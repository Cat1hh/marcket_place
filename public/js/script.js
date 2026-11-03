const products=[
    {
    id:'p1',
    name:'Teclado Mecânico Atlas 75',
    category:'Teclados',
    price:'R$ 329,90',
    old:'R$ 399,90',
    rating:'4.9',
    reviews:128,
    symbol:'⌨',
    tone:'mint',
    tag:'Mais vendido'
    },
    {
    id:'p2',
    name:'Mouse sem fio Pulse Pro',
    category:'Mouses',
    price:'R$ 189,90',
    old:'R$ 229,90',
    rating:'4.8',
    reviews:96,
    symbol:'◉',
    tone:'lavender',
    tag:'Oferta'
    },
    {
        name:'Headset Echo Wireless',
        id:'p3',
        category:'Áudio',
        price:'R$ 279,90',
        old:'R$ 349,90',
        rating:'4.7',
        reviews:74,
        symbol:'◖',
        tone:'peach',
        tag:'Novo'
    },
    {
        id:'p4',
        name:'Hub USB-C Connect 8 em 1',
        category:'Acessórios',
        price:'R$ 149,90',
        old:'R$ 179,90',
        rating:'4.8',
        reviews:52,
        symbol:'⌁',
        tone:'sky',
        tag:'Oferta'
    }];
const adminProducts=JSON.parse(localStorage.getItem('nexatech-admin-products')||'null');
if(Array.isArray(adminProducts)){
    products.splice(0,products.length,...adminProducts.filter(p=>p.status==='Ativo').map(p=>({...p,old:p.price,rating:p.rating||'5.0',reviews:p.reviews||0,tone:p.tone||'mint',tag:p.tag||'Disponível'})));
}
const categories=['Todos','Teclados','Mouses','Áudio','Monitores','Acessórios'];
const cartKey='nexatech-cart';
let selected='Todos';let query='';
let cart=JSON.parse(localStorage.getItem(cartKey)||'[]');
const categoryList=document.querySelector('#categoryList'),grid=document.querySelector('#productGrid'),total=document.querySelector('#productTotal');
function updateCartCount(){document.querySelector('#cartCount').textContent=cart.length}
function addToCart(product){cart.push(product);localStorage.setItem(cartKey,JSON.stringify(cart));updateCartCount()}
function renderCategories(){
    categoryList.innerHTML=categories.map(c=>`<button class="category ${c===selected?'active':''}" data-category="${c}">${c}</button>`).join('');
    document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{selected=b.dataset.category;renderCategories();renderProducts()})}
function renderProducts(){const visible=products.filter(p=>(selected==='Todos'||p.category===selected)&&p.name.toLowerCase().includes(query.toLowerCase()));total.textContent=`${visible.length} produtos`;grid.innerHTML=visible.length?visible.map((p,i)=>`<article class="product-card" data-product-id="${p.id}" tabindex="0"><div class="visual ${p.tone}"><span class="product-symbol">${p.symbol}</span><span class="tag">${p.tag}</span><button class="favorite" aria-label="Favoritar ${p.name}">♡</button></div><div class="product-info"><small>${p.category} · ID ${p.id}</small><h3>${p.name}</h3><div class="rating"><span>★</span> <b>${p.rating}</b> <span>(${p.reviews})</span></div><div class="price-row"><div><span class="old-price">${p.old}</span><b class="price">${p.price}</b></div><button class="add-button" data-add="${i}">Adicionar</button></div></div></article>`).join(''):'<p>Nenhum produto encontrado.</p>';document.querySelectorAll('.product-card').forEach(card=>card.onclick=event=>{if(!event.target.closest('button'))window.location.href=`produto.html?id=${encodeURIComponent(card.dataset.productId)}`});document.querySelectorAll('.favorite').forEach(b=>b.onclick=()=>{b.classList.toggle('active');b.textContent=b.classList.contains('active')?'♥':'♡'});document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{addToCart(visible[Number(b.dataset.add)]);b.textContent='Adicionado';setTimeout(()=>b.textContent='Adicionar',900)})}
function syncSearch(value){query=value;document.querySelectorAll('input[type=search]').forEach(input=>input.value=value);renderProducts()}
document.querySelector('#searchInput').oninput=e=>syncSearch(e.target.value);document.querySelector('#mobileSearchInput').oninput=e=>syncSearch(e.target.value);document.querySelector('#menuButton').onclick=()=>document.querySelector('#mainNav').classList.toggle('open');updateCartCount();renderCategories();renderProducts();
