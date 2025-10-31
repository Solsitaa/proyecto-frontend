const API_BASE_URL_FORO = 'http://localhost:8080/api';

let currentEditPostId = null;
let currentReportUserId = null;
let currentReportPostId = null;

async function handleVote(button, postId) {
    let userData;
    try {
        userData = await getCurrentUserData();
        if (!userData) {
            alert('Debes iniciar sesión para votar.');
            return;
        }
    } catch (authError) {
        alert('Debes iniciar sesión para votar.');
        return;
    }

    button.disabled = true;
    const countSpan = document.getElementById(`vote-count-${postId}`);

    try {
        const voteResponse = await fetchAuth(`${API_BASE_URL_FORO}/posts/${postId}/vote?type=LIKE`, {
            method: 'POST'
        });

        if (countSpan) {
            countSpan.textContent = voteResponse.newCount;
        }
        
        if (voteResponse.voted) {
            button.classList.add('voted');
        } else {
            button.classList.remove('voted');
        }

    } catch (error) {
        console.error('Error al votar:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo registrar el voto.');
        }
    } finally {
        if(button) {
            button.disabled = false;
        }
    }
}


async function handleAuth() {
    const userData = await getCurrentUserData();
    if (userData) {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    } else {
        window.location.href = 'login.html';
    }
}

function actualizarElementosUIAuth(userData) {
    const authButton = document.getElementById('authButton');
    const perfilLink = document.getElementById('perfilLink');
    const adminLink = document.getElementById('adminLink');
    const createPostSection = document.getElementById('createPostSection');

    if (authButton) {
        if (userData) {
            authButton.textContent = 'Cerrar sesión';
            if (perfilLink) perfilLink.style.display = 'inline';
            if (adminLink && userData.rol === 'ADMINISTRADOR') {
                adminLink.style.display = 'inline';
            } else if (adminLink) {
                adminLink.style.display = 'none';
            }
            if (createPostSection) createPostSection.style.display = 'block';

        } else {
            authButton.textContent = 'Iniciar sesión';
            if (perfilLink) perfilLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
            if (createPostSection) createPostSection.style.display = 'none';
        }
    }
}


