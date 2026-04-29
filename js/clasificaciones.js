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

async function cargarClasificaciones() {
    const tabla = document.getElementById("tablaClasificaciones");
    const select = document.getElementById("clasificacion");

    const { data, error } = await client
        .from("clasificaciones")
        .select("*")
        .order("nombre");

    if (error) return console.error(error);

    if (tabla) {
        tabla.innerHTML = "";

        data.forEach(c => {
            tabla.innerHTML += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.prefijo}</td>
                <td>
                <button class="btn btn-danger btn-sm"
                onclick="eliminarClasificacion('${c.id}')">
                Eliminar
                </button>
                </td>
            </tr>`;
        });
    }

    if (select) {
        select.innerHTML = "";

        data.forEach(c => {
            select.innerHTML += `
            <option value="${c.id}" data-prefijo="${c.prefijo}">
                ${c.nombre}
            </option>`;
        });
    }
}

async function guardarClasificacion() {
    const nombre = document.getElementById("nombre").value;
    const prefijo = document.getElementById("prefijo").value.toUpperCase();

    await client.from("clasificaciones").insert([{
        nombre,
        prefijo
    }]);

    location.reload();
}

async function eliminarClasificacion(id) {
    await client.from("clasificaciones").delete().eq("id", id);
    cargarClasificaciones();
}

cargarClasificaciones();

