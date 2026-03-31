import { Inter, Bebas_Neue, Geist_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const bebasNeue = Bebas_Neue({
  variable: '--font-heading',
  weight: '400',
  subsets: ['latin'],
});

export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});