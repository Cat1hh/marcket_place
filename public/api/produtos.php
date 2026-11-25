<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../includes/auth.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$payload = json_decode(file_get_contents('php://input'), true) ?? [];

function normalizarPreco($valor): float
{
    if (is_numeric($valor)) {
        return (float) $valor;
    }
    $limpo = preg_replace('/[^\d,.-]/', '', (string) $valor);
    if (str_contains($limpo, ',')) {
        $limpo = str_replace('.', '', $limpo);
        $limpo = str_replace(',', '.', $limpo);
    }
    return (float) $limpo;
}

function exigirAdminApi(): void
{
    $usuario = usuarioLogado();
    if (!$usuario || ($usuario['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['erro' => 'Sessão expirada ou acesso restrito ao administrador.']);
        exit;
    }
}

try {
    switch ($metodo) {
        // READ: lista geral ou busca unitária (?id=1 ou ?id=p1)
        case 'GET':
            if (isset($_GET['id']) && $_GET['id'] !== '') {
                $idNumerico = (int) preg_replace('/\D/', '', (string) $_GET['id']);
                $stmt = $pdo->prepare('SELECT * FROM produtos WHERE id = :id');
                $stmt->execute([':id' => $idNumerico]);
                $produto = $stmt->fetch();

                if (!$produto) {
                    http_response_code(404);
                    echo json_encode(['erro' => 'Produto não encontrado.']);
                    exit;
                }

                echo json_encode($produto);
                exit;
            }

            $sql = 'SELECT * FROM produtos WHERE 1=1';
            $params = [];

            if (!empty($_GET['q'])) {
                $sql .= ' AND (nome ILIKE :q OR categoria ILIKE :q OR COALESCE(destaque, \'\') ILIKE :q)';
                $params[':q'] = '%' . trim($_GET['q']) . '%';
            }

            if (!empty($_GET['categoria']) && $_GET['categoria'] !== 'Todos') {
                $sql .= ' AND categoria ILIKE :categoria';
                $params[':categoria'] = trim($_GET['categoria']);
            }

            if (!empty($_GET['status'])) {
                $sql .= ' AND status = :status';
                $params[':status'] = trim($_GET['status']);
            }

            $sql .= ' ORDER BY id DESC';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode($stmt->fetchAll());
            break;

        // CREATE: cadastra novo produto no PostgreSQL
        case 'POST':
            exigirAdminApi();

            $nome = trim($payload['nome'] ?? '');
            $categoria = trim($payload['categoria'] ?? '');
            $preco = normalizarPreco($payload['preco'] ?? 0);
            $estoque = max(0, (int) ($payload['estoque'] ?? 0));
            $status = ($payload['status'] ?? 'Ativo') === 'Rascunho' ? 'Rascunho' : 'Ativo';
            $imagem = trim($payload['imagem'] ?? '');
            $destaque = trim($payload['destaque'] ?? '');
            $descricao = trim($payload['descricao'] ?? '');

            if ($nome === '' || $categoria === '' || $preco <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'Preencha nome, categoria e um preço maior que zero.']);
                exit;
            }

            $stmt = $pdo->prepare(
                'INSERT INTO produtos (nome, categoria, preco, estoque, status, imagem, destaque, descricao)
                 VALUES (:nome, :categoria, :preco, :estoque, :status, :imagem, :destaque, :descricao)
                 RETURNING id'
            );
            $stmt->execute([
                ':nome'      => $nome,
                ':categoria' => $categoria,
                ':preco'     => $preco,
                ':estoque'   => $estoque,
                ':status'    => $status,
                ':imagem'    => $imagem,
                ':destaque'  => $destaque !== '' ? $destaque : $categoria,
                ':descricao' => $descricao,
            ]);

            $novoId = (int) $stmt->fetchColumn();
            http_response_code(201);
            echo json_encode(['id' => $novoId, 'mensagem' => 'Produto cadastrado com sucesso.']);
            break;

        // UPDATE: edita um produto existente
        case 'PUT':
            exigirAdminApi();

            $id = (int) ($payload['id'] ?? $_GET['id'] ?? 0);
            $nome = trim($payload['nome'] ?? '');
            $categoria = trim($payload['categoria'] ?? '');
            $preco = normalizarPreco($payload['preco'] ?? 0);
            $estoque = max(0, (int) ($payload['estoque'] ?? 0));
            $status = ($payload['status'] ?? 'Ativo') === 'Rascunho' ? 'Rascunho' : 'Ativo';
            $imagem = trim($payload['imagem'] ?? '');
            $destaque = trim($payload['destaque'] ?? '');
            $descricao = trim($payload['descricao'] ?? '');

            if ($id <= 0 || $nome === '' || $categoria === '' || $preco <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'Dados inválidos para atualizar o produto.']);
                exit;
            }

            $stmt = $pdo->prepare(
                'UPDATE produtos
                 SET nome = :nome,
                     categoria = :categoria,
                     preco = :preco,
                     estoque = :estoque,
                     status = :status,
                     imagem = :imagem,
                     destaque = :destaque,
                     descricao = :descricao
                 WHERE id = :id'
            );
            $stmt->execute([
                ':id'        => $id,
                ':nome'      => $nome,
                ':categoria' => $categoria,
                ':preco'     => $preco,
                ':estoque'   => $estoque,
                ':status'    => $status,
                ':imagem'    => $imagem,
                ':destaque'  => $destaque !== '' ? $destaque : $categoria,
                ':descricao' => $descricao,
            ]);

            echo json_encode(['mensagem' => 'Produto atualizado com sucesso.']);
            break;

        // DELETE: remove um produto
        case 'DELETE':
            exigirAdminApi();

            $id = (int) ($payload['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(422);
                echo json_encode(['erro' => 'ID inválido para exclusão.']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
            $stmt->execute([':id' => $id]);

            echo json_encode(['mensagem' => 'Produto excluído com sucesso.']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['erro' => 'Método não permitido.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro no PostgreSQL: ' . $e->getMessage()]);
}