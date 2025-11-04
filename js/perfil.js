let modalEditarPerfil = null;
let currentUser = null;

function showErrorPerfil(message) {
    const errorDiv = document.getElementById('error-message-perfil');
    if (errorDiv) {
        let displayMessage = 'Ocurrió un error.';

        if (message) {
            try {
                const errorObj = JSON.parse(message);
                
                if (errorObj.error) {
                    displayMessage = errorObj.error;
                } else {
                    displayMessage = message;
                }
            } catch (e) {
                displayMessage = message;
            }
        }
        
        errorDiv.textContent = displayMessage;
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

        const userName = usuario.userName || 'usuario';
        if (userNameEl) userNameEl.textContent = (usuario.nombre || '') + ' ' + (usuario.apellido || '');
        if (userEmailEl) userEmailEl.textContent = usuario.email || 'No disponible';
        if (userKarmaTitleEl) userKarmaTitleEl.textContent = usuario.karmaTitle || 'N/A';
        if (userReputacionEl) userReputacionEl.textContent = usuario.reputacion !== undefined ? usuario.reputacion : 'N/A';
        
        if (userAvatarEl) {
            const fallbackAvatar = `https://robohash.org/${userName}?set=set4`;
            const avatarUrl = usuario.avatarUrl || fallbackAvatar;
            
            userAvatarEl.src = avatarUrl;
            
            userAvatarEl.onerror = function() {
                this.onerror = null; 
                this.src = fallbackAvatar;
            };
        }

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
    document.getElementById('edit-username').value = currentUser.userName || '';
    
    const avatarPreview = document.getElementById('edit-avatar-preview');
    avatarPreview.src = currentUser.avatarUrl || `https://robohash.org/${currentUser.userName}?set=set4`;

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

async function handleGenerarAvatar() {
    const avatarPreview = document.getElementById('edit-avatar-preview');
    const button = document.getElementById('btn-new-avatar');
    
    const originalSrc = avatarPreview.src;
    
    if (button) button.disabled = true;
    avatarPreview.src = 'https://via.placeholder.com/100'; 

    try {
        const response = await fetchAuth(`${API_BASE_URL}/auth/new-avatar`);
        if (!response || !response.url) {
            throw new Error('No se pudo obtener un nuevo avatar.');
        }
        
        avatarPreview.src = response.url;
        
    } catch (error) {
        console.error("Error al generar avatar:", error);
        alert("Error al cargar un nuevo Gato-Avatar. Se mantendrá la imagen anterior.");
        avatarPreview.src = originalSrc;
    } finally {
        if (button) button.disabled = false;
    }
}

async function handleGuardarPerfil(event) {
    event.preventDefault();
    const errorDiv = document.getElementById('error-message-perfil');
    if (errorDiv) errorDiv.style.display = 'none';

    const nombre = document.getElementById('edit-nombre').value;
    const apellido = document.getElementById('edit-apellido').value;
    const email = document.getElementById('edit-email').value.trim();
    const selectedTitle = document.getElementById('select-titulo').value;
    const avatarUrl = document.getElementById('edit-avatar-preview').src;
    const userName = document.getElementById('edit-username').value.trim();

    if (userName.length < 4) {
        showErrorPerfil("El nombre de usuario debe tener al menos 4 caracteres.");
        return false;
    }

    const credentialsChanged = (email !== currentUser.email) || (userName !== currentUser.userName);
    
    const updateData = {
        nombre,
        apellido,
        email,
        selectedTitle,
        avatarUrl,
        userName
    };

    const submitButton = event.target.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;

    try {
        const updatedUser = await fetchAuth(`${API_BASE_URL}/auth/me`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (credentialsChanged) {
            alert("Tus datos de sesión (usuario o correo) han cambiado. Por seguridad, por favor vuelve a iniciar sesión.");
            await cerrarSesion();
        } else {
            updateCurrentUserData(updatedUser);
            currentUser = updatedUser;
            
            if (modalEditarPerfil) {
                modalEditarPerfil.hide();
            }
            
            await cargarPerfil();
            
            if (typeof cargarPosts === 'function') {
                await cargarPosts();
            }
            if (typeof cargarTopUsers === 'function') {
                await cargarTopUsers();
            }
            if (typeof actualizarElementosUIAuth === 'function') {
                actualizarElementosUIAuth(updatedUser);
            }
        }

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