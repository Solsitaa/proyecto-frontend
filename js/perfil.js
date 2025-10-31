async function cargarPerfil() {
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userKarmaTitleEl = document.getElementById('userKarmaTitle');
    const userReputacionEl = document.getElementById('userReputacion');

    if (userNameEl) userNameEl.textContent = 'Cargando...';
    if (userEmailEl) userEmailEl.textContent = 'Cargando...';
    if (userKarmaTitleEl) userKarmaTitleEl.textContent = 'Cargando...';
    if (userReputacionEl) userReputacionEl.textContent = '...';

    let usuario = null;
    try {
        usuario = await getCurrentUserData();
    } catch(e) {
        console.error("Error obteniendo datos del usuario para perfil:", e);
        if (userNameEl) userNameEl.textContent = 'Error al cargar';
        if (userEmailEl) userEmailEl.textContent = 'Error';
        if (userKarmaTitleEl) userKarmaTitleEl.textContent = 'Error';
        if (userReputacionEl) userReputacionEl.textContent = 'Error';
        return;
    }

    if (!usuario) {
        alert('No se pudo cargar la información del perfil. Por favor, inicia sesión.');
        window.location.href = 'login.html';
        return;
    }

    if (userNameEl) userNameEl.textContent = (usuario.nombre || '') + ' ' + (usuario.apellido || '');
    if (userEmailEl) userEmailEl.textContent = usuario.email || 'No disponible';
    if (userKarmaTitleEl) userKarmaTitleEl.textContent = usuario.karmaTitle || 'N/A';
    if (userReputacionEl) userReputacionEl.textContent = usuario.reputacion !== undefined ? usuario.reputacion : 'N/A';
}

function editarPerfil() {
    alert('Función de editar perfil próximamente disponible');
}

window.addEventListener('DOMContentLoaded', cargarPerfil);