import './global.css'

export const metadata = {
    metadataBase: "/",
    title: 'DiscordSRV'
}

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
