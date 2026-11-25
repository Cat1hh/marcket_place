<?php
require_once __DIR__ . '/../../includes/auth.php';
$adminLogado = exigirAdmin();
require_once __DIR__ . '/../../includes/dados.php';

// Gera as duas primeiras letras do nome para o avatar
$iniciaisAdmin = mb_strtoupper(mb_substr(trim($adminLogado['nome'] ?? 'AD'), 0, 2, 'UTF-8'), 'UTF-8');

// Formata a data atual no padrão "25 NOV 2026" independentemente do locale do servidor
$meses = [
    1 => 'JAN', 2 => 'FEV', 3 => 'MAR', 4 => 'ABR',
    5 => 'MAI', 6 => 'JUN', 7 => 'JUL', 8 => 'AGO',
    9 => 'SET', 10 => 'OUT', 11 => 'NOV', 12 => 'DEZ'
];
$dataAtual = date('d') . ' ' . $meses[(int) date('n')] . ' ' . date('Y');
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Painel administrativo NexaTech.">
  <title>NexaTech | Administrador</title>
  <link rel="stylesheet" href="../css/admin.css">
  <link rel="stylesheet" href="../css/admin-detail.css">
</head>
<body>
  <div class="announcement">PAINEL INTERNO <span>•</span> NEXATECH ADMIN</div>
  <div class="admin-shell">
    <aside class="sidebar">
      <a class="logo" href="index.php" aria-label="Voltar para a loja"><b>N</b>nexa<strong>tech</strong></a>
      <div class="admin-profile">
        <span class="avatar"><?= htmlspecialchars($iniciaisAdmin, ENT_QUOTES, 'UTF-8') ?></span>
        <div>
          <b><?= htmlspecialchars($adminLogado['nome'], ENT_QUOTES, 'UTF-8') ?></b>
          <small>Controle da loja</small>
        </div>
      </div>
      <nav class="admin-nav" aria-label="Navegação administrativa">
        <button type="button" class="nav-item active" data-section="overview">Visão geral <span>⌂</span></button>
        <button type="button" class="nav-item" data-section="products">Produtos <span>▦</span></button>
        <button type="button" class="nav-item" data-section="product-detail">Consultar produto <span>⌕</span></button>
        <button type="button" class="nav-item" data-section="orders">Pedidos <span>◷</span></button>
        <button type="button" class="nav-item" data-section="customers">Clientes <span>◉</span></button>
      </nav>
      <a class="back-store" href="index.php">← Voltar para a loja</a>
      <a class="back-store" href="logout.php">Sair do painel</a>
    </aside>

    <main class="admin-main">
      <header class="topbar">
        <div>
          <p class="eyebrow">CENTRAL DE OPERAÇÕES</p>
          <h1 id="pageTitle">Visão geral</h1>
        </div>
        <div class="topbar-actions">
          <span class="date-label"><?= $dataAtual ?></span>
          <a class="store-link" href="index.php">Ver loja ↗</a>
        </div>
      </header>

      <section class="admin-section active" id="overview">
        <div class="welcome">
          <div>
            <p class="eyebrow green">BOM TRABALHO, ADMINISTRADOR</p>
            <h2>A loja em movimento.</h2>
            <p>Acompanhe os principais números e acesse rapidamente cada gerenciador.</p>
          </div>
          <span class="welcome-mark">N° 01</span>
        </div>
        <div class="metric-grid">
          <article class="metric-card">
            <span>Produtos ativos</span>
            <strong id="metricProducts">0</strong>
            <small>no catálogo</small>
          </article>
          <article class="metric-card">
            <span>Pedidos hoje</span>
            <strong id="metricOrders">0</strong>
            <small>aguardando atenção</small>
          </article>
          <article class="metric-card">
            <span>Clientes</span>
            <strong id="metricCustomers">0</strong>
            <small>base cadastrada</small>
          </article>
          <article class="metric-card highlight">
            <span>Vendas no mês</span>
            <strong id="metricSales">R$ 0,00</strong>
            <small>valor processado</small>
          </article>
        </div>
        <div class="quick-grid">
          <button type="button" class="quick-card" data-go="products">
            <span>▦</span>
            <b>Gerenciador de produtos</b>
            <small>Cadastrar, editar e excluir itens</small>
            <strong>↗</strong>
          </button>
          <button type="button" class="quick-card" data-go="orders">
            <span>◷</span>
            <b>Gerenciador de pedidos</b>
            <small>Visualizar e atualizar status</small>
            <strong>↗</strong>
          </button>
          <button type="button" class="quick-card" data-go="customers">
            <span>◉</span>
            <b>Gerenciador de clientes</b>
            <small>Visualizar e gerenciar clientes</small>
            <strong>↗</strong>
          </button>
        </div>
      </section>

      <section class="admin-section" id="products">
        <div class="section-toolbar">
          <div>
            <p class="eyebrow green">CATÁLOGO</p>
            <h2>Gerenciador de produtos</h2>
          </div>
          <button type="button" class="primary-action" id="newProductButton">+ Novo produto</button>
        </div>
        <div class="table-tools">
          <input id="productSearch" type="search" placeholder="Buscar produto...">
          <select id="productCategory">
            <option value="Todos">Todas as categorias</option>
            <option>Teclados</option>
            <option>Mouses</option>
            <option>Áudio</option>
            <option>Monitores</option>
            <option>Acessórios</option>
          </select>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="productsTable"></tbody>
          </table>
        </div>
      </section>

      <section class="admin-section" id="product-detail">
        <div class="section-toolbar">
          <div>
            <p class="eyebrow green">CONSULTA DE ESTOQUE</p>
            <h2>Consultar produto</h2>
          </div>
        </div>
        <div class="product-lookup">
          <label for="productIdSearch">ID do produto cadastrado</label>
          <div class="lookup-row">
            <input id="productIdSearch" list="productIds" placeholder="Ex.: p1" autocomplete="off">
            <datalist id="productIds"></datalist>
            <button type="button" class="primary-action" id="lookupProductButton">Consultar produto</button>
          </div>
          <small>Troque o ID para atualizar automaticamente o produto exibido.</small>
        </div>
        <article class="product-detail-card" id="productDetailCard" aria-live="polite">
          <div class="detail-empty">
            <span>⌕</span>
            <h3>Selecione um produto</h3>
            <p>Informe um ID acima para consultar imagem, estoque, local de venda e categoria.</p>
          </div>
        </article>
      </section>

      <section class="admin-section" id="orders">
        <div class="section-toolbar">
          <div>
            <p class="eyebrow green">OPERAÇÃO</p>
            <h2>Gerenciador de pedidos</h2>
          </div>
          <select id="orderFilter">
            <option value="Todos">Todos os status</option>
            <option value="Recebido">Recebido</option>
            <option value="Em separação">Em separação</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregue">Entregue</option>
          </select>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="ordersTable"></tbody>
          </table>
        </div>
      </section>

      <section class="admin-section" id="customers">
        <div class="section-toolbar">
          <div>
            <p class="eyebrow green">RELACIONAMENTO</p>
            <h2>Gerenciador de clientes</h2>
          </div>
          <input class="toolbar-search" id="customerSearch" type="search" placeholder="Buscar cliente...">
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>E-mail</th>
                <th>Pedidos</th>
                <th>Total gasto</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="customersTable"></tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <dialog id="productDialog">
    <form method="dialog" id="productForm">
      <div class="dialog-header">
        <div>
          <p class="eyebrow green">CATÁLOGO</p>
          <h2 id="dialogTitle">Novo produto</h2>
        </div>
        <button type="button" class="close-button" id="closeDialogButton" aria-label="Fechar">×</button>
      </div>
      <input type="hidden" id="productId">
      <label>Nome do produto<input id="productName" required></label>
      <div class="form-row">
        <label>Imagem (URL ou caminho)<input id="productImage" type="text" placeholder="https://... ou ../img/foto.png"></label>
        <label>Tag de destaque<input id="productHighlight" type="text" placeholder="Ex.: Switch Tactile"></label>
      </div>
      <div class="form-row">
        <label>Categoria
          <select id="productCategoryForm">
            <option>Teclados</option>
            <option>Mouses</option>
            <option>Áudio</option>
            <option>Monitores</option>
            <option>Acessórios</option>
          </select>
        </label>
        <label>Preço<input id="productPrice" placeholder="R$ 0,00" required></label>
      </div>
      <div class="form-row">
        <label>Estoque<input id="productStock" type="number" min="0" value="10" required></label>
        <label>Status
          <select id="productStatus">
            <option>Ativo</option>
            <option>Rascunho</option>
          </select>
        </label>
      </div>
      <label>Descrição<input id="productDescription" type="text" placeholder="Resumo técnico exibido na página do produto"></label>
      <button type="submit" class="primary-action" value="default">Salvar produto</button>
    </form>
  </dialog>

  <script src="../js/admin.js"></script>
</body>
</html>