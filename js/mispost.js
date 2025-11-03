document.addEventListener("DOMContentLoaded", async () => {
    const user = await getCurrentUserData();
    if (!user) {
        document.getElementById("myPostsList").innerHTML = "<p>Debes iniciar sesión para ver tus posts.</p>";
        return;
    }

    loadMyPosts(user);
});

async function loadMyPosts(user) {
    const container = document.getElementById("myPostsList");
    container.innerHTML = "<p>Cargando tus publicaciones...</p>";

    try {
        const posts = await fetchAuth(`${API_BASE_URL}/posts?userId=${user.id}`);
        
        if (!posts.length) {
            container.innerHTML = "<p>No tienes publicaciones aún.</p>";
            return;
        }

        container.innerHTML = "";

        posts.forEach(post => {
            const card = document.createElement("div");
            card.className = "card shadow-sm border-0 mb-4";
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${post.title || "Sin título"}</h5>
                    <p class="card-text">${post.content}</p>
                    <small class="text-muted">Publicado: ${new Date(post.publicationDate).toLocaleString()}</small>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary" onclick="abrirModalEditar(${post.id}, '${encodeURIComponent(post.title)}', '${encodeURIComponent(post.content)}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarPost(${post.id})">Eliminar</button>
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
    document.getElementById("edit-title").value = decodeURIComponent(title);
    document.getElementById("edit-content").value = decodeURIComponent(content);
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

    if (!content) return alert("El contenido no puede estar vacío.");

    try {
        await fetchAuth(`${API_BASE_URL}/posts/${postId}`, {
            method: "PUT",
            body: JSON.stringify({ title, content })
        });
        showSuccess("Post actualizado correctamente.");
        const user = await getCurrentUserData();
        loadMyPosts(user);
    } catch (error) {
        console.error(error);
        showError("Error al actualizar el post.");
    }
}

async function eliminarPost(postId) {
    if (!confirm("¿Seguro quieres eliminar este post?")) return;
    try {
        await fetchAuth(`${API_BASE_URL}/posts/${postId}`, { method: "DELETE" });
        showSuccess("Post eliminado correctamente.");
        const user = await getCurrentUserData();
        loadMyPosts(user);
    } catch (error) {
        console.error(error);
        showError("Error al eliminar el post.");
    }
}