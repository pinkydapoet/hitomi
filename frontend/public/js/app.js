const API = '/api';
const LOGO_SVG = `<svg viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="50" height="32" rx="6" fill="#CC2255" opacity=".9"/>
  <rect x="18" y="16" width="34" height="5" rx="2.5" fill="white"/>
  <rect x="18" y="25" width="34" height="5" rx="2.5" fill="white"/>
  <circle cx="24" cy="54" r="7" fill="#29C8E0"/><circle cx="24" cy="54" r="3.5" fill="white"/>
  <circle cx="52" cy="54" r="7" fill="#29C8E0"/><circle cx="52" cy="54" r="3.5" fill="white"/>
  <rect x="10" y="38" width="56" height="5" rx="2.5" fill="#CC2255" opacity=".7"/>
</svg>`;
document.querySelectorAll('.auth-logo, .nav-logo').forEach(el => {
  if (el.textContent.trim() === 'LOGO_SVG') el.innerHTML = LOGO_SVG;
});

// ── App state
let token       = localStorage.getItem('hitomi_token') || null;
let currentUser = JSON.parse(localStorage.getItem('hitomi_user') || 'null');
let currentProduct = null;
let plistActiveCat = 'all';
let activeCoupon   = null;
let timerInterval  = null;
let prevPage       = 'page-home';
let totalSec       = 8 * 3600 + 34 * 60 + 52;

let homeSearchTimer = null;
let plistSearchTimer = null;

const $ = id => document.getElementById(id);
const setLoading = show => { $('loader').style.display = show ? 'flex' : 'none'; };
const showToast = msg => {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
};

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ============================================================
//  PAGE ROUTING
// ============================================================
function showPage(id) {
  prevPage = document.querySelector('.page.active')?.id || 'page-home';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  closeAllDropdowns();

  if (id === 'page-home')     { loadHomeProducts(); startTimer(); }
  if (id === 'page-products') fetchProducts();
  if (id === 'page-cart')     loadCart();
  if (id === 'page-wishlist') loadWishlist();
  if (id === 'page-account')  loadProfile();
  if (id === 'page-orders')   loadOrders();
  if (id === 'page-admin')    loadAdminProducts();
}

function goBack() { showPage(prevPage || 'page-home'); }

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (totalSec <= 0) { clearInterval(timerInterval); return; }
    totalSec--;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if ($('t-h')) $('t-h').textContent = String(h).padStart(2, '0');
    if ($('t-m')) $('t-m').textContent = String(m).padStart(2, '0');
    if ($('t-s')) $('t-s').textContent = String(s).padStart(2, '0');
  }, 1000);
}

function toggleDropdown(id) {
  const el = $(id);
  const wasOpen = el.classList.contains('open');
  closeAllDropdowns();
  if (!wasOpen) el.classList.add('open');
}
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
}
document.addEventListener('click', e => {
  if (!e.target.closest('.avatar-btn') && !e.target.closest('.dropdown')) closeAllDropdowns();
});

function updateAdminLinks() {
  const isAdmin = currentUser?.role === 'admin';
  document.querySelectorAll('.admin-link').forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

async function syncBadges() {
  if (!token) {
    document.querySelectorAll('#cart-badge,#plist-cart-badge').forEach(el => el && (el.textContent = '0'));
    document.querySelectorAll('#wishlist-badge,#plist-wishlist-badge').forEach(el => el && (el.textContent = '0'));
    return;
  }
  try {
    const [cartData, wishData] = await Promise.all([
      apiFetch('/cart'),
      apiFetch('/wishlist'),
    ]);
    const cartCount = cartData.items.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('#cart-badge,#plist-cart-badge').forEach(el => el && (el.textContent = cartCount));
    document.querySelectorAll('#wishlist-badge,#plist-wishlist-badge').forEach(el => el && (el.textContent = wishData.items.length));
  } catch (_) {}
}

// ============================================================
//  AUTH
// ============================================================
async function doRegister() {
  const name  = $('reg-name').value.trim();
  const email = $('reg-email').value.trim();
  const pass  = $('reg-pass').value;
  const pass2 = $('reg-pass2').value;

  if (!name || !email || !pass || !pass2) return showToast('Please fill all fields');
  if (pass !== pass2) return showToast('Passwords do not match');
  if (pass.length < 6) return showToast('Password must be at least 6 characters');

  const btn = $('reg-btn');
  btn.disabled = true; 
  btn.textContent = 'Creating account…';
  setLoading(true); // Turn loader ON

  try {
    const parts = name.split(' ');
    const data  = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ first_name: parts[0], last_name: parts.slice(1).join(' '), email, password: pass }),
    });
    token       = data.token;
    currentUser = data.user;
    localStorage.setItem('hitomi_token', token);
    localStorage.setItem('hitomi_user', JSON.stringify(currentUser));
    
    // We only call this if updateAdminLinks exists in your code
    if(typeof updateAdminLinks === 'function') updateAdminLinks(); 
    
    showToast('Account created! Welcome 🎉');
    setTimeout(() => { showPage('page-home'); syncBadges(); }, 600);
  } catch (err) {
    // If the database fails, the error will pop up here in a toast!
    showToast(err.message); 
  } finally {
    setLoading(false); // ALWAYS turn loader OFF
    btn.disabled = false; 
    btn.textContent = 'Sign Up';
  }
}

