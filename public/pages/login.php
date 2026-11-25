<?php
require_once __DIR__ . '/../../includes/auth.php';

// Se já estiver logado, envia direto para o painel correspondente
if ($atual = usuarioLogado()) {
    header('Location: ' . ($atual['role'] === 'admin' ? 'admin.php' : 'cliente.php'));
    exit;
}

$erro = '';
if (($_GET['erro'] ?? '') === 'acesso_restrito') {
    $erro = 'Faça login com uma conta de administrador para acessar o painel.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if ($email === '' || $senha === '') {
        $erro = 'Informe seu e-mail e sua senha.';
    } else {
        $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, role FROM usuarios WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $usuario = $stmt->fetch();

        if ($usuario && password_verify($senha, $usuario['senha_hash'])) {
            session_regenerate_id(true);
            $_SESSION['usuario'] = [
                'id'    => (int) $usuario['id'],
                'nome'  => $usuario['nome'],
                'email' => $usuario['email'],
                'role'  => $usuario['role'],
            ];

            if ($usuario['role'] === 'admin') {
                header('Location: admin.php');
            } else {
                header('Location: cliente.php');
            }
            exit;
        }

        $erro = 'E-mail ou senha incorretos.';
    }
}

$tituloPagina = 'Entrar | NexaTech';
$cssExtras = ['auth.css'];
require_once __DIR__ . '/../../includes/header.php';
?>

  <main id="top" class="container auth-page">
    <div class="auth-shell">
      <aside class="auth-banner">
        <div>
          <p class="eyebrow">✦ ACESSO NEXATECH</p>
          <h1>Seu setup,<br><em>seu controle.</em></h1>
          <p>Entre com sua conta de cliente para acompanhar pedidos ou acesse com credenciais administrativas para gerenciar a loja.</p>
        </div>

        <div class="auth-hint">
          <strong>Acesso Administrador (padrão):</strong><br>
          E-mail: <code>admin@nexatech.com</code><br>
          Senha: <code>admin123</code>
        </div>
      </aside>

      <section class="auth-card">
        <p class="eyebrow green">LOGIN</p>
        <h2>Bem-vindo de volta.</h2>
        <p class="auth-subtitle">Informe seus dados para continuar.</p>

        <?php if ($erro !== ''): ?>
          <div class="auth-alert"><?= htmlspecialchars($erro, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <form method="POST" class="auth-form">
          <div class="auth-field">
            <label for="email">E-mail</label>
            <input type="email" id="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>" placeholder="voce@email.com" required>
          </div>

          <div class="auth-field">
            <label for="senha">Senha</label>
            <input type="password" id="senha" name="senha" placeholder="••••••••" required>
          </div>

          <button type="submit" class="primary-button auth-submit">
            Entrar na conta <span>↗</span>
          </button>
        </form>

        <div class="auth-switch">
          Ainda não tem conta de cliente? <a href="cadastro.php">Criar cadastro</a>
        </div>
      </section>
    </div>
  </main>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>