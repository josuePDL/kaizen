// 1. Configuración de conexión
const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

let todosLosProductos = [];
let idEditando = null;

// Inicialización al cargar el DOM
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
    
    // Escuchadores para filtros en tiempo real
    document.getElementById("buscar").addEventListener("input", aplicarFiltros);
    document.getElementById("filtroClasificacion").addEventListener("change", aplicarFiltros);
}

// Cargar categorías en el select de filtros
async function cargarClasificaciones() {
    const select = document.getElementById("filtroClasificacion");
    if (!select) return;

    const { data, error } = await client.from("clasificaciones").select("*").order("nombre");
    
    if (!error && data) {
        data.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    }
}

// Obtener lista de productos con su categoría
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

// Lógica de búsqueda y filtrado
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

// Renderizar filas de la tabla y calcular totales
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
        const codigo = p.codigo ? p.codigo.toUpperCase() : "S/C";

        acumuladoCosto += (costo * stock);
        acumuladoVenta += (venta * stock);

        const stockClase = stock <= 5 ? 'stock-alerta' : '';
        const productoJSON = JSON.stringify(p).replace(/"/g, '&quot;');

        tabla.innerHTML += `
        <tr>
            <td data-label="Código"><code>${codigo}</code></td>
            <td data-label="Producto">${p.nombre}</td>
            <td data-label="Costo">Q${costo.toFixed(2)}</td>
            <td data-label="Venta">Q${venta.toFixed(2)}</td>
            <td data-label="Stock" class="${stockClase}">${stock}</td>
            <td data-label="Acciones">
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-purple btn-sm" onclick='abrirModalEditar(${productoJSON})'>Editar</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarProductoCompleto('${p.id}')">Borrar</button>
                </div>
            </td>
        </tr>`;
    });

    totalCostoHTML.innerText = acumuladoCosto.toLocaleString('en-US', { minimumFractionDigits: 2 });
    totalVentaHTML.innerText = acumuladoVenta.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

// --- FUNCIONES DE EDICIÓN ---

function abrirModalEditar(producto) {
    idEditando = producto.id;
    document.getElementById("editNombre").value = producto.nombre;
    document.getElementById("editCosto").value = producto.precio_compra;
    document.getElementById("editPrecio").value = producto.precio_venta;
    document.getElementById("editStock").value = producto.stock;
    
    const myModal = new bootstrap.Modal(document.getElementById('modalEditar'));
    myModal.show();
}

async function guardarCambios() {
    if (!idEditando) return;

    const updateData = {
        nombre: document.getElementById("editNombre").value,
        precio_compra: parseFloat(document.getElementById("editCosto").value),
        precio_venta: parseFloat(document.getElementById("editPrecio").value),
        stock: parseInt(document.getElementById("editStock").value)
    };

    const { error } = await client.from("productos").update(updateData).eq("id", idEditando);

    if (error) {
        alert("❌ Error al actualizar: " + error.message);
    } else {
        alert("✅ Producto actualizado con éxito");
        const modalElement = document.getElementById('modalEditar');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        await cargarProductos();
    }
}

// --- FUNCIÓN DE ELIMINACIÓN COMPLETA (PRODUCTO + MOVIMIENTOS) ---

async function eliminarProductoCompleto(id) {
    const confirmacion = confirm("⚠️ ADVERTENCIA: Se eliminará este producto y TODO su historial en la tabla de movimientos. ¿Deseas borrarlo permanentemente?");
    
    if (!confirmacion) return;

    try {
        // 1. Eliminar de movimientos_inventario primero por integridad referencial
        const { error: errorMovs } = await client
            .from("movimientos_inventario")
            .delete()
            .eq("producto_id", id); // Verifica que el nombre de la columna sea correcto

        if (errorMovs) throw new Error("No se pudieron borrar los movimientos: " + errorMovs.message);

        // 2. Eliminar de la tabla productos
        const { error: errorProd } = await client
            .from("productos")
            .delete()
            .eq("id", id);

        if (errorProd) throw new Error("No se pudo borrar el producto: " + errorProd.message);

        alert("✅ Producto e historial de movimientos eliminados.");
        await cargarProductos();

    } catch (error) {
        alert("❌ " + error.message);
        console.error(error);
    }
}
