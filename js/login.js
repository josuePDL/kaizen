const SUPABASE_URL = "https://dbherfalxtdpuekdquso.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGVyZmFseHRkcHVla2RxdXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTgsImV4cCI6MjA5MzA2Mjk1OH0.ERCeSP2s_0LfPGL5FYy-dKbMIlyRt8Gvg8aZ47DgITA";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('loginForm');
const mensajeError = document.getElementById('mensajeError');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Ocultar mensaje de error anterior
    mensajeError.style.display = 'none';

    // Intento de inicio de sesión con Supabase Auth
    const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        mensajeError.textContent = "Credenciales incorrectas: " + error.message;
        mensajeError.style.display = 'block';
    } else {
        // Si el login es exitoso, redirigir al index o inventario
        window.location.href = "index.html";
    }
});

// Verificación rápida: si ya tiene sesión, mandarlo al index
async function revisarSesionActiva() {
    const { data } = await client.auth.getSession();
    if (data.session) {
        window.location.href = "index.html";
    }
}
revisarSesionActiva();