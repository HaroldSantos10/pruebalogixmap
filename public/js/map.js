// ── Verificar autenticación ──
const token = localStorage.getItem('token');
const email = localStorage.getItem('email');

if (!token) {
  window.location.href = '/';
}

document.getElementById('user-email').textContent = email || '';

// ── Inicializar mapa ──
const map = L.map('map').setView([13.6929, -89.2182], 8);

// Cargar API key desde el servidor
async function initTiles() {
  try {
    const res = await fetch('/api/config');
    const { stadiaKey } = await res.json();

    L.tileLayer(
      `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaKey}`,
      {
        attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors',
        maxZoom: 20
      }
    ).addTo(map);

  } catch (err) {
    console.error('Error cargando tiles:', err);
  }
}

initTiles();

// ── Estado local ──
let markers = [];       // { id, lat, lng, label, leafletMarker }
let markerCount = 0;

// ── Headers de autenticación ──
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// ── Icono personalizado ──
const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 14px;
    height: 14px;
    background: #3B82F6;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #3B82F6;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// ── Cargar marcadores del servidor ──
async function loadMarkers() {
  try {
    const res = await fetch('/api/markers', { headers: authHeaders });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    const data = await res.json();
    data.forEach(m => addLeafletMarker(m.id, m.lat, m.lng, m.label));
    renderSidebar();
  } catch (err) {
    console.error('Error cargando marcadores:', err);
  }
}

// ── Agregar marcador ──
async function addMarker() {
  const center = map.getCenter();
  markerCount++;
  const label = `Marcador ${markerCount}`;

  try {
    const res = await fetch('/api/markers', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ lat: center.lat, lng: center.lng, label })
    });

    if (!res.ok) return;

    const data = await res.json();
    addLeafletMarker(data.id, data.lat, data.lng, data.label);
    renderSidebar();
    map.panTo([data.lat, data.lng]);

  } catch (err) {
    console.error('Error creando marcador:', err);
  }
}

// ── Agregar marcador al mapa (Leaflet) ──
function addLeafletMarker(id, lat, lng, label) {
  const leafletMarker = L.marker([lat, lng], {
    icon: markerIcon,
    draggable: true
  }).addTo(map);

  leafletMarker.bindTooltip(label, {
    permanent: false,
    direction: 'top',
    offset: [0, -10]
  });

  // Al terminar de arrastrar — actualizar en servidor
  leafletMarker.on('dragend', async (e) => {
    const { lat, lng } = e.target.getLatLng();
    await updateMarkerPosition(id, lat, lng);

    // Actualizar estado local
    const m = markers.find(m => m.id === id);
    if (m) { m.lat = lat; m.lng = lng; }
    renderSidebar();
  });

  markers.push({ id, lat, lng, label, leafletMarker });
}

// ── Actualizar posición en servidor ──
async function updateMarkerPosition(id, lat, lng) {
  try {
    await fetch(`/api/markers/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ lat, lng })
    });
  } catch (err) {
    console.error('Error actualizando marcador:', err);
  }
}

// ── Eliminar marcador ──
async function deleteMarker(id) {
  try {
    const res = await fetch(`/api/markers/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (!res.ok) return;

    const m = markers.find(m => m.id === id);
    if (m) {
      map.removeLayer(m.leafletMarker);
      markers = markers.filter(m => m.id !== id);
    }

    renderSidebar();

  } catch (err) {
    console.error('Error eliminando marcador:', err);
  }
}

// ── Centrar mapa en marcador ──
function focusMarker(id) {
  const m = markers.find(m => m.id === id);
  if (m) {
    map.setView([m.lat, m.lng], 14);
    m.leafletMarker.openTooltip();
  }

  // Marcar activo en sidebar
  document.querySelectorAll('.marker-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });
}

// ── Renderizar sidebar ──
function renderSidebar() {
  const list = document.getElementById('marker-list');
  const empty = document.getElementById('empty-state');

  if (markers.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }

  list.innerHTML = markers.map(m => `
    <div class="marker-item" data-id="${m.id}" onclick="focusMarker('${m.id}')">
      <div class="marker-item-info">
        <div class="marker-item-label">${m.label}</div>
        <div class="marker-item-coords">${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}</div>
      </div>
      <button class="btn-delete-marker" onclick="event.stopPropagation(); deleteMarker('${m.id}')" title="Eliminar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  `).join('');
}

// ── Logout ──
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  window.location.href = '/';
}

// ── Iniciar ──
loadMarkers();