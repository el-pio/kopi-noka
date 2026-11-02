import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kopi Noka - POS & Coffee Shop Management',
  description: 'Sistem Point of Sale (POS), Manajemen 3 Shift, Barista KDS, dan Pemesanan Online Kopi Noka Makassar',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-stone-50 text-stone-900 selection:bg-brand-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
