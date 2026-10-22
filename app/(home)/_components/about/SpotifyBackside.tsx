"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { useSpotifyPlayback, formatTime } from "./useSpotifyPlayback";

export default function SpotifyBackside({
  isFlipped = false,
  isMobile = false,
}: {
  isFlipped?: boolean;
  isMobile?: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const data = useSpotifyPlayback(isFlipped, barRef, timeRef);
  const { showTooltip, hideTooltip } = useTooltip();

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

  const content = (
    <>
      {/* Top half: Album Art */}
      <div className="w-full relative aspect-square bg-[#121212] rounded-[3px] md:rounded-md shadow-lg flex flex-col overflow-hidden border border-zinc-800 shrink-0">
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
      <div className="w-full mt-1.5 md:mt-6 mb-0.5 md:mb-2 flex flex-col justify-end">
        <div className="mb-1 md:mb-4">
          <div className="flex items-center justify-between gap-1 mb-0.5 md:mb-1">
            <p className="text-[7.5px] md:text-xs text-zinc-400 font-medium tracking-wide uppercase truncate">
              {data.isPlaying ? "Currently Playing" : "Recently Played"}
            </p>
            {isMobile && data.songUrl && (
              <a
                href={data.songUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[7.5px] text-emerald-400 hover:text-emerald-300 font-mono underline shrink-0"
              >
                Spotify ↗
              </a>
            )}
          </div>
          <h4 className="text-white font-bold text-[10px] md:text-lg leading-tight truncate">
            {data.title}
          </h4>
          <p className="text-zinc-400 text-[8.5px] md:text-sm truncate leading-tight mt-0.5 mb-1 md:mb-0">
            {data.artist}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full">
          <div className="h-1 md:h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative mb-1 md:mb-1.5">
            <div
              ref={barRef}
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-linear relative"
              style={{
                width: data.durationMs
                  ? `${Math.min(((data.progressMs ?? 0) / data.durationMs) * 100, 100)}%`
                  : "0%",
              }}
            >
              {/* Progress Dot Handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full translate-x-1/2 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
          <div className="flex justify-between text-[7.5px] md:text-[10px] text-zinc-500 font-medium tracking-wider font-mono leading-none">
            <span ref={timeRef}>{formatTime(data.progressMs ?? 0)}</span>
            <span>{data.durationMs ? formatTime(data.durationMs) : "--:--"}</span>
          </div>
        </div>
      </div>
    </>
  );

  const containerClass =
    "absolute inset-0 bg-[#0e0e0e] rounded-[4px] md:rounded-lg border border-zinc-800 flex flex-col items-center justify-between p-2 md:p-4";

  if (isMobile) {
    return <div className={containerClass}>{content}</div>;
  }

  return (
    <a
      href={data.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${containerClass} cursor-pointer select-none`}
      onMouseEnter={() =>
        showTooltip(
          <div className="flex items-center gap-3 px-4 py-3">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              className="text-[#1DB954] shrink-0"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm text-neutral-900">Open in Spotify?</span>
              <span className="text-xs text-neutral-500">Play full track</span>
            </div>
          </div>
        )
      }
      onMouseLeave={hideTooltip}
    >
      {content}
    </a>
  );
}
