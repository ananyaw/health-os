"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// Mock data / mock AI for now. Real photo+text estimation via the
// Anthropic API (server-side route, not browser-side) is a follow-up
// pass once this logging flow feels right.
const TARGETS = { calories: 2050, protein: 150, carbs: 220, fat: 65 };
const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const MEAL_TEMPLATE = {
  Breakfast: { calories: 320, protein: 18, carbs: 40, fat: 10 },
  Lunch: { calories: 480, protein: 32, carbs: 50, fat: 16 },
  Dinner: { calories: 520, protein: 38, carbs: 45, fat: 20 },
  Snack: { calories: 380, protein: 10, carbs: 55, fat: 12 },
};

// A tiny canned lookup so the mock AI estimate feels responsive to what
// you actually type, instead of always returning the same number.
const MOCK_FOOD_ESTIMATES = [
  { match: "coffee with milk", calories: 50, protein: 2, carbs: 5, fat: 2 },
  { match: "coffee", calories: 15, protein: 1, carbs: 2, fat: 0 },
  { match: "banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { match: "chicken", calories: 250, protein: 30, carbs: 0, fat: 12 },
  { match: "rice", calories: 200, protein: 4, carbs: 45, fat: 0 },
  { match: "salad", calories: 150, protein: 5, carbs: 12, fat: 9 },
  { match: "pizza", calories: 285, protein: 12, carbs: 36, fat: 10 },
  { match: "egg", calories: 78, protein: 6, carbs: 1, fat: 5 },
  { match: "toast", calories: 90, protein: 3, carbs: 15, fat: 2 },
  { match: "yogurt", calories: 120, protein: 10, carbs: 15, fat: 3 },
];

function estimateFromDescription(text) {
  const lower = (text || "").toLowerCase();
  for (const entry of MOCK_FOOD_ESTIMATES) {
    if (lower.includes(entry.match)) {
      return { calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat };
    }
  }
  // Generic fallback so any description still produces a plausible
  // number — stand-in for "the AI actually looked at this."
  const base = 200 + Math.min(300, text.length * 5);
  return {
    calories: base,
    protein: Math.round((base * 0.15) / 4),
    carbs: Math.round((base * 0.5) / 4),
    fat: Math.round((base * 0.3) / 9),
  };
}

function guessSlotByTime() {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 15) return "Lunch";
  if (hour < 17) return "Snack";
  return "Dinner";
}

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
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function dayProgressPct() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.min(100, Math.max(0, ((now.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000)) * 100));
}

function emptyDayItems() {
  const obj = {};
  MEAL_SLOTS.forEach((slot) => {
    obj[slot] = [];
  });
  return obj;
}
function sumItemsField(items, field) {
  return items.reduce((sum, it) => sum + (it[field] || 0), 0);
}

function insightBoxStyle(ok) {
  return { fontSize: 12, color: ok ? "#166534" : "#92400e", background: ok ? "#f0fdf4" : "#fffbeb", padding: "8px 10px", borderRadius: 8, marginTop: 8 };
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
function sectionHeaderStyle() {
  return { fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, margin: "20px 0 10px" };
}
function macroRow(label, value, target, unit) {
  const pct = target > 0 ? (value / target) * 100 : 0;
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
        <div style={progressBarInner(pct, pct <= 115 ? "#2563eb" : "#dc2626")} />
      </div>
    </div>
  );
}

function DayStrip({ centerIso, todayIso, onPick }) {
  const days = [];
  for (let off = -3; off <= 3; off++) days.push(offsetDate(off, centerIso));
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
            <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#fff" : "#333" }}>{new Date(iso).getDate()}</div>
          </div>
        );
      })}
    </div>
  );
}

