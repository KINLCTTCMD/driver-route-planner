function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

async function calculateRoute() {
  const start = document.getElementById('startPoint').value;
  const dest = document.getElementById('destination').value;

  document.getElementById('routeResult').innerText =
    "Route calculated (demo). Connect OSRM next.";
}

function findSales() {
  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;
  document.getElementById('salesResults').innerText =
    `Sales locations for ${type} in ${city} (demo).`;
}
