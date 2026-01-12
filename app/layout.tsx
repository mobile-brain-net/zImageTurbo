import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'zimageturbo - AI Image Generator',
  description: 'Generate AI images using Z-Image-Turbo model',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
