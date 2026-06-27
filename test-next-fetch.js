async function run() {
  try {
    const res = await fetch("https://github.com/users/gimigkk/contributions");
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const regex = /data-date="([^"]+)"[^>]*data-level="([^"]+)"/g;
    const matches = [...html.matchAll(regex)];
    console.log(`Found ${matches.length} days via fetch`);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
