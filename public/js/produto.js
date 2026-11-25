(() => {
  const API_PRODUTOS = '../api/produtos.php';
  const cartKey = 'nexatech-cart';

  const coresCard = ['mint', 'lavender', 'peach', 'sky'];
  const iconesCategoria = {
    Teclados: '⌨',
    Mouses: '◉',
    'Áudio': '◖',
    Monitores: '▭',
    'Acessórios': '⌁'
  };

  const money = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const escapeHtml = (text) =>
    String(text ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const badge = document.querySelector('#cartCount');
    if (badge) badge.textContent = cart.length;
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function buildFallbackSvg(symbol) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#dfeeda"/><text x="400" y="315" text-anchor="middle" font-family="Arial" font-size="130" fill="#62aa36">${symbol || '▦'}</text></svg>`
    )}`;
  }

  function renderNotFound() {
    const detailSection = document.querySelector('.product-detail');
    const descSection = document.querySelector('.description-section');
    const breadcrumb = document.querySelector('#breadcrumb-name');

    if (breadcrumb) breadcrumb.textContent = 'Produto não encontrado';
    if (descSection) descSection.style.display = 'none';

    if (detailSection) {
      detailSection.innerHTML = `
        <div style="grid-column:1/-1;padding:48px 28px;border-radius:28px;background:#fff;border:1px solid var(--line);text-align:center">
          <p class="eyebrow green">CATÁLOGO NEXATECH</p>
          <h1 style="margin:10px 0;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.06em">Produto não encontrado</h1>
          <p style="margin:0 0 22px;color:var(--muted)">Esse produto não existe ou não está mais disponível no catálogo.</p>
          <a class="primary-button" href="index.php#produtos" style="margin-top:0">Voltar para a loja <span>↗</span></a>
        </div>`;
    }
  }

  function addItemsToCart(produto, quantity) {
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const priceFormatted = money(produto.preco);

    for (let i = 0; i < quantity; i++) {
      cart.push({
        id: Number(produto.id),
        name: produto.nome,
        price: priceFormatted
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartBadge();
  }

  function renderRelatedProducts(lista, atualId, categoriaAtual) {
    const container = document.querySelector('#related-products');
    if (!container) return;

    const outros = lista.filter((item) => Number(item.id) !== Number(atualId));
    const mesmaCategoria = outros.filter((item) => item.categoria === categoriaAtual);
    const outrasCategorias = outros.filter((item) => item.categoria !== categoriaAtual);
    const relacionados = [...mesmaCategoria, ...outrasCategorias].slice(0, 4);

    if (!relacionados.length) {
      container.innerHTML = '<p style="color:var(--muted)">Nenhum outro produto disponível no momento.</p>';
      return;
    }

    container.innerHTML = relacionados
      .map((item, idx) => {
        const cor = coresCard[idx % coresCard.length];
        const simbolo = iconesCategoria[item.categoria] || '▦';
        const precoFmt = money(item.preco);
        const temImg = item.imagem && item.imagem !== '../img/hero-gadgets.png';

        return `
          <article class="product-card">
            <div class="visual ${cor}">
              <span class="tag">${escapeHtml(item.destaque || item.categoria)}</span>
              <button type="button" class="favorite" aria-label="Favoritar">♥</button>
              <a href="produto.php?id=${Number(item.id)}" style="display:grid;place-items:center;width:100%;height:100%;text-decoration:none">
                ${
                  temImg
                    ? `<img src="${escapeHtml(item.imagem)}" alt="${escapeHtml(item.nome)}" style="width:100%;height:100%;object-fit:cover">`
                    : `<span class="product-symbol">${simbolo}</span>`
                }
              </a>
            </div>
            <div class="product-info">
              <small>${escapeHtml(item.categoria)}</small>
              <h3>
                <a href="produto.php?id=${Number(item.id)}" style="color:inherit;text-decoration:none">
                  ${escapeHtml(item.nome)}
                </a>
              </h3>
              <div class="rating"><span>★</span> ${Number(item.avaliacao || 5).toFixed(1)}</div>
              <div class="price-row">
                <div>
                  ${item.preco_antigo ? `<span class="old-price">${money(item.preco_antigo)}</span>` : ''}
                  <strong class="price">${precoFmt}</strong>
                </div>
                <button
                  type="button"
                  class="add-button"
                  data-related-id="${Number(item.id)}"
                  data-related-name="${escapeHtml(item.nome)}"
                  data-related-price="${precoFmt}">
                  + Sacola
                </button>
              </div>
            </div>
          </article>`;
      })
      .join('');

    container.querySelectorAll('[data-related-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        cart.push({
          id: Number(btn.dataset.relatedId),
          name: btn.dataset.relatedName,
          price: btn.dataset.relatedPrice
        });
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartBadge();
        showToast(`${btn.dataset.relatedName} adicionado à sacola`);
      });
    });
  }

  async function initProductPage() {
    updateCartBadge();

    const rawId = new URLSearchParams(window.location.search).get('id');
    if (!rawId) {
      renderNotFound();
      return;
    }

    try {
      const [resProduto, resLista] = await Promise.all([
        fetch(`${API_PRODUTOS}?id=${encodeURIComponent(rawId)}`),
        fetch(`${API_PRODUTOS}?status=Ativo`)
      ]);

      if (!resProduto.ok) {
        renderNotFound();
        return;
      }

      const produto = await resProduto.json();
      if (!produto || produto.status !== 'Ativo') {
        renderNotFound();
        return;
      }

      const todosAtivos = resLista.ok ? await resLista.json() : [];

      document.title = `${produto.nome} | NexaTech`;

      const breadcrumbEl = document.querySelector('#breadcrumb-name');
      const brandEl = document.querySelector('#product-brand');
      const nameEl = document.querySelector('#product-name');
      const tagEl = document.querySelector('.main-image .tag');
      const imgEl = document.querySelector('#product-image');

      if (breadcrumbEl) breadcrumbEl.textContent = produto.nome;
      if (brandEl) brandEl.textContent = `${produto.categoria} • ID p${produto.id}`;
      if (nameEl) nameEl.textContent = produto.nome;
      if (tagEl) tagEl.textContent = produto.destaque || 'Curadoria NexaTech';

      const simbolo = iconesCategoria[produto.categoria] || '▦';
      const fallbackSvg = buildFallbackSvg(simbolo);
      if (imgEl) {
        imgEl.alt = `Imagem de ${produto.nome}`;
        imgEl.onerror = () => {
          imgEl.src = fallbackSvg;
        };
        imgEl.src =
          produto.imagem && produto.imagem !== '../img/hero-gadgets.png'
            ? produto.imagem
            : fallbackSvg;
      }

      const ratingEl = document.querySelector('#product-rating');
      const stockEl = document.querySelector('.stock');
      const estoque = Number(produto.estoque ?? 0);

      if (ratingEl) {
        ratingEl.textContent = `${Number(produto.avaliacao || 5).toFixed(1)} · Avaliação verificada`;
      }

      if (stockEl) {
        stockEl.innerHTML =
          estoque > 0
            ? `<span class="stock-dot"></span> ${estoque} unidade(s) disponível(is)`
            : `<span class="stock-dot" style="background:#c94a4a"></span> Produto indisponível`;
      }

      const oldPriceEl = document.querySelector('#product-old-price');
      const priceEl = document.querySelector('#product-price');
      const installmentEl = document.querySelector('#product-installment');
      const precoNum = Number(produto.preco || 0);

      if (oldPriceEl) {
        oldPriceEl.textContent = produto.preco_antigo ? money(produto.preco_antigo) : '';
      }
      if (priceEl) {
        priceEl.textContent = money(precoNum);
      }
      if (installmentEl) {
        installmentEl.textContent = `ou em até 10x de ${money(precoNum / 10)} sem juros`;
      }

      const descEl = document.querySelector('#product-description');
      if (descEl) {
        descEl.textContent =
          produto.descricao ||
          'Periférico selecionado pela curadoria NexaTech para elevar a precisão, o conforto e a estética do seu setup.';
      }

      const qtyInput = document.querySelector('#quantity');
      const buyBtn = document.querySelector('#buy-button');
      const cartBtn = document.querySelector('#cart-button');

      if (qtyInput) {
        qtyInput.max = Math.max(estoque, 1);
        qtyInput.disabled = estoque <= 0;
      }

      if (estoque <= 0) {
        if (buyBtn) {
          buyBtn.disabled = true;
          buyBtn.textContent = 'Indisponível';
        }
        if (cartBtn) {
          cartBtn.disabled = true;
          cartBtn.textContent = 'Fora de estoque';
        }
      } else {
        const getSelectedQty = () =>
          Math.min(estoque, Math.max(1, Number(qtyInput?.value || 1)));

        if (cartBtn) {
          cartBtn.onclick = () => {
            const qty = getSelectedQty();
            addItemsToCart(produto, qty);
            showToast(`${produto.nome} (${qty}x) adicionado à sacola`);

            const textoOriginal = cartBtn.textContent;
            cartBtn.textContent = 'Adicionado à sacola ✓';
            setTimeout(() => {
              cartBtn.textContent = textoOriginal;
            }, 1200);
          };
        }

        if (buyBtn) {
          buyBtn.onclick = () => {
            const qty = getSelectedQty();
            addItemsToCart(produto, qty);
            window.location.href = 'carrinho.php';
          };
        }
      }

      renderRelatedProducts(Array.isArray(todosAtivos) ? todosAtivos : [], produto.id, produto.categoria);
    } catch (error) {
      renderNotFound();
    }
  }

  initProductPage();
})();