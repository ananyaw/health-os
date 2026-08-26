export default function Nutrition() {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Nutrition</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Not built yet — here's the plan.</p>
      <div style={{ background: "#f9f9f9", borderLeft: "4px solid #2563eb", borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>
          Photo-based food logging, a per-meal breakdown (planned vs. actual for breakfast/lunch/dinner rather
          than one daily total), and a real nutrient view beyond calories — protein, sugar, sodium, each with an
          over/under read tied back to your goals, not just a raw gram count.
        </p>
      </div>
    </main>
  );
}
