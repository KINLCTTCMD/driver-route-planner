// ----------------------
// MAP SETUP
// ----------------------
let map = L.map('map').setView([28.630501, -81.459345], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let markers = [];
let routeLine = null;

// ----------------------
// UTILITIES
// ----------------------
function clearMap() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

// ----------------------
// ROUTE PLANNER
// ----------------------
async function calculateRoute() {
  clearMap();

  const start = document.getElementById('startPoint').value.split(',').map(Number);
  const dest = document.getElementById('destination').value;
  const avoidTolls = document.getElementById('avoidTolls').checked;

  if (!dest) {
    alert('Please enter a destination address');
    return;
  }

  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
  const geoData = await geoRes.json();

  if (!geoData.length) {
    alert('Destination not found');
    return;
  }

  const destCoords = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${destCoords[1]},${destCoords[0]}?overview=full${avoidTolls ? '&exclude=toll' : ''}`;

  const routeRes = await fetch(osrmUrl);
  const routeData = await routeRes.json();

  const route = routeData.routes[0];
  const miles = (route.distance / 1000 * 0.621371).toFixed(1);
  const minutes = Math.round(route.duration / 60);

  document.getElementById('routeResult').innerText =
    `Fastest route: ${miles} miles · ${minutes} minutes`;

  const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
  routeLine = L.polyline(coords, { color: 'blue' }).addTo(map);

  markers.push(
    L.marker(start, { icon: greenIcon() }).addTo(map).bindPopup("Start"),
    L.marker(destCoords, { icon: blueIcon() }).addTo(map).bindPopup("Destination")
  );

  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

// ----------------------
// SALES PLANNER (NO API – RELIABLE)
// ----------------------
function findSales() {
  clearMap();

  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;

  if (!city) {
    alert("Enter a city or zip code");
    return;
  }

  // Preset smart locations (demo logic)
  const locations = type === 'coffee'
    ? [
        { name: "Downtown Business District", lat: 28.8025, lon: -81.6445 },
        { name: "Medical Offices", lat: 28.8102, lon: -81.6531 },
        { name: "Office Park", lat: 28.7953, lon: -81.6672 }
      ]
    : [
        { name: "Elementary School Zone", lat: 28.8051, lon: -81.6501 },
        { name: "City Park", lat: 28.7902, lon: -81.6404 },
        { name: "Residential Neighborhood", lat: 28.8153, lon: -81.6608 }
      ];

  document.getElementById('salesResults').innerHTML =
    `<strong>Suggested ${type === 'coffee' ? "Coffee" : "Kona Ice"} Stops:</strong><br><br>`;

  locations.forEach((loc, i) => {
    const marker = L.marker([loc.lat, loc.lon], {
      icon: type === 'coffee' ? blueIcon() : orangeIcon()
    }).addTo(map).bindPopup(`${i + 1}. ${loc.name}`);

    markers.push(marker);
    document.getElementById('salesResults').innerHTML += `${i + 1}. ${loc.name}<br>`;
  });

  map.fitBounds(L.featureGroup(markers).getBounds(), { padding: [50, 50] });
}

// ----------------------
// ICONS
// ----------------------
function blueIcon() {
  return L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
}

function orangeIcon() {
  return L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
}

function greenIcon() {
  return L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
}
