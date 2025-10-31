const API_BASE_URL_ADMIN = 'http://localhost:8080/api';

let currentReportIdAdmin = null;

async function verificarAccesoAdmin() {
    let userData = null;
    try {
        userData = await getCurrentUserData();
        if (!userData || userData.rol !== 'ADMINISTRADOR') {
            alert('Acceso denegado. Solo administradores pueden ver esta página.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    } catch (e) {
        alert('Error al verificar sesión de administrador.');
        window.location.href = 'index.html';
        return false;
    }
}

function cambiarTab(tabName) {
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.style.display = 'none');

    const allButtons = document.querySelectorAll('.tab-button');
    allButtons.forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.style.display = 'block';

    const activeButton = event.target;
    if (activeButton) activeButton.classList.add('active');


    if (tabName === 'stats') cargarEstadisticas();
    if (tabName === 'posts') cargarPostsPendientes();
    if (tabName === 'users') cargarUsuarios();
    if (tabName === 'reports') cargarReportes();
}

async function cargarEstadisticas() {
    try {
        const stats = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/stats`);

        const statTotalUsers = document.getElementById('stat-total-users');
        const statActiveUsers = document.getElementById('stat-active-users');
        const statBlockedUsers = document.getElementById('stat-blocked-users');
        const statTotalPosts = document.getElementById('stat-total-posts');
        const statPendingPosts = document.getElementById('stat-pending-posts');
        const statApprovedPosts = document.getElementById('stat-approved-posts');

        if(statTotalUsers) statTotalUsers.textContent = stats.totalUsers ?? 'Error';
        if(statActiveUsers) statActiveUsers.textContent = stats.activeUsers ?? 'Error';
        if(statBlockedUsers) statBlockedUsers.textContent = stats.blockedUsers ?? 'Error';
        if(statTotalPosts) statTotalPosts.textContent = stats.totalPosts ?? 'Error';
        if(statPendingPosts) statPendingPosts.textContent = stats.pendingPosts ?? 'Error';
        if(statApprovedPosts) statApprovedPosts.textContent = stats.approvedPosts ?? 'Error';


    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert('Error al cargar estadísticas: ' + error.message);
        }
    }
}

async function cargarPostsPendientes() {
    const container = document.getElementById('pending-posts-list');
    if (!container) return;
    container.innerHTML = '<p>Cargando posts pendientes...</p>';

    try {
        const posts = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/moderation/posts`);

        container.innerHTML = '';

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML = '<p>No hay posts pendientes de moderación.</p>';
            return;
        }

        posts.forEach(post => {
            if (!post || typeof post !== 'object') return;

            const postCard = document.createElement('div');
            postCard.className = 'admin-post-card';
            postCard.style.cssText = 'background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            postCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="color: #3c4fff; margin-bottom: 10px;">Autor: ${escapeHtml(post.author || '')}</h3>
                        <p style="color: #333; margin-bottom: 10px;">${escapeHtml(post.content || '')}</p>
                        <small style="color: #888;">Fecha: ${post.publicationDate ? new Date(post.publicationDate).toLocaleString() : ''}</small>
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
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            container.innerHTML = `<p style="color: red;">Error al cargar posts pendientes: ${error.message}</p>`;
        }
    }
}

async function aprobarPost(postId) {
    try {
        await fetchAuth(`${API_BASE_URL_ADMIN}/admin/posts/${postId}/approve`, {
            method: 'PUT'
        });

        alert('Post aprobado exitosamente');
        await cargarPostsPendientes();

    } catch (error) {
        console.error('Error al aprobar post:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo aprobar el post');
        }
    }
}

