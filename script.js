const products=[
    {
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
const categories=['Todos','Teclados','Mouses','Áudio','Monitores','Acessórios'];let selected='Todos';let query='';let cart=0;
const categoryList=document.querySelector('#categoryList'),grid=document.querySelector('#productGrid'),total=document.querySelector('#productTotal');
function renderCategories(){
    categoryList.innerHTML=categories.map(c=>`<button class="category ${c===selected?'active':''}" data-category="${c}">${c}</button>`).join('');
    document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{selected=b.dataset.category;renderCategories();renderProducts()})}
function renderProducts(){const visible=products.filter(p=>(selected==='Todos'||p.category===selected)&&p.name.toLowerCase().includes(query.toLowerCase()));total.textContent=`${visible.length} produtos`;grid.innerHTML=visible.length?visible.map((p,i)=>`<article class="product-card"><div class="visual ${p.tone}"><span class="product-symbol">${p.symbol}</span><span class="tag">${p.tag}</span><button class="favorite" aria-label="Favoritar ${p.name}">♡</button></div><div class="product-info"><small>${p.category}</small><h3>${p.name}</h3><div class="rating"><span>★</span> <b>${p.rating}</b> <span>(${p.reviews})</span></div><div class="price-row"><div><span class="old-price">${p.old}</span><b class="price">${p.price}</b></div><button class="add-button" data-add="${i}">Adicionar</button></div></div></article>`).join(''):'<p>Nenhum produto encontrado.</p>';document.querySelectorAll('.favorite').forEach(b=>b.onclick=()=>{b.classList.toggle('active');b.textContent=b.classList.contains('active')?'♥':'♡'});document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{cart++;document.querySelector('#cartCount').textContent=cart;b.textContent='Adicionado';setTimeout(()=>b.textContent='Adicionar',900)})}
function syncSearch(value){query=value;document.querySelectorAll('input[type=search]').forEach(input=>input.value=value);renderProducts()}
document.querySelector('#searchInput').oninput=e=>syncSearch(e.target.value);document.querySelector('#mobileSearchInput').oninput=e=>syncSearch(e.target.value);document.querySelector('#menuButton').onclick=()=>document.querySelector('#mainNav').classList.toggle('open');document.querySelector('#cartButton').onclick=()=>alert(cart?`Você adicionou ${cart} item(ns) ao carrinho.`:'Seu carrinho está vazio.');renderCategories();renderProducts();
