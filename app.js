// ----------------------
// Map Initialization
// ----------------------
let map = L.map('map').setView([28.630501, -81.459345], 12); // default center
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let markers = [];
let routeLine = null;
let salesLine = null;

function clearMap() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  if (salesLine) {
    map.removeLayer(salesLine);
    salesLine = null;
  }
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

  if (!dest) {
    alert('Please enter a destination address');
    return;
  }

  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      alert('Destination not found!');
      return;
    }

    const destCoords = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
    const avoidTolls = document.getElementById('avoidTolls').checked;
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${destCoords[1]},${destCoords[0]}?overview=full${avoidTolls ? '&exclude=toll' : ''}`;
    const routeRes = await fetch(osrmUrl);
    const routeData = await routeRes.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      document.getElementById('routeResult').innerText = "Route not found.";
      return;
    }

    const route = routeData.routes[0];
    const duration = Math.round(route.duration / 60);
    const distance = (route.distance / 1000).toFixed(1);

    document.getElementById('routeResult').innerText = `Fastest route: ${distance} km, approx. ${duration} minutes.`;

    // Draw route polyline
    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
    routeLine = L.polyline(coords, {color: 'blue'}).addTo(map);

    // Add markers
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
// Sales Planner
// ----------------------
async function findSales() {
  clearMap();

  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;

  if (!city) {
    alert('Please enter a city or zip code');
    return;
  }

  try {
    // Geocode city
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      alert('City not found!');
      return;
    }
    const cityLat = parseFloat(geoData[0].lat);
    const cityLon = parseFloat(geoData[0].lon);

    let overpassQuery = '';
    let maxResults = 0;

    if (type === 'coffee') {
      overpassQuery = `
        [out:json][timeout:25];
        (
          node["office"](around:5000,${cityLat},${cityLon});
          way["building"="commercial"](around:5000,${cityLat},${cityLon});
        );
        out center 10;
      `;
      maxResults = 10;
    } else {
      overpassQuery = `
        [out:json][timeout:25];
        way["landuse"="residential"](around:5000,${cityLat},${cityLon});
        out center 3;
      `;
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
      const addr = el.tags && (el.tags["addr:street"] ? el.tags["addr:street"] + (el.tags["addr:housenumber"] ? " " + el.tags["addr:housenumber"] : "") : "");
      return {name, addr, lat, lon};
    }).filter(s => s.lat && s.lon).slice(0, maxResults);

    // Nearest-neighbor ordering
    const startCoords = document.getElementById('startPoint').value.split(',').map(Number);
    let current = {lat: startCoords[0], lon: startCoords[1]};
    let remaining = [...stops];
    let ordered = [];

    while (remaining.length > 0) {
      remaining.sort((a,b) => distanceBetween(current,a) - distanceBetween(current,b));
      const next = remaining.shift();
      next.distFromStart = distanceBetween({lat: startCoords[0], lon: startCoords[1]}, next).toFixed(1);
      ordered.push(next);
      current = next;
    }

    // Display results and add markers
    document.getElementById('salesResults').innerHTML = ordered.map((s,i) => {
      const marker = L.marker([s.lat, s.lon], {icon: type === 'coffee' ? blueIcon() : orangeIcon()})
        .addTo(map)
        .bindPopup(`${i+1}. ${s.name} ${s.addr ? '- ' + s.addr : ''} (Distance from start: ${s.distFromStart} km)`);
      markers.push(marker);
      return `${i+1}. ${s.name} ${s.addr ? '- ' + s.addr : ''} (Distance from start: ${s.distFromStart} km)`;
    }).join('<br>');

    // Add starting location
    const startMarker = L.marker([startCoords[0], startCoords[1]], {icon: greenIcon()}).addTo(map).bindPopup("Start").openPopup();
    markers.push(startMarker);

    // Draw polyline connecting stops
    const polyCoords = ordered.map(s => [s.lat, s.lon]);
    if (polyCoords.length > 0) {
      salesLine = L.polyline([ [startCoords[0], startCoords[1]], ...polyCoords ], {
        color: type === 'coffee' ? 'blue' : 'orange',
        dashArray: '5,10'
      }).addTo(map);
    }

    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.5));

  } catch (error) {
    console.error(error);
    document.getElementById('salesResults').innerText = `Error finding ${type} locations.`;
  }
}

// ----------------------
// Helper: distance in km
// ----------------------
function distanceBetween(a,b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = dLon * Math.cos((lat1+lat2)/2);
  const y = dLat;
  return Math.sqrt(x*x + y*y) * R;
}

// ----------------------
// Leaflet Custom Icons
// ----------------------
function blueIcon() {
  return L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [32,32],
    iconAnchor: [16,32],
    popupAnchor: [0,-32]
  });
}

function orangeIcon() {
  return L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
    iconSize: [32,32],
    iconAnchor: [16,32],
    popupAnchor: [0,-32]
  });
}

function greenIcon() {
  return L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [32,32],
    iconAnchor: [16,32],
    popupAnchor: [0,-32]
  });
}
