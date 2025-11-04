async function handleContacto(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const asunto = document.getElementById('asunto').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    const contacto = {
        nombre: nombre,
        correo: correo,
        asunto: asunto,
        mensaje: mensaje
    };

    const successDiv = document.getElementById('success-message');
    const submitButton = event.target.querySelector('button[type="submit"]');

    try {
        if (submitButton) submitButton.disabled = true;
        if (successDiv) successDiv.style.display = 'none';

        const response = await fetch('https://a-production-10b6.up.railway.app/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contacto)
        });

        if (!response.ok) {
            throw new Error('Error en el servidor');
        }

        if (successDiv) {
            successDiv.textContent = '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.';
            successDiv.style.display = 'block';
        }

        document.getElementById('contactoForm').reset();

        setTimeout(() => {
            if (successDiv) successDiv.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error("Error al enviar contacto:", error);
        showToast("No se pudo enviar el mensaje. Inténtalo más tarde.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }

    return false;
}