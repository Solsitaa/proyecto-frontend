const API_BASE_URL_FORO = 'http://localhost:8080/api';

let currentEditPostId = null;
let currentReportUserId = null;
let currentReportPostId = null;

let modalEditarPost = null;
let modalComentarios = null;
let modalReportar = null;


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

        await cargarTopUsers();

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
    const perfilLink = document.getElementById('perfilLink');
    const adminLink = document.getElementById('adminLink');
    
    const navUserAvatar = document.getElementById('navUserAvatar');
    const navUserName = document.getElementById('navUserName');
    
    const authButton = document.getElementById('authButton');
    const navDiv = authButton ? authButton.parentElement : null;
    let logoutLink = document.getElementById('logoutButtonForo');


    if (userData) {
        document.body.classList.add('logged-in');
        
        const avatarUrl = userData.avatarUrl || `https://robohash.org/${userData.userName}?set=set4`;
        if (navUserAvatar) {
            navUserAvatar.src = avatarUrl;
            navUserAvatar.onerror = function() {
                this.onerror = null;
                this.src = `https://robohash.org/${userData.userName}?set=set4`;
            }
        }
        if (navUserName) navUserName.textContent = userData.userName;
        
        if (adminLink && userData.rol === 'ADMINISTRADOR') {
            adminLink.style.display = 'inline';
        } else if (adminLink) {
            adminLink.style.display = 'none';
        }
        
        if (!logoutLink && navDiv) {
            logoutLink = document.createElement('button');
            logoutLink.id = 'logoutButtonForo';
            logoutLink.className = 'btn btn-outline-warning';
            logoutLink.textContent = 'Cerrar sesión';
            logoutLink.onclick = handleAuth;
            navDiv.appendChild(logoutLink);
        } else if (logoutLink) {
           logoutLink.style.display = 'inline-block';
        }

    } else {
        document.body.classList.remove('logged-in');
        if (adminLink) adminLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}


