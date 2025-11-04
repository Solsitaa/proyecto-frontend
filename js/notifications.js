const WS_BASE_URL = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL.replace('https/api', 'wss').replace('http/api', 'ws') : 'wss://a-production-10b6.up.railway.app') + '/ws';
let stompClientNotif = null;
let notificationsCache = [];

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

function renderNotificationsList() {
    const menu = document.getElementById('notificationsMenu');
    const countBadge = document.getElementById('notifCount');
    if (!menu || !countBadge) return;

    menu.innerHTML = '';

    if (notificationsCache.length === 0) {
        const li = document.createElement('li');
        li.className = 'text-center text-muted small';
        li.textContent = 'No hay notificaciones';
        menu.appendChild(li);
        countBadge.textContent = '0';
        countBadge.style.display = 'none';
        return;
    }

    const header = document.createElement('li');
    header.className = 'd-flex justify-content-between align-items-center mb-2';
    header.innerHTML = `
        <span class="fw-bold text-primary">Notificaciones</span>
        <button id="markAllRead" class="btn btn-sm btn-outline-secondary py-0 px-2">Marcar todas</button>
    `;
    menu.appendChild(header);

    notificationsCache.slice(0, 10).forEach(n => {
        const li = document.createElement('li');
        li.className = 'd-flex align-items-start gap-2 mb-2';
        li.innerHTML = `
            <div class="flex-grow-1">
                <strong class="d-block">${escapeHtml(n.senderUserName || 'Sistema')}</strong>
                <div class="small text-truncate" style="max-width: 240px;">${escapeHtml(n.title || n.message || '')}</div>
                <small class="text-muted">${n.creationDate ? new Date(n.creationDate).toLocaleString() : ''}</small>
            </div>
            <div class="ms-2">
                <button class="btn btn-sm btn-link mark-read-btn" data-id="${n.id}">
                    ${n.isRead ? '✓' : '●'}
                </button>
            </div>
        `;
        menu.appendChild(li);
    });

    const unread = notificationsCache.filter(n => !n.isRead).length;
    countBadge.textContent = unread > 0 ? String(unread) : '0';
    countBadge.style.display = unread > 0 ? 'inline-block' : 'none';
}

async function markNotificationRead(id) {
    try {
        await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            credentials: 'include'
        });
        const idx = notificationsCache.findIndex(n => n.id === id);
        if (idx !== -1) {
            notificationsCache[idx].isRead = true;
            renderNotificationsList();
        }
    } catch (e) {
        console.error('Error al marcar notificación como leída', e);
    }
}

async function markAllNotificationsRead(userId) {
    console.log('Marcando todas como leídas para usuario:', userId);
    const unread = notificationsCache.filter(n => !n.isRead);
    if (unread.length === 0) {
        console.log('No hay notificaciones sin leer');
        return;
    }

    try {
        await Promise.all(unread.map(async n => {
            const res = await fetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (!res.ok) {
                console.error(`Error al marcar notificación ${n.id}: ${res.status}`);
            } else {
                n.isRead = true;
            }
        }));
        renderNotificationsList();
        console.log('Todas las notificaciones marcadas como leídas');
    } catch (e) {
        console.error('Error al marcar todas como leídas', e);
    }
}

function attachMenuHandlers(user) {
    const menu = document.getElementById('notificationsMenu');
    if (!menu) return;

    // Elimina listeners previos para evitar duplicados
    menu.replaceWith(menu.cloneNode(true));
    const newMenu = document.getElementById('notificationsMenu');

    newMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('.mark-read-btn');
        if (btn) {
            const id = Number(btn.getAttribute('data-id'));
            if (id) {
                console.log('Marcando individual:', id);
                markNotificationRead(id);
            }
            return;
        }

        const markAllBtn = e.target.closest('#markAllRead');
        if (markAllBtn) {
            console.log('Botón "Marcar todas" clicado');
            markAllNotificationsRead(user.idUser);
            return;
        }
    });
}

function connectNotifications(user) {
    if (!user) return;
    console.log('Conectando WebSocket para notificaciones', WS_BASE_URL);
    const socket = new SockJS(WS_BASE_URL);
    stompClientNotif = Stomp.over(socket);
    stompClientNotif.connect({}, function(frame) {
        console.log('STOMP conectado', frame);
        stompClientNotif.subscribe('/user/queue/notifications', function(message) {
            console.log('Notificación recibida en /user/queue/notifications', message);
            try {
                const body = JSON.parse(message.body);
                notificationsCache.unshift(body);
                renderNotificationsList();
            } catch (e) {
                console.error('Error parseando notificación de usuario', e);
            }
        });
        stompClientNotif.subscribe('/topic/notifications/' + user.userName, function(message) {
            console.log('Notificación recibida en /topic/notifications/' + user.userName, message);
            try {
                const body = JSON.parse(message.body);
                notificationsCache.unshift(body);
                renderNotificationsList();
            } catch (e) {
                console.error('Error parseando notificación en topic', e);
            }
        });
    }, function(error) {
        console.error('Error STOMP', error);
    });
}

async function loadInitialNotifications(userId) {
    try {
        const r = await fetch(`${API_BASE_URL}/notifications/${userId}`, { credentials: 'include' });
        if (!r.ok) return;
        const data = await r.json();
        if (Array.isArray(data)) {
            notificationsCache = data;
            renderNotificationsList();
        }
    } catch (e) {
        console.error('Error cargando notificaciones iniciales', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getCurrentUserData().then(user => {
        if (!user) {
            const menu = document.getElementById('notificationsMenu');
            if (menu) menu.innerHTML = '<li class="text-center text-muted small">Inicia sesión para ver notificaciones</li>';
            return;
        }
        attachMenuHandlers(user);
        loadInitialNotifications(user.idUser);
        connectNotifications(user);
    });
});
