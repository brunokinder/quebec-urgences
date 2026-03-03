import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urgences Québec",
  description: "Taux d'occupation en temps réel des urgences du Québec",
  openGraph: {
    title: "Urgences Québec",
    description: "Taux d'occupation en temps réel des urgences du Québec",
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
                <span className="text-lg" aria-hidden>🏥</span>
              </div>
              <div>
                <h1 className="text-base font-bold leading-none text-slate-50 tracking-tight">
                  Urgences Québec
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Taux d&apos;occupation — données MSSS</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500 hidden sm:block">Temps réel</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

        <footer className="mt-12 border-t border-surface-border py-5 text-center text-xs text-slate-600">
          Données: MSSS / Console provinciale des urgences — Licence CC-BY 4.0 —{" "}
          <a
            href="https://github.com/brunokinder/quebec-urgences"
            className="text-slate-500 hover:text-slate-300 underline transition-colors"
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
