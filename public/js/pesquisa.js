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

  let todosProdutos = [];

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const escaparHtml = (texto) =>
    String(texto ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function atualizarBadgeCarrinho() {
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = cart.length;
  }

  function montarFiltrosLaterais(produtos) {
    const categorias = [...new Set(produtos.map((p) => p.categoria))];
    const destaques = [...new Set(produtos.map((p) => p.destaque).filter(Boolean))];
    const params = new URLSearchParams(window.location.search);
    const catUrl = (params.get('categoria') || '').toLowerCase();

    const catContainer = document.getElementById('category-filters');
    if (catContainer) {
      catContainer.innerHTML = categorias
        .map(
          (cat) => `
          <label>
            <input type="checkbox" name="cat" value="${escaparHtml(cat)}" ${cat.toLowerCase() === catUrl ? 'checked' : ''}>
            ${escaparHtml(cat)}
          </label>`
        )
        .join('');
    }

    const brandContainer = document.getElementById('brand-filters');
    if (brandContainer) {
      brandContainer.innerHTML = destaques.length
        ? destaques
            .map(
              (tag) => `
              <label>
                <input type="checkbox" name="tag" value="${escaparHtml(tag)}">
                ${escaparHtml(tag)}
              </label>`
            )
            .join('')
        : '<small style="color:var(--muted)">Sem tags adicionais</small>';
    }
  }

  function aplicarFiltros() {
    const params = new URLSearchParams(window.location.search);
    const termoUrl = (params.get('q') || '').trim().toLowerCase();

    const catsSelecionadas = [...document.querySelectorAll('input[name="cat"]:checked')].map((el) => el.value);
    const tagsSelecionadas = [...document.querySelectorAll('input[name="tag"]:checked')].map((el) => el.value);
    const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price')?.value) || Infinity;
    const sort = document.getElementById('sort-select')?.value || 'relevance';

    let filtrados = todosProdutos.filter((p) => {
      const preco = Number(p.preco);
      const bateBusca =
        !termoUrl ||
        p.nome.toLowerCase().includes(termoUrl) ||
        p.categoria.toLowerCase().includes(termoUrl);
      const bateCat = !catsSelecionadas.length || catsSelecionadas.includes(p.categoria);
      const bateTag = !tagsSelecionadas.length || tagsSelecionadas.includes(p.destaque);
      const batePreco = preco >= minPrice && preco <= maxPrice;
      return bateBusca && bateCat && bateTag && batePreco;
    });

    if (sort === 'price-asc') filtrados.sort((a, b) => Number(a.preco) - Number(b.preco));
    if (sort === 'price-desc') filtrados.sort((a, b) => Number(b.preco) - Number(a.preco));
    if (sort === 'rating') filtrados.sort((a, b) => Number(b.avaliacao || 5) - Number(a.avaliacao || 5));

    renderizarProdutos(filtrados);
  }

  function renderizarProdutos(lista) {
    const grid = document.getElementById('search-products');
    const empty = document.getElementById('empty-state');
    const count = document.getElementById('result-count');
    const label = document.getElementById('results-label');

    const textoTotal = `${lista.length} ${lista.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
    if (count) count.textContent = textoTotal;
    if (label) label.textContent = textoTotal;

    if (!lista.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    grid.innerHTML = lista
      .map((p, idx) => {
        const cor = coresCard[idx % coresCard.length];
        const simbolo = iconesCategoria[p.categoria] || '▦';
        const precoFmt = formatarMoeda(p.preco);
        const temImg = p.imagem && p.imagem !== '../img/hero-gadgets.png';

        return `
          <article class="product-card">
            <div class="visual ${cor}">
              <span class="tag">${escaparHtml(p.destaque || p.categoria)}</span>
              <button type="button" class="favorite" aria-label="Favoritar">♥</button>
              <a href="produto.php?id=${Number(p.id)}" style="display:grid;place-items:center;width:100%;height:100%;text-decoration:none">
                ${
                  temImg
                    ? `<img src="${escaparHtml(p.imagem)}" alt="${escaparHtml(p.nome)}" style="width:100%;height:100%;object-fit:cover">`
                    : `<span class="product-symbol">${simbolo}</span>`
                }
              </a>
            </div>
            <div class="product-info">
              <small>${escaparHtml(p.categoria)}</small>
              <h3>
                <a href="produto.php?id=${Number(p.id)}" style="color:inherit;text-decoration:none">
                  ${escaparHtml(p.nome)}
                </a>
              </h3>
              <div class="rating"><span>★</span> ${Number(p.avaliacao || 5).toFixed(1)}</div>
              <div class="price-row">
                <div>
                  ${p.preco_antigo ? `<span class="old-price">${formatarMoeda(p.preco_antigo)}</span>` : ''}
                  <strong class="price">${precoFmt}</strong>
                </div>
                <button
                  type="button"
                  class="add-button"
                  data-add-id="${Number(p.id)}"
                  data-add-name="${escaparHtml(p.nome)}"
                  data-add-price="${precoFmt}">
                  + Sacola
                </button>
              </div>
            </div>
          </article>`;
      })
      .join('');

    grid.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        cart.push({
          id: Number(btn.dataset.addId),
          name: btn.dataset.addName,
          price: btn.dataset.addPrice
        });
        localStorage.setItem(cartKey, JSON.stringify(cart));
        atualizarBadgeCarrinho();
        mostrarToast(`${btn.dataset.addName} adicionado à sacola`);
      });
    });
  }

  async function iniciarCatalogo() {
    try {
      const resp = await fetch(`${API_PRODUTOS}?status=Ativo`);
      const dados = await resp.json();
      todosProdutos = Array.isArray(dados) ? dados : [];
      montarFiltrosLaterais(todosProdutos);
      aplicarFiltros();
    } catch (error) {
      console.error(error);
    }
  }

  document.getElementById('apply-filters')?.addEventListener('click', aplicarFiltros);
  document.getElementById('sort-select')?.addEventListener('change', aplicarFiltros);
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.querySelectorAll('#category-filters input, #brand-filters input').forEach((el) => {
      el.checked = false;
    });
    if (document.getElementById('min-price')) document.getElementById('min-price').value = '';
    if (document.getElementById('max-price')) document.getElementById('max-price').value = '';
    aplicarFiltros();
  });

  atualizarBadgeCarrinho();
  iniciarCatalogo();
})();