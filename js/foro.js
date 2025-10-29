const API_BASE_URL = 'http://localhost:8080/api';

let currentEditPostId = null;
let currentReportUserId = null;
let currentReportPostId = null;

async function darReconocimiento(button, postId) {
    const token = getToken();
    if (!token && !getUserData()) {
        showError('Debes iniciar sesión para dar reconocimiento.');
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;

    try {
        const responseText = await fetchAuth(`${API_BASE_URL}/posts/${postId}/vote?type=LIKE`, {
            method: 'POST'
        });

        button.textContent = `✓ ${responseText || 'Hecho'}`;
        button.style.backgroundColor = '#90EE90';

    } catch (error) {
        console.error('Error al dar reconocimiento:', error);
        alert(error.message || 'No se pudo registrar el voto.');
        button.textContent = originalText;
        button.disabled = false;
    }
}

function handleAuth() {
    const userData = getUserData();
    if (userData) {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    } else {
        window.location.href = 'login.html';
    }
}

function actualizarBotonAuth() {
    const authButton = document.getElementById('authButton');
    const perfilLink = document.getElementById('perfilLink');
    const adminLink = document.getElementById('adminLink');
    const userData = getUserData();

    if (authButton) {
        if (userData) {
            authButton.textContent = 'Cerrar sesión';
            if (perfilLink) perfilLink.style.display = 'inline';
            if (adminLink && userData.rol === 'ADMINISTRADOR') {
                adminLink.style.display = 'inline';
            }
        } else {
            authButton.textContent = 'Iniciar sesión';
            if (perfilLink) perfilLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }
    }
}

async function cargarPosts() {
    const postListDiv = document.getElementById('postList');
    if (!postListDiv) return;

    postListDiv.innerHTML = '<p>Cargando posts...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }
        const posts = await response.json();

        postListDiv.innerHTML = '';

        if (posts.length === 0) {
            postListDiv.innerHTML = '<p>Aún no hay posts. ¡Sé el primero en crear uno!</p>';
            return;
        }

        const userData = getUserData();

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            
            let statusBadge = '';
            if (post.status === 'PENDIENTE') {
                statusBadge = '<span style="font-size: 0.8rem; background-color: #ffecb3; color: #6d4c41; padding: 2px 5px; border-radius: 3px; margin-left: 10px;">⏳ Pendiente de aprobación</span>';
            } else if (post.status === 'RECHAZADO') {
                statusBadge = '<span style="font-size: 0.8rem; background-color: #ffcdd2; color: #b71c1c; padding: 2px 5px; border-radius: 3px; margin-left: 10px;">❌ Rechazado</span>';
            }

            const isOwner = userData && userData.userName === post.userName;
            const canEdit = isOwner && post.status !== 'RECHAZADO';

            postCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h2>${post.userName} <span style="font-size: 0.9rem; color: #555;">(${post.userTitle || 'Usuario'})</span>${statusBadge}</h2>
                        ${post.title ? `<h3 style="color: #3c4fff; margin: 10px 0;">${post.title}</h3>` : ''}
                    </div>
                    ${!isOwner ? `<button class="btn-report" onclick="abrirModalReportar(${post.idPost}, '${post.userName}', ${post.userId})">🚩 Reportar</button>` : ''}
                </div>
                <p>${post.content}</p>
                <p style="font-size: 0.8rem; color: #888;">Publicado: ${new Date(post.publicationDate).toLocaleString()}</p>
                ${post.updateDate && new Date(post.updateDate).getTime() !== new Date(post.publicationDate).getTime()
                    ? `<p style="font-size: 0.8rem; color: #888;">Editado: ${new Date(post.updateDate).toLocaleString()}</p>`
                    : ''
                }
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="reputacion" onclick="darReconocimiento(this, ${post.idPost})">👍 Dar Reconocimiento</button>
                    <button class="btn-secondary" onclick="abrirModalComentarios(${post.idPost})">💬 Comentarios</button>
                    ${canEdit ? `
                        <button class="btn-primary" onclick="abrirModalEditar(${post.idPost}, '${escapeHtml(post.title || '')}', '${escapeHtml(post.content)}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarPost(${post.idPost})">🗑️ Eliminar</button>
                    ` : ''}
                </div>
            `;
            
            if (post.status === 'APROBADO' || (userData && userData.userName === post.userName)) {
                postListDiv.appendChild(postCard);
            }
        });

        if (postListDiv.innerHTML === '') {
            postListDiv.innerHTML = '<p>No hay posts aprobados para mostrar.</p>';
        }

    } catch (error) {
        console.error('Error al cargar posts:', error);
        postListDiv.innerHTML = `<p style="color: red;">Error al cargar los posts: ${error.message}</p>`;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '\n': ' ',
        '\r': ''
    };
    return text.replace(/[&<>"'\n\r]/g, m => map[m]);
}

async function handleCrearPost(event) {
    event.preventDefault();
    const userData = getUserData();
    if (!userData) {
        alert("Debes iniciar sesión para crear un post.");
        return false;
    }

    const content = document.getElementById('newPostContent').value.trim();
    const title = document.getElementById('newPostTitle').value.trim() || null;

    if (!content) {
        alert("El contenido del post no puede estar vacío.");
        return false;
    }

    const postData = { 
        content: content,
        title: title
    };

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Publicando...';

    try {
        await fetchAuth(`${API_BASE_URL}/posts`, {
            method: 'POST',
            body: JSON.stringify(postData)
        });

        document.getElementById('newPostForm').reset();
        document.getElementById('charCount').textContent = '0 / 250 caracteres';
        
        const successDiv = document.getElementById('success-message-post');
        if (successDiv) {
            successDiv.textContent = "Post creado exitosamente. Puede requerir aprobación.";
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }

        cargarPosts();

    } catch (error) {
        console.error('Error al crear post:', error);
        const errorDiv = document.getElementById('error-message-post');
        if (errorDiv) {
            errorDiv.textContent = error.message || "No se pudo crear el post.";
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Publicar';
    }
    return false;
}

function abrirModalEditar(postId, title, content) {
    currentEditPostId = postId;
    document.getElementById('edit-title').value = title || '';
    document.getElementById('edit-content').value = content || '';
    document.getElementById('modal-editar-post').style.display = 'block';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar-post').style.display = 'none';
    currentEditPostId = null;
}

async function submitEditarPost(event) {
    event.preventDefault();
    
    if (!currentEditPostId) return false;

    const title = document.getElementById('edit-title').value.trim() || null;
    const content = document.getElementById('edit-content').value.trim();

    if (!content) {
        alert('El contenido no puede estar vacío');
        return false;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/posts/${currentEditPostId}`, {
            method: 'PUT',
            body: JSON.stringify({ title, content })
        });

        alert('Post actualizado exitosamente');
        cerrarModalEditar();
        cargarPosts();

    } catch (error) {
        console.error('Error al actualizar post:', error);
        alert(error.message || 'No se pudo actualizar el post');
    }

    return false;
}

