// 🔑 CONFIGURACIÓN
const SUPABASE_URL = "https://tqmetigngakqoftnemjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚀 CARGAR PRODUCTOS
async function cargarProductos() {
    const tabla = document.getElementById("tablaProductos");

    const { data, error } = await client
        .from("productos")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    tabla.innerHTML = "";

    data.forEach(p => {
        tabla.innerHTML += `
            <tr>
                <td>${p.codigo || '-'}</td>
                <td class="fw-bold">${p.nombre}</td>
                <td>${p.clasificacion || '-'}</td>
                <td>Q${p.costo || 0}</td>
                <td>Q${p.precio}</td>
                <td class="${p.stock < 5 ? 'stock-bajo' : ''}">
                    ${p.stock}
                </td>
                <td>
                    <button class="btn btn-warning btn-sm me-1"
                        onclick="editar('${p.id}', '${p.nombre}', ${p.precio}, ${p.stock})">
                        Editar
                    </button>

                    <button class="btn btn-danger btn-sm"
                        onclick="eliminar('${p.id}')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

// ✏️ EDITAR
function editar(id, nombre, precio, stock) {
    document.getElementById("editId").value = id;
    document.getElementById("editNombre").value = nombre;
    document.getElementById("editPrecio").value = precio;
    document.getElementById("editStock").value = stock;

    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

// 💾 GUARDAR CAMBIOS
async function guardarCambios() {
    const id = document.getElementById("editId").value;
    const nombre = document.getElementById("editNombre").value;
    const precio = document.getElementById("editPrecio").value;
    const stock = document.getElementById("editStock").value;

    const { error } = await client
        .from("productos")
        .update({ nombre, precio, stock })
        .eq("id", id);

    if (error) {
        alert("Error al actualizar");
        console.error(error);
        return;
    }

    location.reload();
}

// ❌ ELIMINAR
async function eliminar(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    const { error } = await client
        .from("productos")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error al eliminar");
        console.error(error);
        return;
    }

    location.reload();
}

// 🔄 INICIO
cargarProductos();