const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const healthUrl = new URL("/api/health", baseUrl);

const response = await fetch(healthUrl);

if (!response.ok) {
  throw new Error(`Health check failed with HTTP ${response.status}`);
}

const body = await response.json();

if (body.ok !== true || body.service !== "cca-f-exam-prep") {
  throw new Error(`Unexpected health response: ${JSON.stringify(body)}`);
}

console.log(`Health check passed for ${healthUrl.toString()}`);
