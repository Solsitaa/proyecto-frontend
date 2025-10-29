function cargarPerfil() {
    const userData = getUserData();

    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = userData.nombre ? `${userData.nombre} (${userData.userName})` : userData.userName;
    document.getElementById('userEmail').textContent = userData.email || 'No disponible';
    document.getElementById('userKarmaTitle').textContent = userData.karmaTitle || 'Usuario';
    document.getElementById('userReputacion').textContent = userData.reputacion !== null ? userData.reputacion.toFixed(1) : '0.0';

    const sessionsElement = document.getElementById('userSessions');
    const moodElement = document.getElementById('userMood');
    const statsDiv = document.querySelector('.estadisticas');

    if (sessionsElement) sessionsElement.closest('div').style.display = 'none';
    if (moodElement) moodElement.closest('div').style.display = 'none';

    // Ocultar div de estadísticas si ambos elementos hijos fueron ocultados
    if (statsDiv && sessionsElement && moodElement) {
         statsDiv.style.display = 'none';
    }
}

function editarPerfil() {
    alert('Función de editar perfil próximamente disponible');
}

function handleCerrarSesion() {
     if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        cerrarSesion();
    }
}

window.addEventListener('DOMContentLoaded', cargarPerfil);