async function cargarPosts() {
    const postListDiv = document.getElementById('postList');
    if (!postListDiv) return;

    postListDiv.innerHTML = '<p>Cargando posts...</p>';

    let userData = null;
    try {
        userData = await getCurrentUserData();
    } catch (e) {
        console.log("Error al obtener datos de usuario para cargar posts, continuando como anónimo.");
    }


    try {
        const posts = await fetchAuth(`${API_BASE_URL_FORO}/posts`);
        postListDiv.innerHTML = '';

        if (!Array.isArray(posts)) {
            console.error("La respuesta de /posts no es un array:", posts);
            postListDiv.innerHTML = '<p style="color: red;">Error: Formato inesperado de datos.</p>';
            return;
        }


        if (posts.length === 0) {
            postListDiv.innerHTML = '<p>Aún no hay posts. ¡Sé el primero en crear uno!</p>';
            return;
        }


        posts.forEach(post => {
            if (!post || typeof post !== 'object') {
                console.warn("Elemento inválido en la lista de posts:", post);
                return;
            }

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
            const canReport = userData && !isOwner;

            const canVote = userData && !isOwner;
            const votedClass = post.hasVoted ? 'voted' : '';

            postCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h2>${escapeHtml(post.userName || 'Anónimo')} <span style="font-size: 0.9rem; color: #555;">(${escapeHtml(post.userTitle || 'Usuario')})</span>${statusBadge}</h2>
                        ${post.title ? `<h3 style="color: #3c4fff; margin: 10px 0;">${escapeHtml(post.title)}</h3>` : ''}
                    </div>
                    ${canReport ? `<button class="btn-report" onclick="abrirModalReportar(${post.idPost}, '${escapeHtml(post.userName || '')}', ${post.userId})">🚩 Reportar</button>` : ''}
                </div>
                <p>${escapeHtml(post.content || '')}</p>
                <p style="font-size: 0.8rem; color: #888;">Publicado: ${post.publicationDate ? new Date(post.publicationDate).toLocaleString() : 'Fecha desconocida'}</p>
                ${post.updateDate && post.publicationDate && new Date(post.updateDate).getTime() !== new Date(post.publicationDate).getTime()
                    ? `<p style="font-size: 0.8rem; color: #888;">Editado: ${new Date(post.updateDate).toLocaleString()}</p>`
                    : ''
                }
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; align-items: center;">
                    
                    ${canVote ? `
                        <div class="vote-widget">
                            <button id="vote-btn-${post.idPost}" class="upvote-btn ${votedClass}" onclick="handleVote(this, ${post.idPost})">
                                ▲
                            </button>
                            <span id="vote-count-${post.idPost}" class="vote-count">${post.voteCount}</span>
                        </div>
                    ` : `
                        <div class="vote-widget">
                            <button class="upvote-btn" disabled>▲</button>
                            <span class="vote-count">${post.voteCount}</span>
                        </div>
                    `}

                    <button class="btn-secondary" onclick="abrirModalComentarios(${post.idPost})">💬 Comentarios</button>
                    ${canEdit ? `
                        <button class="btn-primary" onclick="abrirModalEditar(${post.idPost}, '${escapeHtml(post.title || '')}', '${escapeHtml(post.content || '')}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarPost(${post.idPost})">🗑️ Eliminar</button>
                    ` : ''}
                </div>
            `;

            if (post.status === 'APROBADO' || isOwner) {
                postListDiv.appendChild(postCard);
            }
        });

        if (postListDiv.innerHTML === '') {
            postListDiv.innerHTML = '<p>No hay posts aprobados para mostrar, o tus posts están pendientes.</p>';
        }

    } catch (error) {
        console.error('Error al cargar posts:', error);
        if (error.message === 'AUTH_REQUIRED') {
             postListDiv.innerHTML = `<p style="color: red;">Error al cargar posts: Tu sesión ha expirado. Por favor, inicia sesión.</p>`;
        } else {
             postListDiv.innerHTML = `<p style="color: red;">Error al cargar los posts: ${error.message}</p>`;
        }
    }
}

async function cargarTopUsers() {
    const listContainer = document.getElementById('topUsersList');
    if (!listContainer) return;

    listContainer.innerHTML = '<p style="font-size: 0.9rem; color: #666;">Cargando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL_FORO}/auth/top5`); 
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const topUsers = await response.json();

        if (!Array.isArray(topUsers) || topUsers.length === 0) {
            listContainer.innerHTML = '<p style="font-size: 0.9rem; color: #666;">Aún no hay usuarios destacados.</p>';
            return;
        }

        listContainer.innerHTML = '';

        topUsers.forEach(user => {
            const userElement = document.createElement('li');
            userElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 2rem;">👤</span>
                    <div>
                        <strong>${escapeHtml(user.userName || 'Usuario')}</strong>
                        <p style="font-size: 0.85rem; color: #666; margin: 0;">
                            ${user.reputacion || 0} reconocimientos
                        </p>
                    </div>
                </div>
            `;
            listContainer.appendChild(userElement);
        });

    } catch (error) {
        console.error('Error al cargar top users:', error);
        listContainer.innerHTML = '<p style="font-size: 0.9rem; color: red;">Error al cargar.</p>';
    }
}

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


async function handleCrearPost(event) {
    event.preventDefault();
    let userData;
    try {
        userData = await getCurrentUserData();
        if (!userData) {
            alert("Debes iniciar sesión para crear un post.");
            window.location.href = 'login.html';
            return false;
        }
    } catch(authError) {
        alert("Error al verificar sesión. Por favor, inicia sesión de nuevo.");
        window.location.href = 'login.html';
        return false;
    }


    const contentInput = document.getElementById('newPostContent');
    const titleInput = document.getElementById('newPostTitle');
    const content = contentInput ? contentInput.value.trim() : '';
    const title = titleInput ? titleInput.value.trim() : null;

    if (!content) {
        alert("El contenido del post no puede estar vacío.");
        return false;
    }

    const postData = {
        content: content,
        title: title || undefined
    };

    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Publicando...';
    }


    try {
        await fetchAuth(`${API_BASE_URL_FORO}/posts`, {
            method: 'POST',
            body: JSON.stringify(postData)
        });

        const form = document.getElementById('newPostForm');
        if (form) form.reset();
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0 / 250 caracteres';

        const successDiv = document.getElementById('success-message-post');
        if (successDiv) {
            successDiv.textContent = "Post creado exitosamente. Puede requerir aprobación.";
            successDiv.style.display = 'block';
            setTimeout(() => {
                if (successDiv) successDiv.style.display = 'none';
            }, 3000);
        }

        await cargarPosts();

    } catch (error) {
        console.error('Error al crear post:', error);
        const errorDiv = document.getElementById('error-message-post');
        if (errorDiv) {
            if (error.message === 'AUTH_REQUIRED') {
                errorDiv.textContent = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
                window.location.href = 'login.html';
            } else {
                errorDiv.textContent = error.message || "No se pudo crear el post.";
            }
            errorDiv.style.display = 'block';
            setTimeout(() => {
                if (errorDiv) errorDiv.style.display = 'none';
            }, 5000);
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Publicar';
        }
    }
    return false;
}

function abrirModalEditar(postId, title, content) {
    currentEditPostId = postId;
    const editTitle = document.getElementById('edit-title');
    const editContent = document.getElementById('edit-content');
    if (editTitle) editTitle.value = title || '';
    if (editContent) editContent.value = content || '';

    const modal = document.getElementById('modal-editar-post');
    if (modal) modal.style.display = 'block';
}

function cerrarModalEditar() {
    const modal = document.getElementById('modal-editar-post');
    if (modal) modal.style.display = 'none';
    currentEditPostId = null;
}

async function submitEditarPost(event) {
    event.preventDefault();

    if (!currentEditPostId) return false;

    const titleInput = document.getElementById('edit-title');
    const contentInput = document.getElementById('edit-content');
    const title = titleInput ? titleInput.value.trim() : null;
    const content = contentInput ? contentInput.value.trim() : '';


    if (!content) {
        alert('El contenido no puede estar vacío');
        return false;
    }

    try {
        await fetchAuth(`${API_BASE_URL_FORO}/posts/${currentEditPostId}`, {
            method: 'PUT',
            body: JSON.stringify({ title: title || undefined, content })
        });

        alert('Post actualizado exitosamente. Puede requerir re-aprobación.');
        cerrarModalEditar();
        await cargarPosts();

    } catch (error) {
        console.error('Error al actualizar post:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo actualizar el post');
        }
    }

    return false;
}

async function eliminarPost(postId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este post?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL_FORO}/posts/${postId}`, {
            method: 'DELETE'
        });

        alert('Post eliminado correctamente');
        await cargarPosts();

    } catch (error) {
        console.error('Error al eliminar post:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo eliminar el post');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    onAuthStatusChecked((loggedIn, userData) => {
        actualizarElementosUIAuth(userData);

    });

    cargarPosts();
    cargarTopUsers();

    const contentTextarea = document.getElementById('newPostContent');
    const charCount = document.getElementById('charCount');
    if (contentTextarea && charCount) {
        contentTextarea.addEventListener('input', () => {
            const length = contentTextarea.value.length;
            charCount.textContent = `${length} / 250 caracteres`;
            if (length > 250) {
                contentTextarea.value = contentTextarea.value.substring(0, 250);
                charCount.textContent = `250 / 250 caracteres`;
            }
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                const posts = document.querySelectorAll('#postList .post-card');

                posts.forEach(post => {
                    if (!searchTerm) {
                        post.style.display = 'block';
                        return;
                    }
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