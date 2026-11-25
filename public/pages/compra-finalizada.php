<?php
require_once __DIR__ . '/../../includes/auth.php';

$usuario = usuarioLogado();
$pedidoId = (int) ($_GET['id'] ?? $_SESSION['ultimo_pedido_id'] ?? 0);
$pedido = null;
$itens = [];

if ($pedidoId > 0) {
    $stmt = $pdo->prepare(
        "SELECT p.*,
                CONCAT('#NT-', 1000 + p.id) AS codigo,
                TO_CHAR(p.criado_em, 'DD/MM/YYYY \"às\" HH24:MI') AS data_formatada,
                c.nome AS cliente_nome,
                c.email AS cliente_email,
                c.endereco AS cliente_endereco,
                c.cep AS cliente_cep
         FROM pedidos p
         INNER JOIN clientes c ON c.id = p.cliente_id
         WHERE p.id = :id
         LIMIT 1"
    );
    $stmt->execute([':id' => $pedidoId]);
    $registro = $stmt->fetch();

    if ($registro) {
        $ehDaSessao = isset($_SESSION['ultimo_pedido_id']) && (int) $_SESSION['ultimo_pedido_id'] === $pedidoId;
        $ehDono = $usuario && (
            ($usuario['role'] ?? '') === 'admin' ||
            mb_strtolower($usuario['email'] ?? '', 'UTF-8') === mb_strtolower($registro['cliente_email'] ?? '', 'UTF-8')
        );

        if ($ehDaSessao || $ehDono) {
            $pedido = $registro;

            $stmtItens = $pdo->prepare(
                "SELECT nome_produto, quantidade, preco_unitario
                 FROM pedido_itens
                 WHERE pedido_id = :pedido_id
                 ORDER BY id ASC"
            );
            $stmtItens->execute([':pedido_id' => $pedidoId]);
            $itens = $stmtItens->fetchAll();
        }
    }
}

