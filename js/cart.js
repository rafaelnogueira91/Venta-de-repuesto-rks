// Carrito de compras con persistencia en localStorage + control de stock

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

// Mapa de stock actual
function getStockMap() {
  return JSON.parse(localStorage.getItem("stockMap") || "{}");
}

function setStockMap(stockMap) {
  localStorage.setItem("stockMap", JSON.stringify(stockMap));
}

// Guarda stock original de cada producto
function getInitialStockMap() {
  return JSON.parse(localStorage.getItem("initialStockMap") || "{}");
}

function setInitialStockMap(map) {
  localStorage.setItem("initialStockMap", JSON.stringify(map));
}

function registerInitialStock(product) {
  const map = getInitialStockMap();

  if (typeof map[product.id] !== "number") {
    map[product.id] = Number(product.stock ?? 0);
    setInitialStockMap(map);
  }
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

// Texto visual según stock
function stockLabel(stock, qty = 0) {
  const disponible = Math.max(Number(stock || 0) - Number(qty || 0), 0);

  if (Number(stock || 0) <= 0) return "Sin stock";
  if (disponible <= 0) return "Stock máximo agregado";
  if (disponible <= 3) return `Quedan solo ${disponible}`;
  return `Disponible: ${disponible}`;
}

// Aplica visualmente stock y botón
function applyStockState(productId, stock) {
  const el = document.getElementById(`stock-${productId}`);
  const btn = document.getElementById(`btn-${productId}`);

  if (!el) return;

  const currentStock = Number(stock);

  if (currentStock <= 0) {
    el.textContent = "Sin stock";
    el.className = "stock stock-out";

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sin stock";
      btn.classList.remove("btn-warning");
      btn.classList.add("btn-secondary");
    }
  } else {
    el.textContent = `Stock: ${currentStock}`;

    if (currentStock <= 3) {
      el.className = "stock stock-low";
    } else {
      el.className = "stock stock-ok";
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = "Agregar al carrito";
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-warning");
    }
  }
}

// Descuenta stock visual y lo guarda
function updateStockUI(productId, qty) {
  const el = document.getElementById(`stock-${productId}`);
  if (!el) return;

  const stockMap = getStockMap();

  let stock;
  if (typeof stockMap[productId] === "number") {
    stock = stockMap[productId];
  } else {
    const currentText = el.textContent;
    const match = currentText.match(/\d+/);
    if (!match) return;
    stock = Number(match[0]);
  }

  stock -= qty;

  if (stock < 0) stock = 0;

  stockMap[productId] = stock;
  setStockMap(stockMap);

  applyStockState(productId, stock);
}

// Restaura stock visual guardado
function restoreStockUI() {
  const stockMap = getStockMap();

  Object.keys(stockMap).forEach((productId) => {
    applyStockState(productId, Number(stockMap[productId]));
  });
}

// Restaura stock original al vaciar carrito
function resetStockUI() {
  const initialMap = getInitialStockMap();

  Object.keys(initialMap).forEach((productId) => {
    applyStockState(productId, Number(initialMap[productId]));
  });

  localStorage.removeItem("stockMap");
}

// Agrega un producto al carrito respetando stock
function addToCart(product) {
  registerInitialStock(product);

  const cart = getCart();
  const existing = cart.find((p) => p.id === product.id);

  const stockEl = document.getElementById(`stock-${product.id}`);
  let stock = product.stock ?? 999999;

  if (stockEl) {
    const match = stockEl.textContent.match(/\d+/);
    if (match) stock = Number(match[0]);
  }

  if (stock <= 0) {
    toast(`❌ Sin stock: ${product.nombre}`);
    return;
  }

  if (existing) {
    if (stock <= 0) {
      toast(`⚠️ Stock máximo disponible para ${product.nombre}`);
      return;
    }

    existing.qty += 1;
  } else {
    cart.push({
      ...product,
      stock: Number(product.stock ?? 999999),
      qty: 1
    });
  }

  setCart(cart);
  updateStockUI(product.id, 1);

  const stockMap = getStockMap();
  const restante = Number(stockMap[product.id] ?? 0);

  if (restante > 0 && restante <= 3) {
    toast(`✅ Agregado: ${product.nombre}. Quedan ${restante}`);
  } else {
    toast(`✅ Agregado: ${product.nombre}`);
  }
}

// Cambia la cantidad de un producto respetando stock
function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((p) => p.id === id);

  if (!item) return;

  const stockEl = document.getElementById(`stock-${id}`);
  let stock = item.stock ?? 999999;

  if (stockEl) {
    const match = stockEl.textContent.match(/\d+/);
    if (match) stock = Number(match[0]);
  }

  if (delta > 0 && stock <= 0) {
    toast(`⚠️ Stock máximo disponible para ${item.nombre}`);
    return;
  }

  item.qty += delta;

  if (item.qty <= 0) {
    const idx = cart.findIndex((p) => p.id === id);
    cart.splice(idx, 1);
  }

  setCart(cart);

  if (delta > 0) {
    updateStockUI(id, 1);
  } else if (delta < 0) {
    const stockMap = getStockMap();
    const current = Number(stockMap[id] ?? 0);
    const newStock = current + 1;
    stockMap[id] = newStock;
    setStockMap(stockMap);
    applyStockState(id, newStock);
  }
}

// Elimina un producto del carrito y devuelve stock
function removeItem(id) {
  const cart = getCart();
  const item = cart.find((p) => p.id === id);

  if (item) {
    const stockMap = getStockMap();
    const current = Number(stockMap[id] ?? 0);
    stockMap[id] = current + item.qty;
    setStockMap(stockMap);
    applyStockState(id, stockMap[id]);
  }

  const nuevoCart = cart.filter((p) => p.id !== id);
  setCart(nuevoCart);
}

// Vacía todo el carrito y restaura stock original
function clearCart() {
  if (!confirm("¿Vaciar carrito?")) return;

  setCart([]);
  resetStockUI();
  toast("🧹 Carrito vaciado");
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
      const stockMap = getStockMap();
      const available = Number(stockMap[p.id] ?? 0);
      const stockText = stockLabel(available, 0);
      const plusDisabled = available <= 0 ? "disabled" : "";

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
              <div class="small ${available <= 0 ? "text-danger" : "text-warning"}">
                ${stockText}
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 cart-item-actions">
            <button class="btn btn-sm btn-outline-light" onclick="changeQty('${p.id}', -1)">-</button>
            <span class="fw-bold cart-item-qty">${p.qty}</span>
            <button class="btn btn-sm btn-outline-light" onclick="changeQty('${p.id}', 1)" ${plusDisabled}>+</button>
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
document.addEventListener("DOMContentLoaded", () => {
  restoreStockUI();
  updateCartUI();
});