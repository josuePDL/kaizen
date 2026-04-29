const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";



const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// VARIABLES GLOBALES (Fundamentales para evitar el error "is not defined")
let carrito = [];
let total = 0;

// Verificar Sesión
async function verificarSesion() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) window.location.href = "login.html";
}
verificarSesion();

// Agregar Producto (Insensible a mayúsculas con .ilike)
async function agregarProducto() {
    const inputCodigo = document.getElementById("codigo").value.trim();
    const cantidad = parseInt(document.getElementById("cantidad").value);

    if (!inputCodigo || isNaN(cantidad) || cantidad <= 0) return alert("Datos inválidos");

    const { data, error } = await client
        .from("productos")
        .select("*")
        .ilike("codigo", inputCodigo) // Busca sin importar Mayúsculas/Minúsculas
        .single();

    if (error || !data) return alert("Producto no encontrado");
    if (cantidad > data.stock) return alert(`Stock insuficiente. Solo hay ${data.stock}`);

    let subtotal = data.precio_venta * cantidad;

    carrito.push({
        id: data.id,
        codigo: data.codigo,
        nombre: data.nombre,
        precio: data.precio_venta,
        cantidad: cantidad,
        subtotal: subtotal
    });

    total += subtotal;
    document.getElementById("codigo").value = ""; // Limpiar buscador
    renderVenta();
}

// Eliminar del Carrito
function eliminarDelCarrito(index) {
    total -= carrito[index].subtotal;
    carrito.splice(index, 1);
    renderVenta();
}

// Dibujar Tabla
function renderVenta() {
    const tabla = document.getElementById("tablaVenta");
    const totalHTML = document.getElementById("total");
    tabla.innerHTML = "";

    carrito.forEach((p, index) => {
        tabla.innerHTML += `
        <tr>
            <td data-label="Producto">${p.nombre}</td>
            <td data-label="Precio">Q${p.precio.toFixed(2)}</td>
            <td data-label="Cant.">${p.cantidad}</td>
            <td data-label="Subtotal">Q${p.subtotal.toFixed(2)}</td>
            <td data-label="Acción">
                <button onclick="eliminarDelCarrito(${index})" class="btn btn-danger btn-sm">X</button>
            </td>
        </tr>`;
    });
    totalHTML.textContent = total.toFixed(2);
}

// Finalizar Venta
async function finalizarVenta() {
    const nit = document.getElementById("nit").value || "C/F";
    const cliente = document.getElementById("cliente").value || "Consumidor Final";

    if (carrito.length === 0) return alert("El carrito está vacío");

    const { data: venta, error } = await client
        .from("ventas")
        .insert([{ cliente_nombre: cliente, cliente_nit: nit, total: total }])
        .select().single();

    if (error) return alert("Error al registrar venta");

    for (let p of carrito) {
        await client.from("detalle_ventas").insert([{
            venta_id: venta.id,
            producto_id: p.id,
            cantidad: p.cantidad,
            precio: p.precio,
            subtotal: p.subtotal
        }]);
    }

    if (confirm("¿Desea generar factura?")) generarPDF(cliente, nit);
    
    alert("Venta realizada");
    location.reload();
}

// Generar PDF Estético
function generarPDF(cliente, nit) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const morado = [124, 58, 237];

    // Encabezado
    doc.setFillColor(...morado);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("KAIZEN", 15, 20);

    // Datos Cliente
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`Cliente: ${cliente}`, 15, 40);
    doc.text(`NIT: ${nit}`, 15, 45);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 40);

    // Tabla con autoTable
    const cuerpo = carrito.map(p => [p.codigo, p.nombre, `Q${p.precio.toFixed(2)}`, p.cantidad, `Q${p.subtotal.toFixed(2)}`]);
    
    doc.autoTable({
        startY: 55,
        head: [['Código', 'Producto', 'Precio', 'Cant.', 'Subtotal']],
        body: cuerpo,
        headStyles: { fillColor: morado },
        alternateRowStyles: { fillColor: [245, 243, 255] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: Q${total.toFixed(2)}`, 150, finalY);

    doc.save(`Factura_${cliente}.pdf`);
}
