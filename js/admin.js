const API_BASE_URL_ADMIN = 'a-production-10b6.up.railway.app';

let currentReportIdAdmin = null;
let modalResolveReport = null;

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

function setupTabListeners() {
    const tabs = document.querySelectorAll('#adminTab button[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            const targetId = event.target.getAttribute('data-bs-target');
            if (targetId === '#nav-stats') cargarEstadisticas();
            if (targetId === '#nav-posts') cargarPostsPendientes();
            if (targetId === '#nav-users') cargarUsuarios();
            if (targetId === '#nav-reports') cargarReportes();
        });
    });
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
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const posts = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/moderation/posts`);

        container.innerHTML = '';

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No hay posts pendientes de moderación.</p>';
            return;
        }

        posts.forEach(post => {
            if (!post || typeof post !== 'object') return;

            const postCard = document.createElement('div');
            postCard.className = 'card shadow-sm mb-3';
            
            postCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title text-primary mb-1">Autor: ${escapeHtml(post.author || '')}</h5>
                            <p class="card-text">${escapeHtml(post.content || '')}</p>
                            <small class="text-muted">Fecha: ${post.publicationDate ? new Date(post.publicationDate).toLocaleString() : ''}</small>
                        </div>
                        <div class="d-flex gap-2 ms-3">
                            <button class="btn btn-success btn-sm" onclick="aprobarPost(${post.id})">✓ Aprobar</button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarPostAdmin(${post.id})">✗ Eliminar</button>
                        </div>
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
            container.innerHTML = `<div class="alert alert-danger">Error al cargar posts pendientes: ${error.message}</div>`;
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
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const users = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users`);

        container.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No hay usuarios registrados.</p>';
            return;
        }

        users.forEach(user => {
            if (!user || typeof user !== 'object') return;

            const userCard = document.createElement('div');
            userCard.className = 'card shadow-sm mb-3';

            const statusBadge = user.active
                ? '<span class="badge bg-success-subtle text-success-emphasis rounded-pill">Activo</span>'
                : '<span class="badge bg-danger-subtle text-danger-emphasis rounded-pill">Bloqueado</span>';

            const isAdmin = user.role === 'ADMINISTRADOR';

            userCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title text-primary mb-1">${escapeHtml(user.userName || '')} ${statusBadge}</h5>
                            <p class="card-text mb-1"><strong>Email:</strong> ${escapeHtml(user.email || '')}</p>
                            <p class="card-text mb-1"><strong>Rol:</strong> ${escapeHtml(user.role || '')}</p>
                            <small class="text-muted">Registro: ${user.registerDate ? new Date(user.registerDate).toLocaleDateString() : ''}</small>
                        </div>
                        ${!isAdmin ? `
                            <div class="d-flex flex-column gap-2 ms-3" style="min-width: 120px;">
                                ${user.active
                                    ? `<button class="btn btn-warning btn-sm" onclick="bloquearUsuario(${user.id})">🚫 Bloquear</button>`
                                    : `<button class="btn btn-success btn-sm" onclick="desbloquearUsuario(${user.id})">✓ Desbloquear</button>`
                                }
                                <button class="btn btn-secondary btn-sm" onclick="verPostsUsuario(${user.id}, '${escapeHtml(user.userName || '')}')">📝 Ver Posts</button>
                                <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${user.id})">🗑️ Eliminar</button>
                            </div>
                        ` : '<span class="text-muted fst-italic ms-3">Administrador</span>'}
                    </div>
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
            container.innerHTML = `<div class="alert alert-danger">Error al cargar usuarios: ${error.message}</div>`;
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

    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const posts = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/users/${userId}/posts`);

        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-secondary btn-sm" onclick="cargarUsuarios()">← Volver a la lista</button>
                <h3 class="mt-3">Posts de ${escapeHtml(userName)}</h3>
            </div>
        `;

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML += '<p class="text-center text-muted">Este usuario no tiene posts.</p>';
            return;
        }

        posts.forEach(post => {
            if (!post || typeof post !== 'object') return;

            const postCard = document.createElement('div');
            postCard.className = 'card shadow-sm mb-2';
            postCard.innerHTML = `
                <div class="card-body">
                    <p class="mb-1"><strong>Estado:</strong> ${escapeHtml(post.status || '')}</p>
                    <p class="mb-1">${escapeHtml(post.content || '')}</p>
                    <small class="text-muted">${post.publicationDate ? new Date(post.publicationDate).toLocaleString() : ''}</small>
                    <div class="mt-2">
                        <button class="btn btn-danger btn-sm" onclick="eliminarPostAdmin(${post.id})">Eliminar Post</button>
                    </div>
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
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const reports = await fetchAuth(`${API_BASE_URL_ADMIN}/admin/reports/pending`);

        container.innerHTML = '';

        if (!Array.isArray(reports) || reports.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No hay reportes pendientes.</p>';
            return;
        }

        reports.forEach(report => {
            if (!report || typeof report !== 'object') return;

            const reportCard = document.createElement('div');
            reportCard.className = 'card shadow-sm mb-3 border-danger';
            
            reportCard.innerHTML = `
                <div class="card-header bg-danger-subtle">
                    <h5 class="mb-0 text-danger-emphasis">🚩 Reporte #${report.id}</h5>
                </div>
                <div class="card-body">
                    <p class="mb-1"><strong>Reportado por:</strong> ${escapeHtml(report.reporterUsername || '')}</p>
                    <p class="mb-1"><strong>Usuario reportado:</strong> ${escapeHtml(report.reportedUsername || '')}</p>
                    <p class="mb-1"><strong>Motivo:</strong> ${escapeHtml(report.reason || '')}</p>
                    <p class="mb-1"><strong>Descripción:</strong> ${escapeHtml(report.description || 'Sin descripción')}</p>
                    ${report.relatedPostId ? `<p class="mb-1"><strong>Post relacionado ID:</strong> ${report.relatedPostId}</p>` : ''}
                    <small class="text-muted">Fecha: ${report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}</small>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="abrirModalResolverReporte(${report.id})">Resolver Reporte</button>
                    </div>
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
            container.innerHTML = `<div class="alert alert-danger">Error al cargar reportes: ${error.message}</div>`;
        }
    }
}

function abrirModalResolverReporte(reportId) {
    currentReportIdAdmin = reportId;
    if (modalResolveReport) {
        modalResolveReport.show();
    }
}

function cerrarModalResolverReporte() {
    if (modalResolveReport) {
        modalResolveReport.hide();
    }
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
    modalResolveReport = new bootstrap.Modal(document.getElementById('modal-resolve-report'));
    
    const isAdmin = await verificarAccesoAdmin();
    if (isAdmin) {
        cargarEstadisticas();
        setupTabListeners();
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