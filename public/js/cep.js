(() => {
  const cepInput = document.querySelector('input[name="cep"]');
  const enderecoInput = document.querySelector('input[name="endereco"]');

  if (!cepInput || !enderecoInput) return;

  const isDarkCard = Boolean(cepInput.closest('.resumo'));
  let ultimoCepConsultado = cepInput.value.replace(/\D/g, '');
  let emConsulta = false;

  // Cria uma linha discreta de status logo abaixo do campo de CEP
  const feedbackEl = document.createElement('small');
  feedbackEl.setAttribute('aria-live', 'polite');
  feedbackEl.style.display = 'none';
  feedbackEl.style.margin = '4px 0 8px';
  feedbackEl.style.fontSize = '12px';
  feedbackEl.style.fontWeight = '700';
  cepInput.insertAdjacentElement('afterend', feedbackEl);

  function setStatus(texto, tipo = 'info') {
    if (!texto) {
      feedbackEl.style.display = 'none';
      feedbackEl.textContent = '';
      return;
    }

    const cores = isDarkCard
      ? { info: '#c5cdc5', success: '#a8ed63', error: '#ff8a8a' }
      : { info: '#68706a', success: '#4f9427', error: '#b83737' };

    feedbackEl.style.display = 'block';
    feedbackEl.style.color = cores[tipo] || cores.info;
    feedbackEl.textContent = texto;
  }

  function formatarCep(valor) {
    const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
    return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
  }

  async function fetchComTimeout(url, ms = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function buscarDadosCep(digitos) {
    // 1. Consulta principal: ViaCEP
    try {
      const resp = await fetchComTimeout(`https://viacep.com.br/ws/${digitos}/json/`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.erro) {
          return { invalido: true };
        }
        return {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || ''
        };
      }
    } catch (_) {
      // Segue para o fallback caso o ViaCEP oscile
    }

    // 2. Fallback: BrasilAPI
    const respFallback = await fetchComTimeout(`https://brasilapi.com.br/api/cep/v1/${digitos}`);
    if (respFallback.status === 404) {
      return { invalido: true };
    }
    if (!respFallback.ok) {
      throw new Error('Falha ao consultar CEP');
    }

    const dataFallback = await respFallback.json();
    return {
      logradouro: dataFallback.street || '',
      bairro: dataFallback.neighborhood || '',
      cidade: dataFallback.city || '',
      uf: dataFallback.state || ''
    };
  }

  async function consultarCep(forcar = false) {
    const digitos = cepInput.value.replace(/\D/g, '');

    if (digitos.length !== 8) {
      if (digitos.length > 0 && forcar) {
        setStatus('Informe um CEP completo com 8 dígitos.', 'error');
      }
      return;
    }

    if (!forcar && digitos === ultimoCepConsultado) return;
    if (emConsulta) return;

    emConsulta = true;
    ultimoCepConsultado = digitos;
    setStatus('Buscando endereço pelo CEP...', 'info');

    try {
      const resultado = await buscarDadosCep(digitos);

      if (resultado.invalido) {
        setStatus('CEP não encontrado. Preencha o endereço manualmente.', 'error');
        return;
      }

      const parteRua = [resultado.logradouro, resultado.bairro].filter(Boolean).join(', ');
      const parteCidade = [resultado.cidade, resultado.uf].filter(Boolean).join('/');
      const enderecoMontado = [parteRua, parteCidade].filter(Boolean).join(' - ');

      if (enderecoMontado) {
        enderecoInput.value = enderecoMontado;
        enderecoInput.dispatchEvent(new Event('input', { bubbles: true }));
        setStatus('CEP encontrado! Complete com o número da residência.', 'success');

        enderecoInput.focus();
        const fim = enderecoInput.value.length;
        enderecoInput.setSelectionRange(fim, fim);
      } else {
        setStatus('CEP localizado (cidade única). Informe rua e número.', 'info');
        enderecoInput.focus();
      }
    } catch (error) {
      ultimoCepConsultado = '';
      setStatus('Não foi possível consultar o CEP agora. Digite o endereço manualmente.', 'error');
    } finally {
      emConsulta = false;
    }
  }

  // Formata enquanto digita e dispara a busca automática ao completar 8 dígitos
  cepInput.addEventListener('input', () => {
    const formatado = formatarCep(cepInput.value);
    if (cepInput.value !== formatado) {
      cepInput.value = formatado;
    }

    const digitos = formatado.replace(/\D/g, '');
    if (digitos.length < 8) {
      ultimoCepConsultado = '';
      setStatus('');
      return;
    }

    consultarCep(false);
  });

  cepInput.addEventListener('blur', () => {
    consultarCep(false);
  });
})();