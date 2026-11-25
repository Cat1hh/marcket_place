<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/dados.php';

$tituloPagina = $tituloPagina ?? 'NexaTech | Periféricos tecnológicos';
$paginaAtual = basename($_SERVER['PHP_SELF']);
$busca = $busca ?? '';
$totalCarrinho = $totalCarrinho ?? 0;
$usuarioHeader = usuarioLogado();
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="NexaTech — periféricos tecnológicos para o seu setup.">
  <title><?= htmlspecialchars($tituloPagina, ENT_QUOTES, 'UTF-8') ?></title>
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="stylesheet" href="../css/interactions.css">
  <?php foreach ((array) ($cssExtras ?? []) as $css): ?>
    <link rel="stylesheet" href="../css/<?= htmlspecialchars($css, ENT_QUOTES, 'UTF-8') ?>">
  <?php endforeach; ?>
</head>
<body>
  <div class="announcement">Frete grátis acima de R$ 199 <span>•</span> 10x sem juros</div>
  <header class="site-header">
    <div class="header-inner">
      <button type="button" class="icon-button menu-button" id="menuButton" aria-label="Abrir menu">☰</button>
      <a class="logo" href="index.php#top" aria-label="NexaTech início"><b>N</b>nexa<strong>tech</strong></a>
      <nav id="mainNav">
        <a href="index.php#produtos">Produtos</a>
        <a href="pesquisa.php">Catálogo</a>
        <a href="index.php#ofertas">Ofertas</a>
      </nav>
      <form class="search" method="GET" action="index.php#produtos">
        <span>⌕</span>
        <input id="searchInput" name="q" type="search" value="<?= htmlspecialchars($busca, ENT_QUOTES, 'UTF-8') ?>" placeholder="Buscar no catálogo" aria-label="Buscar produtos">
      </form>

      <?php if ($usuarioHeader): ?>
        <?php
          $destinoConta = ($usuarioHeader['role'] ?? '') === 'admin' ? 'admin.php' : 'cliente.php';
          $rotuloConta  = ($usuarioHeader['role'] ?? '') === 'admin' ? 'Painel Admin' : 'Minha Conta';
        ?>
        <a class="cart-button <?= $paginaAtual === $destinoConta ? 'active' : '' ?>"
           href="<?= $destinoConta ?>"
           style="text-decoration:none;color:var(--dark)">
          <?= $rotuloConta ?>
        </a>
      <?php else: ?>
        <a class="cart-button <?= in_array($paginaAtual, ['login.php', 'cadastro.php'], true) ? 'active' : '' ?>"
           href="login.php"
           style="text-decoration:none;color:var(--dark)">
          Entrar
        </a>
      <?php endif; ?>

      <a class="cart-button <?= $paginaAtual === 'carrinho.php' ? 'active' : '' ?>"
         id="cartButton"
         href="carrinho.php"
         aria-label="Abrir carrinho"
         style="text-decoration:none;color:var(--dark)">
        Sacola <i id="cartCount"><?= (int) $totalCarrinho ?></i>
      </a>
    </div>
    <form class="mobile-search search" method="GET" action="index.php#produtos">
      <span>⌕</span>
      <input id="mobileSearchInput" name="q" type="search" value="<?= htmlspecialchars($busca, ENT_QUOTES, 'UTF-8') ?>" placeholder="Buscar produtos" aria-label="Buscar produtos">
    </form>
  </header>