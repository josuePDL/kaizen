// 🔑 CONFIG
const SUPABASE_URL = "https://tqmetigngakqoftnemjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚀 CARGAR CLASIFICACIONES
async function cargarClasificaciones() {
    const select = document.getElementById("clasificacion");

    const { data } = await client
        .from("clasificaciones")
        .select("*");

    select.innerHTML = "";

    data.forEach(c => {
        select.innerHTML += `
            <option value="${c.id}" data-prefijo="${c.prefijo}">
                ${c.nombre} (${c.prefijo})
            </option>
        `;
    });
}

// 🔢 GENERAR CÓDIGO AUTOMÁTICO
async function generarCodigo(prefijo) {
    const { data } = await client
        .from("productos")
        .select("codigo")
        .like("codigo", `${prefijo}%`);

    let max = 0;

    data.forEach(p => {
        const numero = parseInt(p.codigo.replace(prefijo, "")) || 0;
        if (numero > max) max = numero;
    });

    const nuevoNumero = (max + 1).toString().padStart(3, "0");
    return prefijo + nuevoNumero;
}

// 💾 GUARDAR INGRESO
async function guardarIngreso() {
    let codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombre").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const costo = parseFloat(document.getElementById("costo").value);
    const precio = parseFloat(document.getElementById("precio").value);

    const select = document.getElementById("clasificacion");
    const clasificacion_id = select.value;
    const prefijo = select.options[select.selectedIndex].dataset.prefijo;

    if (!nombre || !cantidad || !costo || !precio) {
        alert("Completa todos los campos");
        return;
    }

    // 🧠 GENERAR CÓDIGO SI ESTÁ VACÍO
    if (!codigo) {
        codigo = await generarCodigo(prefijo);
    }

    // 🔍 Ver si ya existe producto
    let { data: producto } = await client
        .from("productos")
        .select("*")
        .eq("codigo", codigo)
        .single();

    let producto_id;

    if (!producto) {
        // ➕ Crear producto
        const { data, error } = await client
            .from("productos")
            .insert([{
                codigo,
                nombre,
                precio,
                stock: 0,
                clasificacion_id
            }])
            .select()
            .single();

        if (error) {
            alert("Error al crear producto");
            console.error(error);
            return;
        }

        producto_id = data.id;
    } else {
        producto_id = producto.id;
    }

    // 📥 Insertar ingreso
    const { error } = await client
        .from("ingresos")
        .insert([{
            producto_id,
            cantidad,
            costo,
            precio_venta: precio
        }]);

    if (error) {
        alert("Error al guardar ingreso");
        console.error(error);
        return;
    }

    alert("Ingreso registrado");
    location.reload();
}

// 🔄 INICIO
cargarClasificaciones();