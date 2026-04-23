// 🔑 CONFIG
const SUPABASE_URL = "https://tqmetigngakqoftnemjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚀 CARGAR CLASIFICACIONES
async function cargarClasificaciones() {
    const tabla = document.getElementById("tablaClasificaciones");

    const { data, error } = await client
        .from("clasificaciones")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    tabla.innerHTML = "";

    data.forEach(c => {
        tabla.innerHTML += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.prefijo || "-"}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminar('${c.id}')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

// ➕ GUARDAR
async function guardarClasificacion() {
    const nombre = document.getElementById("nombre").value.trim();
    const prefijo = document.getElementById("prefijo").value.trim().toUpperCase();

    if (!nombre || !prefijo) {
        alert("Completa todos los campos");
        return;
    }

    if (prefijo.length > 3) {
        alert("Máximo 3 letras para el prefijo");
        return;
    }

    const { error } = await client
        .from("clasificaciones")
        .insert([{ nombre, prefijo }]);

    if (error) {
        console.error(error);
        alert("Error al guardar");
        return;
    }

    document.getElementById("nombre").value = "";
    document.getElementById("prefijo").value = "";

    cargarClasificaciones();
}

// ❌ ELIMINAR
async function eliminar(id) {
    if (!confirm("¿Eliminar clasificación?")) return;

    const { error } = await client
        .from("clasificaciones")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Error al eliminar");
        return;
    }

    cargarClasificaciones();
}

// 🔄 INICIO
cargarClasificaciones();