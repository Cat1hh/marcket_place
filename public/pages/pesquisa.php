<?php
$tituloPagina = 'Pesquisar Produtos | NexaTech';
$cssExtras = ['pesquisa.css'];
$jsExtras = ['pesquisa.js'];
require_once __DIR__ . '/../../includes/header.php';
?>

  <main id="top" class="container search-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow green">CATÁLOGO NEXATECH</p>
        <h1>Encontre seu próximo upgrade.</h1>
      </div>
      <span id="result-count"></span>
    </div>

    <div class="search-layout">
      <aside class="filters-card">
        <div class="filter-heading">
          <h3>Filtros</h3>
          <button type="button" id="clear-filters" class="clear-button">Limpar</button>
        </div>

        <div class="filter-group">
          <h4>Categorias</h4>
          <div id="category-filters" class="filter-options"></div>
        </div>

        <div class="filter-group">
          <h4>Marcas</h4>
          <div id="brand-filters" class="filter-options"></div>
        </div>

        <div class="filter-group">
          <h4>Preço</h4>
          <div class="price-inputs">
            <input type="number" id="min-price" placeholder="Mínimo" min="0">
            <input type="number" id="max-price" placeholder="Máximo" min="0">
          </div>
        </div>

        <button type="button" id="apply-filters" class="primary-button apply-filters-btn">
          Aplicar filtros <span>↗</span>
        </button>
      </aside>

      <section class="results-area">
        <div class="results-toolbar">
          <span id="results-label">Produtos</span>

          <select id="sort-select" aria-label="Ordenar produtos">
            <option value="relevance">Mais relevantes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="rating">Melhor avaliação</option>
          </select>
        </div>

        <div id="search-products" class="product-grid"></div>

        <div id="empty-state" class="empty-state" hidden>
          <h3>Nenhum produto encontrado.</h3>
          <p>Tente outra pesquisa ou remova os filtros.</p>
        </div>

        <div id="pagination" class="pagination"></div>
      </section>
    </div>
  </main>

  <div id="toast"></div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>