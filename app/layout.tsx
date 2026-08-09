import "./globals.css";

export const metadata = {
  title: "PREMANKARO | DASHBOARD",
  description: "Dashboard internal Preman Karo",
  icons: {
    icon: [{ url: "/premankaro-favicon-v1.png", type: "image/png" }],
    shortcut: "/premankaro-favicon-v1.png",
    apple: "/premankaro-favicon-v1.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