async function doLogin() {
  const email = $('login-email').value.trim();
  const pass  = $('login-pass').value;
  if (!email || !pass) return showToast('Enter email & password');

  const btn = $('login-btn');
  btn.disabled = true; 
  btn.textContent = 'Signing in…';
  setLoading(true); // Turn loader ON

  try {
    const data  = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    token       = data.token;
    currentUser = data.user;
    localStorage.setItem('hitomi_token', token);
    localStorage.setItem('hitomi_user', JSON.stringify(currentUser));
    
    if(typeof updateAdminLinks === 'function') updateAdminLinks();
    
    showToast('Welcome back! 👟');
    setTimeout(() => { showPage('page-home'); syncBadges(); }, 500);
  } catch (err) {
    showToast(err.message);
  } finally {
    setLoading(false); 
    btn.disabled = false; 
    btn.textContent = 'Sign In';
  }
}

// signs the user out both client side and via the API
async function doSignOut() {
  // show loader immediately so user sees action
  setLoading(true);
  try {
    // call backend to invalidate token if desired (no effort required today)
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  } catch (e) {
    /* ignore */
  }

  token = null;
  currentUser = null;
  localStorage.removeItem('hitomi_token');
  localStorage.removeItem('hitomi_user');

  if (typeof updateAdminLinks === 'function') updateAdminLinks();
  syncBadges();
  showToast('Signed out successfully');
  showPage('page-login');
  setLoading(false);
}

// ============================================================
//  HOME — PRODUCTS
// ============================================================
async function loadHomeProducts() {
  try {
    const [allData, saleData] = await Promise.all([
      apiFetch('/products?limit=8'),
      apiFetch('/products?cat=sale'),
    ]);
    renderHomeGrid(allData.products);
    renderSaleRow(saleData.products);
  } catch (err) { console.error(err); }
}

function homeSearchDebounce() {
  clearTimeout(homeSearchTimer);
  homeSearchTimer = setTimeout(() => {
    const q = $('search-inp').value.trim();
    if (q.length > 0) { openProductsPage('all', q); }
  }, 400);
}

function renderHomeGrid(products) {
  const grid = $('home-grid');
  if (!grid) return;
  if (!products.length) { grid.innerHTML = '<p style="color:rgba(255,255,255,.7)">No products found.</p>'; return; }
  grid.innerHTML = products.map(p => homeProductCard(p)).join('');
}

function homeProductCard(p) {
  return `
  <div class="product-card" onclick="openModal(${p.id})">
    <div class="product-img-wrap">
      <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      <button class="wishlist-btn" onclick="event.stopPropagation();toggleWishlist(${p.id},this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ED66B7" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </button>
    </div>
    <div class="product-info">
      <div class="product-name">${p.name}</div>
      <div class="product-price">$${Number(p.price).toFixed(2)}</div>
      <div class="product-rating"><span style="color:#f5a623">★</span><span>${p.rating}</span></div>
    </div>
  </div>`;
}

function renderSaleRow(products) {
  const row = $('sale-row');
  if (!row) return;
  row.innerHTML = products.map(p => `
    <div class="product-card" style="min-width:160px;flex-shrink:0" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image_url}" alt="${p.name}" loading="lazy">
        <div style="position:absolute;top:8px;left:8px;background:#ED66B7;color:white;font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px">50% OFF</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">$${Number(p.price).toFixed(2)} <span style="color:#aaa;font-size:12px;text-decoration:line-through">$${Number(p.original_price).toFixed(2)}</span></div>
        <div class="product-rating"><span style="color:#f5a623">★</span><span>${p.rating}</span></div>
      </div>
    </div>`).join('');
}

