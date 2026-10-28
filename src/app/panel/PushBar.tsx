"use client";

import { useEffect, useState } from "react";

function urlKey(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function post(body: object) {
  return fetch("/api/admin/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

type State = "loading" | "unsupported" | "off" | "on" | "denied";

// Powiadomienia o nowych wizytach. Otwarcie panelu zeruje licznik na ikonie i zamyka stare powiadomienia.
export default function PushBar({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return setState("unsupported");
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (Notification.permission === "denied") setState("denied");
      else setState(sub ? "on" : "off");
      if (sub) post({ action: "seen", endpoint: sub.endpoint });
      navigator.clearAppBadge?.().catch(() => {});
      (await reg.getNotifications()).forEach((n) => n.close());
    });
  }, [publicKey]);

  async function enable() {
    const reg = await navigator.serviceWorker.ready;
    if ((await Notification.requestPermission()) !== "granted") return setState("denied");
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlKey(publicKey) });
    await post({ action: "subscribe", subscription: sub.toJSON() });
    setState("on");
  }

  async function disable() {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (sub) {
      await post({ action: "unsubscribe", endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
    setState("off");
  }

  if (state === "loading" || state === "unsupported") return null;
  return (
    <div className="push-bar">
      {state === "on" && (
        <>
          <span>🔔 Powiadomienia o nowych wizytach włączone na tym telefonie.</span>
          <button className="btn secondary small" onClick={disable}>Wyłącz</button>
        </>
      )}
      {state === "off" && (
        <>
          <span>Chcesz dostawać powiadomienie i licznik na ikonie przy nowej wizycie?</span>
          <button className="btn small" onClick={enable}>Włącz powiadomienia</button>
        </>
      )}
      {state === "denied" && <span>Powiadomienia są zablokowane. Włącz je w ustawieniach przeglądarki dla tej strony.</span>}
    </div>
  );
}
