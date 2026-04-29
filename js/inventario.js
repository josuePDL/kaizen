// 🔑 CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚀 VARIABLES DE ESTADO
let todosLosProductos = [];
let idEditando = null;

// 🔐 PROTECCIÓN DE RUTA
async function verificarSesion() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) {
        window.location.href = "login.html"; 
    } else {
        inicializarApp();
    }
}

// 🎬 INICIALIZACIÓN
async function inicializarApp() {
    await cargarClasificaciones();
    await cargarProductos();
    
    // Escuchar eventos de búsqueda y filtro
    document.getElementById("buscar").addEventListener("input", aplicarFiltros);
    document.getElementById("filtroClasificacion").addEventListener("change", aplicarFiltros);
}

// 📂 OBTENER CATEGORÍAS
async function cargarClasificaciones() {
    const select = document.getElementById("filtroClasificacion");
    const { data, error } = await client.from("clasificaciones").select("*").order("nombre");
    
    if (error) return console.error("Error cat:", error);

    data.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

// 📦 OBTENER PRODUCTOS (Carga inicial)
async function cargarProductos() {
    const { data, error } = await client
        .from("productos")
        .select(`*, clasificaciones(nombre)`)
        .order("nombre");

    if (error) return console.error("Error prod:", error);
    
    todosLosProductos = data;
    renderizarTabla(todosLosProductos);
}

// 🔍 FILTRADO EN TIEMPO REAL (Case Insensitive)
function aplicarFiltros() {
    const busqueda = document.getElementById("buscar").value.toLowerCase().trim();
    const categoriaId = document.getElementById("filtroClasificacion").value;

    const filtrados = todosLosProductos.filter(p => {
        // Buscamos en código y nombre (ignora mayúsculas)
        const coincideTexto = p.nombre.toLowerCase().includes(busqueda) || 
                             p.codigo.toLowerCase().includes(busqueda);
        
        // Filtro por UUID de categoría
        const coincideCat = (categoriaId === "todos") || (p.clasificacion_id === categoriaId);

        return coincideTexto && coincideCat;
    });

    renderizarTabla(filtrados);
}

// 🎨 DIBUJAR TABLA
function renderizarTabla(lista) {
    const tabla = document.getElementById("tablaProductos");
    tabla.innerHTML = "";

    lista.forEach(p => {
        const categoriaNom = p.clasificaciones ? p.clasificaciones.nombre : 'Sin categoría';
        const stockClase = p.stock <= p.stock_minimo ? 'stock-alerta' : '';
        const productoJSON = JSON.stringify(p).replace(/"/g, '&quot;');

        tabla.innerHTML += `
        <tr>
            <td><code class="fw-bold text-dark">${p.codigo.toUpperCase()}</code></td>
            <td>
                <div class="text-capitalize">${p.nombre.toLowerCase()}</div>
                <small class="text-muted">${categoriaNom}</small>
            </td>
            <td>Q${parseFloat(p.precio_venta).toFixed(2)}</td>
            <td class="${stockClase}">${p.stock}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="abrirModalEditar(${productoJSON})">
                    Editar
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto('${p.id}')">
                    Borrar
                </button>
            </td>
        </tr>`;
    });
}

// 📝 MODAL EDITAR
function abrirModalEditar(producto) {
    idEditando = producto.id;
    document.getElementById("editNombre").value = producto.nombre;
    document.getElementById("editPrecio").value = producto.precio_venta;
    document.getElementById("editStock").value = producto.stock;
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

// 💾 ACTUALIZAR EN SUPABASE
async function guardarCambios() {
    const btn = event.target;
    btn.disabled = true;

    const updateData = {
        nombre: document.getElementById("editNombre").value,
        precio_venta: parseFloat(document.getElementById("editPrecio").value),
        stock: parseInt(document.getElementById("editStock").value),
        updated_at: new Date()
    };

    const { error } = await client.from("productos").update(updateData).eq("id", idEditando);

    if (error) {
        alert("Error al actualizar");
        console.error(error);
    } else {
        // Actualización optimista en la lista local para no recargar toda la página
        const index = todosLosProductos.findIndex(p => p.id === idEditando);
        todosLosProductos[index] = { ...todosLosProductos[index], ...updateData };
        
        renderizarTabla(todosLosProductos);
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        alert("Producto actualizado con éxito");
    }
    btn.disabled = false;
}

// 🗑 ELIMINAR
async function eliminarProducto(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.")) return;
    
    const { error } = await client.from("productos").delete().eq("id", id);
    
    if (error) {
        alert("Error al eliminar");
    } else {
        todosLosProductos = todosLosProductos.filter(p => p.id !== id);
        renderizarTabla(todosLosProductos);
    }
}

// INICIAR
verificarSesion();
