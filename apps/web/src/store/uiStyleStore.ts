import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UIStyleId =
  | "neubrutalism"
  | "glassmorphism"
  | "neumorphism"
  | "cyberpunk"
  | "swiss-minimalism"
  | "aurora"
  | "claymorphism"
  | "bento"
  | "y2k"
  | "terminal"
  | "hand-drawn"
  | "oled";

export interface UIStyleDefinition {
  id: UIStyleId;
  name: string;
  category: "Modern & Trending" | "Retro & Nostalgia" | "Futuristic & Tech" | "Minimalist & Clean";
  tagline: string;
  description: string;
  era: string;
  colorPalette: string[];
  cssFeatures: string[];
  containerClass: string;
  cardClass: string;
  inputClass: string;
  buttonPrimaryClass: string;
  buttonSecondaryClass: string;
  badgeClass: string;
  accentColor: string;
}

export const UI_STYLES: UIStyleDefinition[] = [
  {
    id: "neubrutalism",
    name: "Neubrutalism",
    category: "Modern & Trending",
    tagline: "High contrast, bold 3px black borders, hard offset shadows, and vivid pop colors.",
    description: "A playful modern take on brutalism inspired by Figma, Notion, and Gumroad with unapologetic black strokes and zero-blur drop shadows.",
    era: "2022-Present Trend",
    colorPalette: ["#FFDE59", "#FF5757", "#00F0FF", "#7ED957", "#000000"],
    cssFeatures: ["border-3 border-black", "shadow-[5px_5px_0px_#000]", "font-black", "translate-y hover"],
    containerClass: "bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] text-black rounded-3xl",
    cardClass: "bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] text-black rounded-2xl",
    inputClass: "bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] text-black placeholder:text-neutral-500 rounded-xl font-medium focus:bg-[#FFF9E6] focus:outline-none focus:shadow-[4px_4px_0px_#000]",
    buttonPrimaryClass: "bg-[#FF5757] hover:bg-[#ff3b3b] text-white border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none font-black uppercase tracking-wider rounded-xl transition-all",
    buttonSecondaryClass: "bg-[#00F0FF] hover:bg-[#00d8e6] text-black border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none font-black rounded-xl transition-all",
    badgeClass: "bg-[#FFDE59] text-black border-[2.5px] border-black shadow-[2px_2px_0px_#000] font-black rounded-lg",
    accentColor: "#FF5757",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    category: "Modern & Trending",
    tagline: "Frosted translucent glass with vibrant background blurs and multi-layered depth.",
    description: "Uses backdrop-filter blur with semi-transparent layered surfaces and crisp 1px borders to create floating, ethereal UI elements.",
    era: "2020s Modern UI",
    colorPalette: ["#6366f1", "#a855f7", "#ec4899", "rgba(255,255,255,0.08)"],
    cssFeatures: ["backdrop-blur-xl", "bg-slate-900/60", "border-white/10"],
    containerClass: "bg-slate-950/80 backdrop-blur-2xl border border-white/10 text-slate-100 shadow-2xl rounded-3xl",
    cardClass: "bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl",
    inputClass: "bg-slate-950/70 border border-white/15 text-white placeholder:text-slate-500 rounded-xl focus:border-indigo-500",
    buttonPrimaryClass: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25",
    buttonSecondaryClass: "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-xl",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full",
    accentColor: "#6366f1",
  },
  {
    id: "neumorphism",
    name: "Neumorphism (Soft UI)",
    category: "Modern & Trending",
    tagline: "Soft extruded plastic surfaces with dual-directional highlights and cast shadows.",
    description: "Embossed and debossed tactile surfaces that appear to emerge seamlessly from the background through matching tone highlights and lowlights.",
    era: "2020 Soft UI Wave",
    colorPalette: ["#e0e5ec", "#ffffff", "#a3b1c6", "#31344b"],
    cssFeatures: ["box-shadow: 9px 9px 16px #bebebe, -9px -9px 16px #ffffff", "border-none"],
    containerClass: "bg-[#e8ecf2] text-slate-800 rounded-3xl shadow-[12px_12px_24px_#c5cbdb,-12px_-12px_24px_#ffffff]",
    cardClass: "bg-[#e8ecf2] text-slate-800 rounded-2xl shadow-[6px_6px_14px_#c5cbdb,-6px_-6px_14px_#ffffff]",
    inputClass: "bg-[#e8ecf2] text-slate-800 rounded-xl shadow-[inset_4px_4px_8px_#c5cbdb,inset_-4px_-4px_8px_#ffffff] border-0",
    buttonPrimaryClass: "bg-[#e8ecf2] text-indigo-600 font-bold rounded-xl shadow-[5px_5px_10px_#c5cbdb,-5px_-5px_10px_#ffffff]",
    buttonSecondaryClass: "bg-[#e8ecf2] text-slate-600 font-semibold rounded-xl shadow-[4px_4px_8px_#c5cbdb,-4px_-4px_8px_#ffffff]",
    badgeClass: "bg-[#e8ecf2] text-indigo-600 font-bold shadow-[inset_2px_2px_4px_#c5cbdb,inset_-2px_-2px_4px_#ffffff] rounded-lg",
    accentColor: "#4f46e5",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk / Sci-Fi HUD",
    category: "Futuristic & Tech",
    tagline: "High-tech neon cyan and magenta glow, dark matrix telemetry, and angular HUD frames.",
    description: "Futuristic dystopian aesthetic with high-saturation neon lights, technical bracket styling, scanlines, and monospace telemetry fonts.",
    era: "2077 Cyber Aesthetic",
    colorPalette: ["#00ffff", "#ff007f", "#ffe600", "#050811"],
    cssFeatures: ["text-shadow: 0 0 10px #00ffff", "box-shadow: 0 0 15px rgba(0,255,255,0.4)"],
    containerClass: "bg-[#050811] border-2 border-[#00ffff] shadow-[0_0_25px_rgba(0,255,255,0.3)] text-[#e0ffff] rounded-none font-mono",
    cardClass: "bg-[#0b1220] border border-[#ff007f]/60 text-[#e0ffff] rounded-none",
    inputClass: "bg-[#02050e] border border-[#00ffff]/60 text-[#00ffff] placeholder:text-[#00ffff]/40 rounded-none font-mono",
    buttonPrimaryClass: "bg-gradient-to-r from-[#00ffff] to-[#00a8ff] text-black font-black uppercase rounded-none",
    buttonSecondaryClass: "bg-transparent border border-[#ff007f] text-[#ff007f] font-mono rounded-none",
    badgeClass: "bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/80 font-mono rounded-none",
    accentColor: "#00ffff",
  },
  {
    id: "swiss-minimalism",
    name: "Minimalism & Swiss Style",
    category: "Minimalist & Clean",
    tagline: "Strict Bauhaus grid hierarchy, stark high-contrast typography, and zero ornament.",
    description: "Rooted in the 1950s International Typographic Style emphasizing absolute legibility, geometric precision, and purposeful negative space.",
    era: "1950s Swiss Modernism",
    colorPalette: ["#ffffff", "#000000", "#e5e5e5", "#ff3300"],
    cssFeatures: ["border border-black", "font-sans", "strict 8px grid"],
    containerClass: "bg-white text-black border border-black shadow-none rounded-none",
    cardClass: "bg-[#f7f7f7] text-black border border-black rounded-none",
    inputClass: "bg-white text-black border border-black rounded-none",
    buttonPrimaryClass: "bg-black text-white font-bold uppercase rounded-none border border-black",
    buttonSecondaryClass: "bg-white text-black font-bold uppercase rounded-none border border-black",
    badgeClass: "bg-black text-white font-mono uppercase text-[10px] rounded-none",
    accentColor: "#ff3300",
  },
  {
    id: "aurora",
    name: "Aurora UI / Gradient Mesh",
    category: "Modern & Trending",
    tagline: "Flowing organic gradient mesh, vibrant luminous blends, and ethereal color waves.",
    description: "Multidimensional color blending inspired by the Northern Lights, combining vibrant violet, cyan, and magenta gradients.",
    era: "2023-Present Trend",
    colorPalette: ["#4f46e5", "#ec4899", "#06b6d4", "#10b981"],
    cssFeatures: ["radial-gradient mesh", "backdrop-blur-3xl"],
    containerClass: "bg-slate-950/70 border border-purple-500/30 text-white rounded-3xl backdrop-blur-3xl",
    cardClass: "bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-pink-950/40 border border-pink-500/30 rounded-2xl",
    inputClass: "bg-slate-900/60 border border-purple-500/40 text-white rounded-xl",
    buttonPrimaryClass: "bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold rounded-xl",
    buttonSecondaryClass: "bg-indigo-950/60 text-purple-200 border border-purple-500/40 rounded-xl",
    badgeClass: "bg-purple-500/20 text-pink-200 border border-pink-500/40 rounded-full",
    accentColor: "#ec4899",
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    category: "Modern & Trending",
    tagline: "3D inflated pillowy clay aesthetic with soft double-layered inner & outer shadows.",
    description: "Chunky, friendly rounded 3D elements that resemble sculpted clay with playful tactile depth and smooth bouncy corners.",
    era: "2022 Metaverse Wave",
    colorPalette: ["#6366f1", "#f43f5e", "#10b981", "#f8fafc"],
    cssFeatures: ["border-radius: 32px", "double-shadows"],
    containerClass: "bg-[#4338ca] text-white rounded-[32px] shadow-[20px_20px_40px_rgba(0,0,0,0.3),inset_-10px_-10px_20px_rgba(0,0,0,0.2),inset_10px_10px_20px_rgba(255,255,255,0.3)] border-4 border-indigo-400/40",
    cardClass: "bg-[#4f46e5] text-white rounded-[24px] shadow-[12px_12px_24px_rgba(0,0,0,0.25),inset_-6px_-6px_12px_rgba(0,0,0,0.2),inset_6px_6px_12px_rgba(255,255,255,0.3)]",
    inputClass: "bg-[#3730a3] text-white rounded-2xl",
    buttonPrimaryClass: "bg-[#f43f5e] text-white font-extrabold rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.3)]",
    buttonSecondaryClass: "bg-[#6366f1] text-white font-bold rounded-2xl",
    badgeClass: "bg-[#10b981] text-white font-bold rounded-xl",
    accentColor: "#f43f5e",
  },
  {
    id: "bento",
    name: "Bento Box Grid",
    category: "Modern & Trending",
    tagline: "Apple-inspired modular segmented grid cards with pristine spatial balance.",
    description: "Modular card layouts inspired by traditional Japanese bento boxes with clean micro-surfaces.",
    era: "2023-Present Apple SaaS",
    colorPalette: ["#0f172a", "#1e293b", "#38bdf8", "#f1f5f9"],
    cssFeatures: ["grid modularity", "rounded-2xl"],
    containerClass: "bg-slate-950 border border-slate-800 text-slate-100 rounded-3xl",
    cardClass: "bg-slate-900/80 border border-slate-800/80 text-slate-100 rounded-2xl",
    inputClass: "bg-slate-950 border border-slate-800 text-white rounded-xl",
    buttonPrimaryClass: "bg-sky-500 text-slate-950 font-bold rounded-xl",
    buttonSecondaryClass: "bg-slate-800 text-slate-200 border border-slate-700 rounded-xl",
    badgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg",
    accentColor: "#38bdf8",
  },
  {
    id: "y2k",
    name: "Y2K Aesthetic / Cyber-Retro",
    category: "Retro & Nostalgia",
    tagline: "Early 2000s chrome reflections, bubblegum magenta/cyan, and retro-futuristic badges.",
    description: "Celebrates turn-of-the-millennium digital optimism with metallic bevels and starburst sparkles.",
    era: "2000s Digital Optimism",
    colorPalette: ["#ff00a0", "#00f0ff", "#ffe600", "#1a0033"],
    cssFeatures: ["metallic gradients", "chromatic borders"],
    containerClass: "bg-gradient-to-br from-[#1a0033] to-[#0d001a] border-2 border-[#ff00a0] text-[#00f0ff] rounded-2xl",
    cardClass: "bg-[#25004d] border-2 border-[#00f0ff]/60 text-white rounded-xl",
    inputClass: "bg-[#140026] border-2 border-[#ff00a0]/60 text-[#00f0ff] rounded-xl",
    buttonPrimaryClass: "bg-gradient-to-r from-[#ff00a0] to-[#00f0ff] text-black font-black uppercase rounded-xl",
    buttonSecondaryClass: "bg-[#1a0033] text-[#00f0ff] border-2 border-[#00f0ff] rounded-xl",
    badgeClass: "bg-[#ff00a0]/20 text-[#ff00a0] border border-[#ff00a0] rounded-full",
    accentColor: "#ff00a0",
  },
  {
    id: "terminal",
    name: "Terminal / Hacker CRT",
    category: "Futuristic & Tech",
    tagline: "Phosphor green on pitch black with CRT scanlines, command prompts, and monospace telemetry.",
    description: "Classic retro command-line interface featuring glowing phosphor monospace green text.",
    era: "1980s UNIX Terminal",
    colorPalette: ["#00ff66", "#003311", "#000000", "#33ff99"],
    cssFeatures: ["font-mono", "scanlines overlay"],
    containerClass: "bg-black border-2 border-[#00ff66] text-[#00ff66] rounded-none font-mono",
    cardClass: "bg-[#001100] border border-[#00ff66]/60 text-[#00ff66] rounded-none",
    inputClass: "bg-black border border-[#00ff66] text-[#00ff66] rounded-none font-mono",
    buttonPrimaryClass: "bg-[#00ff66] text-black font-mono font-black uppercase rounded-none",
    buttonSecondaryClass: "bg-transparent text-[#00ff66] border border-[#00ff66] font-mono rounded-none",
    badgeClass: "bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66] font-mono",
    accentColor: "#00ff66",
  },
  {
    id: "hand-drawn",
    name: "Hand-Drawn / Sketch",
    category: "Retro & Nostalgia",
    tagline: "Playful irregular hand-sketched wavy borders, paper textures, and doodle accents.",
    description: "Celebrates organic imperfection and human craft with irregular sketched border radius curves.",
    era: "Organic Indie Web",
    colorPalette: ["#2d3748", "#fffaf0", "#fbd38d", "#e53e3e"],
    cssFeatures: ["border: 2px solid #2d3748", "sketch border"],
    containerClass: "bg-[#fffdf7] text-slate-900 border-[2.5px] border-slate-900 rounded-[255px_15px_225px_15px/15px_225px_15px_255px]",
    cardClass: "bg-[#fef9ee] text-slate-900 border-2 border-slate-800 rounded-[200px_10px_180px_10px/10px_180px_10px_200px]",
    inputClass: "bg-white text-slate-900 border-2 border-slate-800 rounded-[180px_8px_160px_8px/8px_160px_8px_180px]",
    buttonPrimaryClass: "bg-[#e53e3e] text-white font-bold border-2 border-slate-900 rounded-[220px_12px_200px_12px/12px_200px_12px_220px]",
    buttonSecondaryClass: "bg-[#fbd38d] text-slate-900 font-bold border-2 border-slate-900 rounded-[200px_10px_180px_10px/10px_180px_10px_200px]",
    badgeClass: "bg-[#fbd38d] text-slate-900 border border-slate-800 rounded-full",
    accentColor: "#e53e3e",
  },
  {
    id: "oled",
    name: "Dark Mode OLED",
    category: "Minimalist & Clean",
    tagline: "Pure pitch black canvas with razor-sharp micro-borders and radiant neon focus rings.",
    description: "Engineered for maximum contrast on OLED displays with infinite black `#000000` depth.",
    era: "2024 OLED Standard",
    colorPalette: ["#000000", "#111111", "#3b82f6", "#ffffff"],
    cssFeatures: ["background: #000000", "border-neutral-900"],
    containerClass: "bg-[#000000] border border-neutral-800 text-neutral-100 rounded-2xl",
    cardClass: "bg-[#080808] border border-neutral-900 text-neutral-100 rounded-xl",
    inputClass: "bg-[#050505] border border-neutral-800 text-white rounded-lg",
    buttonPrimaryClass: "bg-white text-black font-semibold rounded-lg",
    buttonSecondaryClass: "bg-[#111111] text-neutral-200 border border-neutral-800 rounded-lg",
    badgeClass: "bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-md",
    accentColor: "#3b82f6",
  },
];

export interface UIStyleStoreState {
  currentStyleId: UIStyleId;
  setStyle: (id: UIStyleId) => void;
  getStyle: () => UIStyleDefinition;
}

export const useUIStyleStore = create<UIStyleStoreState>()(
  persist(
    (set, get) => ({
      currentStyleId: "neubrutalism",
      setStyle: (id) => set({ currentStyleId: id }),
      getStyle: () => {
        const id = get().currentStyleId;
        return UI_STYLES.find((s) => s.id === id) || UI_STYLES[0];
      },
    }),
    {
      name: "pulsestage_ui_style_preference_v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
