import Image from "next/image";
import CulledVideo from "./CulledVideo";

interface ModalMacWindowProps {
  slug: string;
  title: string;
  thumbnail: string;
  accent: string;
}

export default function ModalMacWindow({
  slug,
  title,
  thumbnail,
  accent,
}: ModalMacWindowProps) {
  const isVideo = thumbnail.endsWith(".mp4") || thumbnail.endsWith(".webm");

  return (
    <div
      className="w-full rounded-lg overflow-hidden mb-8 border border-zinc-800 bg-zinc-900/60 relative shadow-2xl transition-all"
      style={{
        boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px -10px ${accent}20`,
      }}
    >
      {/* Chrome Header */}
      <div className="w-full h-8 bg-zinc-900/90 border-b border-zinc-800/80 px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90 border border-[#e0443e]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90 border border-[#dea123]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90 border border-[#1aab29]/40" />
        </div>
        <div className="text-[11px] font-mono text-zinc-500 tracking-wider">
          porto://projects/{slug}
        </div>
        <div className="w-10" />
      </div>

      {/* Media Canvas */}
      <div className="w-full aspect-video relative bg-black/40">
        {isVideo ? (
          <CulledVideo src={thumbnail} className="w-full h-full" />
        ) : (
          <Image
            src={thumbnail}
            alt={`${title} preview`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
          />
        )}
      </div>
    </div>
  );
}
