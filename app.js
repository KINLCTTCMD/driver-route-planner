// ---------------- MAP ----------------
let map = L.map('map').setView([28.63, -81.46], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
let routeLine = null;

function clearMap() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (routeLine) map.removeLayer(routeLine);
}

// ---------------- TABS ----------------
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

// ---------------- ROUTE PLANNER ----------------
async function calculateRoute() {
  clearMap();

  const start = document.getElementById('startPoint').value.split(',').map(Number);
  const dest = document.getElementById('destination').value;
  const avoidTolls = document.getElementById('avoidTolls').checked;

  if (!dest) return alert("Enter a destination");

  const geo = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`
  ).then(r => r.json());

  if (!geo.length) return alert("Destination not found");

  const end = [geo[0].lat, geo[0].lon];

  const osrm = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full${avoidTolls ? '&exclude=toll' : ''}`
  ).then(r => r.json());

  const route = osrm.routes[0];
  const miles = (route.distance / 1000 * 0.621371).toFixed(1);
  const mins = Math.round(route.duration / 60);

  document.getElementById('routeResult').innerText =
    `${miles} miles · ${mins} minutes`;

  const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
  routeLine = L.polyline(coords).addTo(map);
  map.fitBounds(routeLine.getBounds());
}

// ---------------- SALES PLANNER ----------------
function findSales() {
  clearMap();
  const type = document.getElementById('salesType').value;

  const candidates = type === "coffee"
    ? coffeeCandidates()
    : iceCandidates();

  candidates.sort((a, b) => b.score - a.score);
  const results = candidates.slice(0, type === "coffee" ? 5 : 3);

  let html = "<h3>Best Stops</h3>";

  results.forEach((loc, i) => {
    html += `
      ${i + 1}. ${loc.name}
      <div class="score">Score: ${loc.score}</div>
      <small>${loc.reason}</small><br><br>
    `;

    const m = L.marker([loc.lat, loc.lon]).addTo(map);
    markers.push(m);
  });

  document.getElementById('salesResults').innerHTML = html;
  map.fitBounds(L.featureGroup(markers).getBounds());
}

function coffeeCandidates() {
  return [
    score("Medical Office Cluster", 28.79, -81.64, 88, "Medical + office staff"),
    score("Warehouse District", 28.82, -81.66, 82, "Large workforce"),
    score("Office Park", 28.80, -81.67, 79, "Multiple businesses"),
    score("Downtown Business Area", 28.76, -81.64, 75, "Foot traffic"),
    score("Government Offices", 28.78, -81.63, 73, "Weekday demand")
  ];
}

function iceCandidates() {
  return [
    score("Large Subdivision Loop", 28.81, -81.65, 86, "Dense neighborhood"),
    score("School + Park Zone", 28.80, -81.62, 81, "Kids traffic"),
    score("Residential Sports Area", 28.83, -81.67, 78, "Weekend activity")
  ];
}

function score(name, lat, lon, value, reason) {
  return { name, lat, lon, score: value, reason };
}

// ---------------- EVENTS FINDER ----------------
function findEvents() {
  const zip = document.getElementById('eventZip').value;
  if (!zip) return alert("Enter a zip code");

  const now = new Date();
  const future = new Date();
  future.setMonth(now.getMonth() + 4);

  const baseSearch = "https://www.eventbrite.com/d/united-states--" + zip;
  const events = [
    eventLink("Festivals", `${baseSearch}/festival/`),
    eventLink("Concerts & Live Music", `${baseSearch}/music/`),
    eventLink("Holiday Events", `${baseSearch}/holiday/`),
    eventLink("Fairs & Carnivals", `${baseSearch}/fair/`),
    eventLink("Community Celebrations", `${baseSearch}/community/`)
  ];

  let html = "<h3>Food Truck-Friendly Events</h3>";

  events.forEach(e => {
    html += `
      <div class="event">
        <strong>${e.name}</strong><br>
        <small>${e.reason}</small><br>
        <a href="${e.link}" target="_blank">View Events</a>
      </div>
    `;
  });

  document.getElementById('eventResults').innerHTML = html;
}

function eventLink(name, link) {
  return {
    name,
    link,
    reason: "Public outdoor events — food vendors likely"
  };
}
