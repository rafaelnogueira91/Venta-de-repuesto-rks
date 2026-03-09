// Carrito de compras con persistencia en localStorage

console.log("cart.js cargado correctamente");

// Número de WhatsApp en formato internacional
const WHATSAPP_NUMBER = "56945900008";

// Construye la ruta correcta de la imagen según la página actual
function imgPath(fileName) {
  const inPages = window.location.pathname.includes("/pages/");
  return (inPages ? "../img/" : "img/") + fileName;
}

// Formatea valores en pesos chilenos
function clp(n) {
  return "$" + Number(n).toLocaleString("es-CL");
}

// Obtiene el carrito almacenado
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

// Guarda el carrito y actualiza la interfaz
function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

// Actualiza el contador visible del carrito
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((acc, item) => acc + item.qty, 0);

  document.querySelectorAll("#cartCount").forEach((el) => {
    el.textContent = total;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
}

// Calcula el total acumulado del carrito
function cartTotal(cart) {
  return cart.reduce((acc, p) => acc + p.precio * p.qty, 0);
}

// Agrega un producto al carrito
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((p) => p.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  setCart(cart);
  toast(`✅ Agregado: ${product.nombre}`);
}

// Cambia la cantidad de un producto
function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((p) => p.id === id);

  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    const idx = cart.findIndex((p) => p.id === id);
    cart.splice(idx, 1);
  }

  setCart(cart);
}

// Elimina un producto del carrito
function removeItem(id) {
  const cart = getCart().filter((p) => p.id !== id);
  setCart(cart);
}

// Vacía todo el carrito
function clearCart() {
  if (!confirm("¿Vaciar carrito?")) return;
  setCart([]);
}

// Renderiza el contenido del carrito en el modal
function renderCart() {
  const cart = getCart();

  const body = document.getElementById("cartBody");
  const empty = document.getElementById("cartEmpty");
  const totalEl = document.getElementById("cartTotal");
  const waBtn = document.getElementById("btnWhatsapp");
  const clearBtn = document.getElementById("btnClear");

  if (!body || !empty || !totalEl || !waBtn || !clearBtn) return;

  if (!cart.length) {
    body.innerHTML = "";
    empty.classList.remove("d-none");
    totalEl.textContent = clp(0);
    waBtn.disabled = true;
    clearBtn.disabled = true;
    return;
  }

  empty.classList.add("d-none");
  waBtn.disabled = false;
  clearBtn.disabled = false;

  body.innerHTML = cart
    .map((p) => {
      const subtotal = p.precio * p.qty;
      const img = p.img ? imgPath(p.img) : "";

      return `
        <div class="cart-item d-flex align-items-center border-bottom border-secondary py-2 gap-2">

          <div class="d-flex align-items-center gap-2 cart-item-info">
            ${
              p.img
                ? `<img src="${img}" alt="${p.nombre}" class="cart-item-img">`
                : ""
            }
            <div class="cart-item-text">
              <div class="fw-bold cart-item-name">${p.nombre}</div>
              <div class="text-secondary small">${clp(p.precio)} c/u</div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 cart-item-actions">
            <button class="btn btn-sm btn-outline-light" onclick="changeQty('${p.id}', -1)">-</button>
            <span class="fw-bold cart-item-qty">${p.qty}</span>
            <button class="btn btn-sm btn-outline-light" onclick="changeQty('${p.id}', 1)">+</button>
          </div>

          <div class="fw-bold text-warning cart-item-subtotal">
            ${clp(subtotal)}
          </div>

          <button class="btn btn-sm btn-outline-danger cart-item-remove" onclick="removeItem('${p.id}')">✕</button>
        </div>
      `;
    })
    .join("");

  totalEl.textContent = clp(cartTotal(cart));
}

// Construye el mensaje para enviar por WhatsApp
function buildWhatsappMessage() {
  const cart = getCart();
  const total = cartTotal(cart);

  const lines = cart.map(
    (p) => `- ${p.nombre} x${p.qty} = ${clp(p.precio * p.qty)}`
  );

  const msg =
    `Hola 😊 Quiero cotizar/comprar:\n\n` +
    lines.join("\n") +
    `\n\nTOTAL: ${clp(total)}\n` +
    `\nNombre:\nDirección/Comuna:\nForma de pago:\n`;

  return encodeURIComponent(msg);
}

// Abre WhatsApp con el pedido generado
function sendWhatsapp() {
  const cart = getCart();
  if (!cart.length) return;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage()}`;
  window.open(url, "_blank");
}

// Abre el modal del carrito
function openCart() {
  updateCartUI();

  const modalEl = document.getElementById("cartModal");
  if (!modalEl) {
    alert("Falta el modal del carrito en el HTML (cartModal).");
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

// Actualiza toda la interfaz del carrito
function updateCartUI() {
  updateCartCount();
  renderCart();
}

// Muestra un mensaje breve de confirmación
function toast(text) {
  const el = document.getElementById("miniToast");
  if (!el) return;

  el.textContent = text;
  el.classList.remove("d-none");

  setTimeout(() => {
    el.classList.add("d-none");
  }, 1800);
}

// Inicializa la interfaz al cargar la página
document.addEventListener("DOMContentLoaded", updateCartUI);