const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 FUNCIÓN DE PROTECCIÓN
async function verificarSesion() {
    const { data: { session }, error } = await client.auth.getSession();

    if (error || !session) {
        window.location.href = "login.html"; 
    } else {
        console.log("Usuario verificado:", session.user.email);
    }
}

verificarSesion();

async function buscarProducto() {
    // .trim() elimina espacios en blanco accidentales al inicio o final
    const codigoInput = document.getElementById("codigo").value.trim();
    const resultado = document.getElementById("resultado");

    if (!codigoInput) {
        resultado.innerHTML = '<div class="alert alert-warning">Por favor escribe un código.</div>';
        return;
    }

    // 🔍 CAMBIO CLAVE: .ilike en lugar de .eq
    // ilike hace que "dc001" coincida con "DC001" en la base de datos.
    const { data, error } = await client
        .from("productos")
        .select("*")
        .ilike("codigo", codigoInput) 
        .maybeSingle(); // maybeSingle evita errores si no encuentra nada

    if (error) {
        console.error(error);
        resultado.innerHTML = "Error en la búsqueda";
        return;
    }

    if (!data) {
        resultado.innerHTML = `
            <div class="alert alert-danger text-center">
                Producto "${codigoInput}" no encontrado
            </div>`;
        return;
    }

    // Mostrar el resultado con un diseño más limpio
    resultado.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-body">
                <h6 class="text-muted mb-1">Código: ${data.codigo.toUpperCase()}</h6>
                <h4 class="card-title text-primary">${data.nombre}</h4>
                <hr>
                <div class="d-flex justify-content-between">
                    <span>Precio:</span>
                    <strong class="text-success">Q${parseFloat(data.precio_venta).toFixed(2)}</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span>Stock actual:</span>
                    <span class="badge ${data.stock > 0 ? 'bg-info' : 'bg-danger'}">${data.stock} unidades</span>
                </div>
            </div>
        </div>
    `;
}