// ============================================================
//  PRODUCTS PAGE
// ============================================================
function openProductsPage(cat, searchQuery) {
  plistActiveCat = cat || 'all';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  const chip = document.querySelector(`.filter-chip[data-filter="${plistActiveCat}"]`);
  if (chip) chip.classList.add('active');
  const titles = { all:'All Sneakers', men:"Men's Shoes", women:"Women's Shoes", sale:'On Sale 🔥', jordan:'Jordan', nike:'Nike', adidas:'Adidas' };
  const titleEl = $('plist-page-title');
  if (titleEl) titleEl.textContent = titles[plistActiveCat] || 'All Sneakers';
  if (searchQuery && $('plist-search-inp')) $('plist-search-inp').value = searchQuery;
  showPage('page-products');
}

function plistChip(btn, cat) {
  plistActiveCat = cat;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const titles = { all:'All Sneakers', men:"Men's Shoes", women:"Women's Shoes", sale:'On Sale 🔥', jordan:'Jordan', nike:'Nike', adidas:'Adidas' };
  $('plist-page-title').textContent = titles[cat] || 'All Sneakers';
  fetchProducts();
}

function plistDebounce() {
  clearTimeout(plistSearchTimer);
  plistSearchTimer = setTimeout(fetchProducts, 400);
}

