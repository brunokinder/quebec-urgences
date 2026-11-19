import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urgences Québec",
  description: "Taux d'occupation des urgences du Québec, mis à jour chaque heure",
  openGraph: {
    title: "Urgences Québec",
    description: "Taux d'occupation des urgences du Québec, mis à jour chaque heure",
    locale: "fr_CA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-surface text-slate-100">
        <header className="bg-surface-card border-b border-surface-border px-4 py-3 sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="2,12 6,12 7.5,6 10,18 13,9 15,13 16.5,12 22,12" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold leading-none text-slate-50 tracking-tight">
                  Urgences Québec
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Taux d&apos;occupation — données MSSS</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">Mis à jour chaque heure</span>
          </div>
        </header>

        <div role="note" className="bg-red-950/40 border-b border-red-900/50 px-4 py-2">
          <p className="max-w-7xl mx-auto text-xs sm:text-sm text-slate-200">
            <strong className="text-red-300">Urgence vitale : composez le 911.</strong>{" "}
            Besoin d&apos;un conseil santé : Info-Santé{" "}
            <a href="tel:811" className="font-semibold underline hover:text-white">811</a>.{" "}
            <span className="text-slate-300">Ne retardez jamais une visite à cause de ces chiffres.</span>
          </p>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

        <footer className="mt-12 border-t border-surface-border py-5 text-center text-xs text-slate-400">
          Données: MSSS / Console provinciale des urgences — Licence CC-BY 4.0 —{" "}
          <a
            href="https://github.com/brunokinder/quebec-urgences"
            className="text-slate-400 hover:text-slate-300 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Code source
          </a>
        </footer>
      </body>
    </html>
  );
}
