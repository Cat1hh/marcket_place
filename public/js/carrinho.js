const cartKey='nexatech-cart';
const cartItems=document.querySelector('#cartItems');
const money=value=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const priceOf=price=>Number(price.replace('R$ ','').replace('.','').replace(',','.'));

function renderCart(){
    const cart=JSON.parse(localStorage.getItem(cartKey)||'[]');
    const grouped=cart.reduce((items,product)=>{
        const item=items.find(entry=>entry.name===product.name);
        if(item)item.quantity++;
        else items.push({...product,quantity:1});
        return items;
    },[]);
    cartItems.innerHTML=grouped.length?grouped.map(item=>`<div class="produto"><div><h3>${item.name}</h3><p>${item.price}</p></div><p>Quantidade: ${item.quantity}</p><button class="remove-button" data-remove="${item.name}">Remover</button></div>`).join(''):'<p>Seu carrinho está vazio.</p>';
    document.querySelector('#itemCount').textContent=`${cart.length} ${cart.length===1?'item':'itens'}`;
    const subtotal=cart.reduce((sum,product)=>sum+priceOf(product.price),0);
    const shipping=subtotal&&subtotal<199?10:0;
    document.querySelector('#subtotal').textContent=money(subtotal);
    document.querySelector('#shipping').textContent=money(shipping);
    document.querySelector('#total').textContent=money(subtotal+shipping);
    document.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{
        const next=cart.filter(product=>product.name!==button.dataset.remove);
        localStorage.setItem(cartKey,JSON.stringify(next));
        renderCart();
    });
}

document.querySelector('#checkoutButton').onclick=()=>alert('Compra pronta para finalização.');
renderCart();