export default function Mealprep() {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Meal-prep</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Not built yet — here's the plan.</p>
      <div style={{ background: "#f9f9f9", borderLeft: "4px solid #ea580c", borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>
          A week-ahead calendar (same visual language as Trainer's strip) where tapping a day toggles it between
          a planned dish and a prep session, built around the cook-day(s) you actually pick. A "Start cooking"
          action mirrors Trainer's "Start workout" — turning static steps into an active, checkable mode. A
          shopping list splits what you already have (from your pantry) from what you need to buy, with real
          amounts, not vague quantities.
        </p>
      </div>
    </main>
  );
}
