// URL de tu Apps Script vinculada
const URL_API = "https://script.google.com/macros/s/AKfycbxfZV-pjl4GX8w9iVBlyx55Nv0JTbpS0tBzs2O2pc3O3sgGJAcwNyLe9X4Jf-LkEfwm/exec";

let inventario = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(URL_API, { 
      method: "POST", 
      body: JSON.stringify({ accion: "leer" }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const data = await res.json();
    inventario = data.datos || [];
    filtrar();
  } catch (error) {
    document.getElementById("resumen").innerText = "Error al conectar con Google Sheets.";
  }
});

function filtrar() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const filtrados = inventario.filter(p => 
    String(p.nombre).toLowerCase().includes(texto) || 
    String(p.id).toLowerCase().includes(texto)
  );
  
  document.getElementById("resumen").innerText = `Mostrando ${filtrados.length} producto(s)`;
  
  document.getElementById("grid").innerHTML = filtrados.map(p => {
    // Si hay imagen, mostrarla; si no, mostrar un cuadro indicativo
    const imgHtml = p.imagen 
      ? `<img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 5px; margin-bottom: 10px; background-color: #eee;">` 
      : `<div style="width: 100%; height: 200px; border-radius: 5px; margin-bottom: 10px; background-color: #eee; display: flex; align-items: center; justify-content: center; color: #999;">Sin Imagen</div>`;

    return `
      <div class="card" style="border-color: ${p.cantidad > 0 ? 'var(--morado-claro)' : 'red'}; display: flex; flex-direction: column;">
        ${imgHtml}
        <h3 style="margin: 5px 0;">${p.nombre}</h3>
        <p style="color:#666; font-size:0.9em; flex-grow: 1; margin: 5px 0;">${p.descripcion || "Sin descripción"}</p>
        <div style="margin: 10px 0;">
          <span class="badge" style="background:#555;">Cód: ${p.id}</span>
          <span class="badge" style="background:#2e7d32">Q${p.precio.toFixed(2)}</span>
        </div>
        <h4 style="color: ${p.cantidad > 0 ? 'var(--morado-oscuro)' : 'red'}; margin: 5px 0;">
          Stock: ${p.cantidad}
        </h4>
      </div>
    `;
  }).join("");
}
