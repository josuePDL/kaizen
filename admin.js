// 🚨 IMPORTANTE: Asegúrate de que esta sea la URL de tu ÚLTIMA implementación en Apps Script
const URL_API = "https://script.google.com/macros/s/AKfycbwLqDG1D_3x3hl3Um5TBp_iKPRrp8gv6XmtCav8E_hfyUOCCKd-eGmeNjpd8GobsFBBTw/exec";

let inventario = [];

document.addEventListener("DOMContentLoaded", cargarDatos);

// ==========================================
// 1. LEER PRODUCTOS (Cargar Tabla)
// ==========================================
async function cargarDatos() {
  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify({ accion: "leer" }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const data = await res.json();
    inventario = data.datos || [];
    
    if (inventario.length === 0) {
      document.getElementById("tabla").innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay productos registrados.</td></tr>`;
      return;
    }

    // Dibujar la tabla, AHORA CON LA DESCRIPCIÓN
    document.getElementById("tabla").innerHTML = inventario.map(p => `
      <tr>
        <td style="font-weight: bold; color: var(--morado-oscuro);">${p.id}</td>
        <td>${p.nombre}</td>
        <td style="font-size: 0.85em; color: #555;">${p.descripcion || "Sin descripción"}</td>
        <td>Q${parseFloat(p.costo).toFixed(2)} / Q${parseFloat(p.precio).toFixed(2)}</td>
        <td style="color: ${p.cantidad > 0 ? 'inherit' : 'red'}; font-weight:bold; text-align: center;">
          ${p.cantidad}
        </td>
        <td style="text-align: center; width: 140px;">
          <button class="btn-edit" onclick="prepararEdicion('${p.id}')" style="padding: 5px; width: 45%; font-size: 0.9em;">Editar</button>
          <button class="btn-danger" onclick="eliminar('${p.id}')" style="padding: 5px; width: 45%; font-size: 0.9em;">Borrar</button>
        </td>
      </tr>
    `).join("");

  } catch(e) {
    console.error(e);
    document.getElementById("tabla").innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error de conexión con la base de datos.</td></tr>`;
  }
}

// ==========================================
// 2. CREAR O EDITAR PRODUCTO (Guardar)
// ==========================================
async function guardar(e) {
  e.preventDefault(); 
  
  document.body.style.cursor = "wait";
  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Procesando...";

  const modo = document.getElementById("modo").value; 
  const idIngresado = document.getElementById("id").value.trim();

  if (!idIngresado) {
    alert("El campo ID es obligatorio.");
    restaurarBoton();
    return;
  }
  
  const payload = {
    accion: modo === "crear" ? "guardar" : "editar", 
    id: idIngresado, 
    nombre: document.getElementById("nombre").value.trim(),
    descripcion: document.getElementById("desc").value.trim(),
    costo: parseFloat(document.getElementById("costo").value) || 0,
    precio: parseFloat(document.getElementById("precio").value) || 0,
    cantidad: parseInt(document.getElementById("cantidad").value) || 0
  };

  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const data = await res.json();
    
    if(data.exito) {
      alert("✅ " + data.mensaje);
      cancelar(); 
      await cargarDatos(); 
    } else {
      alert("❌ Error: " + data.mensaje); 
    }
  } catch(err) {
    console.error(err);
    alert("Hubo un error de conexión.");
  }

  function restaurarBoton() {
    document.body.style.cursor = "default";
    btnSubmit.disabled = false;
    btnSubmit.innerText = modo === "crear" ? "Guardar Producto" : "Actualizar Producto";
  }
  
  restaurarBoton();
}

// ==========================================
// 3. PREPARAR INTERFAZ PARA EDICIÓN
// ==========================================
function prepararEdicion(idBuscado) {
  // Aseguramos que la búsqueda se haga como texto
  const p = inventario.find(x => String(x.id).trim() === String(idBuscado).trim());
  if (!p) {
    alert("Error: No se encontró el producto en la memoria local.");
    return;
  }

  document.getElementById("id").value = p.id;
  document.getElementById("id").readOnly = true; 
  document.getElementById("id").style.backgroundColor = "#e9ecef";
  
  document.getElementById("nombre").value = p.nombre;
  document.getElementById("desc").value = p.descripcion || ""; // Muestra la descripción en el formulario
  document.getElementById("costo").value = p.costo;
  document.getElementById("precio").value = p.precio;
  document.getElementById("cantidad").value = p.cantidad;
  
  document.getElementById("modo").value = "editar";
  document.getElementById("titulo-form").innerText = "Editar Producto";
  document.getElementById("btn-submit").innerText = "Actualizar Producto";
  document.getElementById("btn-cancelar").style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// 4. CANCELAR EDICIÓN (Limpiar form)
// ==========================================
function cancelar() {
  document.getElementById("form").reset();
  
  const inputId = document.getElementById("id");
  inputId.readOnly = false;
  inputId.style.backgroundColor = "white";
  
  document.getElementById("modo").value = "crear";
  document.getElementById("titulo-form").innerText = "Nuevo Producto";
  document.getElementById("btn-submit").innerText = "Guardar Producto";
  document.getElementById("btn-cancelar").style.display = "none";
}

// ==========================================
// 5. ELIMINAR PRODUCTO
// ==========================================
async function eliminar(idBuscado) {
  if(!confirm("¿Borrar el producto con ID: " + idBuscado + "?")) return;
  
  document.body.style.cursor = "wait";
  
  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify({ accion: "eliminar", id: String(idBuscado).trim() }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const data = await res.json();
    
    if(data.exito) {
      alert("✅ Producto eliminado.");
      await cargarDatos(); 
    } else {
      alert("❌ Error: " + data.mensaje);
    }
  } catch(e) {
    alert("Error de conexión al intentar eliminar.");
  }
  
  document.body.style.cursor = "default";
}