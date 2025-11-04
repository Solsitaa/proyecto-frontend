document.addEventListener("DOMContentLoaded", async () => {
    onAuthStatusChecked((loggedIn, user) => {
        if (loggedIn) {
            loadMyPosts(user);
        } else {
            document.getElementById("myPostsList").innerHTML = "<p>Debes iniciar sesión para ver tus posts. Redirigiendo...</p>";
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        }
    });
});

async function loadMyPosts(user) {
    const container = document.getElementById("myPostsList");
    container.innerHTML = "<p>Cargando tus publicaciones...</p>";

    try {
        const posts = await fetchAuth(`${API_BASE_URL}/posts/user/${user.idUser}`);
        
        if (!posts.length) {
            container.innerHTML = "<p>No tienes publicaciones aún.</p>";
            return;
        }

        container.innerHTML = "";

        posts.forEach(post => {
            const card = document.createElement("div");
            card.className = "card shadow-sm border-0 mb-4";
            
            let statusBadge = '';
            if (post.status === 'PENDIENTE') {
                statusBadge = `<span class="badge bg-warning-subtle text-warning-emphasis rounded-pill ms-2">${post.status}</span>`;
            } else if (post.status === 'RECHAZADO') {
                statusBadge = `<span class="badge bg-danger-subtle text-danger-emphasis rounded-pill ms-2">${post.status}</span>`;
            } else {
                 statusBadge = `<span class="badge bg-success-subtle text-success-emphasis rounded-pill ms-2">${post.status}</span>`;
            }

            const safeTitle = (post.title || '').replace(/'/g, "\\'");
            const safeContent = (post.content || '').replace(/'/g, "\\'");

            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${post.title || "Sin título"} ${statusBadge}</h5>
                    <p class="card-text">${post.content}</p>
                    <small class="text-muted">Publicado: ${new Date(post.publicationDate).toLocaleString()}</small>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary" onclick="abrirModalEditar(${post.idPost}, '${safeTitle}', '${safeContent}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarPost(${post.idPost})">Eliminar</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-danger">Error al cargar tus posts.</p>`;
    }
}

function abrirModalEditar(postId, title, content) {
    const modal = new bootstrap.Modal(document.getElementById("modal-editar-post"));
    document.getElementById("edit-title").value = title || '';
    document.getElementById("edit-content").value = content || '';
    
    document.getElementById("form-editar-post").onsubmit = async (e) => {
        e.preventDefault();
        await submitEditarPost(postId);
        modal.hide();
    };
    modal.show();
}

async function submitEditarPost(postId) {
    const title = document.getElementById("edit-title").value.trim();
    const content = document.getElementById("edit-content").value.trim();

    if (!content) return showToast("El contenido no puede estar vacío.");

    try {
        await fetchAuth(`${API_BASE_URL}/posts/${postId}`, {
            method: "PUT",
            body: JSON.stringify({ title, content })
        });
        showToast("Post actualizado correctamente. Puede requerir re-aprobación.", "success");
        const user = await getCurrentUserData();
        loadMyPosts(user);
    } catch (error) {
        console.error(error);
        showToast("Error al actualizar el post.");
    }
}

async function eliminarPost(postId) {
    if (!confirm("¿Seguro quieres eliminar este post?")) return;
    try {
        await fetchAuth(`${API_BASE_URL}/posts/${postId}`, { method: "DELETE" });
        showToast("Post eliminado correctamente.", "success");
        const user = await getCurrentUserData();
        loadMyPosts(user);
    } catch (error) {
        console.error(error);
        showToast("Error al eliminar el post.");
    }
}