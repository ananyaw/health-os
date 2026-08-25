"use client";
import { useState } from "react";

// Mock data for now — once Supabase is wired up, this will come from real
// onboarding answers and logged activity instead of these hardcoded values.
// lastEntry.date is set to yesterday on purpose, to show the "log your
// weight" nudge in this mock — swap it to today's date to see the logged state.
const MOCK = {
  weightUnit: "kg",
  weight: {
    lastEntry: { value: 74.2, date: offsetDate(-1) },
    goal: { value: 67, date: "2026-12-31" },
    nextCheckpoint: { value: 71.5, date: "2026-10-06" },
  },
  workout: {
    name: "Easy run",
    type: "Run",
    duration: "35 min",
    status: "not_started", // "not_started" | "in_progress" | "done"
    details: [
      "Warm-up: 5 min easy jog",
      "Main set: 25 min steady pace, aim for 10:30/mi",
      "Cool-down: 5 min walk + stretch",
    ],
  },
  nutrition: {
    caloriesTarget: 2050,
    meals: [
      { name: "Breakfast", calories: 320 },
      { name: "Lunch", calories: 480 },
      { name: "Snack", calories: 380 },
    ],
  },
  mealprep: {
    cuisines: ["Indian", "Mediterranean"],
    cadenceLabel: "a few times a week",
  },
  week: [
    { offset: -1, activity: "Rest" },
    { offset: 0, activity: "Run" },
    { offset: 1, activity: "Lift" },
    { offset: 2, activity: "Rest" },
    { offset: 3, activity: "Run" },
    { offset: 4, activity: "Lift" },
    { offset: 5, activity: "Long run" },
  ],
};

const ACTIVITY_COLORS = {
  Rest: "#ccc",
  Run: "#16a34a",
  Lift: "#2563eb",
  "Long run": "#166534",
  Swim: "#0891b2",
  Yoga: "#9333ea",
};

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatDateShort(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayProgressPct() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsedMs = now.getTime() - startOfDay.getTime();
  return Math.min(100, Math.max(0, (elapsedMs / (24 * 60 * 60 * 1000)) * 100));
}

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

function statBlock(label, value, sub) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#999" }}>{sub}</div>}
    </div>
  );
}

