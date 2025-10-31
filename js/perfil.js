let modalEditarPerfil = null;
let currentUser = null;

function showErrorPerfil(message) {
    const errorDiv = document.getElementById('error-message-perfil');
    if (errorDiv) {
        errorDiv.textContent = message || 'Ocurrió un error.';
        errorDiv.style.display = 'block';
    }
}

async function cargarPerfil() {
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userKarmaTitleEl = document.getElementById('userKarmaTitle');
    const userReputacionEl = document.getElementById('userReputacion');
    const userAvatarEl = document.getElementById('userAvatar');

    try {
        const usuario = await getCurrentUserData();
        if (!usuario) {
            alert('No se pudo cargar la información del perfil. Por favor, inicia sesión.');
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = usuario;

        if (userNameEl) userNameEl.textContent = (usuario.nombre || '') + ' ' + (usuario.apellido || '');
        if (userEmailEl) userEmailEl.textContent = usuario.email || 'No disponible';
        if (userKarmaTitleEl) userKarmaTitleEl.textContent = usuario.karmaTitle || 'N/A';
        if (userReputacionEl) userReputacionEl.textContent = usuario.reputacion !== undefined ? usuario.reputacion : 'N/A';
        if (userAvatarEl) userAvatarEl.src = usuario.avatarUrl || 'https://via.placeholder.com/150';

    } catch(e) {
        console.error("Error obteniendo datos del usuario para perfil:", e);
        if (userNameEl) userNameEl.textContent = 'Error al cargar';
        if (userEmailEl) userEmailEl.textContent = 'Error';
    }
}

function abrirModalEditarPerfil() {
    if (!currentUser) {
        alert("Error, no se pueden cargar los datos del usuario.");
        return;
    }

    const errorDiv = document.getElementById('error-message-perfil');
    if (errorDiv) errorDiv.style.display = 'none';

    document.getElementById('edit-nombre').value = currentUser.nombre || '';
    document.getElementById('edit-apellido').value = currentUser.apellido || '';
    document.getElementById('edit-email').value = currentUser.email || '';
    
    const avatarPreview = document.getElementById('edit-avatar-preview');
    avatarPreview.src = currentUser.avatarUrl || 'https://via.placeholder.com/100';

    const selectTitulo = document.getElementById('select-titulo');
    selectTitulo.innerHTML = ''; 

    if (currentUser.availableTitles && currentUser.availableTitles.length > 0) {
        currentUser.availableTitles.forEach(title => {
            const option = document.createElement('option');
            option.value = title;
            option.textContent = title;
            if (title === currentUser.karmaTitle) {
                option.selected = true;
            }
            selectTitulo.appendChild(option);
        });
    } else {
        selectTitulo.innerHTML = '<option>No hay títulos disponibles</option>';
    }

    if (modalEditarPerfil) {
        modalEditarPerfil.show();
    }
}

function handleGenerarAvatar() {
    const avatarPreview = document.getElementById('edit-avatar-preview');
    const randomCacheBuster = new Date().getTime();
    avatarPreview.src = `https://cataas.com/cat?t=${randomCacheBuster}`;
}

async function handleGuardarPerfil(event) {
    event.preventDefault();
    const errorDiv = document.getElementById('error-message-perfil');
    if (errorDiv) errorDiv.style.display = 'none';

    const nombre = document.getElementById('edit-nombre').value;
    const apellido = document.getElementById('edit-apellido').value;
    const email = document.getElementById('edit-email').value;
    const selectedTitle = document.getElementById('select-titulo').value;
    const avatarUrl = document.getElementById('edit-avatar-preview').src;
    
    const updateData = {
        nombre,
        apellido,
        email,
        selectedTitle,
        avatarUrl
    };

    const submitButton = event.target.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;

    try {
        const updatedUser = await fetchAuth(`${API_BASE_URL}/auth/me`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        updateCurrentUserData(updatedUser);
        currentUser = updatedUser;
        
        if (modalEditarPerfil) {
            modalEditarPerfil.hide();
        }
        
        await cargarPerfil();

    } catch (error) {
        console.error("Error al guardar perfil:", error);
        showErrorPerfil(error.message || "No se pudo guardar el perfil.");
    } finally {
        if(submitButton) submitButton.disabled = false;
    }
    return false;
}


window.addEventListener('DOMContentLoaded', () => {
    modalEditarPerfil = new bootstrap.Modal(document.getElementById('modal-editar-perfil'));
    cargarPerfil();
});