import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const base = "http://127.0.0.1:4173";
let ready = false;
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await fetch(base + "/os");
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
assert.ok(ready, "Vite preview server did not become ready");

for (const route of ["/", "/os", "/console"]) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, `${route} should resolve to the SPA entry point`);
  const html = await response.text();
  assert.match(html, /id="root"/, `${route} should render the application mount point`);
}

const files = await readdir(new URL("../dist/assets/", import.meta.url));
const bundles = await Promise.all(
  files.filter((file) => file.endsWith(".js")).map((file) =>
    readFile(new URL("../dist/assets/" + file, import.meta.url), "utf8")
  ),
);
const app = bundles.join("\n");
for (const expected of [
  "Engineering Console",
  "Operator Workspace",
  "Fetch live catalogue",
  "Training workers",
  "No credentials, customer records or sensor secrets are stored here",
]) {
  assert.ok(app.includes(expected), `Built app should include: ${expected}`);
}
console.log("NOVA OS homepage, /os and /console route smoke tests passed.");
