<?php
$usuarioFooter = function_exists('usuarioLogado') ? usuarioLogado() : ($_SESSION['usuario'] ?? null);
$linkAdminFooter = ($usuarioFooter && ($usuarioFooter['role'] ?? '') === 'admin')
    ? 'admin.php'
    : 'login.php';
?>
  <footer>
    <b>nexa<strong>tech</strong></b>
    <span>Periféricos para todos os seus momentos.</span>
    <span>© <?= date('Y') ?> NexaTech</span>
  </footer>

  <!-- Widget Oficial VLibras (Tradução em Libras) -->
  <div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  </div>
  <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
  <script>
    if (window.VLibras) {
      new window.VLibras.Widget('https://vlibras.gov.br/app');
    }
  </script>

  <script>
    (() => {
      const badge = document.getElementById('cartCount');
      if (!badge) return;
      const cart = JSON.parse(localStorage.getItem('nexatech-cart') || '[]');
      badge.textContent = cart.length;
    })();
  </script>

  <script src="../js/script.js"></script>
  <?php foreach ((array) ($jsExtras ?? []) as $js): ?>
    <script src="../js/<?= htmlspecialchars($js, ENT_QUOTES, 'UTF-8') ?>"></script>
  <?php endforeach; ?>
</body>
</html>