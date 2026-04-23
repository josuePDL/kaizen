// 🔑 CONFIGURACIÓN
const SUPABASE_URL = "https://tqmetigngakqoftnemjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0";

// ✅ CREAR CLIENTE CORRECTAMENTE
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔍 FUNCIÓN
async function buscarProducto() {
    const codigo = document.getElementById("codigo").value.trim();
    const resultado = document.getElementById("resultado");

    if (!codigo) {
        resultado.innerHTML = `<div class="alert alert-warning">Ingrese un código</div>`;
        return;
    }

    resultado.innerHTML = `<div class="text-muted">Buscando...</div>`;

    const { data, error } = await client
        .from("productos")
        .select("*")
        .eq("codigo", codigo)
        .single();

    if (error || !data) {
        resultado.innerHTML = `<div class="alert alert-danger">Producto no encontrado</div>`;
        return;
    }

    resultado.innerHTML = `
        <div class="card p-3 mt-2">
            <h5>${data.nombre}</h5>
            <p class="mb-1"><strong>Precio:</strong> Q${data.precio}</p>
            <p><strong>Stock:</strong> ${data.stock}</p>
        </div>
    `;
}