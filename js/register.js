// Al enviar el formulario con id="registerForm" interceptamos el submit
document.getElementById("registerForm").addEventListener("submit", async function(e) {
  // Evita que el navegador recargue la página por defecto
  e.preventDefault();

  // Leemos los valores de las contraseñas
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validación rápida en el cliente: ambas contraseñas deben coincidir
  if (password !== confirmPassword) {
    alert("Las contraseñas no coinciden");
    return; // Cortamos aquí para no llamar a la API
  }

  // Construimos el objeto de datos exactamente como lo espera la API (Dtorequest)
  const data = {
    userName: document.getElementById("userName").value,
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    email: document.getElementById("email").value,
    password: password,
    passwordConfirm: confirmPassword
  };

  try {
    // Llamamos al endpoint de registro con método POST y JSON en el body
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    // Si la API responde 2xx, asumimos registro correcto
    if (response.ok) {
      alert("Registro exitoso");
      // Redirigimos a la página de login
      window.location.href = "login.html";
      return;
    }

    // Si no fue ok, intentamos leer el JSON de error que envía el backend
    let message = "No se pudo registrar";
    try {
      const error = await response.json();
      message = error.error || error.message || message;
    } catch (_) {
      // Si no hay JSON en la respuesta, mantenemos el mensaje por defecto
    }
    alert("Error: " + message);
  } catch (err) {
    // Errores de red o CORS, etc.
    alert("Error de conexión. Intenta nuevamente.");
  }
});