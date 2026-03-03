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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🏥</span>
            <div>
              <h1 className="text-lg font-bold leading-none">Urgences Québec</h1>
              <p className="text-xs text-gray-500">Taux d&apos;occupation — données MSSS</p>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-gray-200 py-4 text-center text-xs text-gray-400">
          Données: MSSS / Console provinciale des urgences — Licence CC-BY 4.0 —{" "}
          <a
            href="https://github.com/brunokinder/quebec-urgences"
            className="underline hover:text-gray-600"
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
