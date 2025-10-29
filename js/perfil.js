function cargarPerfil() {
    const usuarioActual = sessionStorage.getItem('usuarioActual');

    if (!usuarioActual) {
        window.location.href = 'login.html';
        return;
    }

    const usuario = JSON.parse(usuarioActual);

    document.getElementById('userName').textContent = usuario.nombre + ' ' + usuario.apellido;
    document.getElementById('userEmail').textContent = usuario.email;
    document.getElementById('userSessions').textContent = usuario.sesiones || 0;

    if (usuario.animo && usuario.animo.length > 0) {
        const promedioAnimo = (usuario.animo.reduce((a, b) => a + b, 0) / usuario.animo.length).toFixed(1);
        document.getElementById('userMood').textContent = promedioAnimo + ' / 10';
    } else {
        document.getElementById('userMood').textContent = 'Sin datos';
    }

    const estados = ['Tranquilo', 'Optimista', 'Neutral', 'Ansioso', 'Reflexivo'];
    const estadoAleatorio = estados[Math.floor(Math.random() * estados.length)];
    document.getElementById('userStatus').textContent = estadoAleatorio;
}

function editarPerfil() {
    alert('Función de editar perfil próximamente disponible');
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        sessionStorage.removeItem('usuarioActual');
        window.location.href = 'index.html';
    }
}

window.addEventListener('DOMContentLoaded', cargarPerfil);