async function fetchProducts() {
  const q    = ($('plist-search-inp')?.value || '').trim();
  const sort = $('plist-sort')?.value || 'default';
  const grid = $('plist-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="plist-empty">Loading…</div>';

  try {
    const params = new URLSearchParams({ sort });
    if (plistActiveCat !== 'all') params.set('cat', plistActiveCat);
    if (q) params.set('q', q);
    const data = await apiFetch(`/products?${params}`);

    $('plist-count').textContent = `${data.total} product${data.total !== 1 ? 's' : ''}`;

    if (!data.products.length) {
      grid.innerHTML = '<div class="plist-empty">😔 No sneakers found.<br>Try a different filter.</div>';
      return;
    }
    grid.innerHTML = data.products.map(p => plistCard(p)).join('');
  } catch (err) {
    grid.innerHTML = `<div class="plist-empty">Error loading products</div>`;
  }
}

function plistCard(p) {
  const brandMap = { jordan:'Jordan', nike:'Nike', adidas:'Adidas', reebok:'Reebok', vans:'Vans', 'new balance':'New Balance' };
  let brand = p.brand || 'Sneakers';
  return `
  <div class="plist-card" onclick="openModal(${p.id})">
    <div class="plist-img-wrap">
      <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      ${p.original_price ? `<div class="plist-sale-badge">50% OFF</div>` : ''}
      <button class="plist-bookmark" onclick="event.stopPropagation();toggleWishlist(${p.id},this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ED66B7" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
      </button>
    </div>
    <div class="plist-info">
      <div class="plist-brand">${brand}</div>
      <div class="plist-name">${p.name}</div>
      <div class="plist-price-row">
        <span class="plist-price">$${Number(p.price).toFixed(2)}</span>
        ${p.original_price ? `<span class="plist-orig">$${Number(p.original_price).toFixed(2)}</span>` : ''}
      </div>
      <div class="plist-rating"><span class="star">★</span><span>${p.rating}</span></div>
    </div>
  </div>`;
}

// ============================================================
//  WISHLIST
// ============================================================
async function toggleWishlist(productId, btn) {
  if (!token) { showToast('Please sign in to use wishlist'); showPage('page-login'); return; }
  try {
    const wishData = await apiFetch('/wishlist');
    const inWish   = wishData.items.some(i => i.product_id === productId);

    if (inWish) {
      await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
      showToast('Removed from wishlist');
      if (btn) { btn.classList.remove('liked','active'); }
    } else {
      await apiFetch('/wishlist', { method: 'POST', body: JSON.stringify({ product_id: productId }) });
      showToast('Added to wishlist ❤️');
      if (btn) { btn.classList.add('liked','active'); }
    }
    syncBadges();
  } catch (err) { showToast(err.message); }
}

async function loadWishlist() {
  if (!token) { $('wishlist-grid').innerHTML = '<div class="plist-empty">Please sign in to view your wishlist.</div>'; return; }
  try {
    const data = await apiFetch('/wishlist');
    const grid = $('wishlist-grid');
    if (!data.items.length) {
      grid.innerHTML = '<div class="plist-empty">Your wishlist is empty 💔</div>';
      return;
    }
    grid.innerHTML = data.items.map(i => `
      <div class="plist-card" onclick="openModal(${i.product_id})">
        <div class="plist-img-wrap">
          <img src="${i.image_url}" alt="${i.name}" loading="lazy">
          <button class="plist-bookmark active" onclick="event.stopPropagation();removeFromWishlistDirect(${i.product_id},this)">
            <svg viewBox="0 0 24 24" fill="#ED66B7" stroke="#ED66B7" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>
        <div class="plist-info">
          <div class="plist-brand">${i.brand}</div>
          <div class="plist-name">${i.name}</div>
          <div class="plist-price-row"><span class="plist-price">$${Number(i.price).toFixed(2)}</span></div>
          <div class="plist-rating"><span class="star">★</span><span>${i.rating}</span></div>
        </div>
      </div>`).join('');
  } catch (err) { showToast(err.message); }
}

async function removeFromWishlistDirect(productId, btn) {
  if (!token) return;
  try {
    await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
    btn?.closest('.plist-card')?.remove();
    showToast('Removed from wishlist');
    syncBadges();
  } catch (err) { showToast(err.message); }
}

// ============================================================
//  PRODUCT MODAL
// ============================================================
async function openModal(id) {
  try {
    const data = await apiFetch(`/products/${id}`);
    currentProduct = data.product;
    $('modal-img').src   = currentProduct.image_url;
    $('modal-name').textContent  = currentProduct.name;
    $('modal-price').textContent = `$${Number(currentProduct.price).toFixed(2)}`;
    $('modal-desc').textContent  = currentProduct.description || '';
    document.querySelectorAll('.size-btn').forEach((b, i) => b.classList.toggle('active', i === 2));
    $('modal-overlay').classList.add('open');
  } catch (err) { showToast('Could not load product'); }
}
function closeModal(e) { if (e.target === $('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { $('modal-overlay').classList.remove('open'); }
function selectSize(btn) { document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }

async function addToCartFromModal() {
  if (!currentProduct) return;
  if (!token) { showToast('Please sign in to add to cart'); closeModalDirect(); showPage('page-login'); return; }
  const size = document.querySelector('.size-btn.active')?.textContent || 'US 8';
  try {
    await apiFetch('/cart', { method: 'POST', body: JSON.stringify({ product_id: currentProduct.id, quantity: 1, size }) });
    showToast('Added to cart 🛒');
    syncBadges();
    closeModalDirect();
  } catch (err) { showToast(err.message); }
}

// ============================================================
//  CART
// ============================================================
async function loadCart() {
  const wrap = $('cart-items');
  if (!token) { wrap.innerHTML = '<div class="cart-empty">Please sign in to view your cart.</div>'; return; }
  try {
    const data = await apiFetch('/cart');
    renderCartItems(data.items, data.subtotal);
  } catch (err) { wrap.innerHTML = `<div class="cart-empty">Error loading cart</div>`; }
}

function renderCartItems(items, subtotal) {
  const wrap = $('cart-items');
  if (!items.length) {
    wrap.innerHTML = '<div class="cart-empty">🛒 Your cart is empty.<br><br><button onclick="showPage(\'page-products\')" style="background:var(--cyan);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-family:Nunito,sans-serif;font-weight:800;cursor:pointer;font-size:14px">Shop Now</button></div>';
    updateCartSummary(0);
    return;
  }
  wrap.innerHTML = items.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <img src="${item.image_url}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">Size: ${item.size}</div>
        <div class="cart-item-price">$${(Number(item.price) * item.quantity).toFixed(2)}</div>
        <div class="cart-actions">
          <button class="qty-btn" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
        </div>
      </div>
      <div class="cart-item-btns">
        <button class="trash-btn" onclick="removeCartItem(${item.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        </button>
      </div>
    </div>`).join('');
  updateCartSummary(subtotal);
}

function updateCartSummary(subtotal) {
  const shipping = subtotal > 0 ? 40 : 0;
  const imports  = subtotal > 0 ? 128 : 0;
  let discount   = 0;
  if (activeCoupon && subtotal > 0) {
    discount = activeCoupon.discount_type === 'percent'
      ? +(subtotal * activeCoupon.discount_value / 100).toFixed(2)
      : activeCoupon.discount_value;
  }
  const total = +(subtotal + shipping + imports - discount).toFixed(2);
  const items = document.querySelectorAll('.cart-item').length;

  $('cart-count').textContent  = items;
  $('items-total').textContent = `$${subtotal.toFixed(2)}`;
  $('grand-total').textContent = `$${total.toFixed(2)}`;

  const discRow = $('discount-row');
  if (discount > 0) {
    discRow.style.display = 'flex';
    $('discount-amt').textContent = `-$${discount.toFixed(2)}`;
  } else {
    discRow.style.display = 'none';
  }
}

async function updateCartItem(cartItemId, qty) {
  try {
    const data = await apiFetch(`/cart/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
    renderCartItems(data.items, data.items.reduce((s, i) => s + i.price * i.quantity, 0));
    syncBadges();
  } catch (err) { showToast(err.message); }
}

async function removeCartItem(cartItemId) {
  try {
    const data = await apiFetch(`/cart/${cartItemId}`, { method: 'DELETE' });
    renderCartItems(data.items, data.items.reduce((s, i) => s + i.price * i.quantity, 0));
    syncBadges();
    showToast('Item removed');
  } catch (err) { showToast(err.message); }
}

async function applyCoupon() {
  const code = $('coupon-inp').value.trim();
  if (!code) return showToast('Enter a coupon code');
  try {
    const data = await apiFetch('/orders/validate-coupon', {
      method: 'POST', body: JSON.stringify({ code }),
    });
    activeCoupon = data.coupon;
    const msg = $('coupon-msg');
    msg.textContent = `✅ ${data.message}`;
    msg.style.display = 'block';
    showToast(data.message);
    loadCart();
  } catch (err) {
    showToast(err.message);
    activeCoupon = null;
    $('coupon-msg').style.display = 'none';
  }
}

async function doCheckout() {
  if (!token) { showToast('Please sign in first'); showPage('page-login'); return; }
  try {
    setLoading(true);
    const body = {};
    if (activeCoupon) body.coupon_code = activeCoupon.code;
    const data = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) });
    setLoading(false);
    activeCoupon = null;
    $('coupon-inp').value = '';
    $('coupon-msg').style.display = 'none';
    syncBadges();
    showToast(`Order #${data.order.id} placed! Thank you 🎊`);
    loadCart();
  } catch (err) {
    setLoading(false);
    showToast(err.message);
  }
}

