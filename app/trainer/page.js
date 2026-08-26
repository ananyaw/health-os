export default function Trainer() {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Trainer</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Not built yet — here's the plan.</p>
      <div style={{ background: "#f9f9f9", borderLeft: "4px solid #16a34a", borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>
          A scrollable calendar strip (the favorite from prototyping) showing past and upcoming sessions, with a
          real in-session guide once you tap "Start" — lifting gets sets/reps/weight with video per exercise,
          running gets pace/route/intervals, each activity type genuinely different rather than one generic
          screen. The trainer assigns the day's session; you can swap it or adjust length, not pick from a menu.
        </p>
      </div>
    </main>
  );
}
