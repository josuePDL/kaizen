const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 FUNCIÓN DE PROTECCIÓN
async function verificarSesion() {
    const { data: { session }, error } = await client.auth.getSession();

    if (error || !session) {
        console.log("Acceso denegado. Redirigiendo al login...");
        // Cambia 'login.html' por el nombre de tu archivo de inicio de sesión
        window.location.href = "login.html"; 
    } else {
        console.log("Usuario verificado:", session.user.email);
        // Si el usuario está verificado, procedemos a cargar los datos
        if (typeof cargarProductos === "function") cargarProductos();
        if (typeof cargarClasificaciones === "function") cargarClasificaciones();
    }
}

// Ejecutar la verificación inmediatamente al cargar la página
verificarSesion();
async function cargarHistorial() {
    const tabla = document.getElementById("tablaHistorial");
    if (!tabla) return;

    const { data } = await client
        .from("ventas")
        .select("*")
        .order("fecha", { ascending: false });

    tabla.innerHTML = "";

    data.forEach(v => {
        tabla.innerHTML += `
        <tr>
            <td>${new Date(v.fecha).toLocaleString()}</td>
            <td>Q${v.total}</td>
            <td>${v.cliente_nombre || "-"}</td>
            <td>
            <button class="btn btn-primary btn-sm"
            onclick="verVenta('${v.id}')">
            Ver
            </button>
            </td>
        </tr>`;
    });
}

async function verVenta(id) {
    const { data } = await client
        .from("detalle_ventas")
        .select(`
            cantidad,
            precio,
            subtotal,
            productos(nombre)
        `)
        .eq("venta_id", id);

    let texto = "DETALLE:\n\n";

    data.forEach(d => {
        texto += `${d.productos.nombre}
${d.cantidad} x Q${d.precio}
= Q${d.subtotal}\n\n`;
    });

    alert(texto);
}

cargarHistorial();