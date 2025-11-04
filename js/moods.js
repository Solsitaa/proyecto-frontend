const API_BASE_URL = 'https://a-production-10b6.up.railway.app/api'

let moodButtonsBound = false
let isSavingMood = false

async function registrarMood(estado) {
  if (isSavingMood) return
  isSavingMood = true

  try {
    const response = await fetch(`${API_BASE_URL}/moods/me`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })

    let data = null
    try {
      data = await response.json()
    } catch (e) {
      data = null
    }

    if (!response.ok) {
      const msg = data && data.error ? data.error : 'No puedes registrar más de un estado hoy.'
      showToast(msg)
      return
    }

    const estadoEl = document.getElementById('estado-actual')
    if (estadoEl && data && data.estado) {
      estadoEl.textContent = `Tu estado de hoy: ${data.estado}`
    }

    showToast('Estado registrado correctamente 🎯', 'success')
  } catch (err) {
    console.error('Error al registrar mood:', err)
    showToast('Error al conectar con el servidor.')
  } finally {
    isSavingMood = false
  }
}

async function obtenerMoodActual() {
  try {
    const response = await fetch(`${API_BASE_URL}/moods/me`, {
      credentials: 'include'
    })

    const estadoEl = document.getElementById('estado-actual')

    if (!response.ok) {
      if (response.status === 401 && estadoEl) {
        estadoEl.textContent = 'Inicia sesión para registrar tu estado de ánimo.'
      }
      return
    }

    const data = await response.json()
    const hoy = new Date().toISOString().split('T')[0]
    const fecha = data.fechaRegistro?.split('T')[0]

    if (!estadoEl) return

    if (fecha === hoy) {
      estadoEl.textContent = `Tu estado de hoy: ${data.estado}`
    } else {
      estadoEl.textContent = 'Aún no registras tu estado de ánimo de hoy.'
    }
  } catch (err) {
    console.error('Error al obtener mood actual:', err)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStatusChecked((loggedIn, userData) => {
    const estadoEl = document.getElementById('estado-actual')

    if (!loggedIn) {
      if (estadoEl) {
        estadoEl.textContent = 'Inicia sesión para registrar tu estado.'
      }
      return
    }

    obtenerMoodActual()

    if (moodButtonsBound) return
    moodButtonsBound = true

    const botonesMood = document.querySelectorAll('[data-mood]')
    botonesMood.forEach(btn => {
      btn.addEventListener('click', () => {
        registrarMood(btn.dataset.mood)
      })
    })
  })
})