function LogFoodModal({ initial, showMacros, onClose, onSave, onDelete }) {
  const [description, setDescription] = useState(initial.name || "");
  const [slot, setSlot] = useState(initial.slot);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [estimated, setEstimated] = useState(initial.calories != null);
  const [calories, setCalories] = useState(initial.calories != null ? String(initial.calories) : "");
  const [protein, setProtein] = useState(initial.protein != null ? String(initial.protein) : "");
  const [carbs, setCarbs] = useState(initial.carbs != null ? String(initial.carbs) : "");
  const [fat, setFat] = useState(initial.fat != null ? String(initial.fat) : "");
  const [estimating, setEstimating] = useState(false);

  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleEstimate() {
    if (!description.trim()) {
      window.alert("Describe what you ate first.");
      return;
    }
    setEstimating(true);
    // Simulated AI latency — swap for a real Anthropic API call later.
    setTimeout(() => {
      const est = estimateFromDescription(description);
      setCalories(String(est.calories));
      setProtein(String(est.protein));
      setCarbs(String(est.carbs));
      setFat(String(est.fat));
      setEstimated(true);
      setEstimating(false);
    }, 500);
  }

  function handleSave(andAddAnother) {
    const cal = parseFloat(calories);
    if (!description.trim() || isNaN(cal)) {
      window.alert("Add a description and calories (or get an AI estimate) first.");
      return;
    }
    onSave(
      {
        name: description.trim(),
        slot,
        calories: cal,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      },
      andAddAnother
    );
    if (andAddAnother) {
      setDescription("");
      setPhotoPreview(null);
      setEstimated(false);
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{initial.id ? "Edit item" : "Log food"}</div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#999", cursor: "pointer" }}>×</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>What did you eat?</div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Coffee with milk"
            style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2563eb", cursor: "pointer" }}>
            📷 {photoPreview ? "Change photo" : "Add a photo (optional)"}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </label>
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Food preview" style={{ display: "block", marginTop: 8, width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
          )}
        </div>

        <button
          onClick={handleEstimate}
          disabled={estimating}
          style={{ width: "100%", padding: 10, background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: estimating ? "default" : "pointer" }}
        >
          {estimating ? "Estimating…" : "✨ Estimate with AI"}
        </button>

        <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Meal</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {MEAL_SLOTS.map((s) => (
            <div
              key={s}
              onClick={() => setSlot(s)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                cursor: "pointer",
                background: slot === s ? "#111" : "#f0f0f0",
                color: slot === s ? "#fff" : "#444",
              }}
            >
              {s}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: showMacros ? 8 : 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Calories</div>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
            />
          </div>
        </div>

        {showMacros && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Protein (g)</div>
              <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Carbs (g)</div>
              <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Fat (g)</div>
              <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }} />
            </div>
          </div>
        )}

        {!estimated && <p style={{ fontSize: 11, color: "#999", marginTop: -12, marginBottom: 16 }}>Tip: tap "Estimate with AI," or just type calories yourself.</p>}

        <button
          onClick={() => handleSave(false)}
          style={{ width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}
        >
          Save
        </button>
        <button
          onClick={() => handleSave(true)}
          style={{ width: "100%", padding: 12, background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, cursor: "pointer" }}
        >
          Save & log another
        </button>
        {initial.id && (
          <button
            onClick={onDelete}
            style={{ width: "100%", padding: 10, background: "none", color: "#b91c1c", border: "none", fontSize: 13, marginTop: 10, cursor: "pointer" }}
          >
            Delete this item
          </button>
        )}
      </div>
    </div>
  );
}

