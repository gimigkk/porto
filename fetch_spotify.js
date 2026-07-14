const urls = [
"https://open.spotify.com/track/6wOazYrDGLhMAhwU6RArlg?si=815f9a89e47b44ca"
];

const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const decodeHtml = (html) => {
    return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#039;/g, "'");
};

async function getTrackData(url) {
  try {
    const html = await fetchHtml(url);
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let rawTitle = titleMatch ? titleMatch[1] : "";
    rawTitle = decodeHtml(rawTitle);
    
    // Usually: "Title - song and lyrics by Artist | Spotify"
    let title = rawTitle;
    let artist = "Unknown Artist";
    
    if (title.includes(" - song and lyrics by ")) {
        const parts = title.split(" - song and lyrics by ");
        title = parts[0];
        artist = parts[1].split(" | ")[0];
    } else if (title.includes(" - song by ")) {
        const parts = title.split(" - song by ");
        title = parts[0];
        artist = parts[1].split(" | ")[0];
    } else if (title.includes(" - Single by ")) {
        const parts = title.split(" - Single by ");
        title = parts[0];
        artist = parts[1].split(" | ")[0];
    } else if (title.includes(" - EP by ")) {
        const parts = title.split(" - EP by ");
        title = parts[0];
        artist = parts[1].split(" | ")[0];
    }
    
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    const imageUrl = imageMatch ? imageMatch[1] : "";
    
    const durationMatch = html.match(/<meta property="music:duration" content="(.*?)"/);
    const durationMs = durationMatch ? parseInt(durationMatch[1]) * 1000 : 200000;
    
    return {
      isPlaying: true,
      title: title,
      artist: artist,
      album: "Spotify Track",
      albumImageUrl: imageUrl,
      songUrl: url.split('?')[0],
      durationMs: durationMs
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function run() {
  const tracks = [];
  for (const url of urls) {
     const t = await getTrackData(url);
     if (t) tracks.push(t);
  }
  console.log(JSON.stringify(tracks, null, 2));
}
run();
