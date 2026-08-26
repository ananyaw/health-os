"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/nutrition", label: "Nutrition", icon: "🍽️" },
  { href: "/trainer", label: "Trainer", icon: "💪" },
  { href: "/mealprep", label: "Meal-prep", icon: "🧑‍🍳" },
  { href: "/goals", label: "Goals", icon: "🎯" },
];

const HIDDEN_PREFIXES = ["/onboarding"];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #eee",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 20px",
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "sans-serif",
        zIndex: 40,
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textDecoration: "none",
              color: active ? "#111" : "#999",
              fontSize: 11,
              gap: 2,
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
