"use client";

import { useEffect, useState } from "react";
import { NadiraMonogram } from "./brand";

export function IntroLoader() {
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("nadira-intro") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (hidden) return;
    const t1 = setTimeout(() => setDone(true), 2600);
    const t2 = setTimeout(() => {
      setHidden(true);
      try {
        sessionStorage.setItem("nadira-intro", "1");
      } catch {
        // ignore
      }
    }, 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] velvet-deep flex flex-col items-center justify-center transition-opacity duration-700 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        <NadiraMonogram className="w-24 h-24" animate />
        <div className="mt-6 overflow-hidden">
          <p
            className="font-display text-2xl tracking-[0.4em] text-gold-gradient"
            style={{
              animation: "fade-up 1s ease 1.4s both",
            }}
          >
            NADIRA
          </p>
        </div>
        <div className="mt-2 h-px w-40 gold-line" style={{ animation: "fade-up 1s ease 1.8s both" }} />
        <p
          className="mt-3 text-[10px] tracking-[0.5em] uppercase text-ivory/50"
          style={{ animation: "fade-up 1s ease 2.1s both" }}
        >
          Couture · Maroc
        </p>
      </div>
      {/* Spool of golden thread at bottom */}
      <div className="absolute bottom-12 flex items-center gap-2 text-ivory/30 text-xs tracking-widest">
        <span className="h-px w-12 gold-line" />
        Broderie en cours
        <span className="h-px w-12 gold-line" />
      </div>
    </div>
  );
}
