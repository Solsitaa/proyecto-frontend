async function registrarMood(estado) {
  try {
    const response = await fetch(`${API_BASE_URL}/moods/me`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || "No puedes registrar más de un estado hoy.");
      return;
    }

    const estadoEl = document.getElementById("estado-actual");
    if (estadoEl) {
      estadoEl.textContent = `Tu estado de hoy: ${data.estado}`;
    }

    showToast("Estado registrado correctamente 🎯", "success");
  } catch (err) {
    console.error("Error al registrar mood:", err);
    showToast("Error al conectar con el servidor.");
  }
}

async function obtenerMoodActual() {
  try {
    const response = await fetch(`${API_BASE_URL}/moods/me`, {
      credentials: "include"
    });

    if (!response.ok) {
      if (response.status === 401) {
        const estadoEl = document.getElementById("estado-actual");
        if (estadoEl) {
          estadoEl.textContent = "Inicia sesión para registrar tu estado de ánimo.";
        }
      }
      return;
    }

    const data = await response.json();
    const hoy = new Date().toISOString().split("T")[0];
    const fecha = data.fechaRegistro?.split("T")[0];
    const estadoEl = document.getElementById("estado-actual");

    if (!estadoEl) return;

    if (fecha === hoy) {
      estadoEl.textContent = `Tu estado de hoy: ${data.estado}`;
    } else {
      estadoEl.textContent = "Aún no registras tu estado de ánimo de hoy.";
    }
  } catch (err) {
    console.error("Error al obtener mood actual:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onAuthStatusChecked((loggedIn, userData) => {
    const estadoEl = document.getElementById("estado-actual");

    if (loggedIn) {
      obtenerMoodActual();
      const botonesMood = document.querySelectorAll("[data-mood]");
      botonesMood.forEach(btn => {
        btn.addEventListener("click", () => {
          registrarMood(btn.dataset.mood);
        });
      });
    } else {
      if (estadoEl) {
        estadoEl.textContent = "Inicia sesión para registrar tu estado.";
      }
    }
  });
});
