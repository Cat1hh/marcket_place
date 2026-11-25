<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/db.php';

// Garante um usuário administrador padrão na primeira execução
function garantirAdminPadrao(PDO $pdo): void
{
    $stmt = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE role = 'admin'");
    if ((int) $stmt->fetchColumn() === 0) {
        $insert = $pdo->prepare(
            "INSERT INTO usuarios (nome, email, senha_hash, role)
             VALUES (:nome, :email, :senha_hash, 'admin')
             ON CONFLICT (email) DO NOTHING"
        );
        $insert->execute([
            ':nome' => 'Administrador NexaTech',
            ':email' => 'admin@nexatech.com',
            ':senha_hash' => password_hash('admin123', PASSWORD_DEFAULT),
        ]);
    }
}

garantirAdminPadrao($pdo);

function usuarioLogado(): ?array
{
    return $_SESSION['usuario'] ?? null;
}

function exigirLogin(): array
{
    $usuario = usuarioLogado();
    if (!$usuario) {
        header('Location: login.php');
        exit;
    }
    return $usuario;
}

function exigirAdmin(): array
{
    $usuario = usuarioLogado();
    if (!$usuario || ($usuario['role'] ?? '') !== 'admin') {
        header('Location: login.php?erro=acesso_restrito');
        exit;
    }
    return $usuario;
}