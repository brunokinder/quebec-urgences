"use client";

import { useEffect, useState } from "react";

/**
 * Registers the service worker and warns when the device is offline,
 * since the page shown may then be an older saved copy.
 */
export function PwaSupport() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="bg-amber-950/60 border-b border-amber-800/60 px-4 py-2">
      <p className="max-w-7xl mx-auto text-xs sm:text-sm text-amber-100">
        <strong>Hors ligne.</strong> Ces données ont été enregistrées lors de votre dernière
        visite et ne sont peut-être plus à jour. Vérifiez l&apos;heure de mise à jour affichée.
      </p>
    </div>
  );
}
