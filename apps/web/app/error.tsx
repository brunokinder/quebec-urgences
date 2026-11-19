"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

// Shown when a page fails to load its data (e.g. a slow or unreachable
// database). The header, the 911/811 notice and the footer come from the root
// layout and stay visible, so they aren't repeated here.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // The failure happened on the server, so reset() alone would just re-render
  // the same broken payload: refresh the server data, then clear the error.
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <h2 className="text-xl font-bold text-slate-50">Les données n&apos;ont pas pu être chargées</h2>
      <p className="text-sm text-slate-300">
        Le serveur n&apos;a pas répondu à temps. C&apos;est généralement passager : réessayez dans un instant.
      </p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition-colors"
      >
        Réessayer
      </button>
      {error.digest && <p className="text-xs text-slate-500">Code : {error.digest}</p>}
    </div>
  );
}
