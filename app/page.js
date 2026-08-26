import Link from "next/link";

const LINKS = [
  { href: "/onboarding", label: "Onboarding" },
  { href: "/home", label: "Home" },
  { href: "/goals", label: "Goals" },
  { href: "/nutrition", label: "Nutrition (placeholder)" },
  { href: "/trainer", label: "Trainer (placeholder)" },
  { href: "/mealprep", label: "Meal-prep (placeholder)" },
];

export default function Landing() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <h1>Health OS</h1>
      <p>
        If you can see this on your phone, the pipeline works: GitHub to
        Vercel to here.
      </p>
      <p style={{ color: "#666", fontSize: 14 }}>Quick links for testing:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "block",
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
              color: "#111",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
