const cartKey = 'nexatech-cart';

function updateCartCount() {
  const badge = document.querySelector('#cartCount');
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  badge.textContent = cart.length;
}

// Abre e fecha o menu mobile
const menuButton = document.querySelector('#menuButton');
const mainNav = document.querySelector('#mainNav');
if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
}

// Alterna o ícone de favorito em qualquer página (vitrine, catálogo ou relacionados)
document.addEventListener('click', (event) => {
  const favBtn = event.target.closest('.favorite');
  if (!favBtn) return;
  event.preventDefault();
  event.stopPropagation();
  favBtn.classList.toggle('active');
  favBtn.textContent = favBtn.classList.contains('active') ? '♥' : '♡';
});

// Sincroniza busca desktop/mobile e filtra ao vivo na vitrine (index.php)
const searchInputs = document.querySelectorAll('#searchInput, #mobileSearchInput');
searchInputs.forEach((input) => {
  input.addEventListener('input', (event) => {
    const value = event.target.value;
    searchInputs.forEach((other) => {
      if (other !== event.target) other.value = value;
    });

    const grid = document.querySelector('#productGrid');
    const totalEl = document.querySelector('#productTotal');
    if (!grid) return;

    const term = value.trim().toLowerCase();
    const cards = grid.querySelectorAll('.product-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const match = !term || card.textContent.toLowerCase().includes(term);
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    if (totalEl) {
      totalEl.textContent = `${visibleCount} ${visibleCount === 1 ? 'produto' : 'produtos'}`;
    }
  });
});

updateCartCount();