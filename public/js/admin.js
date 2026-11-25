const API_PRODUTOS = '../api/produtos.php';
const orderKey = 'nexatech-admin-orders';
const customerKey = 'nexatech-admin-customers';

const starterOrders = [
  { id: '#NT-1048', customer: 'Marina Costa', date: '03 nov 2026', value: 'R$ 519,80', status: 'Recebido' },
  { id: '#NT-1047', customer: 'Rafael Lima', date: '03 nov 2026', value: 'R$ 329,90', status: 'Em separação' },
  { id: '#NT-1046', customer: 'Joana Alves', date: '02 nov 2026', value: 'R$ 469,80', status: 'Enviado' },
  { id: '#NT-1045', customer: 'Lucas Martins', date: '01 nov 2026', value: 'R$ 279,90', status: 'Entregue' }
];

const starterCustomers = [
  { name: 'Marina Costa', email: 'marina@email.com', orders: 3, total: 'R$ 1.249,70', status: 'Ativo' },
  { name: 'Rafael Lima', email: 'rafael@email.com', orders: 2, total: 'R$ 659,80', status: 'Ativo' },
  { name: 'Joana Alves', email: 'joana@email.com', orders: 5, total: 'R$ 1.899,40', status: 'Ativo' },
  { name: 'Lucas Martins', email: 'lucas@email.com', orders: 1, total: 'R$ 279,90', status: 'Ativo' }
];

const categorySymbols = {
  Teclados: '⌨',
  Mouses: '◉',
  'Áudio': '◖',
  Monitores: '▭',
  'Acessórios': '⌁'
};

