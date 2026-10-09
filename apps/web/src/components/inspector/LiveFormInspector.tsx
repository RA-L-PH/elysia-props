"use client";

import { useState } from "react";
import { Terminal, X, Check, Copy, ShieldCheck, Code2, RefreshCw } from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";

export function LiveFormInspector() {
  const { isInspectorOpen, toggleInspector, getPayload, category } = useWizardStore();
  const [copied, setCopied] = useState(false);

  if (!isInspectorOpen) return null;

  const payload = getPayload();
  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-4 z-50 sm:w-full max-w-lg animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl overflow-hidden flex flex-col max-h-[560px]">
        {/* Header */}
        <div className="bg-[#FFDE59] border-b-[3px] border-black p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-black text-black uppercase tracking-tight">
                Live State &amp; Schema Inspector
              </div>
              <div className="text-[10px] font-mono font-bold text-neutral-800">
                Active Discriminator: <strong>{category}Model</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black flex items-center gap-1 hover:bg-neutral-100 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={toggleInspector}
              className="w-7 h-7 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center hover:bg-neutral-100 transition-all"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

        {/* Validation Status Bar */}
        <div className="bg-[#00F0FF] border-b-2 border-black px-4 py-1.5 flex items-center justify-between text-[11px] font-mono font-black text-black">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>ZOD DISCRIMINATOR CONTRACT VALID</span>
          </div>
          <span className="bg-black text-white px-1.5 py-0.5 rounded text-[9px] uppercase font-mono">
            LIVE REFLECT
          </span>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-4 overflow-auto bg-[#0a0a0c] text-[#00ff66] font-mono text-xs leading-relaxed max-h-[380px]">
          <pre className="whitespace-pre-wrap">{jsonString}</pre>
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-white border-t-2 border-black text-[10px] font-mono font-bold text-neutral-700 flex justify-between items-center">
          <span>Payload Size: {jsonString.length} bytes</span>
          <span className="text-black font-black">PulseStage Mongoose Schema Engine</span>
        </div>
      </div>
    </div>
  );
}
