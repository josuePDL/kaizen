// Configuración
const SUPABASE_URL = 'https://tqmetigngakqoftnemjp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWV0aWduZ2FrcW9mdG5lbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjIyMzQsImV4cCI6MjA5MjM5ODIzNH0.AeCiP7zDILSTWqvm3qXSCFF3H6HmPOoVv_5j1kjOwU0';

// Creamos el cliente usando la librería que cargó el HTML
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias a los elementos del DOM
const form = document.getElementById('loginForm');
const btn = document.getElementById('btnSubmit');
const mensajeDiv = document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI: Desactivar botón y limpiar mensajes
    btn.disabled = true;
    btn.innerText = "Verificando...";
    mensajeDiv.classList.add('d-none');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Proceso de autenticación
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        // Mostrar error en rojo
        mensajeDiv.innerText = "Error: " + error.message;
        mensajeDiv.className = "mt-3 small text-center text-danger";
        mensajeDiv.classList.remove('d-none');
        btn.disabled = false;
        btn.innerText = "Entrar";
    } else {
        // Éxito
        mensajeDiv.innerText = "¡Acceso concedido!";
        mensajeDiv.className = "mt-3 small text-center text-success";
        mensajeDiv.classList.remove('d-none');
        
        console.log("Usuario:", data.user);
        
        // Redirigir después de 1 segundo
        setTimeout(() => {
            window.location.href = 'busqueda.html'; 
        }, 1000);
    }
});