export default function Nutrition() {
  const todayIso = toLocalISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [showMacros, setShowMacros] = useState(true);
  const [modalState, setModalState] = useState(null); // null | { iso, slot, item? }
  const [dayItems, setDayItems] = useState(emptyDayItems());
  const [loading, setLoading] = useState(true);

  const isFuture = selectedDate > todayIso;

  // Fetch this day's real logged food from Supabase whenever the
  // selected date changes.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("log_date", selectedDate)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      const grouped = emptyDayItems();
      if (!error && data) {
        data.forEach((row) => {
          if (!grouped[row.slot]) grouped[row.slot] = [];
          grouped[row.slot].push({
            id: row.id,
            name: row.name,
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs,
            fat: row.fat,
          });
        });
      }
      setDayItems(grouped);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const allItems = MEAL_SLOTS.flatMap((slot) => dayItems[slot]);
  const caloriesTotal = sumItemsField(allItems, "calories");
  const proteinTotal = sumItemsField(allItems, "protein");
  const carbsTotal = sumItemsField(allItems, "carbs");
  const fatTotal = sumItemsField(allItems, "fat");

  let calorieInsight;
  if (isFuture) {
    calorieInsight = { text: "Nothing logged yet for a future day.", ok: true };
  } else if (selectedDate === todayIso) {
    const expectedByNow = TARGETS.calories * (dayProgressPct() / 100);
    const diff = caloriesTotal - expectedByNow;
    if (Math.abs(diff) <= 150) calorieInsight = { text: "On pace for today so far.", ok: true };
    else if (diff > 150) calorieInsight = { text: "Running a bit ahead of pace for this point in the day.", ok: false };
    else calorieInsight = { text: "Running a bit behind pace for this point in the day — might want a snack.", ok: false };
  } else {
    const diff = caloriesTotal - TARGETS.calories;
    if (Math.abs(diff) <= 100) calorieInsight = { text: "Landed right around target that day.", ok: true };
    else if (diff > 100) calorieInsight = { text: "About " + Math.round(diff) + " kcal over target that day.", ok: false };
    else calorieInsight = { text: "About " + Math.round(Math.abs(diff)) + " kcal under target that day.", ok: false };
  }

  const caloriesPct = (caloriesTotal / TARGETS.calories) * 100;

  function openNewItemModal(slot) {
    if (isFuture) return;
    setModalState({ iso: selectedDate, slot: slot || guessSlotByTime() });
  }
  function openEditItemModal(slot, item) {
    setModalState({ iso: selectedDate, slot, item });
  }

  async function handleSaveItem(values, andAddAnother) {
    if (modalState.item) {
      const { error } = await supabase
        .from("food_logs")
        .update({ slot: values.slot, name: values.name, calories: values.calories, protein: values.protein, carbs: values.carbs, fat: values.fat })
        .eq("id", modalState.item.id);
      if (error) {
        window.alert("Couldn't save — try again. (" + error.message + ")");
        return;
      }
      setDayItems((prev) => {
        const next = { ...prev };
        next[modalState.slot] = (next[modalState.slot] || []).filter((it) => it.id !== modalState.item.id);
        next[values.slot] = [...(next[values.slot] || []), { id: modalState.item.id, ...values }];
        return next;
      });
    } else {
      const { data, error } = await supabase
        .from("food_logs")
        .insert({ log_date: modalState.iso, slot: values.slot, name: values.name, calories: values.calories, protein: values.protein, carbs: values.carbs, fat: values.fat })
        .select()
        .single();
      if (error) {
        window.alert("Couldn't save — try again. (" + error.message + ")");
        return;
      }
      setDayItems((prev) => ({
        ...prev,
        [values.slot]: [
          ...(prev[values.slot] || []),
          { id: data.id, name: data.name, calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat },
        ],
      }));
    }
    if (!andAddAnother) setModalState(null);
    else setModalState({ iso: modalState.iso, slot: values.slot });
  }

  async function handleDeleteItem() {
    const { error } = await supabase.from("food_logs").delete().eq("id", modalState.item.id);
    if (error) {
      window.alert("Couldn't delete — try again. (" + error.message + ")");
      return;
    }
    setDayItems((prev) => ({
      ...prev,
      [modalState.slot]: (prev[modalState.slot] || []).filter((it) => it.id !== modalState.item.id),
    }));
    setModalState(null);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Nutrition</h1>
          <p style={{ color: "#666", fontSize: 13 }}>{formatDateLabel(selectedDate, todayIso)}</p>
        </div>
        <div
          onClick={() => setShowMacros((v) => !v)}
          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: showMacros ? "#111" : "#f0f0f0", color: showMacros ? "#fff" : "#666", cursor: "pointer", flexShrink: 0, marginTop: 4 }}
        >
          Macros {showMacros ? "On" : "Off"}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <DayStrip centerIso={selectedDate} todayIso={todayIso} onPick={setSelectedDate} />
      </div>

      <button
        onClick={() => openNewItemModal()}
        disabled={isFuture}
        style={{ width: "100%", padding: 14, background: isFuture ? "#eee" : "#111", color: isFuture ? "#999" : "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, marginBottom: 16, cursor: isFuture ? "default" : "pointer" }}
      >
        + Log food
      </button>

      <div style={cardStyle("#2563eb")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{isFuture ? "Planned calories" : "Calories"}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {Math.round(caloriesTotal)} <span style={{ fontSize: 12, color: "#999", fontWeight: 400 }}>/ {TARGETS.calories} kcal</span>
          </div>
        </div>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(caloriesPct, "#2563eb")} />
        </div>
        <div style={insightBoxStyle(calorieInsight.ok)}>{calorieInsight.text}</div>
        {showMacros && (
          <>
            {macroRow("Protein", proteinTotal, TARGETS.protein, "g")}
            {macroRow("Carbs", carbsTotal, TARGETS.carbs, "g")}
            {macroRow("Fat", fatTotal, TARGETS.fat, "g")}
          </>
        )}
      </div>

      <div style={sectionHeaderStyle()}>By meal</div>
      {MEAL_SLOTS.map((slot) => {
        const items = dayItems[slot];
        const planned = MEAL_TEMPLATE[slot];
        return (
          <div key={slot} style={cardStyle("#ea580c")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{slot}</div>
              <div style={{ fontSize: 11, color: "#999" }}>
                Planned ~{planned.calories} kcal
              </div>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: 12, color: "#999", padding: "6px 0" }}>
                {loading ? "Loading…" : isFuture ? "Nothing planned to log yet." : "Nothing logged yet."}
              </div>
            ) : (
              items.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => openEditItemModal(slot, item)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#444", padding: "8px 0", borderTop: i > 0 ? "1px solid #eee" : "none", cursor: "pointer" }}
                >
                  <span>{item.name}</span>
                  <span style={{ color: "#c2410c", fontSize: 12 }}>
                    {item.calories} kcal{showMacros ? " · " + item.protein + "g protein" : ""}
                  </span>
                </div>
              ))
            )}
            {!isFuture && (
              <div onClick={() => openNewItemModal(slot)} style={{ fontSize: 12, color: "#2563eb", marginTop: 8, cursor: "pointer" }}>
                + Add to {slot.toLowerCase()}
              </div>
            )}
          </div>
        );
      })}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Logging is real now — saved to Supabase per day. The AI estimate is still mocked (keyword-based); real
        photo/text analysis via the Anthropic API is a follow-up step.
      </p>

      {modalState && (
        <LogFoodModal
          initial={modalState.item ? { ...modalState.item, slot: modalState.slot } : { slot: modalState.slot }}
          showMacros={showMacros}
          onClose={() => setModalState(null)}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
        />
      )}
    </main>
  );
}
