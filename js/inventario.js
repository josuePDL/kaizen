// 1. Configuración de conexión
const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// Al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
});

async function verificarSesion() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    } else {
        cargarClasificaciones();
    }
}

// Carga las categorías en el select
async function cargarClasificaciones() {
    const select = document.getElementById("clasificacion");
    try {
        const { data, error } = await client.from("clasificaciones").select("*").order("nombre");
        if (error) throw error;

        data.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando categorías:", error.message);
    }
}

// Función principal para guardar
async function guardarIngreso() {
    const btn = document.getElementById("btnGuardar");
    
    // Captura de datos
    const codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const clasificacion_id = document.getElementById("clasificacion").value;
    const stock = parseInt(document.getElementById("cantidad").value);
    const precio_compra = parseFloat(document.getElementById("costo").value) || 0;
    const precio_venta = parseFloat(document.getElementById("precio").value) || 0;

    // Validaciones
    if (!nombre || !clasificacion_id || isNaN(stock)) {
        alert("Por favor, completa los campos obligatorios (*)");
        return;
    }

    try {
        // BLOQUEO DE BOTÓN: Evita que el usuario haga doble clic y duplique el registro
        btn.disabled = true;
        btn.innerText = "GUARDANDO...";

        const nuevoProducto = {
            codigo: codigo || null,
            nombre: nombre,
            clasificacion_id: clasificacion_id,
            stock: stock,
            precio_compra: precio_compra,
            precio_venta: precio_venta
        };

        const { data, error } = await client
            .from("productos")
            .insert([nuevoProducto]);

        if (error) throw error;

        // Éxito
        alert("✅ Producto registrado correctamente");
        
        // Limpiar formulario para evitar re-envíos accidentales
        document.getElementById("formIngreso").reset();

    } catch (error) {
        alert("❌ Error al guardar: " + error.message);
        console.error(error);
    } finally {
        // DESBLOQUEO DE BOTÓN
        btn.disabled = false;
        btn.innerText = "GUARDAR INGRESO";
    }
}
