async function cargarPerfil() {
    let usuario = null;
    try {
        usuario = await getCurrentUserData();
    } catch(e) {
        console.error("Error obteniendo datos del usuario para perfil:", e);
    }


    if (!usuario) {
        alert('No se pudo cargar la información del perfil. Por favor, inicia sesión.');
        window.location.href = 'login.html';
        return;
    }

    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userKarmaTitleEl = document.getElementById('userKarmaTitle');
    const userReputacionEl = document.getElementById('userReputacion');

    if (userNameEl) userNameEl.textContent = (usuario.nombre || '') + ' ' + (usuario.apellido || '');
    if (userEmailEl) userEmailEl.textContent = usuario.email || 'No disponible';
    if (userKarmaTitleEl) userKarmaTitleEl.textContent = usuario.karmaTitle || 'Cargando...';
    if (userReputacionEl) userReputacionEl.textContent = usuario.reputacion !== undefined ? usuario.reputacion : 'Cargando...';
}

function editarPerfil() {
    alert('Función de editar perfil próximamente disponible');
}

window.addEventListener('DOMContentLoaded', cargarPerfil);