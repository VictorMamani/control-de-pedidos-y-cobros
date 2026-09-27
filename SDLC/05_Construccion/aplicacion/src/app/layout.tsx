import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BYTE-CX | Control de pedidos",
    template: "%s | BYTE-CX",
  },
  description: "Seguimiento de pedidos y cobros anotados para comercios.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-[#f3f7f6] font-sans text-[#18332d]">{children}</body>
    </html>
  );
}
