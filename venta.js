// ✅ Tu nueva URL ya está integrada
const URL_API = "https://script.google.com/macros/s/AKfycbwLqDG1D_3x3hl3Um5TBp_iKPRrp8gv6XmtCav8E_hfyUOCCKd-eGmeNjpd8GobsFBBTw/exec";

let inventario = [];
let carrito = [];
let productoEnSeleccion = null;

document.addEventListener("DOMContentLoaded", cargarDatos);

// 1. Cargar datos del inventario
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
    document.getElementById("grid").innerHTML = "<p style='color:red;'>Error al conectar con la base de datos.</p>";
  }
}

// 2. Mostrar catálogo en pantalla
function filtrar() {
  const txt = document.getElementById("buscador").value.toLowerCase();
  const filtrados = inventario.filter(p => 
    String(p.nombre).toLowerCase().includes(txt) || 
    String(p.id).toLowerCase().includes(txt)
  );
  
  document.getElementById("grid").innerHTML = filtrados.map(p => {
    const stock = parseInt(p.cantidad) || 0; // Forzamos a que sea número matemático
    const precio = parseFloat(p.precio) || 0;
    
    return `
      <div class="card" style="cursor:pointer; border-color: ${stock > 0 ? 'var(--morado-claro)' : 'red'};" onclick="abrirModal('${p.id}')">
        <h4>${p.nombre}</h4>
        <p>Q${precio.toFixed(2)} | Stock: <strong style="color: ${stock > 0 ? 'inherit' : 'red'};">${stock}</strong></p>
      </div>
    `;
  }).join("");
}

// 3. Abrir ventana de cantidad
function abrirModal(idBuscado) {
  // 🔥 CORRECCIÓN CLAVE: Obligamos a comparar ambos como Texto para que nunca falle
  const prod = inventario.find(p => String(p.id).trim() === String(idBuscado).trim());
  
  if (!prod) return alert("Error: No se pudo localizar el producto.");
  
  const stock = parseInt(prod.cantidad) || 0;
  if (stock <= 0) return alert("Este producto está agotado (Sin stock).");
  
  productoEnSeleccion = prod;
  document.getElementById("modal-titulo").innerText = prod.nombre;
  document.getElementById("modal-stock").innerText = stock;
  
  const inputCant = document.getElementById("modal-input-cant");
  inputCant.value = 1;
  inputCant.max = stock; // Evita subir de más con las flechitas
  
  document.getElementById("modal-cantidad").style.display = "flex";
}

// 4. Cerrar ventana
function cerrarModal() {
  document.getElementById("modal-cantidad").style.display = "none";
  productoEnSeleccion = null;
}

// 5. Confirmar y pasar al carrito
function confirmarAgregar() {
  const cantidadDeseada = parseInt(document.getElementById("modal-input-cant").value);
  if (isNaN(cantidadDeseada) || cantidadDeseada <= 0) return alert("Ingresa una cantidad válida.");
  
  const stockDisponible = parseInt(productoEnSeleccion.cantidad) || 0;
  
  // Buscar si ya estaba en el carrito (también comparando como texto)
  const itemExistente = carrito.find(c => String(c.id) === String(productoEnSeleccion.id));
  
  if (itemExistente) {
    // Si ya existe, sumar lo viejo con lo nuevo y verificar que no pase el stock
    if ((itemExistente.cantidadVenta + cantidadDeseada) > stockDisponible) {
      return alert(`❌ No puedes agregar ${cantidadDeseada} más. Supera tu stock total de ${stockDisponible} unidades.`);
    }
    itemExistente.cantidadVenta += cantidadDeseada;
  } else {
    // Si es nuevo en el carrito
    if (cantidadDeseada > stockDisponible) {
      return alert("❌ La cantidad supera el stock.");
    }
    // Agregar copia al carrito
    carrito.push({ ...productoEnSeleccion, cantidadVenta: cantidadDeseada });
  }

  cerrarModal();
  renderCarrito();
}

// 6. Quitar un producto del carrito
function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

// 7. Dibujar lista de compras en la derecha
function renderCarrito() {
  let total = 0;
  
  document.getElementById("carrito-lista").innerHTML = carrito.map((c, index) => {
    const precio = parseFloat(c.precio) || 0;
    const subtotal = precio * c.cantidadVenta;
    total += subtotal;
    
    return `
      <div style="background: white; color: var(--texto); margin-bottom: 10px; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--morado-medio);">
        <div>
          <div style="font-weight: bold;">${c.nombre}</div>
          <div style="font-size: 0.9em;">${c.cantidadVenta} und(s) x Q${precio.toFixed(2)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; margin-bottom: 5px; color: var(--morado-oscuro);">Q${subtotal.toFixed(2)}</div>
          <button onclick="quitarDelCarrito(${index})" style="padding:4px 8px; font-size: 0.8em; background:#e74c3c; width:auto; border-radius:3px;">Quitar</button>
        </div>
      </div>
    `;
  }).join("");
  
  document.getElementById("total").innerText = total.toFixed(2);
}

// 8. Procesar Venta (Descontar en Sheets)
async function cobrar() {
  if (carrito.length === 0) return alert("El carrito está vacío.");
  
  document.body.style.cursor = "wait";
  const botonCobrar = document.querySelector(".col-3 button");
  botonCobrar.disabled = true;
  botonCobrar.innerText = "Cobrando...";
  
  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify({ accion: "vender", carrito: carrito }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const data = await res.json();
    if (data.exito) {
      alert("✅ Venta procesada con éxito. Stock descontado de la base de datos.");
      carrito = []; // Vaciamos carrito
      renderCarrito();
      await cargarDatos(); // Refrescamos el inventario para ver el stock actualizado
    } else {
      alert("❌ Error: " + data.mensaje);
    }
  } catch (error) {
    alert("Hubo un problema de conexión. Revisa tu internet.");
  }
  
  document.body.style.cursor = "default";
  botonCobrar.disabled = false;
  botonCobrar.innerText = "Cobrar Venta";
}