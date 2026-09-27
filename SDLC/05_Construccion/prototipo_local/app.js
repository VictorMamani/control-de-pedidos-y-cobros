const DEMO_ACCOUNTS = {
  componentes: {
    id: "componentes",
    prefix: "BC",
    business: "ByteLab Componentes",
    user: "Alex Mendoza",
    initials: "AM",
    role: "Propietario",
    seed: [
      { code: "BC-1042", product: "Teclado mecánico", variant: "K552 · switch red", quantity: 1, unitPrice: 690, status: "En preparación", createdAt: hoursAgo(3) },
      { code: "BC-1041", product: "Monitor IPS", variant: "24 pulgadas · Full HD", quantity: 1, unitPrice: 1480, status: "Listo para entregar", createdAt: hoursAgo(18) },
      { code: "BC-1040", product: "Memoria DDR5", variant: "16 GB · 5600 MHz", quantity: 2, unitPrice: 315, status: "Sin iniciar", createdAt: hoursAgo(28) }
    ]
  },
  movil: {
    id: "movil",
    prefix: "VM",
    business: "Valle Móvil",
    user: "Mariela Rojas",
    initials: "MR",
    role: "Vendedora",
    seed: [
      { code: "VM-0218", product: "Celular Android", variant: "256 GB · color grafito", quantity: 1, unitPrice: 2890, status: "En preparación", createdAt: hoursAgo(2) },
      { code: "VM-0217", product: "Cargador USB-C", variant: "45 W · blanco", quantity: 2, unitPrice: 145, status: "Entregado", createdAt: hoursAgo(21) }
    ]
  }
};

const STORAGE_PREFIX = "bytecx:prototype:v1:orders:";
const STATUS_OPTIONS = ["Sin iniciar", "En preparación", "Listo para entregar", "Entregado"];
const loginScreen = document.getElementById("login-screen");
const app = document.getElementById("app");
const dialog = document.getElementById("order-dialog");
const form = document.getElementById("order-form");
const toast = document.getElementById("toast");
let activeAccount = null;
let orders = [];
let activeView = "overview";
let activeFilter = "all";
let toastTimer;

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function formatMoney(amount) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `Bs ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function storageKey() {
  return `${STORAGE_PREFIX}${activeAccount.id}`;
}

function loadOrders(account) {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${account.id}`);
    if (!saved) return account.seed.map((order) => ({ ...order }));
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : account.seed.map((order) => ({ ...order }));
  } catch {
    showToast("El navegador no permitió leer lo guardado; se cargaron datos ficticios iniciales.");
    return account.seed.map((order) => ({ ...order }));
  }
}

function saveOrders() {
  if (!activeAccount) return false;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(orders));
    return true;
  } catch {
    showToast("El navegador no pudo guardar los cambios. Revisa la configuración de almacenamiento local.");
    return false;
  }
}

