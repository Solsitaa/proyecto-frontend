let currentPostIdForComments = null;

async function abrirModalComentarios(postId) {
    currentPostIdForComments = postId;
    
    if (modalComentarios) {
        modalComentarios.show();
    }

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
    if (modalComentarios) {
        modalComentarios.hide();
    }
    currentPostIdForComments = null;
}

async function cargarComentarios(postId) {
    const comentariosList = document.getElementById('comentarios-list');
    if (!comentariosList) return;

    comentariosList.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    let userData = null;
    try {
        userData = await getCurrentUserData();
    } catch (e) {
        console.log("No logueado, viendo comentarios como anónimo.");
    }


    try {
        const comentarios = await fetchAuth(`${API_BASE_URL}/posts/${postId}/comments`);

        comentariosList.innerHTML = '';

        if (!Array.isArray(comentarios)) {
            throw new Error("Formato de respuesta inesperado.");
        }


        if (comentarios.length === 0) {
            comentariosList.innerHTML = '<p class="text-center text-muted p-3">Aún no hay comentarios. ¡Sé el primero en comentar!</p>';
            return;
        }


        comentarios.forEach(comentario => {
            if (!comentario || typeof comentario !== 'object') return;

            const comentarioDiv = document.createElement('div');
            comentarioDiv.className = 'list-group-item';

            let statusBadge = '';
            if (comentario.status === 'PENDIENTE') {
                statusBadge = '<span class="badge bg-warning-subtle text-warning-emphasis rounded-pill ms-2">Pendiente</span>';
            }

            const isOwner = userData && userData.userName === comentario.userName;
            const canReport = userData && !isOwner;
            const votedClass = comentario.hasVoted ? 'voted' : '';
            const canVote = userData && !isOwner;

            const commentUserName = escapeHtml(comentario.userName || 'usuario');
            const fallbackSrc = `https://robohash.org/${commentUserName}?set=set4`;
            const avatarSrc = escapeHtml(comentario.userAvatarUrl || fallbackSrc); 

            comentarioDiv.innerHTML = `
                <div class="d-flex align-items-start gap-3">
                    <img src="${avatarSrc}" alt="avatar" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                    
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <strong class="text-primary">${commentUserName} <span class="karma-title">(${escapeHtml(comentario.userTitle || 'Usuario')})</span></strong>
                            ${statusBadge}
                        </div>
                        <p class="mb-1 mt-1">${escapeHtml(comentario.content || '')}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <small class="text-muted">${comentario.publicationDate ? new Date(comentario.publicationDate).toLocaleString() : ''}</small>
                            
                            <div class="d-flex align-items-center gap-2">
                                ${isOwner ? `
                                    <button class="btn btn-outline-danger btn-sm" style="--bs-btn-padding-y: .1rem; --bs-btn-padding-x: .3rem; --bs-btn-font-size: .75rem;" onclick="eliminarComentario(${comentario.id})">🗑️</button>
                                ` : ''}

                                ${canReport ? `
                                    <button class="btn btn-outline-danger btn-sm" style="--bs-btn-padding-y: .1rem; --bs-btn-padding-x: .3rem; --bs-btn-font-size: .75rem;" title="Reportar comentario" onclick="abrirModalReportar(${comentario.id}, '${commentUserName}', ${comentario.userId}, 'COMMENT')">🚩</button>
                                ` : ''}

                                ${canVote ? `
                                    <div class="vote-widget d-flex align-items-center gap-1">
                                        <button id="comment-vote-btn-${comentario.id}" class="upvote-btn ${votedClass}" style="width: 30px; height: 30px; font-size: 1rem;" onclick="handleCommentVote(this, ${comentario.id})">
                                            ▲
                                        </button>
                                        <span id="comment-vote-count-${comentario.id}" class="vote-count" style="font-size: 0.9rem;">${comentario.voteCount}</span>
                                    </div>
                                ` : `
                                    <div class="vote-widget d-flex align-items-center gap-1">
                                        <button class="upvote-btn" style="width: 30px; height: 30px; font-size: 1rem;" disabled>▲</button>
                                        <span class="vote-count" style="font-size: 0.9rem;">${comentario.voteCount}</span>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            if (comentario.status === 'APROBADO' || isOwner) {
                comentariosList.appendChild(comentarioDiv);
            }
        });

        if (comentariosList.innerHTML === '') {
            comentariosList.innerHTML = '<p class="text-center text-muted p-3">No hay comentarios visibles.</p>';
        }

    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        comentariosList.innerHTML = `<div class="alert alert-danger">Error al cargar los comentarios: ${error.message}</div>`;
    }
}

async function handleCommentVote(button, commentId) {
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
    const countSpan = document.getElementById(`comment-vote-count-${commentId}`);

    try {
        const voteResponse = await fetchAuth(`${API_BASE_URL}/comments/${commentId}/vote?type=LIKE`, {
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
        console.error('Error al votar en comentario:', error);
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