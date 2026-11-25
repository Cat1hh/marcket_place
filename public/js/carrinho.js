(() => {
  const API_PEDIDOS = '../api/pedidos.php';
  const cartKey = 'nexatech-cart';
  const couponKey = 'nexatech-coupon';
  const CUPOM_VALIDO = 'NEXA10';
  const PERCENTUAL_DESCONTO = 0.10;

  const cartItems = document.querySelector('#cartItems');
  let cupomAtivo = localStorage.getItem(couponKey) === CUPOM_VALIDO ? CUPOM_VALIDO : '';

  const money = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const priceOf = (price) => {
    if (typeof price === 'number') return price;
    return Number(String(price).replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  };

  const escapeHtml = (text) =>
    String(text ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  const getItemKey = (product) =>
    product.id !== undefined && product.id !== null && product.id !== ''
      ? `id:${product.id}`
      : `name:${product.name}`;

  const getCurrentEmail = () =>
    document.querySelector('input[name="email"]')?.value.trim() || window.NEXATECH_USER?.email || '';

  function getGroupedCart() {
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return cart.reduce((items, product) => {
      const key = getItemKey(product);
      const existing = items.find((entry) => entry.key === key);
      if (existing) {
        existing.quantity++;
      } else {
        items.push({
          key,
          id: product.id ?? null,
          name: product.name,
          price: product.price,
          quantity: 1
        });
      }
      return items;
    }, []);
  }

  function setCouponFeedback(texto, tipo = '') {
    const feedbackEl = document.querySelector('#couponMessage');
    if (!feedbackEl) return;
    feedbackEl.textContent = texto;
    feedbackEl.className = `coupon-feedback ${tipo}`.trim();
  }

  function clearCoupon(mensagem = '', tipo = '') {
    cupomAtivo = '';
    localStorage.removeItem(couponKey);
    const input = document.querySelector('#couponInput');
    const applyBtn = document.querySelector('#applyCouponButton');
    if (input) input.readOnly = false;
    if (applyBtn) applyBtn.textContent = 'Aplicar';
    setCouponFeedback(mensagem, tipo);
  }

  function syncCouponUi() {
    const input = document.querySelector('#couponInput');
    const applyBtn = document.querySelector('#applyCouponButton');

    if (cupomAtivo === CUPOM_VALIDO) {
      if (input) {
        input.value = CUPOM_VALIDO;
        input.readOnly = true;
      }
      if (applyBtn) applyBtn.textContent = 'Remover';
      setCouponFeedback('Cupom NEXA10 aplicado: 10% de desconto!', 'success');
    } else {
      if (input) input.readOnly = false;
      if (applyBtn) applyBtn.textContent = 'Aplicar';
    }
  }

  function saveCart(nextCart) {
    localStorage.setItem(cartKey, JSON.stringify(nextCart));
    renderCart();
  }

  function renderCart() {
    if (!cartItems) return;

    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const grouped = getGroupedCart();

    cartItems.innerHTML = grouped.length
      ? grouped
          .map(
            (item) => `
            <div class="produto">
              <div>
                <h3>${escapeHtml(item.name)}</h3>
                <p>${escapeHtml(item.price)}</p>
              </div>
              <div style="display:inline-flex;align-items:center;gap:8px">
                <button type="button" class="remove-button" data-dec="${escapeHtml(item.key)}" aria-label="Diminuir quantidade">−</button>
                <strong>${item.quantity}</strong>
                <button type="button" class="remove-button" data-inc="${escapeHtml(item.key)}" aria-label="Aumentar quantidade">+</button>
              </div>
              <button type="button" class="remove-button" data-remove="${escapeHtml(item.key)}">Remover</button>
            </div>`
          )
          .join('')
      : '<p>Seu carrinho está vazio.</p>';

    const itemCountEl = document.querySelector('#itemCount');
    if (itemCountEl) {
      itemCountEl.textContent = `${cart.length} ${cart.length === 1 ? 'item' : 'itens'}`;
    }

    const headerBadge = document.querySelector('#cartCount');
    if (headerBadge) {
      headerBadge.textContent = cart.length;
    }

    const subtotal = cart.reduce((sum, product) => sum + priceOf(product.price), 0);
    const desconto = subtotal > 0 && cupomAtivo === CUPOM_VALIDO ? subtotal * PERCENTUAL_DESCONTO : 0;
    const shipping = subtotal > 0 && subtotal < 199 ? 10 : 0;
    const totalFinal = Math.max(0, subtotal - desconto + shipping);

    const subtotalEl = document.querySelector('#subtotal');
    const discountLineEl = document.querySelector('#discountLine');
    const discountEl = document.querySelector('#discount');
    const shippingEl = document.querySelector('#shipping');
    const totalEl = document.querySelector('#total');

    if (subtotalEl) subtotalEl.textContent = money(subtotal);

    if (discountLineEl && discountEl) {
      if (desconto > 0) {
        discountLineEl.hidden = false;
        discountEl.textContent = `- ${money(desconto)}`;
      } else {
        discountLineEl.hidden = true;
        discountEl.textContent = '- R$ 0,00';
      }
    }

    if (shippingEl) shippingEl.textContent = money(shipping);
    if (totalEl) totalEl.textContent = money(totalFinal);

    document.querySelectorAll('[data-inc]').forEach((button) => {
      button.onclick = () => {
        const target = grouped.find((item) => item.key === button.dataset.inc);
        if (!target) return;
        saveCart([...cart, { id: target.id, name: target.name, price: target.price }]);
      };
    });

    document.querySelectorAll('[data-dec]').forEach((button) => {
      button.onclick = () => {
        const idx = [...cart].reverse().findIndex((p) => getItemKey(p) === button.dataset.dec);
        if (idx === -1) return;
        const realIndex = cart.length - 1 - idx;
        const next = cart.filter((_, i) => i !== realIndex);
        saveCart(next);
      };
    });

    document.querySelectorAll('[data-remove]').forEach((button) => {
      button.onclick = () => {
        const next = cart.filter((product) => getItemKey(product) !== button.dataset.remove);
        saveCart(next);
      };
    });
  }

  async function validarCupomNoServidor(codigo, email) {
    const query = new URLSearchParams({ verificar_cupom: codigo });
    if (email) query.set('email', email);

    const response = await fetch(`${API_PEDIDOS}?${query.toString()}`, {
      credentials: 'same-origin'
    });
    const data = await response.json();
    return { ok: response.ok, data };
  }

  async function handleCouponAction() {
    const input = document.querySelector('#couponInput');
    const applyBtn = document.querySelector('#applyCouponButton');
    if (!input || !applyBtn) return;

    if (cupomAtivo === CUPOM_VALIDO) {
      input.value = '';
      clearCoupon('Cupom removido.');
      renderCart();
      return;
    }

    const codigoDigitado = input.value.trim().toUpperCase();
    if (!codigoDigitado) {
      setCouponFeedback('Digite o código do cupom.', 'error');
      return;
    }

    if (codigoDigitado !== CUPOM_VALIDO) {
      clearCoupon('Cupom inválido. Use NEXA10 para 10% de desconto.', 'error');
      renderCart();
      return;
    }

    const email = getCurrentEmail();
    if (!email) {
      setCouponFeedback('Preencha seu e-mail abaixo antes de aplicar o cupom NEXA10.', 'error');
      document.querySelector('input[name="email"]')?.focus();
      return;
    }

    applyBtn.disabled = true;
    applyBtn.textContent = '...';

    try {
      const { ok, data } = await validarCupomNoServidor(codigoDigitado, email);
      if (!ok || !data.valido) {
        clearCoupon(data.erro || 'Não foi possível aplicar este cupom.', 'error');
      } else {
        cupomAtivo = CUPOM_VALIDO;
        localStorage.setItem(couponKey, CUPOM_VALIDO);
        syncCouponUi();
      }
      renderCart();
    } catch (error) {
      setCouponFeedback('Erro ao validar o cupom.', 'error');
    } finally {
      applyBtn.disabled = false;
      if (cupomAtivo !== CUPOM_VALIDO) {
        applyBtn.textContent = 'Aplicar';
      }
    }
  }

  document.querySelector('#applyCouponButton')?.addEventListener('click', handleCouponAction);
  document.querySelector('#couponInput')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCouponAction();
    }
  });

  // Se o visitante trocar o e-mail após aplicar o cupom, exige nova validação
  document.querySelector('input[name="email"]')?.addEventListener('change', () => {
    if (cupomAtivo === CUPOM_VALIDO) {
      clearCoupon('E-mail alterado. Clique em Aplicar novamente para validar o cupom.');
      renderCart();
    }
  });

  const checkoutBtn = document.querySelector('#checkoutButton');
  if (checkoutBtn) {
    checkoutBtn.onclick = async () => {
      const grouped = getGroupedCart();
      if (!grouped.length) {
        alert('Adicione pelo menos um produto à sacola antes de finalizar.');
        return;
      }

      const nomeInput = document.querySelector('input[name="nome"]');
      const emailInput = document.querySelector('input[name="email"]');
      const enderecoInput = document.querySelector('input[name="endereco"]');
      const cepInput = document.querySelector('input[name="cep"]');

      const nome = nomeInput?.value.trim() || window.NEXATECH_USER?.nome || '';
      const email = emailInput?.value.trim() || window.NEXATECH_USER?.email || '';
      const endereco = enderecoInput?.value.trim() || '';
      const cep = cepInput?.value.trim() || '';

      if (!nome || !email || !endereco || !cep) {
        alert('Preencha Nome completo, E-mail, Endereço e CEP para concluir o pedido.');
        return;
      }

      const originalHtml = checkoutBtn.innerHTML;
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processando pedido...';

      try {
        const response = await fetch(API_PEDIDOS, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente: { nome, email, endereco, cep },
            itens: grouped,
            cupom: cupomAtivo || null
          })
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 409 && cupomAtivo === CUPOM_VALIDO) {
            clearCoupon(result.erro, 'error');
            renderCart();
          }
          alert(result.erro || 'Não foi possível finalizar o pedido.');
          return;
        }

        localStorage.removeItem(cartKey);
        const couponInput = document.querySelector('#couponInput');
        if (couponInput) couponInput.value = '';
        clearCoupon('');

        if (!window.NEXATECH_USER) {
          if (nomeInput) nomeInput.value = '';
          if (emailInput) emailInput.value = '';
          if (enderecoInput) enderecoInput.value = '';
          if (cepInput) cepInput.value = '';
        }

        renderCart();
        window.location.href = `compra-finalizada.php?id=${encodeURIComponent(result.id)}`;
      } catch (error) {
        alert('Erro de conexão ao enviar o pedido.');
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalHtml;
      }
    };
  }

  // Revalida no carregamento caso já exista um cupom salvo no localStorage
  (async () => {
    if (cupomAtivo === CUPOM_VALIDO) {
      const email = getCurrentEmail();
      if (!email) {
        clearCoupon('');
      } else {
        const { ok, data } = await validarCupomNoServidor(CUPOM_VALIDO, email).catch(() => ({ ok: false, data: {} }));
        if (!ok || !data.valido) {
          clearCoupon(data.erro || '');
        } else {
          syncCouponUi();
        }
      }
    }
    renderCart();
  })();
})();