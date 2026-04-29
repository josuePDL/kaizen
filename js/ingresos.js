// 1. Configuración de conexión
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
// 2. Cargar clasificaciones al iniciar la página
async function cargarClasificaciones() {
    const { data, error } = await client
        .from("clasificaciones")
        .select("id, nombre, prefijo");

    if (error) {
        console.error("Error al obtener clasificaciones:", error);
        return;
    }

    const select = document.getElementById("clasificacion");
    select.innerHTML = '<option value="" data-prefijo="">Seleccione una categoría...</option>';

    data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.nombre;
        // Guardamos el prefijo como un atributo de datos para usarlo después
        option.dataset.prefijo = item.prefijo; 
        select.appendChild(option);
    });
}

// 3. Generar código correlativo basado en el prefijo (ej: A001, A002)
async function generarCodigo(prefijo) {
    if (!prefijo) return "";

    const { data, error } = await client
        .from("productos")
        .select("codigo")
        .like("codigo", `${prefijo}%`);

    if (error) {
        console.error("Error al generar código:", error);
        return "";
    }

    let max = 0;
    data.forEach(p => {
        // Extraemos el número después del prefijo
        let n = parseInt(p.codigo.replace(prefijo, "")) || 0;
        if (n > max) max = n;
    });

    // Formato: Prefijo + número con ceros a la izquierda (ej: A004)
    return prefijo + String(max + 1).padStart(3, "0");
}

// 4. Guardar el producto y el movimiento de inventario
async function guardarIngreso() {
    // Captura de elementos del DOM
    const inputCodigo = document.getElementById("codigo").value;
    const nombre = document.getElementById("nombre").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const costo = parseFloat(document.getElementById("costo").value);
    const precio = parseFloat(document.getElementById("precio").value);
    
    const select = document.getElementById("clasificacion");
    const clasificacion_id = select.value;
    const prefijo = select.options[select.selectedIndex].dataset.prefijo;

    // Validaciones básicas
    if (!nombre || !cantidad || !clasificacion_id) {
        alert("Por favor completa los campos obligatorios (Nombre, Clasificación y Cantidad)");
        return;
    }

    // Si el usuario no escribió un código, lo generamos automáticamente
    let codigoFinal = inputCodigo;
    if (!codigoFinal) {
        codigoFinal = await generarCodigo(prefijo);
    }

    try {
        // A. Insertar el Producto
        const { data: nuevoProducto, error: errorProd } = await client
            .from("productos")
            .insert([{
                codigo: codigoFinal,
                nombre: nombre,
                precio_compra: costo,
                precio_venta: precio,
                stock: cantidad, // El stock inicial es la cantidad del primer ingreso
                clasificacion_id: clasificacion_id
            }])
            .select()
            .single();

        if (errorProd) throw errorProd;

        // B. Registrar el movimiento en el historial
        const { error: errorMov } = await client
            .from("movimientos_inventario")
            .insert([{
                producto_id: nuevoProducto.id,
                tipo: "ingreso",
                cantidad: cantidad,
                costo: costo,
                precio_venta: precio
            }]);

        if (errorMov) throw errorMov;

        alert(`Producto guardado con éxito. Código: ${codigoFinal}`);
        location.reload();

    } catch (err) {
        console.error("Error en la operación:", err);
        alert("Hubo un error al guardar: " + err.message);
    }
}

// Iniciar la carga de datos cuando el script se ejecute
document.addEventListener("DOMContentLoaded", () => {
    cargarClasificaciones();
});