// ============================================================
//  ACCOUNT & ORDERS
// ============================================================
async function loadProfile() {
  if (!token) { showPage('page-login'); return; }
  try {
    const [profileData, wishData, ordersData] = await Promise.all([
      apiFetch('/user/profile'),
      apiFetch('/wishlist'),
      apiFetch('/orders'),
    ]);
    const u = profileData.user;
    $('acc-display-name').textContent = `${u.first_name} ${u.last_name}`.trim();
    $('acc-display-email').textContent = u.email;
    $('acc-fname').value   = u.first_name || '';
    $('acc-lname').value   = u.last_name  || '';
    $('acc-email').value   = u.email      || '';
    $('acc-phone').value   = u.phone      || '';
    $('acc-dob').value     = u.dob ? u.dob.split('T')[0] : '';
    $('acc-street').value  = u.street  || '';
    $('acc-city').value    = u.city    || '';
    $('acc-zip').value     = u.zip     || '';
    $('acc-country').value = u.country || '';

    $('stat-orders').textContent   = ordersData.orders.length;
    $('stat-wishlist').textContent = wishData.items.length;
    const saved = ordersData.orders.reduce((s, o) => s + Number(o.discount || 0), 0);
    $('stat-saved').textContent = `$${saved.toFixed(0)}`;
  } catch (err) { showToast(err.message); }
}

async function saveProfile() {
  try {
    await apiFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        first_name: $('acc-fname').value.trim(),
        last_name:  $('acc-lname').value.trim(),
        phone:      $('acc-phone').value.trim(),
        dob:        $('acc-dob').value,
      }),
    });
    showToast('Profile updated ✅');
    $('acc-display-name').textContent = `${$('acc-fname').value} ${$('acc-lname').value}`.trim();
  } catch (err) { showToast(err.message); }
}

