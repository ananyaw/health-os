"use client";

// Mock data for now — once Supabase is wired up, this will come from real
// onboarding answers and logged activity instead of these hardcoded values.
const MOCK = {
  currentWeight: 74,
  goalWeight: 67,
  weightUnit: "kg",
  todayWorkout: { name: "Easy 5K run", status: "not_started" },
  nutrition: { caloriesEaten: 1180, caloriesTarget: 2050, protein: 62, protyeinTarget: 150 },
};

function cardStyle(color) {
  return {
    background: "#f9f9f9",
    borderLeft: "4px solid " + color,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  };
}

function progressBarOuter() {
  return { background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" };
}

function progressBarInner(pct, color) {
  return {
    width: Math.min(100, Math.max(0, pct)) + "%",
    background: color,
    height: "100%",
    borderRadius: 999,
  };
}

function actionButtonStyle() {
  return {
    flex: 1,
    padding: 12,
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  };
}

export default function Home() {
  const weightTotal = Math.abs(MOCK.currentWeight - MOCK.goalWeight);
  const weightDone = 0; // no logs yet — will compute from real history later
  const weightPct = weightTotal > 0 ? (weightDone / weightTotal) * 100 : 0;

  const caloriesPct = (MOCK.nutrition.caloriesEaten / MOCK.nutrition.caloriesTarget) * 100;

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Home</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
        Sample data for now — this will reflect your real numbers once logging is wired up.
      </p>

      <div style={cardStyle("#2563eb")}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Weight</div>
          <div style={{ fontSize: 13, color: "#666" }}>
            {MOCK.currentWeight}
            {MOCK.weightUnit} → {MOCK.goalWeight}
            {MOCK.weightUnit}
          </div>
        </div>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(weightPct, "#2563eb")} />
        </div>
        <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
          {weightDone === 0 ? "No entries logged yet" : weightDone + MOCK.weightUnit + " toward goal"}
        </div>
      </div>

      <div style={cardStyle("#16a34a")}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Today's workout</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14 }}>{MOCK.todayWorkout.name}</div>
          <div
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              background: MOCK.todayWorkout.status === "done" ? "#dcfce7" : "#eee",
              color: MOCK.todayWorkout.status === "done" ? "#166534" : "#888",
            }}
          >
            {MOCK.todayWorkout.status === "done" ? "Done" : "Not started"}
          </div>
        </div>
      </div>

      <div style={cardStyle("#ea580c")}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Nutrition today</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span>Calories</span>
          <span>
            {MOCK.nutrition.caloriesEaten} / {MOCK.nutrition.caloriesTarget} kcal
          </span>
        </div>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(caloriesPct, "#ea580c")} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={actionButtonStyle()}>Log workout</button>
        <button style={actionButtonStyle()}>Log meal</button>
      </div>
    </main>
  );
}
