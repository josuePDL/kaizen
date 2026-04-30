// 1. Configuración de conexión
const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

let todosLosProductos = [];
let idEditando = null;

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
});

async function verificarSesion() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    } else {
        inicializarApp();
    }
}

async function inicializarApp() {
    await cargarClasificaciones();
    await cargarProductos();
    
    // Listeners para filtros
    document.getElementById("buscar").addEventListener("input", aplicarFiltros);
    document.getElementById("filtroClasificacion").addEventListener("change", aplicarFiltros);
}

// Cargar categorías para el filtro
async function cargarClasificaciones() {
    const select = document.getElementById("filtroClasificacion");
    const { data } = await client.from("clasificaciones").select("*").order("nombre");
    
    data?.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

// Obtener productos de la base de datos
async function cargarProductos() {
    const { data, error } = await client
        .from("productos")
        .select(`*, clasificaciones(nombre)`)
        .order("nombre");

    if (!error) {
        todosLosProductos = data;
        renderizarTabla(todosLosProductos);
    }
}

// Lógica de filtrado
function aplicarFiltros() {
    const busqueda = document.getElementById("buscar").value.toLowerCase().trim();
    const categoriaId = document.getElementById("filtroClasificacion").value;

    const filtrados = todosLosProductos.filter(p => {
        const nombreMatch = p.nombre.toLowerCase().includes(busqueda);
        const codigoMatch = p.codigo ? p.codigo.toLowerCase().includes(busqueda) : false;
        const categoriaMatch = (categoriaId === "todos") || (p.clasificacion_id === categoriaId);
        
        return (nombreMatch || codigoMatch) && categoriaMatch;
    });

    renderizarTabla(filtrados);
}

// Mostrar datos en la tabla y calcular totales
function renderizarTabla(lista) {
    const tabla = document.getElementById("tablaProductos");
    const totalCostoHTML = document.getElementById("totalCostoInv");
    const totalVentaHTML = document.getElementById("totalVentaInv");
    
    tabla.innerHTML = "";
    let acumuladoCosto = 0;
    let acumuladoVenta = 0;

    lista.forEach(p => {
        const stock = parseInt(p.stock || 0);
        const costo = parseFloat(p.precio_compra || 0);
        const venta = parseFloat(p.precio_venta || 0);
        const codigo = p.codigo ? p.codigo.toUpperCase() : "N/A";

        acumuladoCosto += (costo * stock);
        acumuladoVenta += (venta * stock);

        const stockClase = stock <= 5 ? 'stock-alerta' : '';
        const productoJSON = JSON.stringify(p).replace(/"/g, '&quot;');

        tabla.innerHTML += `
        <tr>
            <td data-label="Código"><code>${codigo}</code></td>
            <td data-label="Producto">${p.nombre}</td>
            <td data-label="Costo Unit.">Q${costo.toFixed(2)}</td>
            <td data-label="Precio Venta">Q${venta.toFixed(2)}</td>
            <td data-label="Stock" class="${stockClase}">${stock}</td>
            <td data-label="Acciones">
                <button class="btn btn-purple btn-sm" onclick='abrirModalEditar(${productoJSON})'>Editar</button>
            </td>
        </tr>`;
    });

    totalCostoHTML.innerText = acumuladoCosto.toLocaleString('en-US', { minimumFractionDigits: 2 });
    totalVentaHTML.innerText = acumuladoVenta.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

// Gestión de Edición
function abrirModalEditar(producto) {
    idEditando = producto.id;
    document.getElementById("editNombre").value = producto.nombre;
    document.getElementById("editCosto").value = producto.precio_compra;
    document.getElementById("editPrecio").value = producto.precio_venta;
    document.getElementById("editStock").value = producto.stock;
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

async function guardarCambios() {
    if (!idEditando) return;

    const btn = document.querySelector("#modalEditar .btn-purple");
    btn.disabled = true;

    const updateData = {
        nombre: document.getElementById("editNombre").value,
        precio_compra: parseFloat(document.getElementById("editCosto").value),
        precio_venta: parseFloat(document.getElementById("editPrecio").value),
        stock: parseInt(document.getElementById("editStock").value)
    };

    const { error } = await client.from("productos").update(updateData).eq("id", idEditando);

    if (error) {
        alert("❌ Error: " + error.message);
        btn.disabled = false;
    } else {
        alert("✅ Producto actualizado");
        const modalElement = document.getElementById('modalEditar');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        btn.disabled = false;
        await cargarProductos(); // Recargar datos
    }
}
