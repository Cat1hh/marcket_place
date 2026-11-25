<?php
$usuarioFooter = function_exists('usuarioLogado') ? usuarioLogado() : ($_SESSION['usuario'] ?? null);
$linkAdminFooter = ($usuarioFooter && ($usuarioFooter['role'] ?? '') === 'admin')
    ? 'admin.php'
    : 'login.php';
?>
  <footer>
    <b>nexa<strong>tech</strong></b>
    <span>Periféricos para todos os seus momentos.</span>
    <a href="<?= $linkAdminFooter ?>">Área do administrador</a>
    <span>© <?= date('Y') ?> NexaTech</span>
  </footer>

  <script>
    // Mantém o contador da sacola no cabeçalho atualizado em todas as páginas
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