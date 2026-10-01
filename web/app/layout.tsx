import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LunarSite Compass | CLPS Mission Browser & Flight Dynamics Suite",
  description: "Production-grade temporal illumination and Earth-communication window browser for CLPS lunar south pole landers. Conformal stereographic cartography, PDI descent dynamics, and ISRU traverse routing.",
  keywords: ["NASA", "CLPS", "Artemis", "Lunar South Pole", "Mons Mouton", "Shackleton", "LOLA", "PDI Descent", "Flight Dynamics"],
  authors: [{ name: "LunarSite Compass Aerospace Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-space-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
