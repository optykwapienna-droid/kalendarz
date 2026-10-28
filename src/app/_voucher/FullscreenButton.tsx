"use client";

import { useEffect, useState } from "react";

/** Przycisk „Pełny ekran”: chowa pasek przeglądarki (tam, gdzie telefon na to pozwala). */
export default function FullscreenButton() {
  const [can, setCan] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setCan(typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  if (!can) return null;
  return (
    <button
      type="button"
      className="voucher-fs"
      aria-label={on ? "Zamknij pełny ekran" : "Pełny ekran"}
      onClick={() => (on ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}
    >
      {on ? "✕" : "⛶"}
    </button>
  );
}
