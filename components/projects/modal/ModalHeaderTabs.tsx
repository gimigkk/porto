"use client";

interface ModalHeaderTabsProps {
  currentIndex: number;
  totalProjects: number;
  isAnimating: boolean;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onClose: () => void;
}

export default function ModalHeaderTabs({
  currentIndex,
  totalProjects,
  isAnimating,
  onPrev,
  onNext,
  onClose,
}: ModalHeaderTabsProps) {
  return (
    <div
      className={`flex w-full items-end justify-between h-[40px] shrink-0 relative z-30 ${
        isAnimating ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Left Tab: Pagination */}
      <div className="relative w-[180px] h-full flex items-center justify-center">
        <svg
          width="288"
          height="64"
          viewBox="0 0 288 64"
          className="absolute inset-0 w-full h-full fill-zinc-950 overflow-visible"
        >
          <path
            d="M 0.8 64.8 L 0.8 24 Q 0.8 0, 24 0 L 204 0 Q 224 0, 232 16 L 248 48 Q 256 64.8, 276 64.8 L 288 64.8"
            stroke="#52525b"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="relative z-10 flex items-center justify-center gap-3 pb-1 pr-8 w-full">
          <button
            onClick={onPrev}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Previous project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[13px] font-mono text-zinc-400 select-none">
            {currentIndex + 1} of {totalProjects}
          </span>
          <button
            onClick={onNext}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Next project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Tab: Close Button */}
      <div className="relative w-[80px] h-full flex items-center justify-center">
        <svg
          width="128"
          height="64"
          viewBox="0 0 128 64"
          className="absolute inset-0 w-full h-full fill-zinc-950 overflow-visible"
        >
          <path
            d="M 0 64.8 L 12 64.8 Q 32 64.8, 40 48 L 56 16 Q 64 0, 84 0 L 104 0 Q 127.2 0, 127.2 24 L 127.2 64.8"
            stroke="#52525b"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="relative z-10 flex items-center justify-center pb-1 pl-8 w-full">
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
