// ----------------------
// Map Initialization
// ----------------------
let map = L.map('map').setView([28.630501, -81.459345], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let markers = [];
let routeLine = null;
let salesLine = null;

// ----------------------
// Clear Map
// ----------------------
function clearMap() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  if (salesLine) { map.removeLayer(salesLine); salesLine = null; }
}

// ----------------------
// Tab switching
// ----------------------
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

// ----------------------
// Route Planner
// ----------------------
async function calculateRoute() {
  clearMap();

  const start = document.getElementById('startPoint').value.split(',').map(Number);
  const dest = document.getElementById('destination').value;
  const avoidTolls = document.getElementById('avoidTollsRoute').checked;

  if (!dest) { alert('Please enter a destination address'); return; }

  try {
    console.log("Calculating route...");
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) { alert('Destination not found!'); return; }

    const destCoords = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${destCoords[1]},${destCoords[0]}?overview=full${avoidTolls ? '&exclude=toll' : ''}`;
    const routeRes = await fetch(osrmUrl);
    const routeData = await routeRes.json();
    if (!routeData.routes || routeData.routes.length === 0) {
      document.getElementById('routeResult').innerText = "Route not found.";
      return;
    }

    const route = routeData.routes[0];
    const duration = Math.round(route.duration / 60);
    const distanceMiles = (route.distance / 1000 * 0.621371).toFixed(1);
    document.getElementById('routeResult').innerText = `Fastest route: ${distanceMiles} miles, approx. ${duration} minutes.`;

    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
    routeLine = L.polyline(coords, {color: 'blue'}).addTo(map);

    const startMarker = L.marker([start[0], start[1]], {icon: greenIcon()}).addTo(map).bindPopup("Start").openPopup();
    const destMarker = L.marker(destCoords, {icon: blueIcon()}).addTo(map).bindPopup("Destination");
    markers.push(startMarker, destMarker);

    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.5));
  } catch (error) {
    console.error(error);
    document.getElementById('routeResult').innerText = "Error calculating route.";
  }
}

// ----------------------
// Suggested Areas (Preset)
// ----------------------
const suggestedAreasList = [
  "Mount Dora, FL",
  "Eustis, FL",
  "Apopka, FL",
  "Tavares, FL",
  "Leesburg, FL"
];

function renderSuggestedAreas() {
  const container = document.getElementById('suggestedAreas');
  container.innerHTML = '';
  suggestedAreasList.forEach(area => {
    const div = document.createElement('div');
    div.className = 'suggestion';
    div.innerText = area;
    div.onclick = () => {
      document.getElementById('city').value = area;
      findSales();
    };
    container.appendChild(div);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderSuggestedAreas();
});

// ----------------------
// Sales Planner
// ----------------------
async function findSales() {
  clearMap();

  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;
  const avoidTolls = document.getElementById('avoidTollsSales').checked;
  const startCoords = document.getElementById('startPointSales').value.split(',').map(Number);

  if (!city) { alert('Please enter a city or zip code'); return; }

  console.log("Finding sales locations for", type, "in", city);

  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) { alert('City not found!'); return; }

    const cityLat = parseFloat(geoData[0].lat);
    const cityLon = parseFloat(geoData[0].lon);

    let overpassQuery = '', maxResults = 0;
    if (type === 'coffee') {
      overpassQuery = `[out:json][timeout:25];node["office"](around:5000,${cityLat},${cityLon});out center 10;`;
      maxResults = 10;
    } else {
      overpassQuery = `[out:json][timeout:25];way["landuse"="residential"](around:5000,${cityLat},${cityLon});out center 5;`;
      maxResults = 3;
    }

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const res = await fetch(overpassUrl);
    const data = await res.json();
    if (!data.elements || data.elements.length === 0) {
      document.getElementById('salesResults').innerText = `No ${type} locations found near ${city}.`;
      return;
    }

    const stops = data.elements.map(el => {
      const lat = el.lat || (el.center && el.center.lat);
      const lon = el.lon || (el.center && el.center.lon);
      const name = el.tags && (el.tags.name || el.tags.building || el.tags.office) || "Unnamed location";
      return {name, lat, lon};
    }).filter(s => s.lat && s.lon).slice(0, maxResults);

    // Place markers and show in results
    document.getElementById('salesResults').innerHTML = stops.map((s,i) => {
      const marker = L.marker([s.lat, s.lon], {icon: type === 'coffee' ? blueIcon() : orangeIcon()})
        .addTo(map)
        .bindPopup(`${i+1}. ${s.name}`);
      markers.push(marker);
      return `${i+1}. ${s.name}`;
    }).join('<br>');

    const startMarker = L.marker([startCoords[0], startCoords[1]], {icon: greenIcon()}).addTo(map).bindPopup("Start").openPopup();
    markers.push(startMarker);

    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.5));
  } catch (error) {
    console.error(error);
    document.getElementById('salesResults').innerText = `Error finding ${type} locations.`;
  }
}

// ----------------------
// Leaflet Custom Icons
// ----------------------
function blueIcon() { return L.icon({ iconUrl:'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] }); }
function orangeIcon() { return L.icon({ iconUrl:'https://maps.google.com/mapfiles/ms/icons/orange-dot.png', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] }); }
function greenIcon() { return L.icon({ iconUrl:'https://maps.google.com/mapfiles/ms/icons/green-dot.png', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] }); }