async function cargarPosts() {
    const postListDiv = document.getElementById('postList');
    if (!postListDiv) return;

    postListDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

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
            postListDiv.innerHTML = '<div class="alert alert-danger">Error: Formato inesperado de datos.</div>';
            return;
        }


        if (posts.length === 0) {
            postListDiv.innerHTML = '<p class="text-center text-muted">Aún no hay posts. ¡Sé el primero en crear uno!</p>';
            return;
        }


        posts.forEach(post => {
            if (!post || typeof post !== 'object') {
                console.warn("Elemento inválido en la lista de posts:", post);
                return;
            }

            const postCard = document.createElement('div');
            postCard.className = 'card shadow-sm border-0 mb-3';

            let statusBadge = '';
            if (post.status === 'PENDIENTE') {
                statusBadge = '<span class="badge bg-warning-subtle text-warning-emphasis rounded-pill ms-2">Pendiente</span>';
            } else if (post.status === 'RECHAZADO') {
                statusBadge = '<span class="badge bg-danger-subtle text-danger-emphasis rounded-pill ms-2">Rechazado</span>';
            }

            const isOwner = userData ? userData.userName === post.userName : false;
            const isAdmin = userData ? userData.rol === 'ADMINISTRADOR' : false;
            
            const canEdit = isOwner && post.status !== 'RECHAZADO';
            const canReport = (userData && !isOwner && !isAdmin);
            const canAdminDelete = isAdmin && !isOwner;

            const canVote = userData && !isOwner;
            const votedClass = post.hasVoted ? 'voted' : '';
            
            const postUserName = escapeHtml(post.userName || 'usuario');
            const fallbackSrc = `https://robohash.org/${postUserName}?set=set4`;
            const avatarSrc = escapeHtml(post.userAvatarUrl || fallbackSrc);

            let commentInfoHtml = '';
            if (post.commentCount > 0) {
                const commentText = post.commentCount === 1 ? '1 Comentario' : `${post.commentCount} Comentarios`;
                let lastCommentDateStr = '';
                if (post.lastCommentDate) {
                    lastCommentDateStr = ` (Último: ${new Date(post.lastCommentDate).toLocaleDateString()})`;
                }
                commentInfoHtml = `<span class="text-muted small" style="margin-left: 8px; margin-right: 8px;">${commentText}${lastCommentDateStr}</span>`;
            } else {
                commentInfoHtml = `<span class="text-muted small" style="margin-left: 8px; margin-right: 8px;">Sin comentarios</span>`;
            }

            postCard.innerHTML = `
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex align-items-center">
                            <img src="${avatarSrc}" alt="avatar" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                            <div class="ms-3">
                                <h2 class="h5 card-post-header mb-0">
                                    ${postUserName}
                                    <span class="karma-title">(${escapeHtml(post.userTitle || 'Usuario')})</span>
                                    ${statusBadge}
                                </h2>
                                ${post.title ? `<h3 class="h5 text-primary mt-1 mb-0">${escapeHtml(post.title)}</h3>` : ''}
                            </div>
                        </div>
                        ${canReport ? `<button class="btn btn-outline-danger btn-sm" onclick="abrirModalReportar(${post.idPost}, '${postUserName}', ${post.userId}, 'POST')">🚩 Reportar</button>` : ''}
                    </div>
                    
                    <p class="card-text my-3">${escapeHtml(post.content || '')}</p>
                    
                    <small class="text-muted d-block">Publicado: ${post.publicationDate ? new Date(post.publicationDate).toLocaleString() : 'Fecha desconocida'}</small>
                    ${post.updateDate && post.publicationDate && new Date(post.updateDate).getTime() !== new Date(post.publicationDate).getTime()
                        ? `<small class="text-muted d-block">Editado: ${new Date(post.updateDate).toLocaleString()}</small>`
                        : ''
                    }
                    
                    <hr>
                    <div class="d-flex gap-2 flex-wrap align-items-center">
                        ${canVote ? `
                            <div class="vote-widget d-flex align-items-center gap-2">
                                <button id="vote-btn-${post.idPost}" class="upvote-btn ${votedClass}" onclick="handleVote(this, ${post.idPost})">▲</button>
                                <span id="vote-count-${post.idPost}" class="vote-count">${post.voteCount}</span>
                            </div>
                        ` : `
                            <div class="vote-widget d-flex align-items-center gap-2">
                                <button class="upvote-btn" disabled>▲</button>
                                <span class="vote-count">${post.voteCount}</span>
                            </div>
                        `}

                        ${commentInfoHtml}
                        <button class="btn btn-outline-primary btn-sm" onclick="window.location.href='post.html?id=${post.idPost}'">Ver post completo</button>
                        ${canEdit ? `
                            <button class="btn btn-outline-primary btn-sm" onclick="abrirModalEditar(${post.idPost}, '${escapeHtml(post.title || '')}', '${escapeHtml(post.content || '')}')">✏️ Editar</button>
                            <button class="btn btn-outline-danger btn-sm" onclick="eliminarPost(${post.idPost})">🗑️ Eliminar</button>
                        ` : ''}
                        ${canAdminDelete ? `
                            <button class="btn btn-danger btn-sm" onclick="eliminarPost(${post.idPost})">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            `;

            if (post.status === 'APROBADO' || isOwner || isAdmin) {
                postListDiv.appendChild(postCard);
            }
        });

        if (postListDiv.innerHTML === '') {
            postListDiv.innerHTML = '<p class="text-center text-muted">No hay posts aprobados para mostrar, o tus posts están pendientes.</p>';
        }

    } catch (error) {
        console.error('Error al cargar posts:', error);
        if (error.message === 'AUTH_REQUIRED') {
             postListDiv.innerHTML = `<div class="alert alert-warning">Error al cargar posts: Tu sesión ha expirado. Por favor, inicia sesión.</div>`;
        } else {
             postListDiv.innerHTML = `<div class="alert alert-danger">Error al cargar los posts: ${error.message}</div>`;
        }
    }
}

async function cargarTopUsers() {
    const listContainer = document.getElementById('topUsersList');
    if (!listContainer) return;

    listContainer.innerHTML = '<li class="list-group-item text-muted small">Cargando...</li>';

    try {
        const response = await fetch(`${API_BASE_URL_FORO}/auth/top5`); 
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const topUsers = await response.json();

        if (!Array.isArray(topUsers) || topUsers.length === 0) {
            listContainer.innerHTML = '<li class="list-group-item text-muted small">Aún no hay usuarios destacados.</li>';
            return;
        }

        listContainer.innerHTML = '';

        topUsers.forEach(user => {
            const userElement = document.createElement('li');
            userElement.className = 'list-group-item d-flex align-items-center gap-2';
            
            const userName = escapeHtml(user.userName || 'usuario');
            const fallbackSrc = `https://robohash.org/${userName}?set=set4`;
            const avatarSrc = escapeHtml(user.avatarUrl || fallbackSrc);
            
            userElement.innerHTML = `
                <img src="${avatarSrc}" alt="avatar" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                <div>
                    <strong class="d-block">${userName} <span class="karma-title" style="font-size: 0.9rem; font-weight: normal;">(${escapeHtml(user.karmaTitle || 'Usuario')})</span></strong>
                    <small class="text-muted">
                        ${user.reputacion || 0} reconocimientos
                    </small>
                </div>
            `;
            listContainer.appendChild(userElement);
        });

    } catch (error) {
        console.error('Error al cargar top users:', error);
        listContainer.innerHTML = '<li class="list-group-item text-danger small">Error al cargar.</li>';
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

    if (modalEditarPost) {
        modalEditarPost.show();
    }
}

function cerrarModalEditar() {
    if (modalEditarPost) {
        modalEditarPost.hide();
    }
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

    modalEditarPost = new bootstrap.Modal(document.getElementById('modal-editar-post'));
    modalComentarios = new bootstrap.Modal(document.getElementById('modal-comentarios'));
    modalReportar = new bootstrap.Modal(document.getElementById('modal-reportar'));

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
                const posts = document.querySelectorAll('#postList .card');

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
});