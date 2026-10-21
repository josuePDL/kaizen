const URL_API = "https://script.google.com/macros/s/AKfycbxWNjPiVc07JfL5SoJNVxY47FrgKxfimqJc1HxCoNjKaWuY76AUgbWDgXxICecH2v2t/exec";
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
    p.nombre.toLowerCase().includes(texto) || 
    p.id.toLowerCase().includes(texto)
  );
  
  document.getElementById("resumen").innerText = `Mostrando ${filtrados.length} producto(s)`;
  
  document.getElementById("grid").innerHTML = filtrados.map(p => `
    <div class="card" style="border-color: ${p.cantidad > 0 ? 'var(--morado-claro)' : 'red'};">
      <h3>${p.nombre}</h3>
      <p style="color:#666; font-size:0.9em">${p.descripcion || "Sin descripción"}</p>
      <div style="margin: 10px 0;">
        <span class="badge" style="background:#555;">Código: ${p.id}</span>
        <span class="badge" style="background:#2e7d32">Q${p.precio.toFixed(2)}</span>
      </div>
      <h4 style="color: ${p.cantidad > 0 ? 'var(--morado-oscuro)' : 'red'}">
        Stock disponible: ${p.cantidad}
      </h4>
    </div>
  `).join("");
}
