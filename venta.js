const URL_API = "https://script.google.com/macros/s/AKfycby32Pb0rzz6ruy4T6NGo4PWMaxKvRwb96GeUnWxB8xQUh8757OPUtFSEBs8_SKB4A5U/exec";
let inventario = [];
let carrito = [];
let productoEnSeleccion = null;

document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify({ accion: "leer" }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();
    inventario = data.datos || [];
    filtrar();
  } catch(e) {
    document.getElementById("grid").innerHTML = "<p style='color:red;'>Error al cargar el inventario.</p>";
  }
}

function filtrar() {
  const txt = document.getElementById("buscador").value.toLowerCase();
  const filtrados = inventario.filter(p => 
    String(p.nombre).toLowerCase().includes(txt) || 
    String(p.id).toLowerCase().includes(txt)
  );
  
  document.getElementById("grid").innerHTML = filtrados.map(p => {
    const stock = parseInt(p.cantidad) || 0;
    
    // Mostramos la imagen o un cuadro gris si no tiene
    const imgHtml = p.imagen 
      ? `<img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 5px; margin-bottom: 10px; background-color: #eee;">` 
      : `<div style="width: 100%; height: 120px; border-radius: 5px; margin-bottom: 10px; background-color: #eee; display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.85em;">Sin Imagen</div>`;

    return `
      <div class="card" style="cursor:pointer; border-color: ${stock > 0 ? 'var(--morado-claro)' : 'red'}; display: flex; flex-direction: column;" onclick="abrirModal('${p.id}')">
        ${imgHtml}
        <h4 style="margin: 5px 0;">${p.nombre}</h4>
        <p style="margin:0; font-size: 0.85em; color: #666;">Cód: ${p.id}</p>
        <p style="margin-top:5px;">Q${p.precio.toFixed(2)} | Stock: <strong style="color: ${stock > 0 ? 'inherit' : 'red'};">${stock}</strong></p>
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
  inputCant.value = 1;
  inputCant.max = stock;
  
  document.getElementById("modal-cantidad").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal-cantidad").style.display = "none";
  productoEnSeleccion = null;
}

function confirmarAgregar() {
  const cantidad = parseInt(document.getElementById("modal-input-cant").value);
  if (isNaN(cantidad) || cantidad <= 0) return alert("Cantidad inválida.");
  
  const stockDisponible = parseInt(productoEnSeleccion.cantidad) || 0;
  const itemExistente = carrito.find(c => String(c.id) === String(productoEnSeleccion.id));
  
  if (itemExistente) {
    if ((itemExistente.cantidadVenta + cantidad) > stockDisponible) {
      return alert("La cantidad sumada supera el stock disponible.");
    }
    itemExistente.cantidadVenta += cantidad;
  } else {
    if (cantidad > stockDisponible) return alert("La cantidad supera el stock.");
    carrito.push({ ...productoEnSeleccion, cantidadVenta: cantidad });
  }

  cerrarModal();
  renderCarrito();
}

function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

function renderCarrito() {
  let total = 0;
  if(carrito.length === 0) {
    document.getElementById("carrito-lista").innerHTML = '<p style="text-align: center; color: #ce93d8;">El carrito está vacío</p>';
    document.getElementById("total").innerText = "0.00";
    return;
  }

  document.getElementById("carrito-lista").innerHTML = carrito.map((c, i) => {
    const subtotal = c.precio * c.cantidadVenta;
    total += subtotal;
    return `
      <div style="background: white; color: var(--texto); margin-bottom: 10px; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: bold; font-size: 0.9em;">${c.nombre}</div>
          <div style="font-size: 0.85em;">${c.cantidadVenta}x Q${c.precio.toFixed(2)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; margin-bottom: 5px;">Q${subtotal.toFixed(2)}</div>
          <button onclick="quitarDelCarrito(${i})" style="padding:4px 8px; font-size: 0.8em; background:#e74c3c; width:auto;">X</button>
        </div>
      </div>
    `;
  }).join("");
  document.getElementById("total").innerText = total.toFixed(2);
}

async function cobrar() {
  if (carrito.length === 0) return alert("El carrito está vacío.");
  
  document.body.style.cursor = "wait";
  const btn = document.querySelector(".col-3 button");
  btn.disabled = true;
  btn.innerText = "Procesando...";
  
  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify({ accion: "vender", carrito: carrito }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const data = await res.json();
    if (data.exito) {
      alert("✅ Venta procesada con éxito. Stock descontado.");
      carrito = [];
      renderCarrito();
      await cargarDatos(); // Recargar inventario
    } else {
      alert("❌ Error del servidor: " + data.mensaje);
    }
  } catch (error) {
    alert("Error de red al procesar la venta.");
  }
  
  document.body.style.cursor = "default";
  btn.disabled = false;
  btn.innerText = "Cobrar Venta";
}
