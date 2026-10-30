// ── Verificar autenticación ──
const token = localStorage.getItem('token');
const email = localStorage.getItem('email');

if (!token) window.location.href = '/';

document.getElementById('user-email').textContent = email || '';

// ── Inicializar mapa ──
const map = L.map('map').setView([13.6929, -89.2182], 8);

async function initTiles() {
  try {
    const res = await fetch('/api/config');
    const { stadiaKey } = await res.json();

    if (stadiaKey) {
      L.tileLayer(
        `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaKey}`,
        {
          attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors',
          maxZoom: 20
        }
      ).addTo(map);
    } else {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri © OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
    }
  } catch (err) {
    console.error('Error cargando tiles:', err);
  }
}

initTiles();

// ── Estado ──
let markers = [];
let markerCount = 0;
let pendingDeleteId = null;

const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// ── Colores disponibles ──
const COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Morado' },
  { value: '#EC4899', label: 'Rosa' },
];

// ── Icono con color dinámico ──
function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 2px ${color};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

// ── Cargar marcadores ──
async function loadMarkers() {
  try {
    const res = await fetch('/api/markers', { headers: authHeaders });
    if (res.status === 401 || res.status === 403) { logout(); return; }
    const data = await res.json();
    data.forEach(m => addLeafletMarker(m.id, m.lat, m.lng, m.label, m.color));
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
  const color = COLORS[markerCount % COLORS.length].value;

  try {
    const res = await fetch('/api/markers', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ lat: center.lat, lng: center.lng, label, color })
    });
    if (!res.ok) return;
    const data = await res.json();
    addLeafletMarker(data.id, data.lat, data.lng, data.label, data.color);
    renderSidebar();
    map.panTo([data.lat, data.lng]);
  } catch (err) {
    console.error('Error creando marcador:', err);
  }
}

// ── Agregar al mapa ──
function addLeafletMarker(id, lat, lng, label, color = '#3B82F6') {
  const leafletMarker = L.marker([lat, lng], {
    icon: makeIcon(color),
    draggable: true
  }).addTo(map);

  // Tooltip permanente
  leafletMarker.bindTooltip(label, {
    permanent: true,
    direction: 'top',
    offset: [0, -10],
    className: 'map-tooltip'
  });

  leafletMarker.on('dragend', async (e) => {
    const pos = e.target.getLatLng();
    await updateMarkerPosition(id, pos.lat, pos.lng);
    const m = markers.find(m => m.id === id);
    if (m) { m.lat = pos.lat; m.lng = pos.lng; }
    renderSidebar();
  });

  markers.push({ id, lat, lng, label, color, leafletMarker });
}

// ── Actualizar posición ──
async function updateMarkerPosition(id, lat, lng) {
  try {
    await fetch(`/api/markers/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ lat, lng })
    });
  } catch (err) {
    console.error('Error actualizando posición:', err);
  }
}

// ── Editar etiqueta ──
async function updateMarkerLabel(id, label) {
  try {
    await fetch(`/api/markers/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ label })
    });
    const m = markers.find(m => m.id === id);
    if (m) {
      m.label = label;
      m.leafletMarker.setTooltipContent(label);
    }
  } catch (err) {
    console.error('Error actualizando etiqueta:', err);
  }
}

// ── Actualizar color ──
async function updateMarkerColor(id, color) {
  try {
    await fetch(`/api/markers/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ color })
    });
    const m = markers.find(m => m.id === id);
    if (m) {
      m.color = color;
      m.leafletMarker.setIcon(makeIcon(color));
    }
  } catch (err) {
    console.error('Error actualizando color:', err);
  }
}

// ── Confirmar eliminación ──
function confirmDelete(id) {
  pendingDeleteId = id;
  renderSidebar();
}

function cancelDelete() {
  pendingDeleteId = null;
  renderSidebar();
}

async function deleteMarker(id) {
  try {
    const res = await fetch(`/api/markers/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!res.ok) return;
    const m = markers.find(m => m.id === id);
    if (m) map.removeLayer(m.leafletMarker);
    markers = markers.filter(m => m.id !== id);
    pendingDeleteId = null;
    renderSidebar();
  } catch (err) {
    console.error('Error eliminando marcador:', err);
  }
}

// ── Foco en marcador ──
function focusMarker(id) {
  const m = markers.find(m => m.id === id);
  if (m) map.setView([m.lat, m.lng], 14);
  document.querySelectorAll('.marker-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });
}

// ── Render sidebar ──
function renderSidebar() {
  const list = document.getElementById('marker-list');
  const counter = document.getElementById('marker-count');

  if (counter) counter.textContent = `${markers.length} marcador${markers.length !== 1 ? 'es' : ''}`;

  if (markers.length === 0) {
    list.innerHTML = `<div class="sidebar-empty">No hay marcadores.<br/>Presioná "Agregar" para crear uno.</div>`;
    return;
  }

  list.innerHTML = markers.map(m => {
    const isDeleting = pendingDeleteId === m.id;

    return `
      <div class="marker-item ${isDeleting ? 'deleting' : ''}" data-id="${m.id}">

        ${isDeleting ? `
          <div class="delete-confirm">
            <span>¿Eliminar este marcador?</span>
            <div class="delete-actions">
              <button class="btn-confirm-delete" onclick="deleteMarker('${m.id}')">Eliminar</button>
              <button class="btn-cancel-delete" onclick="cancelDelete()">Cancelar</button>
            </div>
          </div>
        ` : `
          <div class="marker-color-dot" style="background:${m.color}; flex-shrink:0;">
            <input type="color" value="${m.color}" title="Cambiar color"
              onchange="updateMarkerColor('${m.id}', this.value)"
              onclick="event.stopPropagation()" />
          </div>

          <div class="marker-item-info" onclick="focusMarker('${m.id}')">
            <div
              class="marker-item-label"
              contenteditable="true"
              spellcheck="false"
              onclick="event.stopPropagation()"
              onblur="updateMarkerLabel('${m.id}', this.textContent.trim())"
              onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
            >${m.label}</div>
            <div class="marker-item-coords">${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}</div>
          </div>

          <button class="btn-delete-marker" onclick="event.stopPropagation(); confirmDelete('${m.id}')" title="Eliminar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        `}

      </div>
    `;
  }).join('');
}

// ── Logout ──
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  window.location.href = '/';
}

loadMarkers();