<?php
require_once __DIR__ . '/../../includes/auth.php';
$usuario = exigirLogin();

// Busca dados cadastrais e pedidos do cliente
$stmtCli = $pdo->prepare('SELECT * FROM clientes WHERE email = :email LIMIT 1');
$stmtCli->execute([':email' => $usuario['email']]);
$dadosCliente = $stmtCli->fetch();

$pedidos = [];
if ($dadosCliente) {
    $stmtPed = $pdo->prepare(
        "SELECT id, CONCAT('#NT-', 1000 + id) AS codigo, total, status,
                TO_CHAR(criado_em, 'DD/MM/YYYY') AS data
         FROM pedidos
         WHERE cliente_id = :cliente_id
         ORDER BY id DESC"
    );
    $stmtPed->execute([':cliente_id' => $dadosCliente['id']]);
    $pedidos = $stmtPed->fetchAll();
}

$tituloPagina = 'Minha Conta | NexaTech';
$cssExtras = ['auth.css'];
require_once __DIR__ . '/../../includes/header.php';
?>

  <main id="top" class="container auth-page">
    <div class="client-header">
      <div>
        <p class="eyebrow green">ÁREA DO CLIENTE</p>
        <h1 style="margin:8px 0 0;font-family:'Space Grotesk',sans-serif;font-size:clamp(2rem,4vw,3rem);letter-spacing:-0.07em">
          Olá, <?= htmlspecialchars($usuario['nome'], ENT_QUOTES, 'UTF-8') ?>.
        </h1>
      </div>

      <div class="client-actions">
        <a href="index.php#produtos" class="primary-button" style="margin-top:0">Ir para a loja <span>↗</span></a>
        <a href="logout.php" class="logout-button">Sair</a>
      </div>
    </div>

    <div class="client-grid">
      <aside class="client-card">
        <h3>Meus dados</h3>
        <div class="client-info-list">
          <div>
            <span>Nome</span>
            <strong><?= htmlspecialchars($usuario['nome'], ENT_QUOTES, 'UTF-8') ?></strong>
          </div>
          <div>
            <span>E-mail</span>
            <strong><?= htmlspecialchars($usuario['email'], ENT_QUOTES, 'UTF-8') ?></strong>
          </div>
          <?php if ($dadosCliente): ?>
            <div>
              <span>Endereço padrão</span>
              <strong><?= htmlspecialchars($dadosCliente['endereco'], ENT_QUOTES, 'UTF-8') ?></strong>
            </div>
            <div>
              <span>CEP</span>
              <strong><?= htmlspecialchars($dadosCliente['cep'], ENT_QUOTES, 'UTF-8') ?></strong>
            </div>
          <?php endif; ?>
        </div>
      </aside>

      <section class="client-card">
        <div class="orders-card-header">
          <div>
            <h3 style="margin:0">Meus pedidos</h3>
            <small style="color:var(--muted)">Acompanhe em tempo real o andamento das suas entregas.</small>
          </div>
        </div>

        <?php if (empty($pedidos)): ?>
          <p style="color:var(--muted);font-size:14px;margin:16px 0 0">
            Você ainda não realizou nenhum pedido. <a href="index.php#produtos" style="color:var(--dark);font-weight:700">Explorar produtos</a>.
          </p>
        <?php else: ?>
          <div class="orders-list">
            <?php foreach ($pedidos as $pedido): ?>
              <?php $jaEntregue = ($pedido['status'] === 'Entregue'); ?>
              <article
                class="order-item"
                data-order-card
                data-order-id="<?= (int) $pedido['id'] ?>"
                data-initial-status="<?= htmlspecialchars($pedido['status'], ENT_QUOTES, 'UTF-8') ?>">

                <div class="order-top">
                  <div>
                    <strong><?= htmlspecialchars($pedido['codigo'], ENT_QUOTES, 'UTF-8') ?></strong>
                    <div style="color:var(--muted);font-size:12px">Realizado em <?= htmlspecialchars($pedido['data'], ENT_QUOTES, 'UTF-8') ?></div>
                  </div>

                  <div class="order-meta-right">
                    <strong>R$ <?= number_format((float) $pedido['total'], 2, ',', '.') ?></strong>
                    <span class="order-badge <?= $jaEntregue ? 'delivered' : '' ?>" data-status-badge>
                      <?= htmlspecialchars($pedido['status'], ENT_QUOTES, 'UTF-8') ?>
                    </span>
                  </div>
                </div>

                <div class="delivery-sim">
                  <div class="sim-header">
                    <span class="sim-message" data-sim-message>
                      <?= $jaEntregue ? 'Pedido entregue com sucesso!' : 'Pedido recebido. Aguardando confirmação da loja...' ?>
                    </span>
                  </div>

                  <div class="sim-progress-track">
                    <div class="sim-progress-fill" data-sim-bar style="width:<?= $jaEntregue ? '100%' : '0%' ?>"></div>
                  </div>

                  <div class="sim-steps">
                    <div class="sim-step <?= $jaEntregue ? 'done' : 'active' ?>" data-step="0">
                      <span class="sim-dot"></span>
                      <b>Recebido</b>
                    </div>
                    <div class="sim-step <?= $jaEntregue ? 'done' : '' ?>" data-step="10">
                      <span class="sim-dot"></span>
                      <b>Confirmada</b>
                    </div>
                    <div class="sim-step <?= $jaEntregue ? 'done' : '' ?>" data-step="25">
                      <span class="sim-dot"></span>
                      <b>Despachada</b>
                    </div>
                    <div class="sim-step <?= $jaEntregue ? 'done' : '' ?>" data-step="45">
                      <span class="sim-dot"></span>
                      <b>Indo p/ entrega</b>
                    </div>
                    <div class="sim-step <?= $jaEntregue ? 'done' : '' ?>" data-step="60">
                      <span class="sim-dot"></span>
                      <b>Entregue</b>
                    </div>
                  </div>
                </div>
              </article>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>
    </div>
  </main>

  <script>
    (() => {
      const API_PEDIDOS = '../api/pedidos.php';
      const DURACAO_TOTAL_SEG = 60;

      const etapas = [
        {
          segundo: 0,
          status: 'Recebido',
          mensagem: 'Pedido recebido. Aguardando confirmação da loja...'
        },
        {
          segundo: 10,
          status: 'Confirmada',
          mensagem: 'Entrega confirmada! Preparando pacote para envio.'
        },
        {
          segundo: 25,
          status: 'Despachada',
          mensagem: 'Pedido despachado e em trânsito com a transportadora.'
        },
        {
          segundo: 45,
          status: 'Indo para entrega',
          mensagem: 'Indo para entrega! O entregador está a caminho do seu endereço.'
        },
        {
          segundo: 60,
          status: 'Entregue',
          mensagem: 'Pedido entregue com sucesso!'
        }
      ];

      function iniciarAcompanhamento(card) {
        const orderId = card.dataset.orderId;
        const initialStatus = card.dataset.initialStatus;
        if (!orderId || initialStatus === 'Entregue') return;

        const badge = card.querySelector('[data-status-badge]');
        const messageEl = card.querySelector('[data-sim-message]');
        const barEl = card.querySelector('[data-sim-bar]');
        const stepEls = [...card.querySelectorAll('[data-step]')];

        // Mantém o horário inicial salvo para não resetar caso o cliente atualize a página
        const storageKey = `nexatech-track-${orderId}`;
        let inicio = Number(localStorage.getItem(storageKey));
        if (!inicio) {
          inicio = Date.now();
          localStorage.setItem(storageKey, String(inicio));
        }

        let sincronizadoBanco = false;

        const atualizarFrame = () => {
          const decorridoSeg = (Date.now() - inicio) / 1000;
          const limitadoSeg = Math.min(DURACAO_TOTAL_SEG, decorridoSeg);
          const percentual = (limitadoSeg / DURACAO_TOTAL_SEG) * 100;

          let etapaAtual = etapas[0];
          for (const etapa of etapas) {
            if (limitadoSeg >= etapa.segundo) {
              etapaAtual = etapa;
            }
          }

          badge.textContent = etapaAtual.status;
          messageEl.textContent = etapaAtual.mensagem;
          barEl.style.width = `${percentual.toFixed(1)}%`;

          stepEls.forEach((stepEl) => {
            const alvo = Number(stepEl.dataset.step);
            stepEl.classList.toggle('done', limitadoSeg >= alvo);
            stepEl.classList.toggle('active', alvo === etapaAtual.segundo && limitadoSeg < DURACAO_TOTAL_SEG);
          });

          if (limitadoSeg >= DURACAO_TOTAL_SEG) {
            clearInterval(timer);
            badge.classList.add('delivered');
            localStorage.removeItem(storageKey);

            if (!sincronizadoBanco) {
              sincronizadoBanco = true;
              fetch(API_PEDIDOS, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: Number(orderId), status: 'Entregue' })
              }).catch(() => {});
            }
          }
        };

        atualizarFrame();
        const timer = setInterval(atualizarFrame, 250);
      }

      document.querySelectorAll('[data-order-card]').forEach(iniciarAcompanhamento);
    })();
  </script>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>