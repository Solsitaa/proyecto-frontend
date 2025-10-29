function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

function handleRegistro(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const userName = document.getElementById('userName').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    if (password !== passwordConfirm) {
        showError('Las contraseñas no coinciden');
        return false;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return false;
    }

    if (userName.length < 4) {
        showError('El nombre de usuario debe tener al menos 4 caracteres');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Por favor ingresa un correo válido');
        return false;
    }

    const usuario = {
        nombre: nombre,
        apellido: apellido,
        email: email,
        userName: userName,
        password: password,
        fechaRegistro: new Date().toISOString(),
        sesiones: 0,
        animo: []
    };

    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');

    const usuarioExistente = usuarios.find(u => u.email === email || u.userName === userName);
    if (usuarioExistente) {
        showError('El correo o nombre de usuario ya están registrados');
        return false;
    }

    usuarios.push(usuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    showSuccess('Registro exitoso. Redirigiendo...');

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);

    return false;
}

function handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');

    const usuario = usuarios.find(u => 
        (u.email === identifier || u.userName === identifier) && u.password === password
    );

    if (!usuario) {
        showError('Usuario o contraseña incorrectos');
        return false;
    }

    sessionStorage.setItem('usuarioActual', JSON.stringify(usuario));

    window.location.href = 'index.html';

    return false;
}

function verificarSesion() {
    const usuarioActual = sessionStorage.getItem('usuarioActual');
    return usuarioActual ? JSON.parse(usuarioActual) : null;
}

function cerrarSesion() {
    sessionStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';
}