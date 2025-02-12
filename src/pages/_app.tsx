import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/globals.css';
import { Navigation } from '../components/Navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Church Service Roster Planner</title>
      </Head>
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen dark`}>
        <Navigation />
        <main className="container mx-auto p-4">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}

export default MyApp;
