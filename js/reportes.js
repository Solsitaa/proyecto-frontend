let currentReportUserId = null;
let currentReportPostId = null;

function abrirModalReportar(postId, userName) {
    const token = getToken();
    if (!token) {
        alert('Debes iniciar sesión para reportar');
        window.location.href = 'login.html';
        return;
    }

    currentReportPostId = postId;
    
    fetch(`${API_BASE_URL}/posts/${postId}`)
        .then(res => res.json())
        .then(post => {
            const userData = getUserData();
            const autor = post.userName;
            
            if (userData.userName === autor) {
                alert('No puedes reportarte a ti mismo');
                return;
            }

            return fetch(`${API_BASE_URL}/posts`)
                .then(res => res.json())
                .then(posts => {
                    const postEncontrado = posts.find(p => p.userName === autor);
                    if (!postEncontrado) {
                        throw new Error('No se pudo encontrar el usuario');
                    }
                    
                    currentReportUserId = postEncontrado.idPost;
                    document.getElementById('modal-reportar').style.display = 'block';
                });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al preparar el reporte');
        });
}

function cerrarModalReportar() {
    document.getElementById('modal-reportar').style.display = 'none';
    document.getElementById('form-reportar').reset();
    currentReportUserId = null;
    currentReportPostId = null;
}

async function submitReporte(event) {
    event.preventDefault();

    const reason = document.getElementById('report-reason').value;
    const description = document.getElementById('report-description').value.trim();

    if (!reason || !description) {
        alert('Debes completar todos los campos');
        return false;
    }

    const reportData = {
        reportedUserId: currentReportUserId,
        reason: reason,
        description: description,
        relatedPostId: currentReportPostId,
        relatedCommentId: null
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
        alert(error.message || 'No se pudo enviar el reporte');
    }

    return false;
}