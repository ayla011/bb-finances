export const metadata = {
  title: "Finance Command Center",
  description: "Finance dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
