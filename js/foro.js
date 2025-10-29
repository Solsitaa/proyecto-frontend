const API_BASE_URL = 'http://localhost:8080/api';

async function darReconocimiento(button, postId) {
    const token = getToken();
    if (!token) {
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
        showError(error.message || 'No se pudo registrar el voto.');
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
    const userData = getUserData();

    if (authButton) {
        if (userData) {
            authButton.textContent = 'Cerrar sesión';
            if (perfilLink) perfilLink.style.display = 'inline';
        } else {
            authButton.textContent = 'Iniciar sesión';
             if (perfilLink) perfilLink.style.display = 'none';
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

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            // Solo muestra el estado si es PENDIENTE o RECHAZADO, opcionalmente
            let statusBadge = '';
            if (post.status === 'PENDIENTE') {
                statusBadge = '<span style="font-size: 0.8rem; background-color: #ffecb3; color: #6d4c41; padding: 2px 5px; border-radius: 3px; margin-left: 10px;">Pendiente</span>';
            } else if (post.status === 'RECHAZADO') {
                 statusBadge = '<span style="font-size: 0.8rem; background-color: #ffcdd2; color: #b71c1c; padding: 2px 5px; border-radius: 3px; margin-left: 10px;">Rechazado</span>';
            }

            postCard.innerHTML = `
                <h2>${post.userName} <span style="font-size: 0.9rem; color: #555;">(${post.userTitle || 'Usuario'})</span>${statusBadge}</h2>
                <p>${post.content}</p>
                <p style="font-size: 0.8rem; color: #888;">Publicado: ${new Date(post.publicationDate).toLocaleString()}</p>
                ${post.updateDate && new Date(post.updateDate).getTime() !== new Date(post.publicationDate).getTime()
                    ? `<p style="font-size: 0.8rem; color: #888;">Editado: ${new Date(post.updateDate).toLocaleString()}</p>`
                    : ''
                }
                <button class="reputacion" onclick="darReconocimiento(this, ${post.idPost})">👍 Dar Reconocimiento</button>
            `;
            // Solo añadir posts APROBADOS a la lista visible por defecto
            // O ajustar la lógica si quieres mostrar PENDIENTES al propio usuario o admin
            if (post.status === 'APROBADO') {
                postListDiv.appendChild(postCard);
            } else if (getUserData()?.userName === post.userName) { // Muestra propios posts pendientes
                postListDiv.appendChild(postCard);
            }
            // Podrías añadir lógica para roles ADMIN aquí
        });

        
        if (postListDiv.innerHTML === '') {
            postListDiv.innerHTML = '<p>No hay posts aprobados para mostrar.</p>';
        }


    } catch (error) {
        console.error('Error al cargar posts:', error);
        postListDiv.innerHTML = `<p style="color: red;">Error al cargar los posts: ${error.message}</p>`;
    }
}


async function handleCrearPost(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) {
        showError("Debes iniciar sesión para crear un post.");
        return false;
    }

    const content = document.getElementById('newPostContent').value.trim();
    if (!content) {
        showError("El contenido del post no puede estar vacío.");
        return false;
    }

    const postData = { content: content };
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Publicando...';


    try {
        const nuevoPost = await fetchAuth(`${API_BASE_URL}/posts`, {
            method: 'POST',
            body: JSON.stringify(postData)
        });

        document.getElementById('newPostForm').reset();
        showSuccess("Post creado exitosamente. Puede requerir aprobación.");
        cargarPosts();

    } catch (error) {
        console.error('Error al crear post:', error);
        showError(error.message || "No se pudo crear el post.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Publicar';
    }
    return false;
}


window.addEventListener('DOMContentLoaded', () => {
    actualizarBotonAuth();
    cargarPosts();

    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
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
        });
    }

    const newPostForm = document.getElementById('newPostForm');
    if (newPostForm) {
        newPostForm.addEventListener('submit', handleCrearPost);
    }

});