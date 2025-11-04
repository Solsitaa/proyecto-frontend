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
      alert(data.error || "No puedes registrar más de un estado hoy.");
      return;
    }

    document.getElementById("estado-actual").textContent =
      `Tu estado de hoy: ${data.estado}`;
    alert("Estado registrado correctamente 🎯");
  } catch (err) {
    console.error("Error al registrar mood:", err);
    alert("Error al conectar con el servidor.");
  }
}

async function obtenerMoodActual() {
  try {
    const response = await fetch(`${API_BASE_URL}/moods/me`, {
      credentials: "include"
    });

    if (!response.ok) {
      if (response.status === 401) {
        document.getElementById("estado-actual").textContent =
          "Inicia sesión para registrar tu estado de ánimo.";
      }
      return;
    }

    const data = await response.json();
    const hoy = new Date().toISOString().split("T")[0];
    const fecha = data.fechaRegistro?.split("T")[0];
    const estadoEl = document.getElementById("estado-actual");

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
  obtenerMoodActual();

  const botonesMood = document.querySelectorAll("[data-mood]");
  botonesMood.forEach(btn => {
    btn.addEventListener("click", () => {
      registrarMood(btn.dataset.mood);
    });
  });
});
