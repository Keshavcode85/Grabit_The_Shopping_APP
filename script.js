/* ── GRABIT — script.js ── */

const API = "https://fakestoreapi.com/products";
let allProducts = [];

/* ── Cart helpers ── */
function getCart() { return JSON.parse(localStorage.getItem("cart")) || []; }
function saveCart(c) { localStorage.setItem("cart", JSON.stringify(c)); }

function updateCartCount() {
  const total = getCart().reduce((s, i) => s + (i.quantity || 1), 0);
  document.querySelectorAll("#cart-count").forEach(el => el.textContent = total);
}

/* ── Add to Cart ── */
function addToCart(id) {
  let cart = getCart();
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  updateCartCount();
}

/* ── Navigation ── */
function goToCart()      { window.location.href = "cart.html"; }
function viewProduct(id) { window.location.href = `product.html?id=${id}`; }

/* ── Place Order ── */
function placeOrder() {
  localStorage.removeItem("cart");
  window.location.href = "success.html";
}

/* ── Index page: fetch & render ── */
async function initIndex() {
  try {
    const res = await fetch(API);
    allProducts = await res.json();
    if (typeof renderProducts === "function") renderProducts(allProducts);
  } catch (e) {
    const l = document.getElementById("loading");
    if (l) l.textContent = "⚠  Failed to load products. Please refresh.";
  }
}

/* ── Search ── */
function searchProduct(value) {
  const filtered = allProducts.filter(p =>
    p.title.toLowerCase().includes(value.toLowerCase()) ||
    p.category.toLowerCase().includes(value.toLowerCase())
  );
  if (typeof renderProducts === "function") renderProducts(filtered);
}

/* ── Category Filter ── */
const CAT_MAP = {
  "mens-clothing":   "men's clothing",
  "womens-clothing": "women's clothing",
  "electronics":     "electronics",
  "jewelery":        "jewelery"
};

function filterByCategory(cat) {
  document.querySelectorAll(".cat-pill").forEach(p =>
    p.classList.toggle("active", p.dataset.cat === cat)
  );
  const apiCat = CAT_MAP[cat];
  const filtered = (cat === "all" || !apiCat)
    ? allProducts
    : allProducts.filter(p => p.category === apiCat);
  if (typeof renderProducts === "function") renderProducts(filtered);
}

/* ── Product detail page ── */
async function initProduct() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { window.location.href = "index.html"; return; }
  try {
    const res = await fetch(`${API}/${id}`);
    const p = await res.json();
    allProducts = [p];
    if (typeof renderProductDetail === "function") renderProductDetail(p);
  } catch (e) {
    const l = document.getElementById("loading");
    if (l) l.textContent = "⚠  Failed to load product.";
  }
}

/* ── Cart page ── */
async function displayCart() {
  const cartContainer = document.getElementById("cart-wrapper");
  if (!cartContainer) return;

  const cart = getCart();
  updateCartCount();

  if (!cart.length) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <div class="icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Browse our curated collections and find something you love.</p>
        <button class="btn-primary" onclick="window.location.href='index.html'">Start Shopping →</button>
      </div>`;
    return;
  }

  // Fetch products if not loaded yet (e.g. direct navigation to cart)
  if (!allProducts.length) {
    try {
      const res = await fetch(API);
      allProducts = await res.json();
    } catch (e) {}
  }

  let total = 0;
  let itemsHTML = "";

  cart.forEach((item, i) => {
    const product = allProducts.find(p => p.id === item.id) || item;
    const inr = Math.round((product.price || 0) * 83);
    const qty = item.quantity || 1;
    const lineTotal = inr * qty;
    total += lineTotal;

    itemsHTML += `
      <div class="cart-item" style="animation-delay:${i * 0.06}s">
        <img src="${product.image}" alt="${product.title}" onclick="viewProduct(${product.id})" style="cursor:pointer">
        <div class="cart-item-info">
          <div class="cart-item-cat">${product.category || ""}</div>
          <div class="cart-item-title" onclick="viewProduct(${product.id})" style="cursor:pointer">${product.title}</div>
          <div class="cart-item-price">₹${lineTotal.toLocaleString("en-IN")}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-row">
            <button class="qty-btn" onclick="decreaseQty(${item.id})">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" onclick="increaseQty(${item.id})">+</button>
          </div>
          <button class="btn-remove" onclick="removeItem(${item.id})">Remove</button>
        </div>
      </div>
    `;
  });

  cartContainer.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list">${itemsHTML}</div>
      <div class="cart-sidebar">
        <h3>Order Summary</h3>
        <div class="summary-line">
          <span>${cart.reduce((s, i) => s + (i.quantity || 1), 0)} item(s)</span>
          <span>₹${total.toLocaleString("en-IN")}</span>
        </div>
        <div class="summary-line"><span>Delivery</span><span style="color:var(--green)">Free</span></div>
        <div class="summary-line total">
          <span>Total</span>
          <span class="price">₹${total.toLocaleString("en-IN")}</span>
        </div>
        <div class="free-ship">✓ &nbsp;Free delivery on all orders</div>
        <button class="btn-primary" style="width:100%;padding:15px;font-size:0.95rem;" onclick="window.location.href='checkout.html'">
          Proceed to Checkout →
        </button>
      </div>
    </div>
  `;
}

/* ── Cart Controls ── */
function increaseQty(id) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.quantity = (item.quantity || 1) + 1;
  saveCart(cart);
  updateCartCount();
  displayCart();
}

function decreaseQty(id) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if ((item.quantity || 1) > 1) {
    item.quantity--;
  } else {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart(cart);
  updateCartCount();
  displayCart();
}

function removeItem(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartCount();
  displayCart();
}

/* ── Checkout summary ── */
function loadSummary() {
  const cart = getCart();
  const container = document.getElementById("order-items");
  if (!container) return;

  let total = 0;
  container.innerHTML = "";

  cart.forEach(item => {
    const inr = Math.round((item.price || 0) * 83) * (item.quantity || 1);
    total += inr;
    const row = document.createElement("div");
    row.className = "order-item-row";
    row.innerHTML = `
      <img src="${item.image || ''}" alt="${item.title || ''}">
      <div class="order-item-name">${item.title || 'Product'} × ${item.quantity || 1}</div>
      <div class="order-item-price">₹${inr.toLocaleString("en-IN")}</div>
    `;
    container.appendChild(row);
  });

  const subtotalEl = document.getElementById("subtotal");
  const totalEl    = document.getElementById("total");
  if (subtotalEl) subtotalEl.textContent = total.toLocaleString("en-IN");
  if (totalEl)    totalEl.textContent    = total.toLocaleString("en-IN");
}

/* ── Auto-init on page load ── */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  const path = location.pathname;

  if (path.includes("product.html"))       initProduct();
  else if (path.includes("cart.html"))     displayCart();
  else if (path.includes("checkout.html")) loadSummary();
  else                                     initIndex();
});