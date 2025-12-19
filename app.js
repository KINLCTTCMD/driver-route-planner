let map = L.map('map').setView([28.63, -81.46], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let routeLine;
let salesStops = [];
let currentStopIndex = 0;

// ---------- TABS ----------
function showTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById(tab).classList.remove('hidden');
  btn.classList.add('active');
}

// ---------- ROUTE ----------
async function calculateRoute() {
  if (routeLine) map.removeLayer(routeLine);

  const start = document.getElementById('startPoint').value.split(',');
  const dest = document.getElementById('destination').value;
  const avoidTolls = document.getElementById('avoidTolls').checked;

  if (!dest) return alert("Enter destination");

  // Geocode destination
  const geo = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`
  ).then(r => r.json());

  if (!geo.length) return alert("Address not found");

  const endLat = parseFloat(geo[0].lat);
  const endLon = parseFloat(geo[0].lon);

  // OSRM route
  const route = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${endLon},${endLat}?overview=full${avoidTolls ? '&exclude=toll' : ''}`
  ).then(r => r.json());

  if (!route.routes || route.routes.length === 0) {
    alert("Route not found!");
    return;
  }

  const r = route.routes[0];
  const miles = (r.distance / 1000 * 0.621371).toFixed(1);
  const mins = Math.round(r.duration / 60);

  document.getElementById('routeResult').innerText =
    `${miles} miles · ${mins} minutes`;

  // Draw route on map
  const coords = r.geometry.coordinates.map(c => [c[1], c[0]]); // [lat, lon]
  routeLine = L.polyline(coords, {color: '#4f46e5', weight: 5}).addTo(map);
  map.fitBounds(routeLine.getBounds());

  // Show Google Maps link
  const gMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${endLat},${endLon}&travelmode=driving`;
  const actionsDiv = document.getElementById('routeActions');
  actionsDiv.classList.remove('hidden');
  actionsDiv.querySelector('button').onclick = () => window.open(gMapsUrl, "_blank");
}

function openInMaps() {
  document.getElementById('routeActions').querySelector('button').click();
}

// ---------- SALES ----------
function findSales() {
  salesStops = [];
  currentStopIndex = 0;

  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;

  if (!city) return alert("Enter city or zip");

  // Demo stops; replace with actual logic or API as needed
  salesStops = type === "coffee"
    ? ["Starbucks " + city, "AdventHealth " + city, "Lowes " + city, "Office Park " + city]
    : ["Neighborhood " + city, "Community Park " + city, "Elementary School " + city];

  document.getElementById('salesResults').innerHTML =
    salesStops.map((s, i) => `${i+1}. ${s}`).join("<br>");

  document.getElementById('nextStopBtn').classList.remove('hidden');
}

function navigateNextStop() {
  if (currentStopIndex >= salesStops.length) {
    alert("All stops completed!");
    return;
  }
  const stop = salesStops[currentStopIndex];
  currentStopIndex++;
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(stop)}`, "_blank");
}

// ---------- EVENTS ----------
function findEvents() {
  const zip = document.getElementById('eventZip').value.trim();
  if (!zip) return alert("Enter zip code");

  const searchQuery = encodeURIComponent(`${zip} events`);
  const googleUrl = `https://www.google.com/search?q=${searchQuery}`;

  window.open(googleUrl, "_blank");

  document.getElementById('eventResults').innerHTML = `
    <p>Click to view upcoming events in <strong>${zip}</strong>:</p>
    <a href="${googleUrl}" target="_blank">View Events on Google</a>
  `;
}
