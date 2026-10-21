// AQUI PEGA LA NUEVA URL QUE TE DIO APPS SCRIPT
const URL_API = "https://script.google.com/macros/s/AKfycby32Pb0rzz6ruy4T6NGo4PWMaxKvRwb96GeUnWxB8xQUh8757OPUtFSEBs8_SKB4A5U/exec";

let inventario = [];

document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
  const tbody = document.getElementById("tabla-admin");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Cargando base de datos...</td></tr>`;

  try {
    const res = await fetch(URL_API, {
      method: "POST",
      body: JSON.stringify({ accion: "leer" }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();
    inventario = data.datos || [];

    if (inventario.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay productos en el inventario.</td></tr>`;
      return;
    }

    tbody.innerHTML = inventario.map(p => {
      return `
        <tr>
          <td style="font-weight: bold; color: var(--morado-oscuro);">${p.id}</td>
          <td>
            <strong>${p.nombre}</strong><br>
            <small style="color: #666;">${p.descripcion || "Sin descripción"}</small>
          </td>
          <td style="font-weight: bold; color: #2e7d32;">Q${p.precio.toFixed(2)}</td>
          <td style="text-align: center; font-weight: bold; color: ${p.cantidad > 0 ? 'inherit' : 'red'};">${p.cantidad}</td>
          <td style="text-align: center;">
            <button class="btn-edit" onclick="seleccionarParaEditar(${p.fila})" style="padding: 6px 12px; font-size: 0.9em;">✏️ Editar</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al consultar Google Sheets.</td></tr>`;
  }
}

// Llenar el formulario con los datos actuales
function seleccionarParaEditar(fila) {
  const prod = inventario.find(p => p.fila === fila);
  if (!prod) return;

  document.getElementById("prod-fila").value = prod.fila;
  document.getElementById("prod-codigo").value = prod.id !== "N/A" ? prod.id : "";
  document.getElementById("prod-nombre").value = prod.nombre;
  document.getElementById("prod-desc").value = prod.descripcion;
  document.getElementById("prod-precio").value = prod.precio;
  document.getElementById("prod-cantidad").value = prod.cantidad;

  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = false;
  btnSubmit.innerText = "💾 Actualizar Producto";
  document.getElementById("btn-cancelar").style.display = "block";
  
  document.getElementById("titulo-form").innerText = "Editando fila " + prod.fila;

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

// Guardar los cambios en Google Sheets
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
    precio: parseFloat(document.getElementById("prod-precio").value) || 0,
    cantidad: parseInt(document.getElementById("prod-cantidad").value) || 0
  };

  try {
    const res = await fetch(URL_API, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();

    if (data.exito) {
      alert("✅ " + data.mensaje);
      cancelarEdicion();
      await cargarDatos(); // Refresca la tabla
    } else {
      alert("❌ Error: " + data.mensaje);
    }
  } catch (err) {
    alert("Error de conexión al guardar los cambios.");
  }

  document.body.style.cursor = "default";
}
