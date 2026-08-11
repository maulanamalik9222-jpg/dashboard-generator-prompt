import "./globals.css";

export const metadata = {
  title: "TEAM UP | DASHBOARD",
  description: "Dashboard internal Team UP",
  icons: {
    icon: [{ url: "/logo-up-premium-transparent.png", type: "image/png" }],
    shortcut: "/logo-up-premium-transparent.png",
    apple: "/logo-up-premium-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