async function eliminarPostAdmin(postId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este post?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL_ADMIN}/admin/posts/${postId}`, {
            method: 'DELETE'
        });

        alert('Post eliminado exitosamente');
        await cargarPostsPendientes();

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

async function cargarUsuarios() {
    const container = document.getElementById('users-list');
    if (!container) return;
    container.innerHTML = '<p>Cargando usuarios...</p>';

    try {
        const users = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users`);

        container.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            container.innerHTML = '<p>No hay usuarios registrados.</p>';
            return;
        }

        users.forEach(user => {
            if (!user || typeof user !== 'object') return;

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
                        <h3 style="color: #3c4fff; margin-bottom: 5px;">${escapeHtml(user.userName || '')} ${statusBadge}</h3>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${escapeHtml(user.email || '')}</p>
                        <p style="margin: 5px 0;"><strong>Rol:</strong> ${escapeHtml(user.role || '')}</p>
                        <small style="color: #888;">Registro: ${user.registerDate ? new Date(user.registerDate).toLocaleDateString() : ''}</small>
                    </div>
                    ${!isAdmin ? `
                        <div style="display: flex; gap: 10px; flex-direction: column;">
                            ${user.active
                                ? `<button class="btn-danger" onclick="bloquearUsuario(${user.id})">🚫 Bloquear</button>`
                                : `<button class="btn-primary" onclick="desbloquearUsuario(${user.id})">✓ Desbloquear</button>`
                            }
                            <button class="btn-secondary" onclick="verPostsUsuario(${user.id}, '${escapeHtml(user.userName || '')}')">📝 Ver Posts</button>
                            <button class="btn-danger" onclick="eliminarUsuario(${user.id})">🗑️ Eliminar</button>
                        </div>
                    ` : '<p style="color: #888; font-style: italic;">Administrador</p>'}
                </div>
            `;

            container.appendChild(userCard);
        });

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            container.innerHTML = `<p style="color: red;">Error al cargar usuarios: ${error.message}</p>`;
        }
    }
}

async function bloquearUsuario(userId) {
    if (!confirm('¿Estás seguro de que deseas bloquear este usuario?')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users/${userId}/block`, {
            method: 'PUT'
        });

        alert('Usuario bloqueado exitosamente');
        await cargarUsuarios();

    } catch (error) {
        console.error('Error al bloquear usuario:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo bloquear el usuario');
        }
    }
}

async function desbloquearUsuario(userId) {
    if (!confirm('¿Estás seguro de que deseas desbloquear este usuario?')) {
        return;
    }
    try {
        await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users/${userId}/unblock`, {
            method: 'PUT'
        });

        alert('Usuario desbloqueado exitosamente');
        await cargarUsuarios();

    } catch (error) {
        console.error('Error al desbloquear usuario:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo desbloquear el usuario');
        }
    }
}

async function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE este usuario y todo su contenido? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users/${userId}`, {
            method: 'DELETE'
        });

        alert('Usuario eliminado exitosamente');
        await cargarUsuarios();

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo eliminar el usuario');
        }
    }
}

