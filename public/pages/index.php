<?php
$tituloPagina = 'NexaTech | Periféricos tecnológicos';
require_once __DIR__ . '/../../includes/header.php';

$coresCard = ['mint', 'lavender', 'peach', 'sky'];
$iconesCategoria = [
    'Teclados'   => '⌨',
    'Mouses'     => '◉',
    'Áudio'      => '◖',
    'Monitores'  => '▭',
    'Acessórios' => '⌁',
];
?>

  <main id="top">
    <section class="hero container">
      <div class="hero-copy">
        <p class="eyebrow">✦ Upgrade seu setup</p>
        <h1>Tecnologia<br><em>no seu ritmo.</em></h1>
        <p class="hero-text">Peças inteligentes para trabalhar, jogar e criar sem abrir mão do seu estilo.</p>
        <a class="primary-button" href="#produtos">Comprar agora <span>↗</span></a>
      </div>
      <div class="hero-image">
        <img src="../img/hero-gadgets.png" alt="Periféricos tecnológicos em destaque" onerror="this.style.display='none'">
        <div class="collection-card">
          <small>COLEÇÃO DA SEMANA</small>
          <b>Tudo para o seu próximo upgrade.</b>
        </div>
        <strong class="number">N° 01 / 04</strong>
      </div>
    </section>

    <section class="container categories" id="categorias">
      <div id="categoryList">
        <a href="index.php#produtos"
           class="category <?= $categoriaAtiva === '' ? 'active' : '' ?>"
           style="text-decoration:none">
          Todos
        </a>
        <?php foreach ($categorias as $cat): ?>
          <a href="index.php?categoria=<?= urlencode($cat['slug']) ?>#produtos"
             class="category <?= strcasecmp($categoriaAtiva, $cat['slug']) === 0 ? 'active' : '' ?>"
             style="text-decoration:none">
            <?= htmlspecialchars($cat['nome'], ENT_QUOTES, 'UTF-8') ?>
          </a>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="products container" id="produtos">
      <div class="section-heading">
        <div>
          <p class="eyebrow green">CURADORIA NEXATECH</p>
          <h2>Escolhas que fazem diferença.</h2>
        </div>
        <span id="productTotal"><?= count($produtosFiltrados) ?> <?= count($produtosFiltrados) === 1 ? 'produto' : 'produtos' ?></span>
      </div>

      <div class="product-grid" id="productGrid">
        <?php if (empty($produtosFiltrados)): ?>
          <p>Nenhum produto encontrado para o filtro selecionado.</p>
        <?php else: ?>
          <?php foreach ($produtosFiltrados as $indice => $produto): ?>
            <?php
              $cor = $coresCard[$indice % count($coresCard)];
              $simbolo = $iconesCategoria[$produto['categoria']] ?? '▦';
              $precoFormatado = 'R$ ' . number_format((float) $produto['preco'], 2, ',', '.');
              $temImagemReal = !empty($produto['imagem']) && $produto['imagem'] !== '../img/hero-gadgets.png';
            ?>
            <article class="product-card">
              <div class="visual <?= $cor ?>">
                <span class="tag"><?= htmlspecialchars($produto['destaque'], ENT_QUOTES, 'UTF-8') ?></span>
                <button type="button" class="favorite" aria-label="Favoritar">♥</button>

                <a href="produto.php?id=<?= (int) $produto['id'] ?>" style="display:grid;place-items:center;width:100%;height:100%;text-decoration:none">
                  <?php if ($temImagemReal): ?>
                    <img src="<?= htmlspecialchars($produto['imagem'], ENT_QUOTES, 'UTF-8') ?>"
                         alt="<?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>"
                         style="width:100%;height:100%;object-fit:cover">
                  <?php else: ?>
                    <span class="product-symbol"><?= $simbolo ?></span>
                  <?php endif; ?>
                </a>
              </div>

              <div class="product-info">
                <small><?= htmlspecialchars($produto['categoria'], ENT_QUOTES, 'UTF-8') ?></small>
                <h3>
                  <a href="produto.php?id=<?= (int) $produto['id'] ?>" style="color:inherit;text-decoration:none">
                    <?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>
                  </a>
                </h3>
                <div class="rating">
                  <span>★</span> <?= number_format((float) ($produto['avaliacao'] ?? 5.0), 1, '.', '') ?>
                </div>
                <div class="price-row">
                  <div>
                    <?php if (!empty($produto['preco_antigo'])): ?>
                      <span class="old-price">R$ <?= number_format((float) $produto['preco_antigo'], 2, ',', '.') ?></span>
                    <?php endif; ?>
                    <strong class="price"><?= $precoFormatado ?></strong>
                  </div>
                  <button
                    type="button"
                    class="add-button"
                    data-add-cart
                    data-id="<?= (int) $produto['id'] ?>"
                    data-name="<?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>"
                    data-price="<?= $precoFormatado ?>">
                    + Sacola
                  </button>
                </div>
              </div>
            </article>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </section>

    <section class="offer container" id="ofertas">
      <div>
        <p class="eyebrow">OFERTA DE ESTREIA</p>
        <h2>Seu setup merece<br>um upgrade.</h2>
      </div>
      <p>Use o cupom <b>NEXA10</b> e ganhe 10% na primeira compra.</p>
    </section>
  </main>

  <script>
    // Sincroniza o botão "+ Sacola" e o contador do topo com o carrinho.js
    (() => {
      const cartKey = 'nexatech-cart';
      const updateBadge = () => {
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const badge = document.getElementById('cartCount');
        if (badge) badge.textContent = cart.length;
      };

      document.querySelectorAll('[data-add-cart]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
          cart.push({
            id: Number(btn.dataset.id),
            name: btn.dataset.name,
            price: btn.dataset.price
          });
          localStorage.setItem(cartKey, JSON.stringify(cart));
          updateBadge();

          const original = btn.textContent;
          btn.textContent = 'Adicionado ✓';
          setTimeout(() => { btn.textContent = original; }, 900);
        });
      });

      updateBadge();
    })();
  </script>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>