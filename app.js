// Switch tabs
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

// Calculate route using OpenStreetMap + OSRM
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

    // Build OSRM route URL
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

// Demo Sales Planner (placeholder)
function findSales() {
  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;

  if (!city) {
    alert('Please enter a city or zip code');
    return;
  }

  // Demo message
  document.getElementById('salesResults').innerText =
    `Demo sales locations for ${type} in ${city} (real suggestions coming next).`;
}
