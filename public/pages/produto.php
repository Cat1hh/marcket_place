<?php
$tituloPagina = 'Produto | NexaTech';
$cssExtras = ['produto.css'];
$jsExtras = ['produto.js'];
require_once __DIR__ . '/../../includes/header.php';
?>

  <main id="top" class="container product-page">

    <!-- CAMINHO DE NAVEGAÇÃO -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.php">Início</a>
      <span>/</span>
      <a href="pesquisa.php">Produtos</a>
      <span>/</span>
      <span id="breadcrumb-name">Detalhes do produto</span>
    </nav>

    <!-- DETALHES DO PRODUTO -->
    <section class="product-detail">

      <!-- GALERIA / IMAGEM -->
      <div class="product-gallery">
        <div class="main-image">
          <span class="tag">Curadoria NexaTech</span>
          <img id="product-image" src="" alt="Imagem do produto">
        </div>
      </div>

      <!-- INFORMAÇÕES -->
      <div class="product-information">
        <p class="eyebrow green" id="product-brand">MARCA</p>

        <h1 id="product-name">Carregando produto...</h1>

        <div class="rating-row">
          <div class="rating">
            <span>★★★★★</span>
            <small id="product-rating"></small>
          </div>
          <div class="stock">
            <span class="stock-dot"></span> Produto disponível
          </div>
        </div>

        <div class="price-area">
          <span class="old-price" id="product-old-price"></span>
          <h2 class="price" id="product-price"></h2>
          <p class="installment" id="product-installment"></p>
        </div>

        <div class="purchase-area">
          <div class="quantity-field">
            <label for="quantity">Qtd.</label>
            <input
              type="number"
              id="quantity"
              value="1"
              min="1"
              max="10"
            >
          </div>

          <button type="button" id="buy-button" class="primary-button buy-button">
            Comprar agora <span>↗</span>
          </button>

          <button type="button" id="cart-button" class="cart-button">
            Adicionar à sacola
          </button>
        </div>

        <div class="delivery">
          <h3>Informações de entrega</h3>
          <p>🚚 Frete grátis acima de R$ 199 ou consulte condições com o vendedor.</p>
          <p>🔒 Compra segura e protegida em até 10x sem juros.</p>
        </div>
      </div>

    </section>

    <!-- DESCRIÇÃO -->
    <section class="description-section">
      <p class="eyebrow green">ESPECIFICAÇÕES</p>
      <h2>Descrição do produto</h2>
      <p id="product-description">
        Informações detalhadas sobre o produto.
      </p>
    </section>

    <!-- PRODUTOS RELACIONADOS -->
    <section class="related-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow green">COMPLETE SEU SETUP</p>
          <h2>Você também pode gostar</h2>
        </div>
        <a href="pesquisa.php" class="see-all">Ver catálogo ↗</a>
      </div>

      <div id="related-products" class="product-grid"></div>
    </section>

  </main>

  <div id="toast"></div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>