async function eliminarPost(postId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este post?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE'
        });

        alert('Post eliminado correctamente');
        cargarPosts();

    } catch (error) {
        console.error('Error al eliminar post:', error);
        alert(error.message || 'No se pudo eliminar el post');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    actualizarBotonAuth();
    cargarPosts();

    const createPostSection = document.getElementById('createPostSection');
    const userData = getUserData();
    if (createPostSection && userData) {
        createPostSection.style.display = 'block';
    }

    const contentTextarea = document.getElementById('newPostContent');
    const charCount = document.getElementById('charCount');
    if (contentTextarea && charCount) {
        contentTextarea.addEventListener('input', () => {
            charCount.textContent = `${contentTextarea.value.length} / 250 caracteres`;
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase();
                const posts = document.querySelectorAll('.post-card');

                posts.forEach(post => {
                    const text = post.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        post.style.display = 'block';
                    } else {
                        post.style.display = 'none';
                    }
                });
            }, 300);
        });
    }

    window.onclick = function(event) {
        const modalEditar = document.getElementById('modal-editar-post');
        const modalComentarios = document.getElementById('modal-comentarios');
        const modalReportar = document.getElementById('modal-reportar');
        
        if (event.target == modalEditar) {
            cerrarModalEditar();
        }
        if (event.target == modalComentarios) {
            cerrarModalComentarios();
        }
        if (event.target == modalReportar) {
            cerrarModalReportar();
        }
    }
});