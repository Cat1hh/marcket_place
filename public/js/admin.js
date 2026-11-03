const productKey='nexatech-admin-products';
const orderKey='nexatech-admin-orders';
const customerKey='nexatech-admin-customers';
const starterProducts=[
 {id:'p1',name:'Teclado Mecânico Atlas 75',category:'Teclados',price:'R$ 329,90',stock:24,status:'Ativo',symbol:'⌨',image:'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',soldAt:['Loja online','Marketplace']},
 {id:'p2',name:'Mouse sem fio Pulse Pro',category:'Mouses',price:'R$ 189,90',stock:18,status:'Ativo',symbol:'◉',image:'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80',soldAt:['Loja online','Instagram']},
 {id:'p3',name:'Headset Echo Wireless',category:'Áudio',price:'R$ 279,90',stock:9,status:'Ativo',symbol:'◖',image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',soldAt:['Loja online']},
 {id:'p4',name:'Hub USB-C Connect 8 em 1',category:'Acessórios',price:'R$ 149,90',stock:0,status:'Rascunho',symbol:'⌁',image:'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',soldAt:['Marketplace']}
];
const starterOrders=[
 {id:'#NT-1048',customer:'Marina Costa',date:'03 nov 2026',value:'R$ 519,80',status:'Recebido'},
 {id:'#NT-1047',customer:'Rafael Lima',date:'03 nov 2026',value:'R$ 329,90',status:'Em separação'},
 {id:'#NT-1046',customer:'Joana Alves',date:'02 nov 2026',value:'R$ 469,80',status:'Enviado'},
 {id:'#NT-1045',customer:'Lucas Martins',date:'01 nov 2026',value:'R$ 279,90',status:'Entregue'}
];
const starterCustomers=[
 {name:'Marina Costa',email:'marina@email.com',orders:3,total:'R$ 1.249,70',status:'Ativo'},
 {name:'Rafael Lima',email:'rafael@email.com',orders:2,total:'R$ 659,80',status:'Ativo'},
 {name:'Joana Alves',email:'joana@email.com',orders:5,total:'R$ 1.899,40',status:'Ativo'},
 {name:'Lucas Martins',email:'lucas@email.com',orders:1,total:'R$ 279,90',status:'Ativo'}
];
function load(key,fallback){const value=localStorage.getItem(key);if(value)return JSON.parse(value);localStorage.setItem(key,JSON.stringify(fallback));return fallback}
let products=load(productKey,starterProducts);
let orders=load(orderKey,starterOrders);
let customers=load(customerKey,starterCustomers);
const money=value=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const parsePrice=value=>Number(value.replace('R$ ','').replace('.','').replace(',','.'))||0;
const statusClass=status=>status==='Entregue'||status==='Ativo'?'':' '+(status==='Recebido'||status==='Em separação'?'warning':'neutral');

function renderProducts(){
 const query=document.querySelector('#productSearch').value.toLowerCase();
 const category=document.querySelector('#productCategory').value;
 const visible=products.filter(product=>(category==='Todos'||product.category===category)&&product.name.toLowerCase().includes(query));
 document.querySelector('#productsTable').innerHTML=visible.length?visible.map(product=>`<tr><td><b class="product-id">${product.id}</b></td><td><div class="product-cell"><span class="product-symbol">${product.symbol||'▦'}</span>${product.name}</div></td><td>${product.category}</td><td>${product.price}</td><td><span class="status${product.status==='Rascunho'?' neutral':''}">${product.status}</span></td><td><button class="table-action" data-edit="${product.id}">Editar</button> <button class="table-action delete" data-delete="${product.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="6">Nenhum produto encontrado.</td></tr>';
 document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>openProduct(products.find(product=>product.id===button.dataset.edit)));
 document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{products=products.filter(product=>product.id!==button.dataset.delete);saveProducts();renderProducts();updateMetrics()});
}
function renderOrders(){
 const filter=document.querySelector('#orderFilter').value;
 const visible=orders.filter(order=>filter==='Todos'||order.status===filter);
 document.querySelector('#ordersTable').innerHTML=visible.map(order=>`<tr><td>${order.id}</td><td>${order.customer}</td><td>${order.date}</td><td>${order.value}</td><td><select class="status-select status${statusClass(order.status)}" data-order="${order.id}"><option ${order.status==='Recebido'?'selected':''}>Recebido</option><option ${order.status==='Em separação'?'selected':''}>Em separação</option><option ${order.status==='Enviado'?'selected':''}>Enviado</option><option ${order.status==='Entregue'?'selected':''}>Entregue</option></select></td></tr>`).join('');
 document.querySelectorAll('[data-order]').forEach(select=>select.onchange=()=>{orders.find(order=>order.id===select.dataset.order).status=select.value;localStorage.setItem(orderKey,JSON.stringify(orders));renderOrders()});
}
function renderCustomers(){
 const query=document.querySelector('#customerSearch').value.toLowerCase();
 const visible=customers.filter(customer=>`${customer.name} ${customer.email}`.toLowerCase().includes(query));
 document.querySelector('#customersTable').innerHTML=visible.map(customer=>`<tr><td>${customer.name}</td><td>${customer.email}</td><td>${customer.orders}</td><td>${customer.total}</td><td><span class="status">${customer.status}</span></td></tr>`).join('');
}
function saveProducts(){localStorage.setItem(productKey,JSON.stringify(products))}
function renderProductIds(){document.querySelector('#productIds').innerHTML=products.map(product=>`<option value="${product.id}">${product.name}</option>`).join('')}
function updateMetrics(){
 document.querySelector('#metricProducts').textContent=products.filter(product=>product.status==='Ativo').length;
 document.querySelector('#metricOrders').textContent=orders.filter(order=>order.status!=='Entregue').length;
 document.querySelector('#metricCustomers').textContent=customers.length;
 document.querySelector('#metricSales').textContent=money(orders.reduce((sum,order)=>sum+parsePrice(order.value),0));
}
function openProduct(product){
 document.querySelector('#productDialog').showModal();
 document.querySelector('#dialogTitle').textContent=product?'Editar produto':'Novo produto';
 document.querySelector('#productId').value=product?.id||'';
 document.querySelector('#productName').value=product?.name||'';
 document.querySelector('#productImage').value=product?.image||'';
 document.querySelector('#productCategoryForm').value=product?.category||'Teclados';
 document.querySelector('#productPrice').value=product?.price||'';
 document.querySelector('#productStock').value=product?.stock??10;
 document.querySelector('#productStatus').value=product?.status||'Ativo';
}
function renderProductDetail(){
 const id=document.querySelector('#productIdSearch').value.trim().toLowerCase();
 const product=products.find(item=>item.id.toLowerCase()===id);
 const card=document.querySelector('#productDetailCard');
 if(!id){card.innerHTML='<div class="detail-empty"><span>⌕</span><h3>Selecione um produto</h3><p>Informe um ID acima para consultar imagem, estoque, local de venda e categoria.</p></div>';return}
 if(!product){card.innerHTML='<div class="detail-empty"><span>!</span><h3>Produto não encontrado</h3><p>Confira o ID informado e tente novamente.</p></div>';return}
 const fallback=`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#dfeeda"/><text x="320" y="245" text-anchor="middle" font-family="Arial" font-size="80" fill="#62aa36">${product.symbol||'▦'}</text></svg>`)}`;
 const image=product.image||fallback;
 const channels=product.soldAt?.length?product.soldAt:['Loja online'];
 card.innerHTML=`<div class="detail-content"><div class="detail-image-wrap"><img class="detail-image" src="${image}" alt="Imagem de ${product.name}" onerror="this.src='${fallback}'"></div><div class="detail-info"><p class="detail-id">ID ${product.id}</p><h3>${product.name}</h3><div class="detail-data"><div><span>Estoque</span><strong class="${product.stock>0?'stock-good':'stock-empty'}">${product.stock} unidades</strong></div><div><span>Categoria</span><strong>${product.category}</strong></div><div><span>Onde está sendo vendido</span><div class="sale-channels">${channels.map(channel=>`<span class="sale-channel">${channel}</span>`).join('')}</div></div><div><span>Status</span><strong>${product.status}</strong></div></div></div></div>`;
}
document.querySelectorAll('.nav-item').forEach(button=>button.onclick=()=>showSection(button.dataset.section));
document.querySelectorAll('[data-go]').forEach(button=>button.onclick=()=>showSection(button.dataset.go));
function showSection(id){document.querySelectorAll('.admin-section').forEach(section=>section.classList.toggle('active',section.id===id));document.querySelectorAll('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.section===id));document.querySelector('#pageTitle').textContent={overview:'Visão geral',products:'Produtos','product-detail':'Consultar produto',orders:'Pedidos',customers:'Clientes'}[id];if(id==='product-detail')renderProductDetail()}
document.querySelector('#newProductButton').onclick=()=>openProduct();
document.querySelector('#productSearch').oninput=renderProducts;
document.querySelector('#productCategory').onchange=renderProducts;
document.querySelector('#orderFilter').onchange=renderOrders;
document.querySelector('#customerSearch').oninput=renderCustomers;
document.querySelector('#productIdSearch').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();renderProductDetail()}};
document.querySelector('#productIdSearch').oninput=renderProductDetail;
document.querySelector('#lookupProductButton').onclick=renderProductDetail;
document.querySelector('#productForm').onsubmit=event=>{event.preventDefault();const id=document.querySelector('#productId').value;const current=id&&products.find(item=>item.id===id);const product={id:id||`p${Date.now()}`,name:document.querySelector('#productName').value,category:document.querySelector('#productCategoryForm').value,price:document.querySelector('#productPrice').value,stock:Number(document.querySelector('#productStock').value),status:document.querySelector('#productStatus').value,symbol:current?.symbol||'▦',image:document.querySelector('#productImage').value,soldAt:current?.soldAt||['Loja online']};if(id)products=products.map(item=>item.id===id?{...item,...product}:item);else products.push(product);saveProducts();document.querySelector('#productDialog').close();renderProducts();renderProductIds();updateMetrics();if(document.querySelector('#productIdSearch').value.toLowerCase()===product.id.toLowerCase())renderProductDetail()};
renderProducts();renderProductIds();renderOrders();renderCustomers();updateMetrics();
