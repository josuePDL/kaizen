const SUPABASE_URL = "https://tqmetigngakqoftnemjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let total = 0;

// 🛒 AGREGAR PRODUCTO
async function agregarProducto() {
    const codigo = document.getElementById("codigo").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);

    if (!codigo || !cantidad) return alert("Completa los campos");

    const { data } = await client
        .from("productos")
        .select("*")
        .eq("codigo", codigo)
        .single();

    if (!data) return alert("Producto no encontrado");

    if (cantidad > data.stock) {
        return alert("Stock insuficiente");
    }

    const subtotal = data.precio * cantidad;

    carrito.push({
        id: data.id,
        nombre: data.nombre,
        precio: data.precio,
        cantidad,
        subtotal
    });

    total += subtotal;

    renderTabla();
}

// 🔄 MOSTRAR TABLA
function renderTabla() {
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
            </tr>
        `;
    });

    totalHTML.textContent = total.toFixed(2);
}

// 💾 FINALIZAR VENTA
// 💾 FINALIZAR VENTA
async function finalizarVenta() {
    const nit = document.getElementById("nit").value;
    const cliente = document.getElementById("cliente").value;

    if (carrito.length === 0) return alert("No hay productos");

    // 🧾 CREAR VENTA
    const { data: venta } = await client
        .from("ventas")
        .insert([{ total }])
        .select()
        .single();

    // 📦 DETALLE + STOCK
    for (let p of carrito) {
        await client.from("detalle_ventas").insert([{
            venta_id: venta.id,
            producto_id: p.id,
            cantidad: p.cantidad,
            precio: p.precio
        }]);

        await client.rpc("restar_stock", {
            producto_id: p.id,
            cantidad: p.cantidad
        });
    }

    // 🔥 NUEVO: CONFIRMAR PDF
    const generar = confirm("¿Desea generar factura en PDF?");

    if (generar) {
        generarPDF(nit, cliente);
    }

    alert("Venta realizada");
    location.reload();
}

// 📄 GENERAR PDF
function generarPDF(nit, cliente) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fecha = new Date().toLocaleDateString();

    // 🧾 ENCABEZADO
    doc.setFontSize(18);
    doc.text("FACTURA", 150, 15);

    doc.setFontSize(10);
    doc.text("Kaizen", 10, 10);
    doc.text("Dirección: Villas del amanecer 2, 5-00, Zona 8 Villa Nueva, Ciudad Peronia", 10, 15);
    doc.text("Tel: 1234-5678", 10, 20);

    // 📅 INFO CLIENTE
    doc.setFontSize(11);
    doc.text(`Fecha: ${fecha}`, 10, 30);
    doc.text(`Cliente: ${cliente}`, 10, 35);
    doc.text(`NIT: ${nit}`, 10, 40);

    // 📊 TABLA ENCABEZADO
    let y = 50;

    doc.setFillColor(40, 167, 69); // verde bootstrap
    doc.rect(10, y, 190, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.text("Producto", 12, y + 6);
    doc.text("Precio", 90, y + 6);
    doc.text("Cant.", 130, y + 6);
    doc.text("Subtotal", 160, y + 6);

    doc.setTextColor(0, 0, 0);

    y += 12;

    // 📦 PRODUCTOS
    carrito.forEach(p => {
        doc.text(p.nombre, 12, y);
        doc.text(`Q${p.precio}`, 90, y);
        doc.text(`${p.cantidad}`, 135, y);
        doc.text(`Q${p.subtotal}`, 160, y);

        y += 8;
    });

    // 🧮 TOTAL
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69);
    doc.text(`TOTAL: Q${total.toFixed(2)}`, 140, y);

    doc.setTextColor(0, 0, 0);

    // 🧾 PIE
    y += 15;
    doc.setFontSize(10);
    doc.text("Gracias por su compra", 10, y);

    // 💾 GUARDAR
    doc.save(`factura_${fecha}.pdf`);
}