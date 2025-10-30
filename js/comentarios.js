let currentPostIdForComments = null;

async function abrirModalComentarios(postId) {
    currentPostIdForComments = postId;
    const modal = document.getElementById('modal-comentarios');
    if (modal) modal.style.display = 'block';

    const formComentario = document.getElementById('form-comentario');
    if (formComentario) {
        try {
            const userData = await getCurrentUserData();
            formComentario.style.display = userData ? 'block' : 'none';
        } catch {
            formComentario.style.display = 'none';
        }
    }

    await cargarComentarios(postId);
}

function cerrarModalComentarios() {
    const modal = document.getElementById('modal-comentarios');
    if (modal) modal.style.display = 'none';
    currentPostIdForComments = null;
}

async function cargarComentarios(postId) {
    const comentariosList = document.getElementById('comentarios-list');
    if (!comentariosList) return;

    comentariosList.innerHTML = '<p>Cargando comentarios...</p>';

    let userData = null;
    try {
        userData = await getCurrentUserData();
    } catch (e) {
        console.log("No logueado, viendo comentarios como anónimo.");
    }


    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
        if (!response.ok) {
            throw new Error('Error al cargar comentarios: ' + response.statusText);
        }

        const comentarios = await response.json();

        comentariosList.innerHTML = '';

        if (!Array.isArray(comentarios)) {
            throw new Error("Formato de respuesta inesperado.");
        }


        if (comentarios.length === 0) {
            comentariosList.innerHTML = '<p style="color: #666;">Aún no hay comentarios. ¡Sé el primero en comentar!</p>';
            return;
        }


        comentarios.forEach(comentario => {
            if (!comentario || typeof comentario !== 'object') return;

            const comentarioDiv = document.createElement('div');
            comentarioDiv.className = 'comentario-item';
            comentarioDiv.style.cssText = 'background: #f7f9ff; padding: 15px; border-radius: 8px; margin-bottom: 10px;';

            let statusBadge = '';
            if (comentario.status === 'PENDIENTE') {
                statusBadge = '<span style="font-size: 0.75rem; background-color: #fff4cc; color: #856404; padding: 2px 5px; border-radius: 3px; margin-left: 5px;">Pendiente</span>';
            }

            const isOwner = userData && userData.userName === comentario.userName;

            comentarioDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <strong style="color: #3c4fff;">${escapeHtml(comentario.userName || 'Anónimo')}</strong>
                    ${statusBadge}
                </div>
                <p style="margin: 8px 0; color: #333;">${escapeHtml(comentario.content || '')}</p>
                <small style="color: #888;">${comentario.publicationDate ? new Date(comentario.publicationDate).toLocaleString() : ''}</small>
                ${isOwner ? `
                    <div style="margin-top: 10px;">
                        <button class="btn-small btn-danger" onclick="eliminarComentario(${comentario.id})">🗑️ Eliminar</button>
                    </div>
                ` : ''}
            `;

            if (comentario.status === 'APROBADO' || isOwner) {
                comentariosList.appendChild(comentarioDiv);
            }
        });

        if (comentariosList.innerHTML === '') {
            comentariosList.innerHTML = '<p style="color: #666;">No hay comentarios visibles.</p>';
        }

    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        comentariosList.innerHTML = `<p style="color: red;">Error al cargar los comentarios: ${error.message}</p>`;
    }
}

async function agregarComentario() {
    let userData;
    try {
        userData = await getCurrentUserData();
        if (!userData) {
            alert('Debes iniciar sesión para comentar');
            window.location.href = 'login.html';
            return;
        }
    } catch {
        alert('Error al verificar sesión. Intenta iniciar sesión.');
        window.location.href = 'login.html';
        return;
    }


    if (!currentPostIdForComments) return;

    const textarea = document.getElementById('nuevo-comentario');
    const content = textarea ? textarea.value.trim() : '';

    if (!content) {
        alert('El comentario no puede estar vacío');
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/posts/${currentPostIdForComments}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        if (textarea) textarea.value = '';
        await cargarComentarios(currentPostIdForComments);

    } catch (error) {
        console.error('Error al crear comentario:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo crear el comentario');
        }
    }
}

async function eliminarComentario(comentarioId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
        return;
    }

    if (!currentPostIdForComments) return;


    try {
        await fetchAuth(`${API_BASE_URL}/posts/${currentPostIdForComments}/comments/${comentarioId}`, {
            method: 'DELETE'
        });

        alert('Comentario eliminado.');
        await cargarComentarios(currentPostIdForComments);

    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo eliminar el comentario');
        }
    }
}


if (typeof escapeHtml !== 'function') {
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        let safeText = String(text).replace(/&/g, '&amp;').replace(/[<>"']/g, m => map[m]);
        safeText = safeText.replace(/\r?\n/g, ' ');
        return safeText;
    }
}