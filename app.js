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

  const geo = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`
  ).then(r => r.json());

  if (!geo.length) return alert("Address not found");

  const end = [geo[0].lat, geo[0].lon];

  const route = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full${avoidTolls ? '&exclude=toll' : ''}`
  ).then(r => r.json());

  const r = route.routes[0];
  const miles = (r.distance / 1000 * 0.621371).toFixed(1);
  const mins = Math.round(r.duration / 60);

  document.getElementById('routeResult').innerText =
    `${miles} miles · ${mins} minutes`;

  const coords = r.geometry.coordinates.map(c => [c[1], c[0]]);
  routeLine = L.polyline(coords).addTo(map);
  map.fitBounds(routeLine.getBounds());

  document.getElementById('routeActions').classList.remove('hidden');
}

function openInMaps() {
  const dest = document.getElementById('destination').value;
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(dest)}`, "_blank");
}

// ---------- SALES ----------
function findSales() {
  salesStops = [];
  currentStopIndex = 0;

  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;

  if (!city) return alert("Enter city or zip");

  // DEMO STOPS (replace later with smarter logic)
  salesStops = type === "coffee"
    ? [
        "Starbucks Distribution Apopka FL",
        "AdventHealth Apopka",
        "Lowes Distribution Center Apopka",
        "Office Park Apopka FL"
      ]
    : [
        "Neighborhood Apopka FL",
        "Community Park Apopka FL",
        "Elementary School Area Apopka FL"
      ];

  document.getElementById('salesResults').innerHTML =
    salesStops.map((s, i) => `${i + 1}. ${s}`).join("<br>");

  document.getElementById('nextStopBtn').classList.remove('hidden');
}

// ---------- NEXT STOP ----------
function navigateNextStop() {
  if (currentStopIndex >= salesStops.length) {
    alert("All stops completed!");
    return;
  }

  const stop = salesStops[currentStopIndex];
  currentStopIndex++;

  window.open(
    `https://www.google.com/maps/search/${encodeURIComponent(stop)}`,
    "_blank"
  );
}
