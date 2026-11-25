<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../includes/auth.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$payload = json_decode(file_get_contents('php://input'), true) ?? [];

function normalizarValor($valor): float
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

function cupomJaUtilizado(PDO $pdo, string $email, string $cupom): bool
{
    $emailLimpo = mb_strtolower(trim($email), 'UTF-8');
    $cupomLimpo = strtoupper(trim($cupom));

    if ($emailLimpo === '' || $cupomLimpo === '') {
        return false;
    }

    $stmt = $pdo->prepare(
        "SELECT 1
         FROM pedidos p
         INNER JOIN clientes c ON c.id = p.cliente_id
         WHERE LOWER(c.email) = :email
           AND UPPER(COALESCE(p.cupom, '')) = :cupom
         LIMIT 1"
    );
    $stmt->execute([
        ':email' => $emailLimpo,
        ':cupom' => $cupomLimpo,
    ]);

    return (bool) $stmt->fetchColumn();
}

try {
    switch ($metodo) {
        case 'GET':
            // Verificação rápida do cupom para a sacola
            if (isset($_GET['verificar_cupom'])) {
                $cupom = strtoupper(trim((string) $_GET['verificar_cupom']));
                $usuario = usuarioLogado();
                $email = trim((string) ($_GET['email'] ?? ($usuario['email'] ?? '')));

                if ($cupom !== 'NEXA10') {
                    http_response_code(422);
                    echo json_encode(['valido' => false, 'erro' => 'Cupom inválido. Use NEXA10 para 10% de desconto.']);
                    exit;
                }

                if ($email !== '' && cupomJaUtilizado($pdo, $email, $cupom)) {
                    http_response_code(409);
                    echo json_encode(['valido' => false, 'erro' => 'Este cupom já foi utilizado nesta conta (limite de 1 uso por cliente).']);
                    exit;
                }

                echo json_encode(['valido' => true, 'desconto_percentual' => 10]);
                exit;
            }

            // Listagem de pedidos e clientes para o painel admin
            $stmtPedidos = $pdo->query(
                "SELECT p.id,
                        CONCAT('#NT-', 1000 + p.id) AS codigo,
                        c.nome AS cliente,
                        TO_CHAR(p.criado_em, 'DD/MM/YYYY') AS data,
                        p.total AS valor,
                        p.status,
                        p.cupom
                 FROM pedidos p
                 INNER JOIN clientes c ON c.id = p.cliente_id
                 ORDER BY p.id DESC"
            );

            $stmtClientes = $pdo->query(
                "SELECT c.id,
                        c.nome,
                        c.email,
                        COUNT(p.id) AS pedidos,
                        COALESCE(SUM(p.total), 0) AS total_gasto,
                        'Ativo' AS status
                 FROM clientes c
                 LEFT JOIN pedidos p ON p.cliente_id = c.id
                 GROUP BY c.id, c.nome, c.email
                 ORDER BY total_gasto DESC, c.id DESC"
            );

            echo json_encode([
                'pedidos'  => $stmtPedidos->fetchAll(),
                'clientes' => $stmtClientes->fetchAll(),
            ]);
            break;

        case 'POST':
            $usuario = usuarioLogado();
            $cliente = $payload['cliente'] ?? [];
            $itens   = $payload['itens'] ?? [];
            $cupom   = strtoupper(trim((string) ($payload['cupom'] ?? '')));

            $nome     = trim((string) ($cliente['nome'] ?? ($usuario['nome'] ?? '')));
            $email    = trim((string) ($usuario['email'] ?? ($cliente['email'] ?? '')));
            $endereco = trim((string) ($cliente['endereco'] ?? ''));
            $cep      = trim((string) ($cliente['cep'] ?? ''));

            if ($nome === '' || $endereco === '' || $cep === '' || empty($itens)) {
                http_response_code(422);
                echo json_encode(['erro' => 'Preencha todos os dados de entrega e adicione itens à sacola.']);
                exit;
            }

            if ($cupom !== '' && $cupom !== 'NEXA10') {
                http_response_code(422);
                echo json_encode(['erro' => 'Cupom de desconto inválido.']);
                exit;
            }

            if ($cupom === 'NEXA10') {
                if ($email === '') {
                    http_response_code(422);
                    echo json_encode(['erro' => 'Informe seu e-mail para validar o uso único do cupom NEXA10.']);
                    exit;
                }

                if (cupomJaUtilizado($pdo, $email, $cupom)) {
                    http_response_code(409);
                    echo json_encode(['erro' => 'O cupom NEXA10 já foi utilizado anteriormente neste e-mail.']);
                    exit;
                }
            }

            $pdo->beginTransaction();

            // Cria ou atualiza o cliente pelo e-mail
            $emailFinal = $email !== '' ? $email : ('cliente_' . uniqid() . '@nexatech.local');
            $stmtCli = $pdo->prepare(
                "INSERT INTO clientes (nome, email, endereco, cep)
                 VALUES (:nome, :email, :endereco, :cep)
                 ON CONFLICT (email) DO UPDATE
                   SET nome = EXCLUDED.nome,
                       endereco = EXCLUDED.endereco,
                       cep = EXCLUDED.cep
                 RETURNING id"
            );
            $stmtCli->execute([
                ':nome'     => $nome,
                ':email'    => $emailFinal,
                ':endereco' => $endereco,
                ':cep'      => $cep,
            ]);
            $clienteId = (int) $stmtCli->fetchColumn();

            $subtotal = 0.0;
            $itensValidados = [];

            foreach ($itens as $item) {
                $qtd = max(1, (int) ($item['quantity'] ?? 1));
                $prodId = isset($item['id']) ? (int) $item['id'] : 0;

                if ($prodId > 0) {
                    $stmtProd = $pdo->prepare('SELECT id, nome, preco, estoque FROM produtos WHERE id = :id FOR UPDATE');
                    $stmtProd->execute([':id' => $prodId]);
                    $prodDb = $stmtProd->fetch();

                    if (!$prodDb) {
                        $pdo->rollBack();
                        http_response_code(404);
                        echo json_encode(['erro' => 'Um dos produtos da sacola não existe mais.']);
                        exit;
                    }

                    if ((int) $prodDb['estoque'] < $qtd) {
                        $pdo->rollBack();
                        http_response_code(409);
                        echo json_encode(['erro' => 'Estoque insuficiente para concluir a quantidade selecionada.']);
                        exit;
                    }

                    $precoUnit = (float) $prodDb['preco'];
                    $subtotal += $precoUnit * $qtd;
                    $itensValidados[] = [
                        'produto_id'   => $prodId,
                        'nome_produto' => $prodDb['nome'],
                        'quantidade'   => $qtd,
                        'preco_unit'   => $precoUnit,
                    ];

                    $stmtBaixa = $pdo->prepare('UPDATE produtos SET estoque = estoque - :qtd WHERE id = :id');
                    $stmtBaixa->execute([':qtd' => $qtd, ':id' => $prodId]);
                } else {
                    $precoUnit = normalizarValor($item['price'] ?? 0);
                    $subtotal += $precoUnit * $qtd;
                    $itensValidados[] = [
                        'produto_id'   => null,
                        'nome_produto' => trim((string) ($item['name'] ?? 'Produto NexaTech')),
                        'quantidade'   => $qtd,
                        'preco_unit'   => $precoUnit,
                    ];
                }
            }

            $desconto = ($cupom === 'NEXA10') ? round($subtotal * 0.10, 2) : 0.0;
            $frete    = ($subtotal > 0 && $subtotal < 199) ? 10.0 : 0.0;
            $total    = max(0, round($subtotal - $desconto + $frete, 2));

            // Identifica as colunas existentes na tabela pedidos
            $colunasPedido = $pdo->query(
                "SELECT column_name
                 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'pedidos'"
            )->fetchAll(PDO::FETCH_COLUMN);

            $dadosPedido = [
                'cliente_id' => $clienteId,
                'total'      => $total,
                'status'     => 'Recebido',
            ];

            $opcionaisPedido = [
                'endereco_entrega' => $endereco,
                'cep_entrega'      => $cep,
                'cep'              => $cep,
                'subtotal'         => $subtotal,
                'desconto'         => $desconto,
                'frete'            => $frete,
                'cupom'            => $cupom !== '' ? $cupom : null,
            ];

            foreach ($opcionaisPedido as $coluna => $valor) {
                if (in_array($coluna, $colunasPedido, true)) {
                    $dadosPedido[$coluna] = $valor;
                }
            }

            $listaColunas = implode(', ', array_keys($dadosPedido));
            $listaParams  = implode(', ', array_map(fn($c) => ':' . $c, array_keys($dadosPedido)));

            $stmtPedido = $pdo->prepare(
                "INSERT INTO pedidos ({$listaColunas})
                 VALUES ({$listaParams})
                 RETURNING id"
            );

            $paramsExec = [];
            foreach ($dadosPedido as $coluna => $valor) {
                $paramsExec[':' . $coluna] = $valor;
            }
            $stmtPedido->execute($paramsExec);
            $pedidoId = (int) $stmtPedido->fetchColumn();

            // Grava os itens do pedido mapeando automaticamente as colunas de pedido_itens
            if (!empty($itensValidados)) {
                $colunasItens = $pdo->query(
                    "SELECT column_name
                     FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'pedido_itens'"
                )->fetchAll(PDO::FETCH_COLUMN);

                foreach ($itensValidados as $iv) {
                    $dadosItem = [
                        'pedido_id'  => $pedidoId,
                        'produto_id' => $iv['produto_id'],
                        'quantidade' => $iv['quantidade'],
                    ];

                    $opcionaisItem = [
                        'nome_produto'   => $iv['nome_produto'],
                        'preco_unitario' => $iv['preco_unit'],
                        'preco'          => $iv['preco_unit'],
                    ];

                    foreach ($opcionaisItem as $coluna => $valor) {
                        if (in_array($coluna, $colunasItens, true)) {
                            $dadosItem[$coluna] = $valor;
                        }
                    }

                    $colsItemStr = implode(', ', array_keys($dadosItem));
                    $valsItemStr = implode(', ', array_map(fn($c) => ':' . $c, array_keys($dadosItem)));

                    $stmtItem = $pdo->prepare("INSERT INTO pedido_itens ({$colsItemStr}) VALUES ({$valsItemStr})");
                    $paramsItem = [];
                    foreach ($dadosItem as $coluna => $valor) {
                        $paramsItem[':' . $coluna] = $valor;
                    }
                    $stmtItem->execute($paramsItem);
                }
            }

            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                'id'       => $pedidoId,
                'codigo'   => '#NT-' . (1000 + $pedidoId),
                'subtotal' => $subtotal,
                'desconto' => $desconto,
                'frete'    => $frete,
                'total'    => $total,
            ]);
            break;

        case 'PUT':
            $id = (int) ($payload['id'] ?? 0);
            $status = trim((string) ($payload['status'] ?? ''));
            $permitidos = ['Recebido', 'Em separação', 'Enviado', 'Entregue'];

            if ($id <= 0 || !in_array($status, $permitidos, true)) {
                http_response_code(422);
                echo json_encode(['erro' => 'Status ou ID inválido.']);
                exit;
            }

            $stmt = $pdo->prepare('UPDATE pedidos SET status = :status WHERE id = :id');
            $stmt->execute([':status' => $status, ':id' => $id]);

            echo json_encode(['mensagem' => 'Status atualizado.']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['erro' => 'Método não permitido.']);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao processar pedido: ' . $e->getMessage()]);
}