function enterDemo(accountId) {
  const account = DEMO_ACCOUNTS[accountId];
  if (!account) return;
  activeAccount = account;
  orders = loadOrders(account);
  activeFilter = "all";
  document.getElementById("order-search").value = "";
  document.querySelectorAll("[data-filter]").forEach((chip) => {
    const selected = chip.dataset.filter === "all";
    chip.classList.toggle("active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  document.getElementById("sidebar-business").textContent = account.business;
  document.getElementById("header-business").textContent = account.business;
  document.getElementById("user-name").textContent = account.user;
  document.getElementById("user-role").textContent = account.role;
  document.getElementById("user-avatar").textContent = account.initials;
  loginScreen.hidden = true;
  app.hidden = false;
  setView("overview");
  render();
}

function leaveDemo() {
  activeAccount = null;
  orders = [];
  app.hidden = true;
  loginScreen.hidden = false;
}

function setView(view) {
  activeView = view === "orders" ? "orders" : "overview";
  document.getElementById("overview-view").hidden = activeView !== "overview";
  document.getElementById("orders-view").hidden = activeView !== "orders";
  document.getElementById("breadcrumb").textContent = activeView === "orders" ? "Pedidos" : "Resumen";
  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getTotal(order) {
  return Number(order.quantity) * Number(order.unitPrice);
}

function orderMarkup(order, includeStatusControl) {
  const code = escapeHTML(order.code);
  const product = escapeHTML(order.product);
  const variant = escapeHTML(order.variant || "Sin variante anotada");
  const status = STATUS_OPTIONS.includes(order.status) ? order.status : STATUS_OPTIONS[0];
  const control = includeStatusControl
    ? `<label class="sr-only" for="status-${code}">Preparación del pedido ${code}</label>
       <select id="status-${code}" class="status-select" data-order-status="${code}">
         ${STATUS_OPTIONS.map((option) => `<option${option === status ? " selected" : ""}>${option}</option>`).join("")}
       </select>`
    : `<span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span>`;
  return `<tr>
    <td><span class="order-title">${product}</span><span class="order-meta"><span class="order-code">${code}</span> · ${variant} · Cant. ${Number(order.quantity)}</span></td>
    <td>${formatDate(order.createdAt)}</td>
    <td>${control}</td>
    <td class="money-cell">${formatMoney(getTotal(order))}</td>
  </tr>`;
}

function statusClass(status) {
  if (status === "Entregado") return "status-done";
  if (status === "Listo para entregar") return "status-ready";
  if (status === "En preparación") return "status-working";
  return "status-waiting";
}

function getVisibleOrders() {
  const query = document.getElementById("order-search").value.trim().toLocaleLowerCase("es");
  return [...orders]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .filter((order) => activeFilter === "all" || order.status === activeFilter)
    .filter((order) => !query || `${order.code} ${order.product} ${order.variant || ""}`.toLocaleLowerCase("es").includes(query));
}

function render() {
  const sorted = [...orders].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  const activeOrders = orders.filter((order) => order.status !== "Entregado");
  const totalValue = orders.reduce((sum, order) => sum + getTotal(order), 0);
  document.getElementById("metric-count").textContent = String(orders.length).padStart(2, "0");
  document.getElementById("metric-open").textContent = String(activeOrders.length).padStart(2, "0");
  document.getElementById("metric-total").textContent = formatMoney(totalValue);
  document.getElementById("recent-rows").innerHTML = sorted.slice(0, 5).map((order) => orderMarkup(order, false)).join("");
  document.getElementById("recent-empty").hidden = sorted.length > 0;

  const visible = getVisibleOrders();
  document.getElementById("order-rows").innerHTML = visible.map((order) => orderMarkup(order, true)).join("");
  document.getElementById("orders-caption").textContent = `${visible.length} de ${orders.length} pedidos`;
  document.getElementById("orders-empty").hidden = visible.length > 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3600);
}

function nextOrderCode() {
  const highest = orders.reduce((maximum, order) => {
    const suffix = Number(String(order.code).split("-").at(-1));
    return Number.isFinite(suffix) ? Math.max(maximum, suffix) : maximum;
  }, 1000);
  return `${activeAccount.prefix}-${highest + 1}`;
}

function updateOrderStatus(code, status) {
  if (!STATUS_OPTIONS.includes(status)) return;
  const order = orders.find((entry) => entry.code === code);
  if (!order) return;
  const previousStatus = order.status;
  order.status = status;
  if (!saveOrders()) {
    order.status = previousStatus;
    render();
    return;
  }
  render();
  showToast(`Preparación actualizada en ${code}.`);
}

document.querySelectorAll("[data-enter-demo]").forEach((button) => {
  button.addEventListener("click", () => enterDemo(button.dataset.enterDemo));
});

document.querySelectorAll("[data-change-account]").forEach((button) => button.addEventListener("click", leaveDemo));
document.querySelectorAll("[data-reset-demo]").forEach((button) => button.addEventListener("click", () => {
  if (!activeAccount || !window.confirm(`¿Reiniciar los datos de ${activeAccount.business}?`)) return;
  try {
    localStorage.removeItem(storageKey());
  } catch {
    showToast("El navegador no permitió reiniciar el almacenamiento.");
    return;
  }
  orders = activeAccount.seed.map((order) => ({ ...order }));
  render();
  showToast("Datos ficticios restaurados para este comercio.");
}));
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelectorAll("[data-open-order]").forEach((button) => button.addEventListener("click", () => {
  document.getElementById("form-error").hidden = true;
  form.reset();
  document.getElementById("quantity").value = "1";
  document.getElementById("order-total-preview").textContent = formatMoney(0);
  dialog.showModal();
  document.getElementById("product-name").focus();
}));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => dialog.close()));
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

function updateTotalPreview() {
  const quantity = Number(document.getElementById("quantity").value);
  const unitPrice = Number(document.getElementById("unit-price").value);
  const total = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : 0;
  document.getElementById("order-total-preview").textContent = formatMoney(total);
}

document.getElementById("quantity").addEventListener("input", updateTotalPreview);
document.getElementById("unit-price").addEventListener("input", updateTotalPreview);
document.getElementById("order-search").addEventListener("input", render);

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((chip) => {
      const selected = chip === button;
      chip.classList.toggle("active", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

document.getElementById("order-rows").addEventListener("change", (event) => {
  const select = event.target.closest("[data-order-status]");
  if (select) updateOrderStatus(select.dataset.orderStatus, select.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const product = document.getElementById("product-name").value.trim();
  const variant = document.getElementById("variant").value.trim();
  const quantity = Number(document.getElementById("quantity").value);
  const unitPrice = Number(document.getElementById("unit-price").value);
  const error = document.getElementById("form-error");

  if (!activeAccount) return;
  if (!product || product.length > 100 || variant.length > 100 || !Number.isInteger(quantity) || quantity < 1 || quantity > 999 || !Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 10000000) {
    error.textContent = "Revisa el producto, la cantidad y el precio unitario.";
    error.hidden = false;
    return;
  }

  orders.push({
    code: nextOrderCode(),
    product,
    variant,
    quantity,
    unitPrice,
    status: document.getElementById("fulfillment-status").value,
    createdAt: new Date().toISOString()
  });
  if (!saveOrders()) {
    orders.pop();
    render();
    return;
  }
  render();
  dialog.close();
  form.reset();
  setView("orders");
  showToast("Pedido guardado solo en este navegador.");
});
