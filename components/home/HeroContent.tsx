import { IBM_Plex_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { Download, Send, FolderOpen } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export default function HeroContent() {
  return (
    <div className="relative z-20 flex flex-col items-center text-center text-white px-6 w-full max-w-4xl mx-auto -mt-32 md:-mt-52">
      {/* 1. Big Text - Plus Jakarta Sans */}
      <h1 className={`${plusJakartaSans.className} text-4xl md:text-5xl font-[700] tracking-tight mb-2 drop-shadow-xs`}>
        "Digitalisasi dimulai dari hati"
      </h1>

      {/* 2. Contact Text - IBM Plex Serif */}
      <p className={`${ibmPlexSerif.className} font-[400] text-3xl md:text-4xl opacity-90 mb-[60]`}>
        <span className="italic">Contact me!</span> Mari berkolaborasi.
      </p>

      {/* 3. Subtext - IBM Plex Serif */}
      <p className={`${ibmPlexSerif.className} font-[400] text-[22.5px] opacity-90 mb-2`}>
        Full-stack Dev & Product Designer
      </p>

      {/* 4. CTA Buttons */}
      <div className="flex justify-center -space-x-2 w-full max-w-fit mx-auto drop-shadow-xl">
        <a
          href="/cv.pdf"
          style={{
            borderTopLeftRadius: "6px",
            borderBottomLeftRadius: "6px",
            borderTopRightRadius: "20px",
            borderBottomRightRadius: "20px",
          }}
          className="group flex items-center justify-center bg-zinc-950 text-white text-sm px-6 py-2 font-medium z-10"
        >
          <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[15px] opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
            <Download size={15} />
          </span>
          <span>CV</span>
          <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-[15px] group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
            <Download size={15} />
          </span>
        </a>
        <a
          href="mailto:contact@example.com"
          className="group flex items-center justify-center bg-zinc-950 text-white text-sm px-6 py-2 rounded-full font-medium z-20"
        >
          <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[15px] opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
            <Send size={15} />
          </span>
          <span>Send an Email</span>
          <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-[15px] group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
            <Send size={15} />
          </span>
        </a>
        <a
          href="#projects"
          style={{
            borderTopLeftRadius: "20px",
            borderBottomLeftRadius: "20px",
            borderTopRightRadius: "6px",
            borderBottomRightRadius: "6px",
          }}
          className="group flex items-center justify-center bg-zinc-950 text-white text-sm px-6 py-2 font-medium z-10"
        >
          <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[15px] opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
            <FolderOpen size={15} />
          </span>
          <span>Projects</span>
          <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-[15px] group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
            <FolderOpen size={15} />
          </span>
        </a>
      </div>
    </div>
  );
}
