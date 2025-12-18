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
  const start = document.getElementById('startPoint').value.split(',');
  const dest = document.getElementById('destination').value;

  if (!dest) {
    alert('Please enter a destination address');
    return;
  }

  try {
    // Geocode destination with Nominatim
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      alert('Destination not found!');
      return;
    }

    const destCoords = [geoData[0].lon, geoData[0].lat];

    // OSRM routing
    const avoidTolls = document.getElementById('avoidTolls').checked;
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${destCoords[0]},${destCoords[1]}?overview=false${avoidTolls ? '&exclude=toll' : ''}`;

    const routeRes = await fetch(osrmUrl);
    const routeData = await routeRes.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      document.getElementById('routeResult').innerText = "Route not found.";
      return;
    }

    const route = routeData.routes[0];
    const duration = Math.round(route.duration / 60); // minutes
    const distance = (route.distance / 1000).toFixed(1); // km

    document.getElementById('routeResult').innerText = `Fastest route: ${distance} km, approx. ${duration} minutes.`;

  } catch (error) {
    console.error(error);
    document.getElementById('routeResult').innerText = "Error calculating route.";
  }
}

// ----------------------
// Sales Planner
// ----------------------
async function findSales() {
  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;

  if (!city) {
    alert('Please enter a city or zip code');
    return;
  }

  try {
    // Step 1: Geocode city to get lat/lon
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
      // Coffee: look for offices / commercial buildings
      overpassQuery = `
        [out:json][timeout:25];
        (
          node["office"](around:5000,${cityLat},${cityLon});
          way["building"="commercial"](around:5000,${cityLat},${cityLon});
        );
        out center ${10};
      `;
      maxResults = 10;
    } else {
      // Shaved ice: look for residential areas
      overpassQuery = `
        [out:json][timeout:25];
        way["landuse"="residential"](around:5000,${cityLat},${cityLon});
        out center ${3};
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

    // Map elements to coordinates and names
    const stops = data.elements.map(el => {
      const lat = el.lat || (el.center && el.center.lat);
      const lon = el.lon || (el.center && el.center.lon);
      const name = el.tags && (el.tags.name || el.tags.building || el.tags.office) || "Unnamed location";
      return {name, lat, lon};
    }).filter(s => s.lat && s.lon).slice(0, maxResults);

    // Simple nearest-neighbor route ordering
    const start = document.getElementById('startPoint').value.split(',').map(Number);
    let orderedStops = [];
    let current = {lat: start[0], lon: start[1]};
    let remaining = [...stops];

    while (remaining.length > 0) {
      remaining.sort((a, b) => distanceBetween(current, a) - distanceBetween(current, b));
      const nextStop = remaining.shift();
      orderedStops.push(nextStop);
      current = nextStop;
    }

    // Display results
    document.getElementById('salesResults').innerHTML = orderedStops.map((s,i) => `${i+1}. ${s.name}`).join('<br>');

  } catch (error) {
    console.error(error);
    document.getElementById('salesResults').innerText = `Error finding ${type} locations.`;
  }
}

// Helper: approximate distance in km between two points
function distanceBetween(a,b) {
  const R = 6371; // Earth radius km
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x = dLon * Math.cos((lat1+lat2)/2);
  const y = dLat;
  return Math.sqrt(x*x + y*y) * R;
}
