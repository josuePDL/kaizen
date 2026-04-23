const SUPABASE_URL = "https://tqmetigngakqoftnemjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 📊 CARGAR HISTORIAL
async function cargarHistorial() {
    const tabla = document.getElementById("tablaHistorial");

    const { data, error } = await client
        .from("ventas")
        .select("*")
        .order("fecha", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    tabla.innerHTML = "";

    data.forEach(v => {
        tabla.innerHTML += `
            <tr>
                <td>${new Date(v.fecha).toLocaleString()}</td>
                <td>Q${v.total}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="verDetalle('${v.id}')">
                        Ver
                    </button>
                </td>
            </tr>
        `;
    });
}

// 🔍 VER DETALLE
async function verDetalle(venta_id) {
    const lista = document.getElementById("detalleLista");

    const { data, error } = await client
        .from("detalle_ventas")
        .select(`
            cantidad,
            precio,
            productos(nombre)
        `)
        .eq("venta_id", venta_id);

    if (error) {
        console.error(error);
        return;
    }

    lista.innerHTML = "";

    data.forEach(d => {
        lista.innerHTML += `
            <li class="list-group-item">
                ${d.productos.nombre} - ${d.cantidad} x Q${d.precio}
            </li>
        `;
    });

    const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
    modal.show();
}

// 🚀 INICIO
cargarHistorial();