async function saveAddress() {
  try {
    await apiFetch('/user/address', {
      method: 'PUT',
      body: JSON.stringify({
        street:  $('acc-street').value.trim(),
        city:    $('acc-city').value.trim(),
        zip:     $('acc-zip').value.trim(),
        country: $('acc-country').value.trim(),
      }),
    });
    showToast('Address saved ✅');
  } catch (err) { showToast(err.message); }
}

async function changePassword() {
  const cur  = $('acc-cur-pass').value;
  const nw   = $('acc-new-pass').value;
  const conf = $('acc-conf-pass').value;
  if (!cur || !nw || !conf) return showToast('Fill all password fields');
  if (nw !== conf) return showToast('New passwords do not match');
  if (nw.length < 6) return showToast('Min 6 characters');
  try {
    await apiFetch('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: cur, new_password: nw, confirm_password: conf }),
    });
    $('acc-cur-pass').value = $('acc-new-pass').value = $('acc-conf-pass').value = '';
    showToast('Password updated 🔐');
  } catch (err) { showToast(err.message); }
}

async function loadOrders() {
  if (!token) { $('orders-wrap').innerHTML = '<p style="color:rgba(255,255,255,.8);text-align:center;padding:40px">Please sign in to view orders.</p>'; return; }
  try {
    const data = await apiFetch('/orders');
    const wrap = $('orders-wrap');
    if (!data.orders.length) {
      wrap.innerHTML = '<div style="color:rgba(255,255,255,.7);text-align:center;padding:60px;font-size:18px;font-weight:700">📦 No orders yet.</div>';
      return;
    }
    wrap.innerHTML = data.orders.map(o => `
      <div class="account-section" style="cursor:pointer" onclick="viewOrderDetail(${o.id})">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:16px;font-weight:900;color:#333">Order #${o.id}</div>
            <div style="font-size:12px;color:#aaa;margin-top:4px">${new Date(o.created_at).toLocaleDateString()} · ${o.item_count} item${o.item_count !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="order-status ${o.status}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
            <span class="order-price">$${Number(o.total).toFixed(2)}</span>
          </div>
        </div>
      </div>`).join('');
  } catch (err) { showToast(err.message); }
}

