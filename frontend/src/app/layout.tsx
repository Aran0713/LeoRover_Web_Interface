// src/app/layout.tsx

import "./globals.css";

export const metadata = {
  title: "Avalon Space: LeoRover Mission Console",
  description: "Unified control interface for Leo Rover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d1117] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
