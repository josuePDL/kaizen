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

let carrito = [];
let total = 0;

async function agregarProducto() {
    const codigo = document.getElementById("codigo").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);

    const { data } = await client
        .from("productos")
        .select("*")
        .eq("codigo", codigo)
        .single();

    if (!data) return alert("No existe");

    if (cantidad > data.stock)
        return alert("Stock insuficiente");

    let subtotal = data.precio_venta * cantidad;

    carrito.push({
        id: data.id,
        nombre: data.nombre,
        precio: data.precio_venta,
        cantidad,
        subtotal
    });

    total += subtotal;

    renderVenta();
}

function renderVenta() {
    const tabla = document.getElementById("tablaVenta");
    const totalHTML = document.getElementById("total");

    tabla.innerHTML = "";

    carrito.forEach(p => {
        tabla.innerHTML += `
        <tr>
            <td>${p.nombre}</td>
            <td>Q${p.precio}</td>
            <td>${p.cantidad}</td>
            <td>Q${p.subtotal}</td>
        </tr>`;
    });

    totalHTML.textContent = total.toFixed(2);
}

async function finalizarVenta() {
    const nit = document.getElementById("nit").value;
    const cliente = document.getElementById("cliente").value;

    const { data: venta } = await client
        .from("ventas")
        .insert([{
            cliente_nombre: cliente,
            cliente_nit: nit,
            total
        }])
        .select()
        .single();

    for (let p of carrito) {
        await client.from("detalle_ventas").insert([{
            venta_id: venta.id,
            producto_id: p.id,
            cantidad: p.cantidad,
            precio: p.precio,
            subtotal: p.subtotal
        }]);
    }

    const pdf = confirm("¿Desea generar PDF?");
    if (pdf) generarPDF(cliente, nit);

    alert("Venta realizada");
    location.reload();
}

function generarPDF(cliente, nit) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("FACTURA", 150, 10);
    doc.text(`Cliente: ${cliente}`, 10, 20);
    doc.text(`NIT: ${nit}`, 10, 30);

    let y = 45;

    carrito.forEach(p => {
        doc.text(`${p.nombre} x${p.cantidad} = Q${p.subtotal}`, 10, y);
        y += 10;
    });

    doc.text(`TOTAL: Q${total}`, 10, y + 10);

    doc.save("factura.pdf");
}
