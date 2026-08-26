import NavBar from "./NavBar";

export const metadata = {
  title: "Health OS",
  description: "Personal health, nutrition, and training coach",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{ paddingBottom: 70 }}>{children}</div>
        <NavBar />
      </body>
    </html>
  );
}
