const baseUrl = (process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const routes = ['/', '/pricing', '/privacy', '/terms', '/api/health'];

let failed = false;
for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
    const acceptableRedirect = response.status >= 300 && response.status < 400;
    if (!response.ok && !acceptableRedirect) {
      failed = true;
      console.error(`FAIL ${route}: HTTP ${response.status}`);
    } else {
      console.log(`PASS ${route}: HTTP ${response.status}`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${route}:`, error instanceof Error ? error.message : error);
  }
}

if (failed) process.exit(1);
