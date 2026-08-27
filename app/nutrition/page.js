"use client";
import { useState } from "react";

// Mock data for now, same pattern Home started with — a full redesign,
// not just a placeholder. Real logging (manual here, photo-based later
// per the concept brief) gets wired to Supabase once this design lands.
const TARGETS = { calories: 2050, protein: 150, carbs: 220, fat: 65 };

const MEAL_TEMPLATE = [
  { slot: "Breakfast", calories: 320, protein: 18, carbs: 40, fat: 10 },
  { slot: "Lunch", calories: 480, protein: 32, carbs: 50, fat: 16 },
  { slot: "Dinner", calories: 520, protein: 38, carbs: 45, fat: 20 },
  { slot: "Snack", calories: 380, protein: 10, carbs: 55, fat: 12 },
];

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
function offsetDate(days, base) {
  const d = base ? new Date(base) : new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}
function formatDateLabel(iso, todayIso) {
  if (iso === todayIso) return "Today";
  if (iso === offsetDate(-1, todayIso)) return "Yesterday";
  if (iso === offsetDate(1, todayIso)) return "Tomorrow";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Per concept-brief finding: closed days show planned+actual for every
// meal; today shows actual only for meals already eaten; future days
// show planned only. Mocked here with a fixed "2 meals eaten" state for
// today, tweakable via the tap-to-log modal below.
function buildDayMeals(iso, todayIso, loggedOverrides) {
  const isPast = iso < todayIso;
  const isToday = iso === todayIso;
  return MEAL_TEMPLATE.map((m, i) => {
    const planned = { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat };
    const overrideKey = iso + "-" + m.slot;
    let actual = null;
    if (loggedOverrides[overrideKey]) {
      actual = loggedOverrides[overrideKey];
    } else if (isPast) {
      actual = planned;
    } else if (isToday && i < 2) {
      // Mock: breakfast + lunch already logged, dinner/snack not yet.
      actual = { ...planned, calories: planned.calories - 10 };
    }
    return { slot: m.slot, planned, actual };
  });
}

function sumField(meals, field, useActualOnly) {
  return meals.reduce((sum, m) => {
    const source = useActualOnly ? m.actual : m.actual || m.planned;
    return sum + (source ? source[field] || 0 : 0);
  }, 0);
}

function insightBoxStyle(ok) {
  return {
    fontSize: 12,
    color: ok ? "#166534" : "#92400e",
    background: ok ? "#f0fdf4" : "#fffbeb",
    padding: "8px 10px",
    borderRadius: 8,
    marginTop: 8,
  };
}
function cardStyle(color) {
  return { background: "#f9f9f9", borderLeft: "4px solid " + color, borderRadius: 10, padding: 16, marginBottom: 16 };
}
function progressBarOuter() {
  return { background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" };
}
function progressBarInner(pct, color) {
  return { width: Math.min(100, Math.max(0, pct)) + "%", background: color, height: "100%", borderRadius: 999 };
}
function macroRow(label, value, target, unit) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const ok = Math.abs(pct - 100) <= 15 || pct <= 100;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 3 }}>
        <span>{label}</span>
        <span>
          {Math.round(value)}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div style={progressBarOuter()}>
        <div style={progressBarInner(pct, ok ? "#2563eb" : "#dc2626")} />
      </div>
    </div>
  );
}