function WeekStrip({ week, todayIso }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
      {week.map((d) => {
        const iso = offsetDate(d.offset);
        const isToday = iso === todayIso;
        const color = ACTIVITY_COLORS[d.activity] || "#999";
        return (
          <div
            key={d.offset}
            style={{
              flex: "1 0 0",
              minWidth: 44,
              textAlign: "center",
              padding: "8px 4px",
              borderRadius: 10,
              background: isToday ? "#111" : "#f5f5f5",
            }}
          >
            <div style={{ fontSize: 10, color: isToday ? "#ccc" : "#999", marginBottom: 4 }}>
              {new Date(iso).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? "#fff" : "#333", marginBottom: 6 }}>
              {new Date(iso).getDate()}
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                margin: "0 auto",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function WorkoutModal({ workout, onClose }) {
  const isDone = workout.status === "done";
  const isInProgress = workout.status === "in_progress";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          padding: 24,
          width: "100%",
          maxWidth: 480,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{workout.name}</div>
            <div style={{ fontSize: 13, color: "#777" }}>
              {workout.type} · {workout.duration}
            </div>
          </div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#999", cursor: "pointer" }}>
            ×
          </span>
        </div>

        <div style={{ margin: "16px 0" }}>
          {workout.details.map((line, i) => (
            <div key={i} style={{ fontSize: 14, color: "#333", padding: "8px 0", borderTop: i > 0 ? "1px solid #eee" : "none" }}>
              {line}
            </div>
          ))}
        </div>

        <button
          style={{
            width: "100%",
            padding: 16,
            background: isDone ? "#eee" : "#16a34a",
            color: isDone ? "#888" : "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: isDone ? "default" : "pointer",
          }}
        >
          <span style={{ fontSize: 18 }}>{isDone ? "✓" : "▶"}</span>
          {isDone ? "Completed" : isInProgress ? "Continue where you left off" : "Start workout"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [workoutOpen, setWorkoutOpen] = useState(false);

  const todayIso = toLocalISODate(new Date());
  const weightLoggedToday = MOCK.weight.lastEntry.date === todayIso;

  const caloriesEaten = MOCK.nutrition.meals.reduce((sum, m) => sum + m.calories, 0);
  const caloriesPct = (caloriesEaten / MOCK.nutrition.caloriesTarget) * 100;

  const status = MOCK.workout.status;
  const statusLabel = status === "done" ? "Done" : status === "in_progress" ? "In progress" : "Not started";
  const statusColor = status === "done" ? "#dcfce7" : status === "in_progress" ? "#fef9c3" : "#eee";
  const statusTextColor = status === "done" ? "#166534" : status === "in_progress" ? "#854d0e" : "#888";
  const buttonLabel = status === "done" ? "View" : status === "in_progress" ? "Continue" : "Start";

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 10 }}>Here's today.</p>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(dayProgressPct(), "#111")} />
        </div>
      </div>

      <WeekStrip week={MOCK.week} todayIso={todayIso} />

      {!weightLoggedToday && (
        <div style={{ ...cardStyle("#f59e0b"), background: "#fffbeb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>You haven't logged your weight today</div>
            <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              Last entry: {MOCK.weight.lastEntry.value}
              {MOCK.weightUnit} on {formatDateShort(MOCK.weight.lastEntry.date)}
            </div>
          </div>
          <button
            style={{
              padding: "8px 14px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            Log it
          </button>
        </div>
      )}

      <div style={cardStyle("#2563eb")}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Weight</div>
        <div style={{ display: "flex", gap: 8 }}>
          {statBlock(
            "Most recent",
            MOCK.weight.lastEntry.value + MOCK.weightUnit,
            formatDateShort(MOCK.weight.lastEntry.date)
          )}
          {statBlock(
            "Next check-in",
            MOCK.weight.nextCheckpoint.value + MOCK.weightUnit,
            formatDateShort(MOCK.weight.nextCheckpoint.date)
          )}
          {statBlock(
            "Goal",
            MOCK.weight.goal.value + MOCK.weightUnit,
            formatDateShort(MOCK.weight.goal.date)
          )}
        </div>
      </div>

      <div style={cardStyle("#16a34a")} onClick={() => setWorkoutOpen(true)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Today's workout</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
              {MOCK.workout.name} · {MOCK.workout.duration}
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              background: statusColor,
              color: statusTextColor,
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#2563eb", marginTop: 10 }}>Tap for details ▾ · {buttonLabel}</div>
      </div>

      <div style={cardStyle("#ea580c")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Net calories today</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {caloriesEaten} <span style={{ fontSize: 12, color: "#999", fontWeight: 400 }}>/ {MOCK.nutrition.caloriesTarget} kcal</span>
          </div>
        </div>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(caloriesPct, "#ea580c")} />
        </div>
        <div style={{ marginTop: 12 }}>
          {MOCK.nutrition.meals.map((meal, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#444",
                padding: "6px 0",
                borderTop: i > 0 ? "1px solid #eee" : "none",
              }}
            >
              <span>{meal.name}</span>
              <span>{meal.calories} kcal</span>
            </div>
          ))}
        </div>
        <button
          style={{
            width: "100%",
            padding: 10,
            background: "#fff",
            color: "#c2410c",
            border: "1px solid #fdba74",
            borderRadius: 8,
            fontSize: 13,
            marginTop: 10,
            cursor: "pointer",
          }}
        >
          Log a meal
        </button>
      </div>

      <div style={cardStyle("#ea580c")}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Meal-prep</div>
        <p style={{ fontSize: 13, color: "#444" }}>
          Into {MOCK.mealprep.cuisines.join(" and ")} recipes, cooking {MOCK.mealprep.cadenceLabel}.
        </p>
      </div>

      {workoutOpen && <WorkoutModal workout={MOCK.workout} onClose={() => setWorkoutOpen(false)} />}
    </main>
  );
}