function loadLocal(key, fallback) {
  const value = localStorage.getItem(key);
  if (value) return JSON.parse(value);
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

let products = [];
let orders = loadLocal(orderKey, starterOrders);
let customers = loadLocal(customerKey, starterCustomers);

const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const parsePrice = (value) => {
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
};

const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

const statusClass = (status) =>
  status === 'Entregue' || status === 'Ativo'
    ? ''
    : ' ' + (status === 'Recebido' || status === 'Em separação' ? 'warning' : 'neutral');

// Converte o registro vindo do PostgreSQL para o formato usado na interface
function mapDbProduct(row) {
  const numericId = Number(row.id);
  const priceNumber = Number(row.preco || 0);
  return {
    rawId: numericId,
    id: `p${numericId}`,
    name: row.nome,
    category: row.categoria,
    priceNumber,
    price: money(priceNumber),
    stock: Number(row.estoque ?? 0),
    status: row.status || 'Ativo',
    symbol: categorySymbols[row.categoria] || '▦',
    image: row.imagem || '',
    soldAt: ['Loja online']
  };
}

// READ: busca os produtos cadastrados no PostgreSQL
async function fetchProducts() {
  try {
    const response = await fetch(API_PRODUTOS);
    if (!response.ok) throw new Error('Falha ao carregar produtos');
    const data = await response.json();
    products = Array.isArray(data) ? data.map(mapDbProduct) : [];
  } catch (error) {
    console.error(error);
    products = [];
  }

  renderProducts();
  renderProductIds();
  updateMetrics();

  if (document.querySelector('#productIdSearch').value.trim()) {
    renderProductDetail();
  }
}

function renderProducts() {
  const query = document.querySelector('#productSearch').value.toLowerCase();
  const category = document.querySelector('#productCategory').value;
  const visible = products.filter(
    (product) =>
      (category === 'Todos' || product.category === category) &&
      product.name.toLowerCase().includes(query)
  );

  document.querySelector('#productsTable').innerHTML = visible.length
    ? visible
        .map(
          (product) => `
          <tr>
            <td><b class="product-id">${escapeHtml(product.id)}</b></td>
            <td>
              <div class="product-cell">
                <span class="product-symbol">${product.symbol}</span>
                ${escapeHtml(product.name)}
              </div>
            </td>
            <td>${escapeHtml(product.category)}</td>
            <td>${product.price}</td>
            <td><span class="status${product.status === 'Rascunho' ? ' neutral' : ''}">${escapeHtml(product.status)}</span></td>
            <td>
              <button type="button" class="table-action" data-edit="${product.rawId}">Editar</button>
              <button type="button" class="table-action delete" data-delete="${product.rawId}">Excluir</button>
            </td>
          </tr>`
        )
        .join('')
    : '<tr><td colspan="6">Nenhum produto encontrado.</td></tr>';

  document.querySelectorAll('[data-edit]').forEach((button) => {
    button.onclick = () => {
      const target = products.find((p) => p.rawId === Number(button.dataset.edit));
      openProduct(target);
    };
  });

  document.querySelectorAll('[data-delete]').forEach((button) => {
    button.onclick = () => deleteProduct(Number(button.dataset.delete));
  });
}

// DELETE: remove o produto no PostgreSQL
async function deleteProduct(rawId) {
  if (!confirm(`Deseja realmente excluir o produto p${rawId}?`)) return;

  try {
    const response = await fetch(`${API_PRODUTOS}?id=${rawId}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      alert(result.erro || 'Não foi possível excluir o produto.');
      return;
    }
    await fetchProducts();
  } catch (error) {
    alert('Erro de comunicação com o servidor.');
  }
}

function renderOrders() {
  const filter = document.querySelector('#orderFilter').value;
  const visible = orders.filter((order) => filter === 'Todos' || order.status === filter);

  document.querySelector('#ordersTable').innerHTML = visible
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.id)}</td>
        <td>${escapeHtml(order.customer)}</td>
        <td>${escapeHtml(order.date)}</td>
        <td>${escapeHtml(order.value)}</td>
        <td>
          <select class="status-select status${statusClass(order.status)}" data-order="${escapeHtml(order.id)}">
            <option ${order.status === 'Recebido' ? 'selected' : ''}>Recebido</option>
            <option ${order.status === 'Em separação' ? 'selected' : ''}>Em separação</option>
            <option ${order.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
            <option ${order.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
          </select>
        </td>
      </tr>`
    )
    .join('');

  document.querySelectorAll('[data-order]').forEach((select) => {
    select.onchange = () => {
      orders.find((order) => order.id === select.dataset.order).status = select.value;
      localStorage.setItem(orderKey, JSON.stringify(orders));
      renderOrders();
      updateMetrics();
    };
  });
}

function renderCustomers() {
  const query = document.querySelector('#customerSearch').value.toLowerCase();
  const visible = customers.filter((customer) =>
    `${customer.name} ${customer.email}`.toLowerCase().includes(query)
  );

  document.querySelector('#customersTable').innerHTML = visible
    .map(
      (customer) => `
      <tr>
        <td>${escapeHtml(customer.name)}</td>
        <td>${escapeHtml(customer.email)}</td>
        <td>${customer.orders}</td>
        <td>${escapeHtml(customer.total)}</td>
        <td><span class="status">${escapeHtml(customer.status)}</span></td>
      </tr>`
    )
    .join('');
}

function renderProductIds() {
  document.querySelector('#productIds').innerHTML = products
    .map((product) => `<option value="${product.id}">${escapeHtml(product.name)}</option>`)
    .join('');
}

function updateMetrics() {
  document.querySelector('#metricProducts').textContent = products.filter(
    (product) => product.status === 'Ativo'
  ).length;
  document.querySelector('#metricOrders').textContent = orders.filter(
    (order) => order.status !== 'Entregue'
  ).length;
  document.querySelector('#metricCustomers').textContent = customers.length;
  document.querySelector('#metricSales').textContent = money(
    orders.reduce((sum, order) => sum + parsePrice(order.value), 0)
  );
}

function openProduct(product) {
  document.querySelector('#productDialog').showModal();
  document.querySelector('#dialogTitle').textContent = product ? 'Editar produto' : 'Novo produto';
  document.querySelector('#productId').value = product?.rawId || '';
  document.querySelector('#productName').value = product?.name || '';
  document.querySelector('#productImage').value = product?.image || '';
  document.querySelector('#productCategoryForm').value = product?.category || 'Teclados';
  document.querySelector('#productPrice').value = product ? product.price : '';
  document.querySelector('#productStock').value = product?.stock ?? 10;
  document.querySelector('#productStatus').value = product?.status || 'Ativo';
}

function renderProductDetail() {
  const rawInput = document.querySelector('#productIdSearch').value.trim().toLowerCase();
  const card = document.querySelector('#productDetailCard');

  if (!rawInput) {
    card.innerHTML =
      '<div class="detail-empty"><span>⌕</span><h3>Selecione um produto</h3><p>Informe um ID acima para consultar imagem, estoque, local de venda e categoria.</p></div>';
    return;
  }

  // Aceita tanto "p1" quanto "1" na busca
  const normalized = rawInput.replace(/^p/, '');
  const product = products.find(
    (item) => item.id.toLowerCase() === rawInput || String(item.rawId) === normalized
  );

  if (!product) {
    card.innerHTML =
      '<div class="detail-empty"><span>!</span><h3>Produto não encontrado</h3><p>Confira o ID informado e tente novamente.</p></div>';
    return;
  }

  const fallback = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#dfeeda"/><text x="320" y="245" text-anchor="middle" font-family="Arial" font-size="80" fill="#62aa36">${product.symbol}</text></svg>`
  )}`;
  const image = product.image || fallback;
  const channels = product.soldAt?.length ? product.soldAt : ['Loja online'];

  card.innerHTML = `
    <div class="detail-content">
      <div class="detail-image-wrap">
        <img class="detail-image" src="${escapeHtml(image)}" alt="Imagem de ${escapeHtml(product.name)}" onerror="this.src='${fallback}'">
      </div>
      <div class="detail-info">
        <p class="detail-id">ID ${escapeHtml(product.id)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="detail-data">
          <div>
            <span>Estoque</span>
            <strong class="${product.stock > 0 ? 'stock-good' : 'stock-empty'}">${product.stock} unidades</strong>
          </div>
          <div>
            <span>Categoria</span>
            <strong>${escapeHtml(product.category)}</strong>
          </div>
          <div>
            <span>Onde está sendo vendido</span>
            <div class="sale-channels">
              ${channels.map((channel) => `<span class="sale-channel">${escapeHtml(channel)}</span>`).join('')}
            </div>
          </div>
          <div>
            <span>Status</span>
            <strong>${escapeHtml(product.status)}</strong>
          </div>
        </div>
      </div>
    </div>`;
}

function showSection(id) {
  document.querySelectorAll('.admin-section').forEach((section) => {
    section.classList.toggle('active', section.id === id);
  });
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.section === id);
  });
  document.querySelector('#pageTitle').textContent = {
    overview: 'Visão geral',
    products: 'Produtos',
    'product-detail': 'Consultar produto',
    orders: 'Pedidos',
    customers: 'Clientes'
  }[id];

  if (id === 'product-detail') renderProductDetail();
}

document.querySelectorAll('.nav-item').forEach((button) => {
  button.onclick = () => showSection(button.dataset.section);
});

document.querySelectorAll('[data-go]').forEach((button) => {
  button.onclick = () => showSection(button.dataset.go);
});

document.querySelector('#newProductButton').onclick = () => openProduct();
document.querySelector('#productSearch').oninput = renderProducts;
document.querySelector('#productCategory').onchange = renderProducts;
document.querySelector('#orderFilter').onchange = renderOrders;
document.querySelector('#customerSearch').oninput = renderCustomers;

document.querySelector('#productIdSearch').onkeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    renderProductDetail();
  }
};
document.querySelector('#productIdSearch').oninput = renderProductDetail;
document.querySelector('#lookupProductButton').onclick = renderProductDetail;

// CREATE & UPDATE no PostgreSQL
document.querySelector('#productForm').onsubmit = async (event) => {
  // Evita salvar quando o usuário clica no botão "×" (value="cancel") do dialog
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();

  const rawId = document.querySelector('#productId').value;
  const payload = {
    id: rawId ? Number(rawId) : undefined,
    nome: document.querySelector('#productName').value.trim(),
    categoria: document.querySelector('#productCategoryForm').value,
    preco: document.querySelector('#productPrice').value,
    estoque: Number(document.querySelector('#productStock').value),
    status: document.querySelector('#productStatus').value,
    imagem: document.querySelector('#productImage').value.trim()
  };

  try {
    const response = await fetch(API_PRODUTOS, {
      method: rawId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.erro || 'Erro ao salvar o produto.');
      return;
    }

    document.querySelector('#productDialog').close();
    await fetchProducts();
  } catch (error) {
    alert('Erro de comunicação com o servidor.');
  }
};

// Inicialização
fetchProducts();
renderOrders();
renderCustomers();
updateMetrics();