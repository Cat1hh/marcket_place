<?php
$tituloPagina = 'NexaTech | Minha sacola';
$cssExtras = ['carrinho.css'];
$jsExtras = ['carrinho.js'];
require_once __DIR__ . '/../../includes/header.php';

$usuarioAtual = usuarioLogado();
$dadosSalvos = [
    'nome'     => '',
    'email'    => '',
    'endereco' => '',
    'cep'      => '',
];

if ($usuarioAtual) {
    $dadosSalvos['nome']  = $usuarioAtual['nome'] ?? '';
    $dadosSalvos['email'] = $usuarioAtual['email'] ?? '';

    $stmtCli = $pdo->prepare('SELECT endereco, cep FROM clientes WHERE email = :email LIMIT 1');
    $stmtCli->execute([':email' => $usuarioAtual['email']]);
    if ($cli = $stmtCli->fetch()) {
        $dadosSalvos['endereco'] = $cli['endereco'] ?? '';
        $dadosSalvos['cep']      = $cli['cep'] ?? '';
    }
}
?>

  <main id="top" class="cart-page container">
    <div class="page-heading">
      <p class="eyebrow">SUA SELEÇÃO</p>
      <h1>Minha sacola.</h1>
      <a class="back-link" href="index.php#produtos">← Continuar comprando</a>
    </div>

    <div class="cart-layout">
      <section class="produtos">
        <div class="section-title">
          <h2>Seus produtos</h2>
          <span id="itemCount"></span>
        </div>
        <div id="cartItems"></div>
      </section>

      <section class="resumo">
        <p class="eyebrow green">RESUMO DO PEDIDO</p>
        <h2>Quase lá.</h2>

        <div class="coupon-box">
          <label for="couponInput">Cupom de desconto</label>
          <div class="coupon-row">
            <input type="text" id="couponInput" placeholder="Ex.: NEXA10" autocomplete="off">
            <button type="button" id="applyCouponButton">Aplicar</button>
          </div>
          <small id="couponMessage" class="coupon-feedback" aria-live="polite"></small>
        </div>

        <div class="summary-line">
          <span>Subtotal</span>
          <b id="subtotal">R$ 0,00</b>
        </div>
        <div class="summary-line discount-line" id="discountLine" hidden>
          <span>Desconto (<span id="discountCode">NEXA10</span> · 10%)</span>
          <b id="discount">- R$ 0,00</b>
        </div>
        <div class="summary-line">
          <span>Frete</span>
          <b id="shipping">R$ 0,00</b>
        </div>

        <div class="total-line">
          <span>Total</span>
          <strong id="total">R$ 0,00</strong>
        </div>

        <h2 class="delivery-title">Dados de entrega</h2>

        <input type="text" name="nome" placeholder="Nome completo" value="<?= htmlspecialchars($dadosSalvos['nome'], ENT_QUOTES, 'UTF-8') ?>" required>
        <input type="email" name="email" placeholder="E-mail" value="<?= htmlspecialchars($dadosSalvos['email'], ENT_QUOTES, 'UTF-8') ?>" <?= $usuarioAtual ? 'readonly' : '' ?> required>
        <input type="text" name="endereco" placeholder="Endereço" value="<?= htmlspecialchars($dadosSalvos['endereco'], ENT_QUOTES, 'UTF-8') ?>" required>
        <input type="text" name="cep" placeholder="CEP" value="<?= htmlspecialchars($dadosSalvos['cep'], ENT_QUOTES, 'UTF-8') ?>" required>

        <button type="button" id="checkoutButton">Finalizar compra <span>↗</span></button>
      </section>
    </div>
  </main>

  <script>
    window.NEXATECH_USER = <?= json_encode($usuarioAtual, JSON_UNESCAPED_UNICODE) ?>;
  </script>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>