function DayStrip({ centerIso, todayIso, onPick }) {
  const days = [];
  for (let off = -3; off <= 3; off++) {
    days.push(offsetDate(off, centerIso));
  }
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
      {days.map((iso) => {
        const isSelected = iso === centerIso;
        const isToday = iso === todayIso;
        return (
          <div
            key={iso}
            onClick={() => onPick(iso)}
            style={{
              flex: "1 0 0",
              minWidth: 42,
              textAlign: "center",
              padding: "8px 4px",
              borderRadius: 10,
              cursor: "pointer",
              background: isSelected ? "#111" : "#f5f5f5",
              border: isToday && !isSelected ? "1px solid #999" : "none",
            }}
          >
            <div style={{ fontSize: 10, color: isSelected ? "#ccc" : "#999", marginBottom: 4 }}>
              {new Date(iso).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#fff" : "#333" }}>
              {new Date(iso).getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LogMealModal({ meal, onClose, onSave }) {
  const [calories, setCalories] = useState(meal.actual ? String(meal.actual.calories) : "");
  const [protein, setProtein] = useState(meal.actual ? String(meal.actual.protein) : "");

  function handleSave() {
    const cal = parseFloat(calories);
    const prot = parseFloat(protein);
    if (isNaN(cal)) {
      window.alert("Please enter calories as a number.");
      return;
    }
    onSave({
      calories: cal,
      protein: isNaN(prot) ? 0 : prot,
      carbs: meal.planned.carbs,
      fat: meal.planned.fat,
    });
  }

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
        style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: 24, width: "100%", maxWidth: 480, boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Log {meal.slot.toLowerCase()}</div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#999", cursor: "pointer" }}>
            ×
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
          Planned: {meal.planned.calories} kcal / {meal.planned.protein}g protein. Manual entry for now — photo-based
          logging comes later.
        </p>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Calories</div>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Protein (g)</div>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
          />
        </div>
        <button
          onClick={handleSave}
          style={{ width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function Nutrition() {
  const todayIso = toLocalISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [loggedOverrides, setLoggedOverrides] = useState({});
  const [openMealIndex, setOpenMealIndex] = useState(null);

  const isPast = selectedDate < todayIso;
  const isToday = selectedDate === todayIso;
  const isFuture = selectedDate > todayIso;

  const meals = buildDayMeals(selectedDate, todayIso, loggedOverrides);
  const useActualOnly = isFuture; // future days: totals reflect plan only, not "eaten so far"
  const caloriesTotal = sumField(meals, "calories", false);
  const proteinTotal = sumField(meals, "protein", false);
  const carbsTotal = sumField(meals, "carbs", false);
  const fatTotal = sumField(meals, "fat", false);

  const caloriesPct = (caloriesTotal / TARGETS.calories) * 100;
  const overUnder = caloriesTotal - TARGETS.calories;

  let calorieInsight;
  if (isFuture) {
    calorieInsight = { text: "This is the plan for that day — nothing logged yet.", ok: true };
  } else if (Math.abs(overUnder) <= 100) {
    calorieInsight = { text: "Right around target for " + (isToday ? "today" : "this day") + ".", ok: true };
  } else if (overUnder > 100) {
    calorieInsight = { text: "About " + Math.round(overUnder) + " kcal over target.", ok: false };
  } else {
    calorieInsight = { text: "About " + Math.round(Math.abs(overUnder)) + " kcal under target.", ok: false };
  }

  function handleOpenMeal(i) {
    if (isFuture) return; // can't log a meal that hasn't happened yet
    setOpenMealIndex(i);
  }

  function handleSaveMeal(values) {
    const meal = meals[openMealIndex];
    const key = selectedDate + "-" + meal.slot;
    setLoggedOverrides((prev) => ({ ...prev, [key]: values }));
    setOpenMealIndex(null);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Nutrition</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>{formatDateLabel(selectedDate, todayIso)}</p>

      <DayStrip centerIso={selectedDate} todayIso={todayIso} onPick={setSelectedDate} />

      <div style={cardStyle("#2563eb")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{isFuture ? "Planned calories" : "Net calories"}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {Math.round(caloriesTotal)} <span style={{ fontSize: 12, color: "#999", fontWeight: 400 }}>/ {TARGETS.calories} kcal</span>
          </div>
        </div>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(caloriesPct, "#2563eb")} />
        </div>
        <div style={insightBoxStyle(calorieInsight.ok)}>{calorieInsight.text}</div>
        {macroRow("Protein", proteinTotal, TARGETS.protein, "g")}
        {macroRow("Carbs", carbsTotal, TARGETS.carbs, "g")}
        {macroRow("Fat", fatTotal, TARGETS.fat, "g")}
      </div>

      <div style={sectionHeaderStyleLocal()}>By meal</div>
      {meals.map((meal, i) => {
        const hasActual = !!meal.actual;
        return (
          <div
            key={meal.slot}
            onClick={() => handleOpenMeal(i)}
            style={{ ...cardStyle("#ea580c"), cursor: isFuture ? "default" : "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{meal.slot}</div>
              <div
                style={{
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: hasActual ? "#dcfce7" : "#eee",
                  color: hasActual ? "#166534" : "#888",
                }}
              >
                {hasActual ? "Logged" : isFuture ? "Planned" : "Not logged"}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Planned: {meal.planned.calories} kcal · {meal.planned.protein}g protein
            </div>
            {hasActual && (
              <div style={{ fontSize: 12, color: "#c2410c", marginTop: 2 }}>
                Actual: {meal.actual.calories} kcal · {meal.actual.protein}g protein
              </div>
            )}
            {!isFuture && <div style={{ fontSize: 11, color: "#2563eb", marginTop: 8 }}>Tap to {hasActual ? "edit" : "log"}</div>}
          </div>
        );
      })}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Manual logging for now, and this screen is still mock data — photo-based logging and real Supabase persistence
        come once this layout feels right.
      </p>

      {openMealIndex !== null && (
        <LogMealModal meal={meals[openMealIndex]} onClose={() => setOpenMealIndex(null)} onSave={handleSaveMeal} />
      )}
    </main>
  );
}

function sectionHeaderStyleLocal() {
  return { fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, margin: "20px 0 10px" };
}
