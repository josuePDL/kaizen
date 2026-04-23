// CONFIGURACIÓN DE SUPABASE (Centralizada)
const supabaseUrl = 'https://tqmetigngakqoftnemjp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0';

// Inicializamos una sola vez. 
// Usamos 'window.supabaseClient' para que sea accesible desde cualquier otro script
if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

const supabaseInstance = window.supabaseClient;

// FUNCIÓN PARA PROTEGER LA PÁGINA
async function checkUser() {
    const { data: { session } } = await supabaseInstance.auth.getSession();
    
    // Si no hay sesión y NO estamos en la página de login, redirigir
    if (!session && !window.location.pathname.includes('index.html')) {
        window.location.replace("index.html");
    } 
    // Si ya hay sesión e intenta ir al login, mandarlo a búsqueda
    else if (session && window.location.pathname.includes('index.html')) {
        window.location.replace("busqueda.html");
    }
}

// FUNCIÓN PARA CERRAR SESIÓN (Global)
async function cerrarSesion() {
    try {
        const { error } = await supabaseInstance.auth.signOut();
        if (error) throw error;
        window.location.replace("index.html");
    } catch (error) {
        console.error("Error al cerrar sesión:", error.message);
    }
}

// Ejecutar protección automáticamente al cargar
checkUser();