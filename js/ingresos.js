// Configuración de conexión
const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
});

async function verificarSesion() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) window.location.href = "login.html";
    else cargarClasificaciones();
}

async function cargarClasificaciones() {
    const select = document.getElementById("clasificacion");
    const { data } = await client.from("clasificaciones").select("*").order("nombre");
    data?.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

async function guardarIngreso() {
    const btn = document.getElementById("btnGuardar");
    
    // Captura de datos
    const nombre = document.getElementById("nombre").value.trim();
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const clasificacion = document.getElementById("clasificacion").value;
    const costo = parseFloat(document.getElementById("costo").value) || 0;
    const precio = parseFloat(document.getElementById("precio").value) || 0;
    const codigo = document.getElementById("codigo").value.trim();

    // Validación básica
    if (!nombre || isNaN(cantidad) || !clasificacion) {
        alert("Por favor, completa los campos obligatorios (*)");
        return;
    }

    try {
        // --- EVITAR DUPLICADOS ---
        btn.disabled = true; // Desactivar botón inmediatamente
        btn.innerText = "PROCESANDO...";

        const { error } = await client.from("productos").insert([{
            nombre: nombre,
            stock: cantidad, // Solo se inserta lo que dice el campo
            clasificacion_id: clasificacion,
            precio_compra: costo,
            precio_venta: precio,
            codigo: codigo || null
        }]);

        if (error) throw error;

        alert("✅ Producto registrado con éxito");
        
        // Limpiar campos para evitar duplicados al presionar de nuevo
        document.getElementById("formIngreso").reset();

    } catch (error) {
        alert("❌ Error: " + error.message);
    } finally {
        // Restaurar botón
        btn.disabled = false;
        btn.innerText = "GUARDAR INGRESO";
    }
}