$tituloPagina = 'Compra Finalizada | NexaTech';
$cssExtras = ['confirmacao.css'];
require_once __DIR__ . '/../../includes/header.php';
?>

  <main id="top" class="container checkout-success-page">
    <?php if (!$pedido): ?>
      <section class="success-card empty-success">
        <p class="eyebrow green">NEXATECH</p>
        <h1>Nenhum pedido recente encontrado.</h1>
        <p class="success-subtitle">Explore nosso catálogo de periféricos e monte seu setup.</p>
        <div class="success-actions">
          <a href="index.php#produtos" class="primary-button">Voltar para a loja <span>↗</span></a>
        </div>
      </section>
    <?php else: ?>
      <?php
        $enderecoFinal = $pedido['endereco_entrega'] ?? $pedido['cliente_endereco'] ?? '';
        $cepFinal      = $pedido['cep_entrega'] ?? $pedido['cliente_cep'] ?? '';
        $subtotalVal   = isset($pedido['subtotal']) ? (float) $pedido['subtotal'] : null;
        $descontoVal   = isset($pedido['desconto']) ? (float) $pedido['desconto'] : 0.0;
        $freteVal      = isset($pedido['frete']) ? (float) $pedido['frete'] : 0.0;
        $totalVal      = (float) $pedido['total'];
      ?>
      <section class="success-card">
        <div class="success-hero">
          <div class="success-check" aria-hidden="true">✓</div>
          <p class="eyebrow green">PEDIDO CONFIRMADO</p>
          <h1>Compra finalizada!</h1>
          <p class="success-subtitle">
            Obrigado, <strong><?= htmlspecialchars($pedido['cliente_nome'], ENT_QUOTES, 'UTF-8') ?></strong>.
            Recebemos seu pedido e já iniciamos o processamento.
          </p>

          <div class="order-pill-bar">
            <span>Código do pedido: <strong><?= htmlspecialchars($pedido['codigo'], ENT_QUOTES, 'UTF-8') ?></strong></span>
            <span class="dot">•</span>
            <span><?= htmlspecialchars($pedido['data_formatada'], ENT_QUOTES, 'UTF-8') ?></span>
            <span class="status-pill"><?= htmlspecialchars($pedido['status'], ENT_QUOTES, 'UTF-8') ?></span>
          </div>
        </div>

        <div class="success-grid">
          <!-- Itens comprados -->
          <div class="success-box">
            <h2>Itens do pedido</h2>

            <?php if (empty($itens)): ?>
              <p class="muted-text">Itens registrados no pedido <?= htmlspecialchars($pedido['codigo'], ENT_QUOTES, 'UTF-8') ?>.</p>
            <?php else: ?>
              <div class="success-items">
                <?php foreach ($itens as $item): ?>
                  <?php
                    $qtd = (int) $item['quantidade'];
                    $unit = (float) $item['preco_unitario'];
                  ?>
                  <div class="success-item-row">
                    <div>
                      <strong><?= htmlspecialchars($item['nome_produto'], ENT_QUOTES, 'UTF-8') ?></strong>
                      <small><?= $qtd ?>x R$ <?= number_format($unit, 2, ',', '.') ?></small>
                    </div>
                    <span>R$ <?= number_format($unit * $qtd, 2, ',', '.') ?></span>
                  </div>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>

            <div class="success-totals">
              <?php if ($subtotalVal !== null): ?>
                <div>
                  <span>Subtotal</span>
                  <b>R$ <?= number_format($subtotalVal, 2, ',', '.') ?></b>
                </div>
              <?php endif; ?>

              <?php if ($descontoVal > 0): ?>
                <div class="discount-row">
                  <span>Desconto (<?= htmlspecialchars($pedido['cupom'] ?: 'NEXA10', ENT_QUOTES, 'UTF-8') ?>)</span>
                  <b>- R$ <?= number_format($descontoVal, 2, ',', '.') ?></b>
                </div>
              <?php endif; ?>

              <div>
                <span>Frete</span>
                <b><?= $freteVal > 0 ? 'R$ ' . number_format($freteVal, 2, ',', '.') : 'Grátis' ?></b>
              </div>

              <div class="grand-total">
                <span>Total pago</span>
                <strong>R$ <?= number_format($totalVal, 2, ',', '.') ?></strong>
              </div>
            </div>
          </div>

          <!-- Dados de entrega -->
          <div class="success-box delivery-box">
            <h2>Entrega</h2>

            <div class="delivery-details">
              <div>
                <span>Destinatário</span>
                <strong><?= htmlspecialchars($pedido['cliente_nome'], ENT_QUOTES, 'UTF-8') ?></strong>
              </div>
              <div>
                <span>E-mail de confirmação</span>
                <strong><?= htmlspecialchars($pedido['cliente_email'], ENT_QUOTES, 'UTF-8') ?></strong>
              </div>
              <div>
                <span>Endereço</span>
                <strong><?= htmlspecialchars($enderecoFinal, ENT_QUOTES, 'UTF-8') ?></strong>
              </div>
              <div>
                <span>CEP</span>
                <strong><?= htmlspecialchars($cepFinal, ENT_QUOTES, 'UTF-8') ?></strong>
              </div>
            </div>

            <div class="tracking-hint">
              Acompanhe a evolução da entrega em tempo real na área do cliente.
            </div>
          </div>
        </div>

        <div class="success-actions">
          <?php if ($usuario && ($usuario['role'] ?? '') === 'cliente'): ?>
            <a href="cliente.php" class="primary-button">Acompanhar entrega <span>↗</span></a>
          <?php else: ?>
            <a href="cadastro.php" class="primary-button">Criar conta para acompanhar <span>↗</span></a>
          <?php endif; ?>
          <a href="index.php#produtos" class="secondary-button">Continuar comprando</a>
        </div>
      </section>
    <?php endif; ?>
  </main>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>