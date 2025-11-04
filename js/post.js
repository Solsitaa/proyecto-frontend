const postContainer = document.getElementById('postContainer');
const commentsContainer = document.getElementById('comentarios-list');
const commentForm = document.getElementById('commentFormContainer');
const commentBtn = document.getElementById('commentSubmitBtn');
const postId = new URLSearchParams(window.location.search).get('id');

if (!postId) {
  postContainer.innerHTML = '<div class="alert alert-danger text-center">Post no encontrado.</div>';
}

async function cargarPostCompleto() {
  try {
    const post = await fetchAuth(`${API_BASE_URL}/posts/${postId}`);
    renderPost(post);
    await cargarComentarios(postId);
  } catch (err) {
    console.error('Error al cargar post:', err);
    postContainer.innerHTML = `<div class="alert alert-danger">Error al cargar la publicación: ${err.message}</div>`;
  }
}

function renderPost(post) {
  const avatarUrl = post.userAvatarUrl || `https://robohash.org/${post.userName}?set=set4`;
  const postHtml = `
    <div class="card shadow-sm border-0">
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          <img src="${avatarUrl}" class="rounded-circle me-3" width="50" height="50" onerror="this.src='https://robohash.org/${post.userName}?set=set4'">
          <div>
            <strong class="d-block text-primary">${escapeHtml(post.userName)}</strong>
            <small class="text-muted">${new Date(post.publicationDate).toLocaleString()}</small>
          </div>
        </div>
        ${post.title ? `<h2 class="h4 text-dark mb-3">${escapeHtml(post.title)}</h2>` : ''}
        <p class="lead">${escapeHtml(post.content)}</p>

        <div class="d-flex justify-content-between align-items-center mt-4">
          <div class="d-flex align-items-center gap-2">
            <button id="vote-btn-${post.idPost}" class="upvote-btn ${post.hasVoted ? 'voted' : ''}" onclick="handleVote(this, ${post.idPost})">▲</button>
            <span id="vote-count-${post.idPost}" class="vote-count">${post.voteCount}</span>
          </div>
          <button class="btn btn-outline-secondary btn-sm" onclick="window.location.href='foro.html'">Volver al foro</button>
        </div>
      </div>
    </div>
  `;
  postContainer.innerHTML = postHtml;
}

async function handleVote(button, postId) {
    let userData;
    try {
        userData = await getCurrentUserData();
        if (!userData) {
            showToast('Debes iniciar sesión para votar.');
            return;
        }
    } catch (authError) {
        showToast('Debes iniciar sesión para votar.');
        return;
    }

    button.disabled = true;
    const countSpan = document.getElementById(`vote-count-${postId}`);

    try {
        const voteResponse = await fetchAuth(`${API_BASE_URL}/posts/${postId}/vote?type=LIKE`, {
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
            showToast('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            showToast(error.message || 'No se pudo registrar el voto.');
        }
    } finally {
        if(button) {
            button.disabled = false;
        }
    }
}

async function handleCommentSubmission() {
  const textarea = document.getElementById('nuevo-comentario');
  const content = textarea?.value.trim();
  if (!content) {
    showToast('El comentario no puede estar vacío.');
    return;
  }
  try {
    await fetchAuth(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    textarea.value = '';
    await cargarComentarios(postId);
  } catch (error) {
    console.error('Error al crear comentario:', error);
    showToast(error.message || 'No se pudo crear el comentario.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStatusChecked((loggedIn, userData) => {
        if (loggedIn) {
            commentForm.style.display = 'block';
            commentBtn.onclick = handleCommentSubmission;
        } else {
            commentForm.style.display = 'none';
        }
        cargarPostCompleto();
    });
});