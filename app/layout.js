export const metadata = {
  title: 'El PoKe pLuG Tracker',
  description: 'Sealed Inventory Tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
