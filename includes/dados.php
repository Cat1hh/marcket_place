<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/db.php';

// Calcula a quantidade total de itens na sessão do carrinho
$totalCarrinho = 0;
if (!empty($_SESSION['carrinho'])) {
    foreach ($_SESSION['carrinho'] as $item) {
        $totalCarrinho += (int) $item['quantidade'];
    }
}

// Mesmas categorias cadastradas no select do admin.php
$categorias = [
    ['slug' => 'Teclados',   'nome' => 'Teclados'],
    ['slug' => 'Mouses',     'nome' => 'Mouses'],
    ['slug' => 'Áudio',      'nome' => 'Áudio'],
    ['slug' => 'Monitores',  'nome' => 'Monitores'],
    ['slug' => 'Acessórios', 'nome' => 'Acessórios'],
];

// Filtro por busca (?q=...) ou categoria (?categoria=...)
$busca = trim($_GET['q'] ?? '');
$categoriaAtiva = trim($_GET['categoria'] ?? '');

$sql = "SELECT 
            id,
            nome,
            categoria,
            preco,
            preco_antigo,
            estoque,
            status,
            COALESCE(NULLIF(imagem, ''), '../img/hero-gadgets.png') AS imagem,
            COALESCE(NULLIF(destaque, ''), categoria) AS destaque,
            descricao,
            avaliacao
        FROM produtos
        WHERE status = 'Ativo'";

$params = [];

if ($busca !== '') {
    $sql .= ' AND (nome ILIKE :busca OR categoria ILIKE :busca)';
    $params[':busca'] = "%{$busca}%";
}

if ($categoriaAtiva !== '') {
    $sql .= ' AND categoria ILIKE :categoria';
    $params[':categoria'] = $categoriaAtiva;
}

$sql .= ' ORDER BY id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$produtosFiltrados = $stmt->fetchAll();
$produtos = $produtosFiltrados;