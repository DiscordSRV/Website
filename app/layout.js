import './global.css'

export const metadata = {
    metadataBase: "/",
    title: 'DiscordSRV',
    openGraph: {
        images: '/opengraph-image.png'
    }
}

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
