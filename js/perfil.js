function cargarPerfil() {
    const usuario = getUserData();

    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = usuario.nombre + ' ' + usuario.apellido;
    document.getElementById('userEmail').textContent = usuario.email;
    document.getElementById('userKarmaTitle').textContent = usuario.karmaTitle || 'Cargando...';
    document.getElementById('userReputacion').textContent = usuario.reputacion !== undefined ? usuario.reputacion : 'Cargando...';

    document.getElementById('userSessions').textContent = usuario.sesiones || 0;

    if (usuario.animo && usuario.animo.length > 0) {
        const promedioAnimo = (usuario.animo.reduce((a, b) => a + b, 0) / usuario.animo.length).toFixed(1);
        document.getElementById('userMood').textContent = promedioAnimo + ' / 10';
    } else {
        document.getElementById('userMood').textContent = 'Sin datos';
    }
}

function editarPerfil() {
    alert('Función de editar perfil próximamente disponible');
}

window.addEventListener('DOMContentLoaded', cargarPerfil);