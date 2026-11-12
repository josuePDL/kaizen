const API_URL = "https://script.google.com/macros/s/AKfycbzfLRPDIGziFyZEzNRjDs54iOb51f_byKxoeaN8JhEEmq5qF6z96oFgLxIYrtpmlNCV/exec";

let inventario = [];
document.addEventListener("DOMContentLoaded", cargarDatos);

// Función utilitaria para convertir imagen a texto (Base64)
function leerArchivoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

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
    let costoTotal = 0; let ventaTotal = 0;
    inventario.forEach(p => {
        let stock = parseInt(p.cantidad) || 0;
        if (stock > 0) {
            costoTotal += (parseFloat(p.costo) || 0) * stock;
            ventaTotal += (parseFloat(p.precio) || 0) * stock;
        }
    });

    // Actualizar Dashboard
    document.getElementById("metric-productos").innerText = inventario.length;
    document.getElementById("metric-costo").innerText = `Q${costoTotal.toFixed(2)}`;
    document.getElementById("metric-venta").innerText = `Q${ventaTotal.toFixed(2)}`;
    document.getElementById("metric-ganancia").innerText = `Q${(ventaTotal - costoTotal).toFixed(2)}`;

    if (inventario.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">Inventario vacío.</td></tr>`; return;
    }

    tbody.innerHTML = inventario.map(p => {
      const miniImg = p.imagen ? `<img src="${p.imagen}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 4px; float: left; margin-right: 10px; background:#eee;">` : '';
      return `
        <tr>
          <td style="font-weight: 600; color: var(--morado-oscuro);">${p.id}</td>
          <td>
            ${miniImg}
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
  } catch (error) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al consultar Google Sheets.</td></tr>`; }
}

function seleccionarParaEditar(fila) {
  const prod = inventario.find(p => p.fila === fila);
  if (!prod) return;
  document.getElementById("prod-fila").value = prod.fila;
  document.getElementById("prod-codigo").value = prod.id !== "N/A" ? prod.id : "";
  document.getElementById("prod-nombre").value = prod.nombre;
  document.getElementById("prod-desc").value = prod.descripcion;
  document.getElementById("prod-imagen-actual").value = prod.imagen || ""; // Oculto
  document.getElementById("prod-file").value = ""; // Limpiar input file
  document.getElementById("prod-costo").value = prod.costo || 0;
  document.getElementById("prod-precio").value = prod.precio || 0;
  document.getElementById("prod-cantidad").value = prod.cantidad || 0;

  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = false; btnSubmit.innerText = "💾 Actualizar Producto";
  document.getElementById("btn-cancelar").style.display = "block";
  document.getElementById("titulo-form").innerText = "Editando Fila " + prod.fila;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelarEdicion() {
  document.getElementById("form-editar").reset();
  document.getElementById("prod-fila").value = "";
  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = true; btnSubmit.innerText = "Selecciona un producto";
  document.getElementById("btn-cancelar").style.display = "none";
  document.getElementById("titulo-form").innerText = "Editar Producto";
}

async function guardarEdicion(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-submit");
  btn.disabled = true; btn.innerText = "Subiendo archivo y guardando...";
  document.body.style.cursor = "wait";

  // Procesar archivo si se seleccionó uno nuevo
  const fileInput = document.getElementById("prod-file");
  let archivoBase64 = "";
  let nombreArchivo = "";
  let urlImagenFinal = document.getElementById("prod-imagen-actual").value; // Mantiene la vieja si no hay nueva

  if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      archivoBase64 = await leerArchivoComoBase64(file);
      nombreArchivo = file.name;
      urlImagenFinal = ""; // Se reemplazará en el servidor por el archivo subido
  }

  const payload = {
    accion: "editar",
    fila: document.getElementById("prod-fila").value,
    id: document.getElementById("prod-codigo").value.trim(),
    nombre: document.getElementById("prod-nombre").value.trim(),
    descripcion: document.getElementById("prod-desc").value.trim(),
    costo: parseFloat(document.getElementById("prod-costo").value) || 0,
    precio: parseFloat(document.getElementById("prod-precio").value) || 0,
    cantidad: parseInt(document.getElementById("prod-cantidad").value) || 0,
    // Datos de la imagen
    imagenURL: urlImagenFinal, 
    archivoBase64: archivoBase64,
    nombreArchivo: nombreArchivo
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();
    if (data.exito) { alert("✅ " + data.mensaje); cancelarEdicion(); await cargarDatos(); } 
    else { alert("❌ Error: " + data.mensaje); }
  } catch (err) { alert("Error de red al guardar los cambios."); }
  
  document.body.style.cursor = "default";
  btn.innerText = "💾 Actualizar Producto"; btn.disabled = false;
}

// CREAR PRODUCTOS
function abrirModalNuevoProducto() { document.getElementById("form-nuevo").reset(); document.getElementById("modal-nuevo-producto").style.display = "flex"; }
function cerrarModalNuevoProducto() { document.getElementById("modal-nuevo-producto").style.display = "none"; }

async function guardarNuevoProducto(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-submit-nuevo");
  btn.disabled = true; btn.innerText = "Subiendo foto y guardando...";
  document.body.style.cursor = "wait";

  // Procesar archivo de imagen
  const fileInput = document.getElementById("nuevo-file");
  let archivoBase64 = "";
  let nombreArchivo = "";
  if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      archivoBase64 = await leerArchivoComoBase64(file);
      nombreArchivo = file.name;
  }

  const payload = {
    accion: "crear",
    id: document.getElementById("nuevo-codigo").value.trim(),
    nombre: document.getElementById("nuevo-nombre").value.trim(),
    descripcion: document.getElementById("nuevo-desc").value.trim(),
    costo: parseFloat(document.getElementById("nuevo-costo").value) || 0,
    precio: parseFloat(document.getElementById("nuevo-precio").value) || 0,
    cantidad: parseInt(document.getElementById("nuevo-cantidad").value) || 0,
    archivoBase64: archivoBase64,
    nombreArchivo: nombreArchivo
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();
    if (data.exito) { alert("✅ Producto guardado exitosamente."); cerrarModalNuevoProducto(); await cargarDatos(); } 
    else { alert("❌ Error: " + data.mensaje); }
  } catch (err) { alert("Error de red al crear el producto."); }
  
  document.body.style.cursor = "default";
  btn.innerText = "💾 Guardar Producto"; btn.disabled = false;
}
