export const metadata = {
  title: "Health OS",
  description: "Personal health, nutrition, and training coach",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
