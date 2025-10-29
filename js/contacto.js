function handleContacto(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const asunto = document.getElementById('asunto').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    const contacto = {
        nombre: nombre,
        correo: correo,
        asunto: asunto,
        mensaje: mensaje,
        fecha: new Date().toISOString()
    };

    const contactos = JSON.parse(localStorage.getItem('contactos') || '[]');
    contactos.push(contacto);
    localStorage.setItem('contactos', JSON.stringify(contactos));

    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.';
        successDiv.style.display = 'block';
    }

    document.getElementById('contactoForm').reset();

    setTimeout(() => {
        if (successDiv) {
            successDiv.style.display = 'none';
        }
    }, 5000);

    return false;
}