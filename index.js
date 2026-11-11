const API_URL = "https://script.google.com/macros/s/AKfycbzfLRPDIGziFyZEzNRjDs54iOb51f_byKxoeaN8JhEEmq5qF6z96oFgLxIYrtpmlNCV/exec";
let inventario = [];
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ accion: "leer" }), headers: { "Content-Type": "text/plain;charset=utf-8" }});
    const data = await res.json();
    inventario = data.datos || [];
    filtrar();
  } catch (error) { document.getElementById("resumen").innerText = "Error al conectar con Google Sheets."; }
});
function filtrar() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const filtrados = inventario.filter(p => String(p.nombre).toLowerCase().includes(texto) || String(p.id).toLowerCase().includes(texto));
  document.getElementById("resumen").innerText = `Mostrando ${filtrados.length} producto(s)`;
  document.getElementById("grid").innerHTML = filtrados.map(p => {
    const imgHtml = p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; background-color: #f9f9f9;">` : `<div style="width: 100%; height: 200px; border-radius: 8px; margin-bottom: 12px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999;">Sin Imagen</div>`;
    return `
      <div class="card" style="border-top-color: ${p.cantidad > 0 ? 'var(--morado-medio)' : '#e53935'};">
        ${imgHtml}
        <h3 style="margin: 5px 0;">${p.nombre}</h3>
        <p style="color:#666; font-size:0.9em; flex-grow: 1; margin: 8px 0; line-height: 1.4;">${p.descripcion || "Sin descripción"}</p>
        <div style="margin: 10px 0;">
          <span class="badge" style="background:#eee; color: #333;">Cód: ${p.id}</span>
          <span class="badge" style="background:#e8f5e9; color: #2e7d32; font-size: 1em;">Q${p.precio.toFixed(2)}</span>
        </div>
        <h4 style="color: ${p.cantidad > 0 ? 'var(--morado-oscuro)' : '#c62828'}; margin: 10px 0 0 0; background: ${p.cantidad > 0 ? '#f3e5f5' : '#ffebee'}; padding: 8px; border-radius: 8px;">
          ${p.cantidad > 0 ? 'Stock: ' + p.cantidad : 'Agotado'}
        </h4>
      </div>
    `;
  }).join("");
}