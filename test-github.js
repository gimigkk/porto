const https = require('https');

https.get('https://github.com/users/gimigkk/contributions', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /data-date="([^"]+)"[^>]*data-level="([^"]+)"/g;
    const matches = [...data.matchAll(regex)];
    const levels = matches.map(m => parseInt(m[2], 10));
    const nonZero = levels.filter(l => l > 0).length;
    console.log(`Found ${matches.length} days, ${nonZero} non-zero days`);
  });
});
