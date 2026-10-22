import { useEffect, useState, useRef, RefObject } from "react";

export interface SpotifyData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
}

export const MOCK_TRACKS: SpotifyData[] = [
  {
    isPlaying: true,
    title: "Suiheisen wa Boku no Furukizu",
    artist: "yanaginagi",
    album: "Suiheisen",
    albumImageUrl: "/images/spotify/suiheisen.jpg",
    songUrl: "https://open.spotify.com/track/2jHegMG75LTPEHolqbm8UM",
    progressMs: 85000,
    durationMs: 281000,
  },
  {
    isPlaying: true,
    title: "君の知らない物語 -TV Edit-",
    artist: "supercell",
    album: "Today Is A Beautiful Day",
    albumImageUrl: "/images/spotify/bakemonogatari.jpg",
    songUrl: "https://open.spotify.com/track/3hcxvXjflT9z5UV9IJHjgF",
    progressMs: 65000,
    durationMs: 93000,
  },
  {
    isPlaying: true,
    title: "リトルソルジャー",
    artist: "田所あずさ",
    album: "Little Soldier",
    albumImageUrl: "/images/spotify/littlesoldier.jpg",
    songUrl: "https://open.spotify.com/track/4ESR8uG70TFcWKqtePEJpo",
    progressMs: 145000,
    durationMs: 234000,
  },
  {
    isPlaying: true,
    title: "STAY ALIVE ～REGAIN～",
    artist: "エミリア(CV:高橋李依)",
    album: "Re:ZERO",
    albumImageUrl: "/images/spotify/stayalive.jpg",
    songUrl: "https://open.spotify.com/track/0s2VcNK7LZdk4lGdIRgSdt",
    progressMs: 145000,
    durationMs: 294000,
  },
  {
    isPlaying: true,
    title: "薄ら氷心中",
    artist: "Sheena Ringo",
    album: "Sandokushi",
    albumImageUrl: "/images/spotify/sheenaringo.jpg",
    songUrl: "https://open.spotify.com/track/1DxOabtnI3W4ouECc6AdyT",
    progressMs: 45000,
    durationMs: 193000,
  },
  {
    isPlaying: true,
    title: "Sleep Walking Orchestra",
    artist: "BUMP OF CHICKEN",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2734fa6f800142c0e82a60b5bec",
    songUrl: "https://open.spotify.com/track/0vMBqdJIkmflvFk728hKH7",
    durationMs: 245000,
  },
  {
    isPlaying: true,
    title: "Aishite Aishite Aishite",
    artist: "Ado",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f5912abed0ea22e746552771",
    songUrl: "https://open.spotify.com/track/4gpvY7b9wHA9G1ZsMDu15b",
    durationMs: 204000,
  },
  {
    isPlaying: true,
    title: "風と行く道",
    artist: "大原ゆい子",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2738e06192b20db0e7665e299c1",
    songUrl: "https://open.spotify.com/track/0aNhn72dSTLI5DKcbx579b",
    durationMs: 265000,
  },
  {
    isPlaying: true,
    title: "Ketsui no Uta",
    artist: "大原ゆい子",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2739da7ea7ec3fdd889ada7462d",
    songUrl: "https://open.spotify.com/track/4lOOJXa8XJWOmT5Ha3COIu",
    durationMs: 278000,
  },
  {
    isPlaying: true,
    title: "Wind's Anthem (feat. suis From Yorushika)",
    artist: "Eve",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2734b3802ca0f0cde9fb1da1b2c",
    songUrl: "https://open.spotify.com/track/1xjyjzvD6l7nCHMySQrgVc",
    durationMs: 251000,
  },
  {
    isPlaying: true,
    title: "KIRA",
    artist: "Ado",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273422899ac4d2bf386921a9775",
    songUrl: "https://open.spotify.com/track/7FTTLL9jM3wcpgeCAJU9L6",
    durationMs: 198000,
  },
  {
    isPlaying: true,
    title: "LOVE 2000",
    artist: "八奈見杏菜（CV: 遠野ひかる）",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2739f3bd62e5cb8053fb94ad2c0",
    songUrl: "https://open.spotify.com/track/3SgrOFXKKNcffg5jFvU5Cf",
    durationMs: 258000,
  },
  {
    isPlaying: true,
    title: "Fuyubiyori",
    artist: "佐々木恵梨",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273e88c2d63e455f7c14c1082c0",
    songUrl: "https://open.spotify.com/track/4Ts3FQkEs1jRIbcgxxT7R0",
    durationMs: 242000,
  },
  {
    isPlaying: true,
    title: "会いたかった空",
    artist: "茅原実里",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2730b2ec123c0a0916817a07083",
    songUrl: "https://open.spotify.com/track/2WmY0S1XUdWaYiVRYap5H1",
    durationMs: 312000,
  },
  {
    isPlaying: true,
    title: "秘密",
    artist: "sumika",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2739324a240e4d3fc7ac67b225a",
    songUrl: "https://open.spotify.com/track/7y06U9dmbU1d73cX0gjMCj",
    durationMs: 215000,
  },
  {
    isPlaying: true,
    title: "春夏秋冬",
    artist: "sumika",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2739324a240e4d3fc7ac67b225a",
    songUrl: "https://open.spotify.com/track/3TQKZoYr4tH2YeJ02bcw1m",
    durationMs: 235000,
  },
  {
    isPlaying: true,
    title: "Sincerely",
    artist: "TRUE",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2732c3cbb74ae5cc1d3e8996983",
    songUrl: "https://open.spotify.com/track/1774XGEDmmV7ynAzCQHrhU",
    durationMs: 275000,
  },
  {
    isPlaying: true,
    title: "旅人の唄",
    artist: "大原ゆい子",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2738e06192b20db0e7665e299c1",
    songUrl: "https://open.spotify.com/track/7fgA5gjOjGlsIPLbUFvHDb",
    durationMs: 250000,
  },
  {
    isPlaying: true,
    title: "全力少年",
    artist: "Sukima Switch",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273d0624e5204e7871f088a65b9",
    songUrl: "https://open.spotify.com/track/3Ztjw8utVpcrzms1RrsJvR",
    durationMs: 275000,
  },
  {
    isPlaying: true,
    title: "Sincerely",
    artist: "Lia",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273dddca4ba4d52751dd192c99c",
    songUrl: "https://open.spotify.com/track/62X8QsHGfAImwjrCtlFByg",
    durationMs: 285000,
  },
  {
    isPlaying: true,
    title: "Sing My Pleasure",
    artist: "ヴィヴィ(Vo.八木海莉)",
    album: "Spotify Track",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b27330353054c4cdfe757f66997b",
    songUrl: "https://open.spotify.com/track/6wOazYrDGLhMAhwU6RArlg",
    durationMs: 275000,
  },
];

