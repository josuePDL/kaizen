// 🔑 CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";


const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

let todosLosProductos = [];
let idEditando = null;

async function verificarSesion() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) window.location.href = "login.html";
    else inicializarApp();
}

async function inicializarApp() {
    await cargarClasificaciones();
    await cargarProductos();
    document.getElementById("buscar").addEventListener("input", aplicarFiltros);
    document.getElementById("filtroClasificacion").addEventListener("change", aplicarFiltros);
}

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

async function cargarProductos() {
    const { data, error } = await client.from("productos").select(`*, clasificaciones(nombre)`).order("nombre");
    if (!error) {
        todosLosProductos = data;
        renderizarTabla(todosLosProductos);
    }
}

function aplicarFiltros() {
    const busqueda = document.getElementById("buscar").value.toLowerCase();
    const categoriaId = document.getElementById("filtroClasificacion").value;

    const filtrados = todosLosProductos.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda);
        const coincideCat = (categoriaId === "todos") || (p.clasificacion_id === categoriaId);
        return coincideTexto && coincideCat;
    });
    renderizarTabla(filtrados);
}

function renderizarTabla(lista) {
    const tabla = document.getElementById("tablaProductos");
    const totalCostoHTML = document.getElementById("totalCostoInv");
    const totalVentaHTML = document.getElementById("totalVentaInv");
    tabla.innerHTML = "";
    
    let acumuladoCosto = 0;
    let acumuladoVenta = 0;

    lista.forEach(p => {
        const stockClase = p.stock <= (p.stock_minimo || 5) ? 'stock-alerta' : '';
        const productoJSON = JSON.stringify(p).replace(/"/g, '&quot;');

        // Uso de 'p.costo' según tu indicación
        acumuladoCosto += (parseFloat(p.costo || 0) * parseInt(p.stock || 0));
        acumuladoVenta += (parseFloat(p.precio_venta || 0) * parseInt(p.stock || 0));

        tabla.innerHTML += `
        <tr>
            <td data-label="Código"><code>${p.codigo.toUpperCase()}</code></td>
            <td data-label="Producto">${p.nombre}</td>
            <td data-label="Costo Unit.">Q${parseFloat(p.costo || 0).toFixed(2)}</td>
            <td data-label="Precio Venta">Q${parseFloat(p.precio_venta || 0).toFixed(2)}</td>
            <td data-label="Stock" class="${stockClase}">${p.stock}</td>
            <td>
                <button class="btn btn-purple btn-sm" onclick="abrirModalEditar(${productoJSON})">Editar</button>
            </td>
        </tr>`;
    });

    totalCostoHTML.innerText = acumuladoCosto.toLocaleString('en-US', { minimumFractionDigits: 2 });
    totalVentaHTML.innerText = acumuladoVenta.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function abrirModalEditar(producto) {
    idEditando = producto.id;
    document.getElementById("editNombre").value = producto.nombre;
    document.getElementById("editCosto").value = producto.costo;
    document.getElementById("editPrecio").value = producto.precio_venta;
    document.getElementById("editStock").value = producto.stock;
    new bootstrap.Modal(document.getElementById('modalEditar')).show();
}

async function guardarCambios() {
    const updateData = {
        nombre: document.getElementById("editNombre").value,
        costo: parseFloat(document.getElementById("editCosto").value),
        precio_venta: parseFloat(document.getElementById("editPrecio").value),
        stock: parseInt(document.getElementById("editStock").value)
    };

    const { error } = await client.from("productos").update(updateData).eq("id", idEditando);
    if (!error) {
        location.reload(); // Recarga para actualizar lista y totales
    } else {
        alert("Error al actualizar");
    }
}

verificarSesion();
