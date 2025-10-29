let currentPostIdForComments = null;

async function abrirModalComentarios(postId) {
    currentPostIdForComments = postId;
    document.getElementById('modal-comentarios').style.display = 'block';
    
    const userData = getUserData();
    const formComentario = document.getElementById('form-comentario');
    if (formComentario) {
        formComentario.style.display = userData ? 'block' : 'none';
    }
    
    await cargarComentarios(postId);
}

function cerrarModalComentarios() {
    document.getElementById('modal-comentarios').style.display = 'none';
    currentPostIdForComments = null;
}

async function cargarComentarios(postId) {
    const comentariosList = document.getElementById('comentarios-list');
    if (!comentariosList) return;

    comentariosList.innerHTML = '<p>Cargando comentarios...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
        if (!response.ok) {
            throw new Error('Error al cargar comentarios');
        }

        const comentarios = await response.json();

        comentariosList.innerHTML = '';

        if (comentarios.length === 0) {
            comentariosList.innerHTML = '<p style="color: #666;">Aún no hay comentarios. ¡Sé el primero en comentar!</p>';
            return;
        }

        const userData = getUserData();

        comentarios.forEach(comentario => {
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
                    <strong style="color: #3c4fff;">${comentario.userName}</strong>
                    ${statusBadge}
                </div>
                <p style="margin: 8px 0; color: #333;">${comentario.content}</p>
                <small style="color: #888;">${new Date(comentario.publicationDate).toLocaleString()}</small>
                ${isOwner ? `
                    <div style="margin-top: 10px;">
                        <button class="btn-small" onclick="eliminarComentario(${comentario.id})">🗑️ Eliminar</button>
                    </div>
                ` : ''}
            `;

            comentariosList.appendChild(comentarioDiv);
        });

    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        comentariosList.innerHTML = '<p style="color: red;">Error al cargar los comentarios</p>';
    }
}

async function agregarComentario() {
    const token = getToken();
    if (!token) {
        alert('Debes iniciar sesión para comentar');
        return;
    }

    if (!currentPostIdForComments) return;

    const textarea = document.getElementById('nuevo-comentario');
    const content = textarea.value.trim();

    if (!content) {
        alert('El comentario no puede estar vacío');
        return;
    }

    try {
        const auth = { name: getUserData().userName };
        
        const response = await fetchAuth(`${API_BASE_URL}/posts/${currentPostIdForComments}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        textarea.value = '';
        await cargarComentarios(currentPostIdForComments);

    } catch (error) {
        console.error('Error al crear comentario:', error);
        alert(error.message || 'No se pudo crear el comentario');
    }
}

async function eliminarComentario(comentarioId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/posts/${currentPostIdForComments}/comments/${comentarioId}`, {
            method: 'DELETE'
        });

        await cargarComentarios(currentPostIdForComments);

    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        alert(error.message || 'No se pudo eliminar el comentario');
    }
}