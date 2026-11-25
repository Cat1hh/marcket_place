<?php
require_once __DIR__ . '/../../includes/auth.php';

if ($atual = usuarioLogado()) {
    header('Location: ' . ($atual['role'] === 'admin' ? 'admin.php' : 'cliente.php'));
    exit;
}

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome     = trim($_POST['nome'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $endereco = trim($_POST['endereco'] ?? '');
    $cep      = trim($_POST['cep'] ?? '');
    $senha    = $_POST['senha'] ?? '';
    $confirma = $_POST['confirma_senha'] ?? '';

    if ($nome === '' || $email === '' || $endereco === '' || $cep === '' || $senha === '') {
        $erro = 'Preencha todos os campos obrigatórios.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erro = 'Informe um endereço de e-mail válido.';
    } elseif (strlen($senha) < 6) {
        $erro = 'A senha deve ter pelo menos 6 caracteres.';
    } elseif ($senha !== $confirma) {
        $erro = 'As senhas não conferem.';
    } else {
        try {
            $pdo->beginTransaction();

            $check = $pdo->prepare('SELECT id FROM usuarios WHERE email = :email');
            $check->execute([':email' => $email]);
            if ($check->fetch()) {
                $pdo->rollBack();
                $erro = 'Este e-mail já está cadastrado.';
            } else {
                $stmtUser = $pdo->prepare(
                    "INSERT INTO usuarios (nome, email, senha_hash, role)
                     VALUES (:nome, :email, :senha_hash, 'cliente')
                     RETURNING id"
                );
                $stmtUser->execute([
                    ':nome'       => $nome,
                    ':email'      => $email,
                    ':senha_hash' => password_hash($senha, PASSWORD_DEFAULT),
                ]);
                $novoId = (int) $stmtUser->fetchColumn();

                // Sincroniza também na tabela clientes para o checkout
                $stmtCli = $pdo->prepare(
                    "INSERT INTO clientes (nome, email, endereco, cep)
                     VALUES (:nome, :email, :endereco, :cep)
                     ON CONFLICT (email) DO UPDATE
                       SET nome = EXCLUDED.nome,
                           endereco = EXCLUDED.endereco,
                           cep = EXCLUDED.cep"
                );
                $stmtCli->execute([
                    ':nome'     => $nome,
                    ':email'    => $email,
                    ':endereco' => $endereco,
                    ':cep'      => $cep,
                ]);

                $pdo->commit();

                session_regenerate_id(true);
                $_SESSION['usuario'] = [
                    'id'    => $novoId,
                    'nome'  => $nome,
                    'email' => $email,
                    'role'  => 'cliente',
                ];

                header('Location: cliente.php');
                exit;
            }
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $erro = 'Erro ao concluir o cadastro. Tente novamente.';
        }
    }
}

$tituloPagina = 'Criar conta | NexaTech';
$cssExtras = ['auth.css'];
require_once __DIR__ . '/../../includes/header.php';
?>

  <main id="top" class="container auth-page">
    <div class="auth-shell">
      <aside class="auth-banner">
        <div>
          <p class="eyebrow">✦ CADASTRO DE CLIENTE</p>
          <h1>Comece seu<br><em>próximo nível.</em></h1>
          <p>Cadastre-se para salvar seu endereço de entrega, finalizar compras com agilidade e acompanhar o status dos seus pedidos.</p>
        </div>

        <div class="auth-hint">
          <strong>Benefícios NexaTech:</strong><br>
          Frete grátis acima de R$ 199 e até 10x sem juros em todo o catálogo.
        </div>
      </aside>

      <section class="auth-card">
        <p class="eyebrow green">NOVA CONTA</p>
        <h2>Criar cadastro.</h2>
        <p class="auth-subtitle">Preencha seus dados abaixo para acessar a loja.</p>

        <?php if ($erro !== ''): ?>
          <div class="auth-alert"><?= htmlspecialchars($erro, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <form method="POST" class="auth-form">
          <div class="auth-field">
            <label for="nome">Nome completo</label>
            <input type="text" id="nome" name="nome" value="<?= htmlspecialchars($_POST['nome'] ?? '', ENT_QUOTES, 'UTF-8') ?>" placeholder="Seu nome" required>
          </div>

          <div class="auth-field">
            <label for="email">E-mail</label>
            <input type="email" id="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>" placeholder="voce@email.com" required>
          </div>

          <div class="auth-row">
            <div class="auth-field">
              <label for="endereco">Endereço</label>
              <input type="text" id="endereco" name="endereco" value="<?= htmlspecialchars($_POST['endereco'] ?? '', ENT_QUOTES, 'UTF-8') ?>" placeholder="Rua, número e bairro" required>
            </div>
            <div class="auth-field">
              <label for="cep">CEP</label>
              <input type="text" id="cep" name="cep" value="<?= htmlspecialchars($_POST['cep'] ?? '', ENT_QUOTES, 'UTF-8') ?>" placeholder="00000-000" required>
            </div>
          </div>

          <div class="auth-row">
            <div class="auth-field">
              <label for="senha">Senha (mín. 6 caracteres)</label>
              <input type="password" id="senha" name="senha" placeholder="••••••••" required>
            </div>
            <div class="auth-field">
              <label for="confirma_senha">Confirmar senha</label>
              <input type="password" id="confirma_senha" name="confirma_senha" placeholder="••••••••" required>
            </div>
          </div>

          <button type="submit" class="primary-button auth-submit">
            Cadastrar e entrar <span>↗</span>
          </button>
        </form>

        <div class="auth-switch">
          Já possui uma conta? <a href="login.php">Fazer login</a>
        </div>
      </section>
    </div>
  </main>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>