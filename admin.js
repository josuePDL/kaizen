const API_URL = "https://script.google.com/macros/s/AKfycbzfLRPDIGziFyZEzNRjDs54iOb51f_byKxoeaN8JhEEmq5qF6z96oFgLxIYrtpmlNCV/exec";

let inventario = [];

document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
  const tbody = document.getElementById("tabla-admin");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">Cargando base de datos...</td></tr>`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "leer" }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();
    inventario = data.datos || [];

    // Calcular Totales
    let costoTotal = 0;
    let ventaTotal = 0;
    let totalUnidades = 0;

    inventario.forEach(p => {
        let stock = parseInt(p.cantidad) || 0;
        let costo = parseFloat(p.costo) || 0;
        let precio = parseFloat(p.precio) || 0;
        
        if (stock > 0) {
            costoTotal += (costo * stock);
            ventaTotal += (precio * stock);
            totalUnidades += stock;
        }
    });

    // Actualizar Dashboard
    document.getElementById("metric-productos").innerText = inventario.length;
    document.getElementById("metric-costo").innerText = `Q${costoTotal.toFixed(2)}`;
    document.getElementById("metric-venta").innerText = `Q${ventaTotal.toFixed(2)}`;
    document.getElementById("metric-ganancia").innerText = `Q${(ventaTotal - costoTotal).toFixed(2)}`;

    if (inventario.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">No hay productos en el inventario.</td></tr>`;
      return;
    }

    tbody.innerHTML = inventario.map(p => {
      return `
        <tr>
          <td style="font-weight: 600; color: var(--morado-oscuro);">${p.id}</td>
          <td>
            <div style="font-weight: bold; margin-bottom: 4px;">${p.nombre}</div>
            <div style="color: #666; font-size: 0.85em; line-height: 1.3;">${p.descripcion || "Sin descripción"}</div>
          </td>
          <td style="font-weight: bold;">
            <div style="color: #c62828; font-size: 0.85em;">C: Q${(parseFloat(p.costo)||0).toFixed(2)}</div>
            <div style="color: #2e7d32;">V: Q${(parseFloat(p.precio)||0).toFixed(2)}</div>
          </td>
          <td style="text-align: center;">
            <span style="background: ${p.cantidad > 0 ? '#e8f5e9' : '#ffebee'}; color: ${p.cantidad > 0 ? '#2e7d32' : '#c62828'}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.9em;">
              ${p.cantidad}
            </span>
          </td>
          <td style="text-align: center;">
            <button class="btn-edit" onclick="seleccionarParaEditar(${p.fila})" style="padding: 6px 12px; font-size: 0.85em; border-radius: 15px;">✏️ Editar</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; padding: 30px;">Error al consultar Google Sheets. Verifica la conexión.</td></tr>`;
  }
}

function seleccionarParaEditar(fila) {
  const prod = inventario.find(p => p.fila === fila);
  if (!prod) return;

  document.getElementById("prod-fila").value = prod.fila;
  document.getElementById("prod-codigo").value = prod.id !== "N/A" ? prod.id : "";
  document.getElementById("prod-nombre").value = prod.nombre;
  document.getElementById("prod-desc").value = prod.descripcion;
  document.getElementById("prod-costo").value = prod.costo || 0;
  document.getElementById("prod-precio").value = prod.precio || 0;
  document.getElementById("prod-cantidad").value = prod.cantidad || 0;

  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = false;
  btnSubmit.innerText = "💾 Actualizar Producto";
  document.getElementById("btn-cancelar").style.display = "block";
  document.getElementById("titulo-form").innerText = "Editando Fila " + prod.fila;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelarEdicion() {
  document.getElementById("form-editar").reset();
  document.getElementById("prod-fila").value = "";
  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Selecciona un producto";
  document.getElementById("btn-cancelar").style.display = "none";
  document.getElementById("titulo-form").innerText = "Editar Producto";
}

async function guardarEdicion(e) {
  e.preventDefault();
  document.body.style.cursor = "wait";
  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  btn.innerText = "Guardando cambios...";

  const payload = {
    accion: "editar",
    fila: document.getElementById("prod-fila").value,
    id: document.getElementById("prod-codigo").value.trim(),
    nombre: document.getElementById("prod-nombre").value.trim(),
    descripcion: document.getElementById("prod-desc").value.trim(),
    costo: parseFloat(document.getElementById("prod-costo").value) || 0,
    precio: parseFloat(document.getElementById("prod-precio").value) || 0,
    cantidad: parseInt(document.getElementById("prod-cantidad").value) || 0
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();

    if (data.exito) {
      alert("✅ " + data.mensaje);
      cancelarEdicion();
      await cargarDatos(); 
    } else {
      alert("❌ Error: " + data.mensaje);
    }
  } catch (err) {
    alert("Error de conexión al guardar los cambios.");
  }
  document.body.style.cursor = "default";
  btn.innerText = "💾 Actualizar Producto";
  btn.disabled = false;
}

function abrirModalForm() { document.getElementById("modal-form").style.display = "flex"; }
function cerrarModalForm() { document.getElementById("modal-form").style.display = "none"; cargarDatos(); }
