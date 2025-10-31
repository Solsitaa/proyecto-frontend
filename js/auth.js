const API_BASE_URL = 'http://localhost:8080/api';

let currentUserData = null;
let userDataPromise = null;

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
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            if (successDiv) successDiv.style.display = 'none';
        }, 3000);
    }
}

async function fetchAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: headers,
        });

        if (response.status === 401 || response.status === 403) {
            currentUserData = null;
            userDataPromise = null;
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('registro.html')) {
                console.warn('AUTH_REQUIRED detectado por fetchAuth.');
            }
            throw new Error('AUTH_REQUIRED');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
                return await response.json();
            } catch (e) {
                console.error("Error parsing JSON:", e);
                return null;
            }
        } else {
            const text = await response.text();
            return text || response;
        }

    } catch (error) {
        console.error('Error en fetchAuth:', error);
        if (error.message === 'AUTH_REQUIRED') {
            throw error;
        }
        throw new Error(error.message || 'Error de conexión o de servidor.');
    }
}

async function handleRegistro(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre')?.value.trim();
    const apellido = document.getElementById('apellido')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const userName = document.getElementById('userName')?.value.trim();
    const password = document.getElementById('password')?.value;
    const passwordConfirm = document.getElementById('passwordConfirm')?.value;

    if (!nombre || !apellido || !email || !userName || !password || !passwordConfirm) {
        showError('Todos los campos son obligatorios.');
        return;
    }

    if (password !== passwordConfirm) {
        showError('Las contraseñas no coinciden');
        return;
    }
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    if (userName.length < 4) {
        showError('El nombre de usuario debe tener al menos 4 caracteres');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Por favor ingresa un correo válido');
        return;
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
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }

        await response.json();
        currentUserData = null;
        userDataPromise = null;
        showSuccess('Registro exitoso. Serás redirigido al login.');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Error en el registro:', error);
        showError(error.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!identifier || !password) {
        showError('Por favor ingresa tu usuario/correo y contraseña.');
        return;
    }

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
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            currentUserData = null;
            userDataPromise = null;
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }

        const userResponse = await response.json();
        currentUserData = userResponse;
        userDataPromise = Promise.resolve(userResponse);

        window.location.href = 'index.html';

    } catch (error) {
        console.error('Error en el login:', error);
        showError(error.message);
    }
}

async function getCurrentUserData() {
    if (currentUserData) {
        return currentUserData;
    }
    if (userDataPromise) {
        return userDataPromise;
    }

    userDataPromise = (async () => {
        try {
            const userData = await fetchAuth(`${API_BASE_URL}/auth/me`);
            if (userData && typeof userData === 'object') {
                currentUserData = userData;
                return userData;
            } else {
                currentUserData = null;
                userDataPromise = null;
                return null;
            }
        } catch (error) {
            currentUserData = null;
            userDataPromise = null;
            return null;
        }
    })();
    return userDataPromise;
}

function updateCurrentUserData(newUserData) {
    if (newUserData) {
        currentUserData = newUserData;
        userDataPromise = Promise.resolve(newUserData);
    } else {
        currentUserData = null;
        userDataPromise = null;
    }
}

async function cerrarSesion() {
    try {
        await fetchAuth(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
        });
    } catch (error) {
        if (error.message !== 'AUTH_REQUIRED') {
            console.error("Error al llamar a /auth/logout en el backend:", error);
        }
    } finally {
        currentUserData = null;
        userDataPromise = null;
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistro);
    }

    getCurrentUserData().then(userData => {
        console.log("Estado de login inicial verificado:", userData ? "Logueado como " + userData.userName : "No logueado");
        document.dispatchEvent(new CustomEvent('authStatusChecked', { detail: { loggedIn: !!userData, userData: userData } }));
    }).catch(() => {
        document.dispatchEvent(new CustomEvent('authStatusChecked', { detail: { loggedIn: false, userData: null } }));
    });
});

function onAuthStatusChecked(callback) {
    document.addEventListener('authStatusChecked', (event) => {
        callback(event.detail.loggedIn, event.detail.userData);
    });

    if (userDataPromise !== null) {
        getCurrentUserData().then(userData => {
            callback(!!userData, userData);
        });
    }
}