export function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getCurrentTimeTrack(): { track: SpotifyData; initialProgress: number } {
  const date = new Date();
  const currentHour = date.getHours();
  const isDowntime = currentHour >= 0 && currentHour < 7;
  const timeToUse = isDowntime
    ? new Date(date).setHours(0, 0, 0, 0) - 1
    : date.getTime();

  let totalDuration = 0;
  for (let i = 0; i < MOCK_TRACKS.length; i++) {
    totalDuration += MOCK_TRACKS[i].durationMs || 100000;
  }

  const currentLoopTime = timeToUse % totalDuration;
  let accumulatedTime = 0;
  let initialIndex = 0;
  let initialProgress = 0;

  for (let i = 0; i < MOCK_TRACKS.length; i++) {
    const duration = MOCK_TRACKS[i].durationMs || 100000;
    if (currentLoopTime < accumulatedTime + duration) {
      initialIndex = i;
      initialProgress = currentLoopTime - accumulatedTime;
      break;
    }
    accumulatedTime += duration;
  }

  return {
    track: {
      ...MOCK_TRACKS[initialIndex],
      progressMs: initialProgress,
      isPlaying: !isDowntime,
    },
    initialProgress,
  };
}

export function useSpotifyPlayback(
  isFlipped: boolean,
  barRef: RefObject<HTMLDivElement | null>,
  timeRef: RefObject<HTMLSpanElement | null>
) {
  const [data, setData] = useState<SpotifyData>(() => MOCK_TRACKS[0]);
  const progressRef = useRef<number>(0);
  const trackRef = useRef<SpotifyData | null>(null);
  const isFlippedRef = useRef(isFlipped);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  useEffect(() => {
    let startTime = Date.now();
    let baseProgress = 0;

    const { track: initialTrack, initialProgress } = getCurrentTimeTrack();
    trackRef.current = initialTrack;
    progressRef.current = initialProgress;
    baseProgress = initialProgress;
    startTime = Date.now();

    const frameId = requestAnimationFrame(() => {
      setData(initialTrack);
    });

    const interval = setInterval(() => {
      if (document.hidden || !isFlippedRef.current) return;

      const currentTrack = trackRef.current;
      if (!currentTrack || !currentTrack.isPlaying || currentTrack.durationMs === undefined) return;

      const elapsed = Date.now() - startTime;
      progressRef.current = baseProgress + elapsed;

      if (progressRef.current >= currentTrack.durationMs) {
        const currentIndex = MOCK_TRACKS.findIndex((t) => t.songUrl === currentTrack.songUrl);
        const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % MOCK_TRACKS.length : 0;
        const nextTrack = {
          ...MOCK_TRACKS[nextIndex],
          progressMs: 0,
          isPlaying: true,
        };
        trackRef.current = nextTrack;
        progressRef.current = 0;
        startTime = Date.now();
        baseProgress = 0;
        setData(nextTrack);
        return;
      }

      if (barRef.current) {
        const percentage = Math.min((progressRef.current / currentTrack.durationMs) * 100, 100);
        barRef.current.style.width = `${percentage}%`;
      }
      if (timeRef.current) {
        timeRef.current.innerText = formatTime(progressRef.current);
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
    };
  }, [barRef, timeRef]);

  return data;
}
