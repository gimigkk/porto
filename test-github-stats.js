const https = require('https');

https.get('https://github.com/users/gimigkk/contributions', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /data-date="([^"]+)"[^>]*data-level="([^"]+)"/g;
    const matches = [...data.matchAll(regex)];
    const levels = {0:0, 1:0, 2:0, 3:0, 4:0};
    matches.forEach(m => {
      levels[m[2]]++;
    });
    console.log(levels);
  });
});
