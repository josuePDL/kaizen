// 🔑 CONFIGURACIÓN
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
// 🚀 CARGAR PRODUCTOS
async function cargarProductos() {
    const tabla = document.getElementById("tablaProductos");
    if (!tabla) return;

    const { data, error } = await client
        .from("productos")
        .select("*")
        .order("nombre");

    if (error) return console.error(error);

    tabla.innerHTML = "";

    data.forEach(p => {
        // Guardamos los datos del producto en un string JSON para pasarlo al editar
        const productoJSON = JSON.stringify(p).replace(/"/g, '&quot;');

        tabla.innerHTML += `
        <tr>
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>Q${p.precio_venta}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="abrirModalEditar(${productoJSON})">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${p.id}')">
                    Eliminar
                </button>
            </td>
        </tr>`;
    });
}

// 📝 PREPARAR EDICIÓN
let idEditando = null;

function abrirModalEditar(producto) {
    idEditando = producto.id;
    document.getElementById("editNombre").value = producto.nombre;
    document.getElementById("editPrecio").value = producto.precio_venta;
    document.getElementById("editStock").value = producto.stock;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

// 💾 GUARDAR CAMBIOS
async function guardarCambios() {
    const nuevoNombre = document.getElementById("editNombre").value;
    const nuevoPrecio = parseFloat(document.getElementById("editPrecio").value);
    const nuevoStock = parseInt(document.getElementById("editStock").value);

    const { error } = await client
        .from("productos")
        .update({ 
            nombre: nuevoNombre, 
            precio_venta: nuevoPrecio, 
            stock: nuevoStock 
        })
        .eq("id", idEditando);

    if (error) {
        alert("Error al actualizar");
        console.error(error);
    } else {
        alert("Producto actualizado");
        location.reload(); // Recargar para ver cambios
    }
}

// 🗑 ELIMINAR
async function eliminarProducto(id) {
    if (!confirm("¿Eliminar producto?")) return;
    await client.from("productos").delete().eq("id", id);
    cargarProductos();
}

cargarProductos();