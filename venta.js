const API_URL = "https://script.google.com/macros/s/AKfycbzfLRPDIGziFyZEzNRjDs54iOb51f_byKxoeaN8JhEEmq5qF6z96oFgLxIYrtpmlNCV/exec";
let inventario = [];
let carrito = [];
let productoEnSeleccion = null;
document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ accion: "leer" }), headers: { "Content-Type": "text/plain;charset=utf-8" }});
    const data = await res.json();
    inventario = data.datos || [];
    filtrar();
  } catch(e) { document.getElementById("grid").innerHTML = "<p style='color:red; text-align:center;'>Error al cargar el inventario.</p>"; }
}

function filtrar() {
  const txt = document.getElementById("buscador").value.toLowerCase();
  const filtrados = inventario.filter(p => String(p.nombre).toLowerCase().includes(txt) || String(p.id).toLowerCase().includes(txt));
  document.getElementById("grid").innerHTML = filtrados.map(p => {
    const stock = parseInt(p.cantidad) || 0;
    const imgHtml = p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; background-color: #f9f9f9;">` : `<div style="width: 100%; height: 140px; border-radius: 8px; margin-bottom: 10px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.85em;">Sin Imagen</div>`;
    return `
      <div class="card" style="cursor:pointer; border-top-color: ${stock > 0 ? 'var(--morado-medio)' : '#e53935'};" onclick="abrirModal('${p.id}')">
        ${imgHtml}
        <h4 style="margin: 5px 0; font-size: 1.1em;">${p.nombre}</h4>
        <p style="margin:5px 0; font-size: 0.85em; color: #888;">Cód: ${p.id}</p>
        <div style="margin-top:auto; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #2e7d32; font-size: 1.1em;">Q${p.precio.toFixed(2)}</span>
          <span style="background: ${stock > 0 ? '#f3e5f5' : '#ffebee'}; color: ${stock > 0 ? 'var(--morado-oscuro)' : '#c62828'}; padding: 4px 8px; border-radius: 12px; font-size: 0.9em; font-weight: bold;">
            Stock: ${stock}
          </span>
        </div>
      </div>
    `;
  }).join("");
}

function abrirModal(idBuscado) {
  const prod = inventario.find(p => String(p.id).trim() === String(idBuscado).trim());
  if (!prod) return alert("Error: No se pudo localizar el producto.");
  const stock = parseInt(prod.cantidad) || 0;
  if (stock <= 0) return alert("Este producto está agotado (Sin stock).");
  productoEnSeleccion = prod;
  document.getElementById("modal-titulo").innerText = prod.nombre;
  document.getElementById("modal-stock").innerText = stock;
  const inputCant = document.getElementById("modal-input-cant");
  inputCant.value = 1; inputCant.max = stock;
  document.getElementById("modal-cantidad").style.display = "flex";
}
function cerrarModal() { document.getElementById("modal-cantidad").style.display = "none"; productoEnSeleccion = null; }
function confirmarAgregar() {
  const cantidad = parseInt(document.getElementById("modal-input-cant").value);
  if (isNaN(cantidad) || cantidad <= 0) return alert("Cantidad inválida.");
  const stockDisponible = parseInt(productoEnSeleccion.cantidad) || 0;
  const itemExistente = carrito.find(c => String(c.id) === String(productoEnSeleccion.id));
  if (itemExistente) {
    if ((itemExistente.cantidadVenta + cantidad) > stockDisponible) return alert("La cantidad sumada supera el stock disponible.");
    itemExistente.cantidadVenta += cantidad;
  } else {
    if (cantidad > stockDisponible) return alert("La cantidad supera el stock.");
    carrito.push({ ...productoEnSeleccion, cantidadVenta: cantidad });
  }
  cerrarModal(); renderCarrito();
}
function quitarDelCarrito(index) { carrito.splice(index, 1); renderCarrito(); }
function renderCarrito() {
  let total = 0;
  if(carrito.length === 0) {
    document.getElementById("carrito-lista").innerHTML = '<p style="text-align: center; color: #ce93d8; margin: 20px 0;">El carrito está vacío</p>';
    document.getElementById("total").innerText = "0.00";
    return;
  }
  document.getElementById("carrito-lista").innerHTML = carrito.map((c, i) => {
    const subtotal = c.precio * c.cantidadVenta; total += subtotal;
    return `
      <div style="background: white; color: var(--texto); margin-bottom: 12px; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div><div style="font-weight: bold; font-size: 0.95em; margin-bottom: 3px;">${c.nombre}</div><div style="font-size: 0.85em; color: #555;">${c.cantidadVenta} x Q${c.precio.toFixed(2)}</div></div>
        <div style="text-align: right;"><div style="font-weight: bold; margin-bottom: 8px; color: #2e7d32;">Q${subtotal.toFixed(2)}</div><button onclick="quitarDelCarrito(${i})" style="padding:4px 10px; font-size: 0.85em; background:#e53935; border-radius: 15px; width:auto; border:none; color:white; cursor:pointer;">Eliminar</button></div>
      </div>
    `;
  }).join("");
  document.getElementById("total").innerText = total.toFixed(2);
}
async function cobrar() {
  if (carrito.length === 0) return alert("El carrito está vacío.");
  document.body.style.cursor = "wait";
  const btn = document.querySelector(".col-3 button");
  if(btn) { btn.disabled = true; btn.innerText = "Procesando..."; }
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ accion: "vender", carrito: carrito }), headers: { "Content-Type": "text/plain;charset=utf-8" }});
    const data = await res.json();
    if (data.exito) { alert("✅ Venta procesada con éxito. Stock descontado."); carrito = []; renderCarrito(); await cargarDatos(); } else { alert("❌ Error del servidor: " + data.mensaje); }
  } catch (error) { alert("Error de red al procesar la venta."); }
  document.body.style.cursor = "default";
  if(btn) { btn.disabled = false; btn.innerText = "Cobrar Venta"; }
}
