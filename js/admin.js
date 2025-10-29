const API_BASE_URL = 'http://localhost:8080/api';

let currentReportId = null;

function verificarAccesoAdmin() {
    const userData = getUserData();
    if (!userData || userData.rol !== 'ADMINISTRADOR') {
        alert('Acceso denegado. Solo administradores pueden ver esta página.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function cambiarTab(tabName) {
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.style.display = 'none');

    const allButtons = document.querySelectorAll('.tab-button');
    allButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');

    if (tabName === 'stats') cargarEstadisticas();
    if (tabName === 'posts') cargarPostsPendientes();
    if (tabName === 'users') cargarUsuarios();
    if (tabName === 'reports') cargarReportes();
}

async function cargarEstadisticas() {
    try {
        const stats = await fetchAuth(`${API_BASE_URL}/admin/stats`);

        document.getElementById('stat-total-users').textContent = stats.totalUsers;
        document.getElementById('stat-active-users').textContent = stats.activeUsers;
        document.getElementById('stat-blocked-users').textContent = stats.blockedUsers;
        document.getElementById('stat-total-posts').textContent = stats.totalPosts;
        document.getElementById('stat-pending-posts').textContent = stats.pendingPosts;
        document.getElementById('stat-approved-posts').textContent = stats.approvedPosts;

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        alert('Error al cargar estadísticas');
    }
}

async function cargarPostsPendientes() {
    const container = document.getElementById('pending-posts-list');
    container.innerHTML = '<p>Cargando posts pendientes...</p>';

    try {
        const posts = await fetchAuth(`${API_BASE_URL}/admin/moderation/posts`);

        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p>No hay posts pendientes de moderación.</p>';
            return;
        }

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'admin-post-card';
            postCard.style.cssText = 'background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            postCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="color: #3c4fff; margin-bottom: 10px;">Autor: ${post.author}</h3>
                        <p style="color: #333; margin-bottom: 10px;">${post.content}</p>
                        <small style="color: #888;">Fecha: ${new Date(post.publicationDate).toLocaleString()}</small>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="aprobarPost(${post.id})">✓ Aprobar</button>
                        <button class="btn-danger" onclick="eliminarPostAdmin(${post.id})">✗ Eliminar</button>
                    </div>
                </div>
            `;

            container.appendChild(postCard);
        });

    } catch (error) {
        console.error('Error al cargar posts pendientes:', error);
        container.innerHTML = '<p style="color: red;">Error al cargar posts pendientes</p>';
    }
}

async function aprobarPost(postId) {
    try {
        await fetchAuth(`${API_BASE_URL}/admin/posts/${postId}/approve`, {
            method: 'PUT'
        });

        alert('Post aprobado exitosamente');
        cargarPostsPendientes();

    } catch (error) {
        console.error('Error al aprobar post:', error);
        alert(error.message || 'No se pudo aprobar el post');
    }
}

async function eliminarPostAdmin(postId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este post?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/admin/posts/${postId}`, {
            method: 'DELETE'
        });

        alert('Post eliminado exitosamente');
        cargarPostsPendientes();

    } catch (error) {
        console.error('Error al eliminar post:', error);
        alert(error.message || 'No se pudo eliminar el post');
    }
}

async function cargarUsuarios() {
    const container = document.getElementById('users-list');
    container.innerHTML = '<p>Cargando usuarios...</p>';

    try {
        const users = await fetchAuth(`${API_BASE_URL}/admin/users`);

        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = '<p>No hay usuarios registrados.</p>';
            return;
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'admin-user-card';
            userCard.style.cssText = 'background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            const statusBadge = user.active 
                ? '<span style="background: #4caf50; color: white; padding: 3px 8px; border-radius: 5px; font-size: 0.8rem;">Activo</span>'
                : '<span style="background: #f44336; color: white; padding: 3px 8px; border-radius: 5px; font-size: 0.8rem;">Bloqueado</span>';

            const isAdmin = user.role === 'ADMINISTRADOR';

            userCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="color: #3c4fff; margin-bottom: 5px;">${user.userName} ${statusBadge}</h3>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 5px 0;"><strong>Rol:</strong> ${user.role}</p>
                        <small style="color: #888;">Registro: ${new Date(user.registerDate).toLocaleDateString()}</small>
                    </div>
                    ${!isAdmin ? `
                        <div style="display: flex; gap: 10px; flex-direction: column;">
                            ${user.active 
                                ? `<button class="btn-danger" onclick="bloquearUsuario(${user.id})">🚫 Bloquear</button>`
                                : `<button class="btn-primary" onclick="desbloquearUsuario(${user.id})">✓ Desbloquear</button>`
                            }
                            <button class="btn-secondary" onclick="verPostsUsuario(${user.id}, '${user.userName}')">📝 Ver Posts</button>
                            <button class="btn-danger" onclick="eliminarUsuario(${user.id})">🗑️ Eliminar</button>
                        </div>
                    ` : '<p style="color: #888; font-style: italic;">Administrador</p>'}
                </div>
            `;

            container.appendChild(userCard);
        });

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        container.innerHTML = '<p style="color: red;">Error al cargar usuarios</p>';
    }
}

async function bloquearUsuario(userId) {
    if (!confirm('¿Estás seguro de que deseas bloquear este usuario?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/admin/users/${userId}/block`, {
            method: 'PUT'
        });

        alert('Usuario bloqueado exitosamente');
        cargarUsuarios();

    } catch (error) {
        console.error('Error al bloquear usuario:', error);
        alert(error.message || 'No se pudo bloquear el usuario');
    }
}

