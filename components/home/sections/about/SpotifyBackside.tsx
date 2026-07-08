"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useTooltip } from "@/components/providers/TooltipProvider";

interface SpotifyData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
}

const MOCK_TRACKS: SpotifyData[] = [
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
    title: "JANE DOE",
    artist: "Kenshi Yonezu, Hikaru Utada",
    album: "JANE DOE",
    albumImageUrl: "/images/spotify/janedoe.png",
    songUrl: "https://open.spotify.com/track/4oE7MyJhqSD3BaHRpNs8Nl",
    progressMs: 120000,
    durationMs: 236000,
  }
];

export default function SpotifyBackside() {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showTooltip, hideTooltip } = useTooltip();

  useEffect(() => {
    // Pick a random track from the mock array on mount to avoid hydration mismatch
    const randomTrack = MOCK_TRACKS[Math.floor(Math.random() * MOCK_TRACKS.length)];
    // Randomize the start progress between 0 and the song duration
    const randomizedTrack = {
      ...randomTrack,
      progressMs: Math.floor(Math.random() * (randomTrack.durationMs || 100000))
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(randomizedTrack);
    setLoading(false);

    // Simulate playback progress
    const interval = setInterval(() => {
      setData((prev) => {
        if (!prev || !prev.isPlaying || prev.progressMs === undefined || prev.durationMs === undefined) return prev;

        // Change track if it finishes
        const newProgress = prev.progressMs + 1000;
        if (newProgress >= prev.durationMs) {
          let nextTrack = MOCK_TRACKS[Math.floor(Math.random() * MOCK_TRACKS.length)];
          // Ensure we don't pick the same track twice in a row
          while (MOCK_TRACKS.length > 1 && nextTrack.songUrl === prev.songUrl) {
            nextTrack = MOCK_TRACKS[Math.floor(Math.random() * MOCK_TRACKS.length)];
          }
          return { ...nextTrack, progressMs: 0 };
        }

        return { ...prev, progressMs: newProgress };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const progressPercentage =
    data && data.durationMs && data.progressMs
      ? Math.min((data.progressMs / data.durationMs) * 100, 100)
      : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!data || !data.title) {
    return (
      <div className="absolute inset-0 bg-[#0e0e0e] flex flex-col items-center justify-center p-6 text-center border border-zinc-800 rounded-lg">
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="currentColor"
          className="text-[#1DB954] mb-4 opacity-50"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <p className="text-zinc-500 font-medium text-sm">Not playing anything right now</p>
      </div>
    );
  }

  return (
    <a
      href={data.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 bg-[#0e0e0e] rounded-lg border border-zinc-800 overflow-hidden flex flex-col items-center justify-between p-4 cursor-pointer"
      onMouseEnter={() => showTooltip(
        <div className="flex items-center gap-3 px-4 py-3">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-[#1DB954] shrink-0">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm text-neutral-900 dark:text-white">Open in Spotify?</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Play full track</span>
          </div>
        </div>
      )}
      onMouseLeave={hideTooltip}
    >
      {/* Top half: Album Art */}
      <div
        className="w-full relative aspect-square bg-[#121212] rounded-md shadow-lg flex flex-col overflow-hidden border border-zinc-800"
      >
        <div className="relative w-full h-full">
          {data.albumImageUrl ? (
            <Image
              src={data.albumImageUrl}
              alt={data.album || "Album Art"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full bg-zinc-200" />
          )}
        </div>
      </div>

      {/* Bottom half: Text & Progress */}
      <div className="w-full mt-6 mb-2 flex flex-col justify-end">
        <div className="mb-4">
          <p className="text-xs text-zinc-400 font-medium mb-1 tracking-wide uppercase">
            {data.isPlaying ? "Currently Playing" : "Recently Played"}
          </p>
          <h4 className="text-white font-bold text-lg leading-tight truncate">
            {data.title}
          </h4>
          <p className="text-zinc-400 text-sm truncate">{data.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative mb-1.5">
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-linear relative"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Progress Dot Handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full translate-x-1/2 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 font-medium tracking-widest font-mono">
            <span>{formatTime(data.progressMs || 0)}</span>
            <span>{formatTime(data.durationMs || 0)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
