import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Marcellus } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif-alt",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NADIRA Couture — L'art de la couture marocaine",
  description:
    "Maison de couture marocaine haut de gamme. Caftans, takchitas, djellabas et pièces sur-mesure brodées main, façonnées avec savoir-faire et passion.",
  keywords: [
    "NADIRA",
    "couture marocaine",
    "caftan",
    "takchita",
    "djellaba",
    "sur-mesure",
    "broderie",
    "haute couture Maroc",
  ],
  authors: [{ name: "Maison NADIRA" }],
  icons: {
    icon: "/nadira-logo.png",
    apple: "/nadira-logo.png",
  },
  openGraph: {
    title: "NADIRA Couture — L'art de la couture marocaine",
    description:
      "Caftans, takchitas et pièces sur-mesure brodées main. Héritage, savoir-faire et élégance intemporelle.",
    siteName: "NADIRA Couture",
    type: "website",
    locale: "fr_MA",
  },
  twitter: {
    card: "summary_large_image",
    title: "NADIRA Couture",
    description: "L'art de la couture marocaine, façonné pour vous.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${cormorant.variable} ${marcellus.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