async function desbloquearUsuario(userId) {
    try {
        await fetchAuth(`${API_BASE_URL}/admin/users/${userId}/unblock`, {
            method: 'PUT'
        });

        alert('Usuario desbloqueado exitosamente');
        cargarUsuarios();

    } catch (error) {
        console.error('Error al desbloquear usuario:', error);
        alert(error.message || 'No se pudo desbloquear el usuario');
    }
}

async function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE este usuario y todo su contenido?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE'
        });

        alert('Usuario eliminado exitosamente');
        cargarUsuarios();

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert(error.message || 'No se pudo eliminar el usuario');
    }
}

async function verPostsUsuario(userId, userName) {
    try {
        const posts = await fetchAuth(`${API_BASE_URL}/admin/users/${userId}/posts`);

        const container = document.getElementById('users-list');
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <button class="btn-secondary" onclick="cargarUsuarios()">← Volver a la lista</button>
                <h3 style="margin-top: 15px;">Posts de ${userName}</h3>
            </div>
        `;

        if (posts.length === 0) {
            container.innerHTML += '<p>Este usuario no tiene posts.</p>';
            return;
        }

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.style.cssText = 'background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            postCard.innerHTML = `
                <p><strong>Estado:</strong> ${post.status}</p>
                <p>${post.content}</p>
                <small style="color: #888;">${new Date(post.publicationDate).toLocaleString()}</small>
            `;

            container.appendChild(postCard);
        });

    } catch (error) {
        console.error('Error al cargar posts del usuario:', error);
        alert('Error al cargar posts del usuario');
    }
}

async function cargarReportes() {
    const container = document.getElementById('reports-list');
    container.innerHTML = '<p>Cargando reportes...</p>';

    try {
        const reports = await fetchAuth(`${API_BASE_URL}/admin/reports/pending`);

        container.innerHTML = '';

        if (reports.length === 0) {
            container.innerHTML = '<p>No hay reportes pendientes.</p>';
            return;
        }

        reports.forEach(report => {
            const reportCard = document.createElement('div');
            reportCard.style.cssText = 'background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            reportCard.innerHTML = `
                <h3 style="color: #e91e63; margin-bottom: 10px;">🚩 Reporte #${report.id}</h3>
                <p><strong>Reportado por:</strong> ${report.reporterUsername}</p>
                <p><strong>Usuario reportado:</strong> ${report.reportedUsername}</p>
                <p><strong>Motivo:</strong> ${report.reason}</p>
                <p><strong>Descripción:</strong> ${report.description || 'Sin descripción'}</p>
                ${report.relatedPostId ? `<p><strong>Post relacionado ID:</strong> ${report.relatedPostId}</p>` : ''}
                <small style="color: #888;">Fecha: ${new Date(report.createdAt).toLocaleString()}</small>
                <div style="margin-top: 15px;">
                    <button class="btn-primary" onclick="abrirModalResolverReporte(${report.id})">Resolver Reporte</button>
                </div>
            `;

            container.appendChild(reportCard);
        });

    } catch (error) {
        console.error('Error al cargar reportes:', error);
        container.innerHTML = '<p style="color: red;">Error al cargar reportes</p>';
    }
}

function abrirModalResolverReporte(reportId) {
    currentReportId = reportId;
    document.getElementById('modal-resolve-report').style.display = 'block';
}

function cerrarModalResolverReporte() {
    document.getElementById('modal-resolve-report').style.display = 'none';
    document.getElementById('form-resolve-report').reset();
    document.getElementById('penalty-group').style.display = 'none';
    currentReportId = null;
}

document.getElementById('resolve-status')?.addEventListener('change', function() {
    const penaltyGroup = document.getElementById('penalty-group');
    if (this.value === 'RESUELTO_CON_PENALIZACION') {
        penaltyGroup.style.display = 'block';
    } else {
        penaltyGroup.style.display = 'none';
    }
});

async function submitResolverReporte(event) {
    event.preventDefault();

    if (!currentReportId) return false;

    const status = document.getElementById('resolve-status').value;
    const penalty = status === 'RESUELTO_CON_PENALIZACION' 
        ? parseFloat(document.getElementById('karma-penalty').value) 
        : 0;

    const resolutionData = {
        finalStatus: status,
        karmaPenalty: penalty
    };

    try {
        await fetchAuth(`${API_BASE_URL}/admin/reports/${currentReportId}/resolve`, {
            method: 'PUT',
            body: JSON.stringify(resolutionData)
        });

        alert('Reporte resuelto exitosamente');
        cerrarModalResolverReporte();
        cargarReportes();

    } catch (error) {
        console.error('Error al resolver reporte:', error);
        alert(error.message || 'No se pudo resolver el reporte');
    }

    return false;
}

window.addEventListener('DOMContentLoaded', () => {
    if (verificarAccesoAdmin()) {
        cargarEstadisticas();
    }

    window.onclick = function(event) {
        const modal = document.getElementById('modal-resolve-report');
        if (event.target == modal) {
            cerrarModalResolverReporte();
        }
    }
});