let currentReportUserIdReportes = null;
let currentReportPostIdReportes = null;
let currentReportCommentIdReportes = null;

async function abrirModalReportar(targetId, userName, userId, type) {
    let userData;
    try {
        userData = await getCurrentUserData();
        if (!userData) {
            alert('Debes iniciar sesión para reportar');
            window.location.href = 'login.html';
            return;
        }
    } catch {
        alert('Error al verificar sesión. Intenta iniciar sesión.');
        window.location.href = 'login.html';
        return;
    }


    if (userData.idUser === userId) {
        alert('No puedes reportarte a ti mismo');
        return;
    }

    currentReportUserIdReportes = userId;
    
    if (type === 'POST') {
        currentReportPostIdReportes = targetId;
        currentReportCommentIdReportes = null;
    } else if (type === 'COMMENT') {
        currentReportCommentIdReportes = targetId;
        currentReportPostIdReportes = null;
    }

    if (modalReportar) {
        modalReportar.show();
    }
}

function cerrarModalReportar() {
    if (modalReportar) {
        modalReportar.hide();
    }
    const form = document.getElementById('form-reportar');
    if (form) form.reset();
    currentReportUserIdReportes = null;
    currentReportPostIdReportes = null;
    currentReportCommentIdReportes = null;
}

async function submitReporte(event) {
    event.preventDefault();

    const reasonSelect = document.getElementById('report-reason');
    const descriptionTextarea = document.getElementById('report-description');

    const reason = reasonSelect ? reasonSelect.value : '';
    const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';

    if (!reason) {
        alert('Debes seleccionar un motivo');
        return false;
    }
    if (!description) {
        alert('Debes incluir una descripción');
        return false;
    }


    if (!currentReportUserIdReportes) {
        alert("Error: No se ha identificado al usuario a reportar.");
        return false;
    }


    const reportData = {
        reportedUserId: currentReportUserIdReportes,
        reason: reason,
        description: description,
        relatedPostId: currentReportPostIdReportes,
        relatedCommentId: currentReportCommentIdReportes
    };

    try {
        await fetchAuth(`${API_BASE_URL}/reports`, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });

        alert('Reporte enviado exitosamente. Será revisado por un administrador.');
        cerrarModalReportar();

    } catch (error) {
        console.error('Error al enviar reporte:', error);
        if (error.message === 'AUTH_REQUIRED') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
        } else {
            alert(error.message || 'No se pudo enviar el reporte');
        }
    }

    return false;
}