// Function to switch tabs
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

// Function to calculate route (demo, will be replaced with real routing later)
async function calculateRoute() {
  const start = document.getElementById('startPoint').value.split(',');
  const dest = document.getElementById('destination').value;

  if (!dest) {
    alert('Please enter a destination address');
    return;
  }

  document.getElementById('routeResult').innerText =
    `Route calculation demo for ${dest}. (Real routing coming next)`;
}

// Function to show sales locations (demo)
function findSales() {
  const type = document.getElementById('salesType').value;
  const city = document.getElementById('city').value;
  document.getElementById('salesResults').innerText =
    `Demo sales locations for ${type} in ${city}.`;
}
