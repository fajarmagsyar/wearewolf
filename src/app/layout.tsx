import type { Metadata } from 'next'
import './globals.css'
import { GlobalProviders } from '@/components/GlobalProviders'
import { LocaleToggle } from '@/components/LocaleToggle'

export const metadata: Metadata = {
  title: "We're Wolf",
  description: 'Multiplayer Werewolf role-distributor and narrator-assist',
  themeColor: '#e63329',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <GlobalProviders>
          <div className="app">
            <header className="topbar">
              <a href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
                <svg className="logo-mark" viewBox="0 0 48 48" aria-hidden="true">
                  <rect x="2" y="2" width="44" height="44" fill="var(--paper)" stroke="#111" strokeWidth="3"/>
                  <polygon points="6,18 23,23 23,31 6,27" fill="var(--yellow)" stroke="#111" strokeWidth="2.5" strokeLinejoin="round"/>
                  <circle cx="16" cy="26" r="3.4" fill="#111"/>
                  <polygon points="42,18 25,23 25,31 42,27" fill="var(--blue)" stroke="#111" strokeWidth="2.5" strokeLinejoin="round"/>
                  <circle cx="32" cy="26" r="3.4" fill="var(--red)"/>
                </svg>
                <span>WE&rsquo;RE&nbsp;WOLF</span>
              </a>
              <div className="row" style={{ flex: '0 0 auto', alignItems: 'center' }}>
                <LocaleToggle />
              </div>
            </header>
            <main>{children}</main>
          </div>
        </GlobalProviders>
      </body>
    </html>
  )
}
