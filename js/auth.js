const API_BASE_URL = 'http://localhost:8080/api';

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        try {
            const errorObj = JSON.parse(message);
            errorDiv.textContent = errorObj.error || Object.values(errorObj).join(', ') || 'Ocurrió un error.';
        } catch (e) {
            errorDiv.textContent = message || 'Ocurrió un error.';
        }
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

async function handleRegistro(event) {
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

    const registroData = {
        userName: userName,
        nombre: nombre,
        apellido: apellido,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registroData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }

        await response.json();

        showSuccess('Registro exitoso. Serás redirigido al login.');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Error en el registro:', error);
        showError(error.message);
    }

    return false;
}

async function handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    const loginData = {
        identifier: identifier,
        password: password
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }

        const userResponse = await response.json();

        localStorage.setItem('jwtToken', userResponse.token);
        const userData = {
            idUser: userResponse.idUser,
            userName: userResponse.userName,
            nombre: userResponse.nombre,
            email: userResponse.email,
            rol: userResponse.rol,
            karmaTitle: userResponse.karmaTitle,
            reputacion: userResponse.reputacion
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        window.location.href = 'index.html';

    } catch (error) {
        console.error('Error en el login:', error);
        showError(error.message);
    }

    return false;
}


function getToken() {
    return localStorage.getItem('jwtToken');
}

function getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
}

function cerrarSesion() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

async function fetchAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: headers,
        });

        if (response.status === 401 || response.status === 403) {
            cerrarSesion();
            throw new Error('Sesión inválida o expirada. Por favor, inicia sesión de nuevo.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            try {
                return await response.text();
            } catch (e) {
                return response;
            }
        }

    } catch (error) {
        console.error('Error en fetchAuth:', error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error('Error de conexión o de servidor.');
        }
    }
}