async function viewOrderDetail(orderId) {
  try {
    const data = await apiFetch(`/orders/${orderId}`);
    const o    = data.order;
    const win  = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Order #${o.id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
    <style>body{font-family:Nunito,sans-serif;background:#f5f0f5;padding:32px;max-width:600px;margin:0 auto}
    .card{background:#fff;border-radius:20px;padding:24px;margin-bottom:16px;box-shadow:0 4px 16px rgba(0,0,0,.08)}
    h1{color:#ED66B7;font-size:26px;margin-bottom:20px}
    .item{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0}
    .item img{width:60px;height:50px;object-fit:contain;background:#f5f0f3;border-radius:8px;padding:4px}
    .row{display:flex;justify-content:space-between;font-size:14px;color:#666;margin-bottom:8px}
    .total{font-weight:900;font-size:16px;color:#333;border-top:1.5px solid #eee;padding-top:12px}
    .badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800;background:#e6f9f0;color:#22c55e}
    </style></head><body>
    <h1>Order #${o.id}</h1>
    <div class="card"><div class="row"><span>Status</span><span class="badge">${o.status}</span></div>
    <div class="row"><span>Date</span><span>${new Date(o.created_at).toLocaleString()}</span></div>
    ${o.shipping_address ? `<div class="row"><span>Ship to</span><span>${o.shipping_address}</span></div>` : ''}
    </div>
    <div class="card">${(o.items||[]).map(i=>`<div class="item"><img src="${i.image_url}" alt="${i.name}">
    <div><div style="font-weight:800">${i.name}</div><div style="font-size:12px;color:#aaa">Size: ${i.size} · Qty: ${i.quantity}</div>
    <div style="color:#29C8E0;font-weight:900">$${Number(i.price).toFixed(2)}</div></div></div>`).join('')}</div>
    <div class="card">
    <div class="row"><span>Subtotal</span><span>$${Number(o.subtotal).toFixed(2)}</span></div>
    <div class="row"><span>Shipping</span><span>$${Number(o.shipping).toFixed(2)}</span></div>
    <div class="row"><span>Import charges</span><span>$${Number(o.import_charges).toFixed(2)}</span></div>
    ${Number(o.discount)>0?`<div class="row" style="color:#22c55e"><span>Discount</span><span>-$${Number(o.discount).toFixed(2)}</span></div>`:''}
    <div class="row total"><span>Total</span><span style="color:#29C8E0">$${Number(o.total).toFixed(2)}</span></div>
    </div></body></html>`);
  } catch (err) { showToast(err.message); }
}

// ============================================================
//  ADMIN DASHBOARD
// ============================================================
async function loadAdminProducts() {
  if (currentUser?.role !== 'admin') { showToast('Unauthorized access'); showPage('page-home'); return; }
  try {
    const data = await apiFetch('/products?limit=100');
    const tbody = $('admin-products-tbody');
    tbody.innerHTML = data.products.map(p => `
      <tr>
        <td>#${p.id}</td>
        <td><img src="${p.image_url}" alt="${p.name}"></td>
        <td>${p.name}</td>
        <td style="color:var(--cyan)">$${Number(p.price).toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>
          <button class="admin-action-btn edit-btn" onclick='editAdminProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="admin-action-btn del-btn" onclick="deleteAdminProduct(${p.id})">Del</button>
        </td>
      </tr>
    `).join('');
  } catch (err) { showToast('Error loading admin products'); }
}

function openAdminProductModal() {
  $('admin-modal-title').textContent = "Add Product";
  $('admin-prod-id').value = '';
  $('admin-prod-name').value = '';
  $('admin-prod-brand').value = '';
  $('admin-prod-price').value = '';
  $('admin-prod-orig').value = '';
  $('admin-prod-cat').value = '1'; 
  $('admin-prod-stock').value = '100';
  $('admin-prod-img').value = '';
  $('admin-prod-desc').value = '';
  $('admin-modal-overlay').classList.add('open');
}

function editAdminProduct(p) {
  $('admin-modal-title').textContent = "Edit Product";
  $('admin-prod-id').value = p.id;
  $('admin-prod-name').value = p.name;
  $('admin-prod-brand').value = p.brand || '';
  $('admin-prod-price').value = p.price;
  $('admin-prod-orig').value = p.original_price || '';
  $('admin-prod-cat').value = p.category_id;
  $('admin-prod-stock').value = p.stock;
  $('admin-prod-img').value = p.image_url;
  $('admin-prod-desc').value = p.description || '';
  $('admin-modal-overlay').classList.add('open');
}

function closeAdminModal(e) { if (e.target === $('admin-modal-overlay')) closeAdminModalDirect(); }
function closeAdminModalDirect() { $('admin-modal-overlay').classList.remove('open'); }

async function saveAdminProduct() {
  const id = $('admin-prod-id').value;
  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `/products/${id}` : '/products';
  
  const payload = {
    name: $('admin-prod-name').value,
    brand: $('admin-prod-brand').value,
    price: Number($('admin-prod-price').value),
    original_price: $('admin-prod-orig').value ? Number($('admin-prod-orig').value) : null,
    category_id: Number($('admin-prod-cat').value),
    stock: Number($('admin-prod-stock').value),
    image_url: $('admin-prod-img').value,
    description: $('admin-prod-desc').value
  };

  if(!payload.name || !payload.price || !payload.category_id) {
    return showToast('Name, Price, and Category are required.');
  }

  try {
    setLoading(true);
    await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
    setLoading(false);
    showToast(id ? 'Product updated ✅' : 'Product created ✅');
    closeAdminModalDirect();
    loadAdminProducts();
  } catch (err) {
    setLoading(false);
    showToast(err.message);
  }
}

async function deleteAdminProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    setLoading(true);
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    setLoading(false);
    showToast('Product deleted (deactivated)');
    loadAdminProducts();
  } catch (err) {
    setLoading(false);
    showToast(err.message);
  }
}

// ============================================================
//  INIT
// ============================================================
(async function init() {
  // if we already have a token, validate and refresh user info
  if (token) {
    try {
      const data = await apiFetch('/auth/me');
      currentUser = data.user;
      localStorage.setItem('hitomi_user', JSON.stringify(currentUser));
    } catch (err) {
      // token invalid/expired – clear it so we don't stay stuck
      token = null;
      currentUser = null;
      localStorage.removeItem('hitomi_token');
      localStorage.removeItem('hitomi_user');
    }
  }

  updateAdminLinks();

  if (token) {
    showPage('page-home');
    syncBadges();
  }

  startTimer();
})();