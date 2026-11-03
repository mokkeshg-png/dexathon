import http from 'http';

const routes = [
  '/',
  '/login',
  '/register',
  '/projects',
  '/collaborators',
  '/search',
  '/dashboard',
  '/faculty',
  '/admin',
  '/industry',
  '/curriculum',
  '/recovery',
  '/subscription',
  '/messages',
  '/notifications',
  '/requests',
  '/settings',
];

async function checkRoute(r) {
  return new Promise((resolve) => {
    http.get('http://localhost:5175' + r, (res) => {
      resolve({ route: r, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ route: r, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing Vite HTTP server on localhost:5175 for all core routes:');
  let successCount = 0;
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`Route: ${res.route.padEnd(20)} -> Status: ${res.status || res.error}`);
    if (res.status === 200) successCount++;
  }
  console.log(`\nRoute Health: ${successCount} / ${routes.length} HTTP 200 OK (${Math.round((successCount/routes.length)*100)}%)`);
}

run();

