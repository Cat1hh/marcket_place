const defaultProducts=[
 {id:'p1',name:'Teclado Mecânico Atlas 75',category:'Teclados',price:'R$ 329,90',old:'R$ 399,90',rating:'4.9',reviews:128,symbol:'⌨',image:'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',stock:24},
 {id:'p2',name:'Mouse sem fio Pulse Pro',category:'Mouses',price:'R$ 189,90',old:'R$ 229,90',rating:'4.8',reviews:96,symbol:'◉',image:'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80',stock:18},
 {id:'p3',name:'Headset Echo Wireless',category:'Áudio',price:'R$ 279,90',old:'R$ 349,90',rating:'4.7',reviews:74,symbol:'◖',image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',stock:9},
 {id:'p4',name:'Hub USB-C Connect 8 em 1',category:'Acessórios',price:'R$ 149,90',old:'R$ 179,90',rating:'4.8',reviews:52,symbol:'⌁',image:'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',stock:0}
];
const savedProducts=JSON.parse(localStorage.getItem('nexatech-admin-products')||'null');
const products=Array.isArray(savedProducts)?savedProducts.filter(product=>product.status==='Ativo').map(product=>({...product,old:product.price,rating:product.rating||'5.0',reviews:product.reviews||0})):defaultProducts;
const productId=new URLSearchParams(window.location.search).get('id');
const product=products.find(item=>item.id===productId);
const cartKey='nexatech-cart';
const cart=JSON.parse(localStorage.getItem(cartKey)||'[]');
document.querySelector('#cartCount').textContent=cart.length;
const detail=document.querySelector('#productDetail');
const fallback=product?`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#dfeeda"/><text x="400" y="315" text-anchor="middle" font-family="Arial" font-size="120" fill="#62aa36">${product.symbol||'▦'}</text></svg>`)} `:'';
if(!product){
 detail.innerHTML='<div class="detail-empty-page"><h1>Produto não encontrado</h1><p>Esse produto não existe ou não está mais disponível.</p><a class="primary-button" href="index.html#produtos">Voltar para a loja</a></div>';
}else{
 const stock=Number(product.stock??0);
 const image=product.image||fallback.trim();
 detail.innerHTML=`<div class="product-detail-visual"><img src="${image}" alt="Imagem de ${product.name}" onerror="this.src='${fallback.trim()}'"></div><div class="product-detail-info"><p class="eyebrow">${product.category} · ID ${product.id}</p><h1>${product.name}</h1><div class="detail-rating"><span>★</span> <b>${product.rating||'5.0'}</b> · ${product.reviews||0} avaliações</div><div class="detail-price"><strong>${product.price}</strong><s>${product.old||''}</s></div><div class="detail-meta"><div><span>Disponibilidade</span><strong class="${stock?'detail-stock':'detail-stock out'}">${stock?`${stock} em estoque`:'Fora de estoque'}</strong></div><div><span>Categoria</span><strong>${product.category}</strong></div></div><div class="detail-buy"><input class="quantity-input" id="quantity" type="number" min="1" max="${Math.max(stock,1)}" value="1" aria-label="Quantidade"><button id="addProduct" ${stock?'':'disabled'}>${stock?'Adicionar à sacola':'Indisponível'} <span>↗</span></button></div></div>`;
 document.querySelector('#addProduct').onclick=()=>{const quantity=Number(document.querySelector('#quantity').value);for(let index=0;index<quantity;index++)cart.push(product);localStorage.setItem(cartKey,JSON.stringify(cart));document.querySelector('#cartCount').textContent=cart.length;document.querySelector('#addProduct').textContent='Adicionado à sacola';document.querySelector('#addProduct').classList.add('added')};
}