async function verPostsUsuario(userId, userName) {
    const container = document.getElementById('users-list');
    if (!container) return;

    try {
        const posts = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users/${userId}/posts`);

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <button class="btn-secondary" onclick="cargarUsuarios()">← Volver a la lista</button>
                <h3 style="margin-top: 15px;">Posts de ${escapeHtml(userName)}</h3>
            </div>
        `;

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML += '<p>Este usuario no tiene posts.</p>';
            return;
        }

        posts.forEach(post => {
            if (!post || typeof post !== 'object') return;

            const postCard = document.createElement('div');
            postCard.style.cssText = 'background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            postCard.innerHTML = `
                <p><strong>Estado:</strong> ${escapeHtml(post.status || '')}</p>
                <p>${escapeHtml(post.content || '')}</p>
                <small style="color: #888;">${post.publicationDate ? new Date(post.publicationDate).toLocaleString() : ''}</small>
                <div style="margin-top: 10px;">
                    <button class="btn-danger btn-small" onclick="eliminarPostAdmin(${post.id})">Eliminar Post</button>
                </div>
            `;

            container.appendChild(postCard);
        });

    } catch (error) {
        console.error('Error al cargar posts del usuario:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert('Error al cargar posts del usuario: ' + error.message);
            cargarUsuarios();
        }
    }
}

async function cargarReportes() {
    const container = document.getElementById('reports-list');
    if (!container) return;
    container.innerHTML = '<p>Cargando reportes...</p>';

    try {
        const reports = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/reports/pending`);

        container.innerHTML = '';

        if (!Array.isArray(reports) || reports.length === 0) {
            container.innerHTML = '<p>No hay reportes pendientes.</p>';
            return;
        }

        reports.forEach(report => {
            if (!report || typeof report !== 'object') return;

            const reportCard = document.createElement('div');
            reportCard.style.cssText = 'background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

            reportCard.innerHTML = `
                <h3 style="color: #e91e63; margin-bottom: 10px;">🚩 Reporte #${report.id}</h3>
                <p><strong>Reportado por:</strong> ${escapeHtml(report.reporterUsername || '')}</p>
                <p><strong>Usuario reportado:</strong> ${escapeHtml(report.reportedUsername || '')}</p>
                <p><strong>Motivo:</strong> ${escapeHtml(report.reason || '')}</p>
                <p><strong>Descripción:</strong> ${escapeHtml(report.description || 'Sin descripción')}</p>
                ${report.relatedPostId ? `<p><strong>Post relacionado ID:</strong> ${report.relatedPostId}</p>` : ''}
                <small style="color: #888;">Fecha: ${report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}</small>
                <div style="margin-top: 15px;">
                    <button class="btn-primary" onclick="abrirModalResolverReporte(${report.id})">Resolver Reporte</button>
                </div>
            `;

            container.appendChild(reportCard);
        });

    } catch (error) {
        console.error('Error al cargar reportes:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            container.innerHTML = `<p style="color: red;">Error al cargar reportes: ${error.message}</p>`;
        }
    }
}

function abrirModalResolverReporte(reportId) {
    currentReportIdAdmin = reportId;
    const modal = document.getElementById('modal-resolve-report');
    if (modal) modal.style.display = 'block';
}

function cerrarModalResolverReporte() {
    const modal = document.getElementById('modal-resolve-report');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('form-resolve-report');
    if (form) form.reset();
    const penaltyGroup = document.getElementById('penalty-group');
    if (penaltyGroup) penaltyGroup.style.display = 'none';
    currentReportIdAdmin = null;
}

document.getElementById('resolve-status')?.addEventListener('change', function() {
    const penaltyGroup = document.getElementById('penalty-group');
    if (!penaltyGroup) return;
    if (this.value === 'RESUELTO_CON_PENALIZACION') {
        penaltyGroup.style.display = 'block';
    } else {
        penaltyGroup.style.display = 'none';
    }
});

async function submitResolverReporte(event) {
    event.preventDefault();

    if (!currentReportIdAdmin) return false;

    const statusSelect = document.getElementById('resolve-status');
    const penaltyInput = document.getElementById('karma-penalty');

    const status = statusSelect ? statusSelect.value : '';
    const penaltyValue = penaltyInput ? penaltyInput.value : '0';

    if (!status) {
        alert("Debes seleccionar una decisión.");
        return false;
    }


    const penalty = status === 'RESUELTO_CON_PENALIZACION'
        ? parseFloat(penaltyValue)
        : 0;

    if (isNaN(penalty) || penalty < 0) {
        alert("La penalización de karma debe ser un número positivo o cero.");
        return false;
    }

    const resolutionData = {
        finalStatus: status,
        karmaPenalty: penalty
    };

    try {
        await fetchAuth(`${API_BASE_URL_ADMIN}/admin/reports/${currentReportIdAdmin}/resolve`, {
            method: 'PUT',
            body: JSON.stringify(resolutionData)
        });

        alert('Reporte resuelto exitosamente');
        cerrarModalResolverReporte();
        await cargarReportes();

    } catch (error) {
        console.error('Error al resolver reporte:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo resolver el reporte');
        }
    }

    return false;
}

window.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await verificarAccesoAdmin();
    if (isAdmin) {
        cargarEstadisticas();
    }

    window.onclick = function(event) {
        const modal = document.getElementById('modal-resolve-report');
        if (event.target == modal) {
            cerrarModalResolverReporte();
        }
    }
});


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