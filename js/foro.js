function darReconocimiento(button) {
    const originalText = button.textContent;
    button.textContent = '✓ Reconocimiento dado';
    button.style.backgroundColor = '#90EE90';
    button.disabled = true;

    const reconocimientos = parseInt(localStorage.getItem('totalReconocimientos') || '0');
    localStorage.setItem('totalReconocimientos', (reconocimientos + 1).toString());

    setTimeout(() => {
        alert('¡Gracias por dar reconocimiento! Tu apoyo es importante para la comunidad.');
    }, 300);
}

function handleAuth() {
    const usuarioActual = sessionStorage.getItem('usuarioActual');

    if (usuarioActual) {
        cerrarSesion();
    } else {
        window.location.href = 'login.html';
    }
}

function actualizarBotonAuth() {
    const authButton = document.getElementById('authButton');
    const usuarioActual = sessionStorage.getItem('usuarioActual');

    if (authButton) {
        if (usuarioActual) {
            authButton.textContent = 'Cerrar sesión';
        } else {
            authButton.textContent = 'Iniciar sesión';
        }
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';
}

window.addEventListener('DOMContentLoaded', () => {
    actualizarBotonAuth();

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
});