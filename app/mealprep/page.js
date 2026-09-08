"use client";
import { useState } from "react";

// Mock data for now — same pattern as Trainer's first draft. Real
// persistence, and reading real kitchen/pantry equipment from onboarding
// (which doesn't collect that yet — see section 4 of the concept brief),
// are follow-ups once this design lands.
const DISH_LIBRARY = {
  "Chicken tikka bowl": {
    forMeal: "Lunch",
    calories: 520,
    protein: 38,
    servings: 4,
    ingredients: ["4 chicken breasts", "1 cup plain yogurt", "2 tbsp tikka masala spice mix", "2 cups rice", "1 cucumber", "2 tomatoes", "1 lemon", "Olive oil", "Salt", "Garlic"],
    steps: [
      "Marinate chicken in yogurt + tikka spice mix for at least 30 min",
      "Cook rice according to package directions",
      "Grill or pan-sear chicken until cooked through, about 6-7 min per side",
      "Dice cucumber and tomatoes for a quick salad, toss with lemon juice and olive oil",
      "Slice chicken and portion into containers over rice with salad on the side",
    ],
  },
  "Mediterranean chickpea salad": {
    forMeal: "Dinner",
    calories: 480,
    protein: 22,
    servings: 4,
    ingredients: ["2 cans chickpeas", "1 cucumber", "1 cup cherry tomatoes", "1/2 red onion", "1 cup feta cheese", "1/4 cup olive oil", "2 lemons", "Fresh parsley", "Salt", "Pepper"],
    steps: [
      "Drain and rinse chickpeas",
      "Dice cucumber, tomatoes, and red onion",
      "Combine chickpeas and vegetables in a large bowl",
      "Whisk olive oil, lemon juice, salt, and pepper for the dressing",
      "Toss salad with dressing and crumbled feta, portion into containers",
    ],
  },
  "Turkey chili": {
    forMeal: "Dinner",
    calories: 460,
    protein: 34,
    servings: 4,
    ingredients: ["2 lb ground turkey", "2 cans diced tomatoes", "1 can kidney beans", "1 can black beans", "1 onion", "2 tbsp chili powder", "1 tbsp cumin", "Garlic", "Salt"],
    steps: [
      "Brown ground turkey in a large pot over medium heat",
      "Add diced onion and garlic, cook until softened",
      "Stir in chili powder and cumin, cook 1 min until fragrant",
      "Add tomatoes and both cans of beans, bring to a simmer",
      "Simmer uncovered 25-30 min, stirring occasionally",
      "Portion into containers once cooled slightly",
    ],
  },
  "Greek yogurt parfait": {
    forMeal: "Breakfast",
    calories: 320,
    protein: 20,
    servings: 4,
    ingredients: ["4 cups Greek yogurt", "2 cups granola", "2 cups mixed berries", "Honey"],
    steps: ["Layer yogurt, granola, and berries in containers", "Drizzle with honey", "Seal and refrigerate — best eaten within 3 days"],
  },
};

// Two prep sessions a week, each covering the days until the next one.
// Sunday=0 ... Saturday=6.
const WEEKLY_TEMPLATE = {
  0: { type: "prep", dishes: ["Chicken tikka bowl", "Mediterranean chickpea salad"] },
  1: { type: "eating", dishes: ["Chicken tikka bowl", "Mediterranean chickpea salad"] },
  2: { type: "eating", dishes: ["Chicken tikka bowl", "Mediterranean chickpea salad"] },
  3: { type: "prep", dishes: ["Turkey chili", "Greek yogurt parfait"] },
  4: { type: "eating", dishes: ["Turkey chili", "Greek yogurt parfait"] },
  5: { type: "eating", dishes: ["Turkey chili", "Greek yogurt parfait"] },
  6: { type: "eating", dishes: ["Turkey chili", "Greek yogurt parfait"] },
};

const STAPLES = ["salt", "pepper", "olive oil", "garlic"];
function isStaple(ingredient) {
  const lower = ingredient.toLowerCase();
  return STAPLES.some((s) => lower.includes(s));
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
function dayOfWeek(iso) {
  return new Date(iso + "T12:00:00").getDay();
}
function formatDateLabel(iso, todayIso) {
  if (iso === todayIso) return "Today";
  if (iso === offsetDate(-1, todayIso)) return "Yesterday";
  if (iso === offsetDate(1, todayIso)) return "Tomorrow";
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function buildDayPlan(type, dishNames) {
  return { type, dishes: dishNames.map((name) => ({ name, servings: getDishSpec(name).servings })), status: "not_started" };
}
function getDayPlanForDate(iso, todayIso, overrides) {
  if (overrides[iso]) return overrides[iso];
  const template = WEEKLY_TEMPLATE[dayOfWeek(iso)];
  const status = iso < todayIso && template.type === "prep" ? "done" : "not_started";
  const plan = buildDayPlan(template.type, template.dishes);
  plan.status = status;
  return plan;
}

function matchFromText(text, options) {
  const lower = text.toLowerCase();
  return options.find((opt) => lower.includes(opt.toLowerCase())) || null;
}

function cardStyle(color) {
  return { background: "#f9f9f9", borderLeft: "4px solid " + color, borderRadius: 10, padding: 16, marginBottom: 16 };
}
function sectionHeaderStyle() {
  return { fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, margin: "20px 0 10px" };
}
function smallBtnStyle() {
  return { padding: "8px 10px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 12, cursor: "pointer" };
}
function chipStyle() {
  return { padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", background: "#f0f0f0", color: "#444" };
}

function OptionsPopover({ title, options, onPick, onCustomSubmit }) {
  const [showChat, setShowChat] = useState(false);
  const [text, setText] = useState("");
  function submitCustom() {
    if (!text.trim()) return;
    onCustomSubmit(text.trim());
    setText("");
    setShowChat(false);
  }
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 12, marginTop: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => (
          <div key={opt} onClick={() => onPick(opt)} style={chipStyle()}>
            {opt}
          </div>
        ))}
        <div onClick={() => setShowChat((v) => !v)} style={{ ...chipStyle(), background: showChat ? "#4338ca" : "#eef2ff", color: showChat ? "#fff" : "#4338ca" }}>
          💬
        </div>
      </div>
      {showChat && (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type exactly what you want…"
            style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
          />
          <button onClick={submitCustom} style={{ padding: "8px 14px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Go
          </button>
        </div>
      )}
    </div>
  );
}

function getDishSpec(name) {
  return DISH_LIBRARY[name] || { forMeal: "—", calories: 0, protein: 0, servings: 4, ingredients: [], steps: ["Details coming soon for this one."] };
}

// Figures out whether free-text input to "Alter this dish" means swap
// to a different dish, or a servings tweak — mocked keyword/number
// matching, same pattern as everywhere else in the app.
function resolveAlterCustom(text, currentServings) {
  const dishMatch = matchFromText(text, Object.keys(DISH_LIBRARY));
  if (dishMatch) return { kind: "swap", name: dishMatch };
  const numMatch = text.match(/\d+/);
  if (numMatch) return { kind: "servings", servings: Math.max(1, parseInt(numMatch[0], 10)) };
  const lower = text.toLowerCase();
  if (lower.includes("more") || lower.includes("bigger") || lower.includes("extra")) {
    return { kind: "servings", servings: currentServings + 2 };
  }
  if (lower.includes("less") || lower.includes("fewer") || lower.includes("smaller")) {
    return { kind: "servings", servings: Math.max(1, currentServings - 2) };
  }
  return { kind: "swap", name: text }; // fallback: treat as a literal custom dish name
}

// Step-by-step cooking mode, mirroring Trainer's Workout Mode: one dish
// at a time, ingredients then steps as a checklist, then the next dish.
function CookMode({ dayPlan, onUpdateDay, onFinish, onClose }) {
  const [dishIndex, setDishIndex] = useState(0);
  const [checksByDish, setChecksByDish] = useState({});
  const [openPopover, setOpenPopover] = useState(null); // null | "swap"

  const dishEntry = dayPlan.dishes[dishIndex];
  const dishName = dishEntry.name;
  const currentServings = dishEntry.servings;
  const dish = getDishSpec(dishName);
  const isLastDish = dishIndex >= dayPlan.dishes.length - 1;
  const checks = checksByDish[dishIndex] || {};
  const totalItems = dish.ingredients.length + dish.steps.length;
  const doneCount = Object.values(checks).filter(Boolean).length;

  function toggleCheck(key) {
    setChecksByDish((prev) => ({ ...prev, [dishIndex]: { ...(prev[dishIndex] || {}), [key]: !((prev[dishIndex] || {})[key]) } }));
  }
  function goToDish(i) {
    setDishIndex(Math.max(0, Math.min(dayPlan.dishes.length - 1, i)));
    setOpenPopover(null);
  }
  function handleSwapDish(newName) {
    const nextDishes = [...dayPlan.dishes];
    nextDishes[dishIndex] = { name: newName, servings: getDishSpec(newName).servings };
    onUpdateDay({ ...dayPlan, dishes: nextDishes });
    setChecksByDish((prev) => ({ ...prev, [dishIndex]: {} }));
    setOpenPopover(null);
  }
  function handleServingsChange(newServings) {
    const nextDishes = [...dayPlan.dishes];
    nextDishes[dishIndex] = { ...nextDishes[dishIndex], servings: newServings };
    onUpdateDay({ ...dayPlan, dishes: nextDishes });
    setOpenPopover(null);
  }
  function handleAlterPick(option) {
    if (option === "More servings") return handleServingsChange(currentServings + 2);
    if (option === "Fewer servings") return handleServingsChange(Math.max(1, currentServings - 2));
    return handleSwapDish(option);
  }
  function handleAlterCustom(text) {
    const resolved = resolveAlterCustom(text, currentServings);
    if (resolved.kind === "servings") handleServingsChange(resolved.servings);
    else handleSwapDish(resolved.name);
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 60, overflowY: "auto" }}>
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: "#999" }}>
            Dish {dishIndex + 1} of {dayPlan.dishes.length}
          </div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#999", cursor: "pointer" }}>×</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{dishName}</div>
        <div style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
          {dish.forMeal} · {dish.calories} kcal/serving · {dish.protein}g protein · serves {currentServings}
        </div>

        <div onClick={() => setOpenPopover(openPopover === "alter" ? null : "alter")} style={{ ...smallBtnStyle(), display: "inline-block", marginBottom: 4 }}>
          ✏️ Alter this dish
        </div>
        {openPopover === "alter" && (
          <OptionsPopover
            title="Alter this dish…"
            options={["More servings", "Fewer servings", ...Object.keys(DISH_LIBRARY).filter((n) => n !== dishName)]}
            onPick={handleAlterPick}
            onCustomSubmit={handleAlterCustom}
          />
        )}
        {dish.ingredients.length > 0 && (
          <p style={{ fontSize: 11, color: "#999", marginTop: 6, marginBottom: 0 }}>
            Ingredient amounts below are for the original recipe size — adjust while cooking if you've changed servings.
          </p>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={cardStyle("#ea580c")}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Ingredients</div>
            {dish.ingredients.map((ing, i) => {
              const key = "ing-" + i;
              const checked = !!checks[key];
              return (
                <div
                  key={key}
                  onClick={() => toggleCheck(key)}
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: checked ? "#999" : "#333", padding: "6px 0", cursor: "pointer", textDecoration: checked ? "line-through" : "none" }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: "1px solid " + (checked ? "#16a34a" : "#ccc"), background: checked ? "#16a34a" : "#fff", flexShrink: 0 }} />
                  {ing}
                </div>
              );
            })}
          </div>

          <div style={cardStyle("#ea580c")}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Steps</div>
            {dish.steps.map((stepText, i) => {
              const key = "step-" + i;
              const checked = !!checks[key];
              return (
                <div
                  key={key}
                  onClick={() => toggleCheck(key)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: checked ? "#999" : "#333", padding: "8px 0", borderTop: i > 0 ? "1px solid #eee" : "none", cursor: "pointer", textDecoration: checked ? "line-through" : "none" }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: "1px solid " + (checked ? "#16a34a" : "#ccc"), background: checked ? "#16a34a" : "#fff", flexShrink: 0, marginTop: 2 }} />
                  {stepText}
                </div>
              );
            })}
          </div>

          {doneCount < totalItems && (
            <div style={{ fontSize: 12, color: "#999", marginBottom: 10 }}>
              {doneCount} of {totalItems} checked off
            </div>
          )}

          <button
            onClick={() => (isLastDish ? onFinish() : goToDish(dishIndex + 1))}
            style={{ width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            {isLastDish ? "Finish prep session" : "Next dish →"}
          </button>
          {dishIndex > 0 && (
            <button onClick={() => goToDish(dishIndex - 1)} style={{ ...smallBtnStyle(), width: "100%", marginTop: 8 }}>
              ← Previous dish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Mealprep() {
  const todayIso = toLocalISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [overrides, setOverrides] = useState({});
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);

  const dayPlan = getDayPlanForDate(selectedDate, todayIso, overrides);
  const isFuture = selectedDate > todayIso;
  const isPrepDay = dayPlan.type === "prep";

  function updateDay(next) {
    setOverrides((prev) => ({ ...prev, [selectedDate]: next }));
  }
  function handleOpenCook() {
    if (isFuture || !isPrepDay) return;
    if (dayPlan.status === "not_started") updateDay({ ...dayPlan, status: "in_progress" });
    setCookModeOpen(true);
  }
  function handleFinishCook() {
    updateDay({ ...dayPlan, status: "done" });
    setCookModeOpen(false);
  }

  // Shopping list for the week: every ingredient across this week's two
  // prep sessions, deduped, split by a naive "already have" staples check
  // (not a real pantry yet — see footer note).
  const weekStart = offsetDate(-dayOfWeek(selectedDate), selectedDate);
  const prepDishNames = new Set();
  for (let i = 0; i < 7; i++) {
    const iso = offsetDate(i, weekStart);
    const plan = getDayPlanForDate(iso, todayIso, overrides);
    if (plan.type === "prep") plan.dishes.forEach((d) => prepDishNames.add(d.name));
  }
  const allIngredients = [];
  prepDishNames.forEach((name) => {
    getDishSpec(name).ingredients.forEach((ing) => {
      if (!allIngredients.includes(ing)) allIngredients.push(ing);
    });
  });
  const haveList = allIngredients.filter(isStaple);
  const needList = allIngredients.filter((i) => !isStaple(i));

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Meal-prep</h1>
          <p style={{ color: "#666", fontSize: 13 }}>{formatDateLabel(selectedDate, todayIso)}</p>
        </div>
        <div onClick={() => setShoppingOpen((v) => !v)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: shoppingOpen ? "#111" : "#f0f0f0", color: shoppingOpen ? "#fff" : "#666", cursor: "pointer", flexShrink: 0, marginTop: 4 }}>
          🛒 Shopping list
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, margin: "16px 0", overflowX: "auto" }}>
        {Array.from({ length: 7 }, (_, i) => offsetDate(i - 3, selectedDate)).map((iso) => {
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          const plan = getDayPlanForDate(iso, todayIso, overrides);
          const dotColor = plan.type === "prep" ? "#ea580c" : "#999";
          return (
            <div
              key={iso}
              onClick={() => setSelectedDate(iso)}
              style={{ flex: "1 0 0", minWidth: 42, textAlign: "center", padding: "8px 4px", borderRadius: 10, cursor: "pointer", background: isSelected ? "#111" : "#f5f5f5", border: isToday && !isSelected ? "1px solid #999" : "none" }}
            >
              <div style={{ fontSize: 10, color: isSelected ? "#ccc" : "#999", marginBottom: 4 }}>
                {new Date(iso + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#fff" : "#333", marginBottom: 6 }}>{new Date(iso + "T12:00:00").getDate()}</div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, margin: "0 auto" }} />
            </div>
          );
        })}
      </div>

      {shoppingOpen && (
        <div style={cardStyle("#0891b2")}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>This week's shopping list</div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 10 }}>
            Naive split for now — assumes common staples are on hand, doesn't read a real pantry yet.
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 4 }}>Probably already have</div>
          {haveList.length === 0 ? <div style={{ fontSize: 13, color: "#999", marginBottom: 10 }}>—</div> : haveList.map((i) => <div key={i} style={{ fontSize: 13, color: "#444", padding: "3px 0" }}>{i}</div>)}
          <div style={{ fontSize: 12, fontWeight: 600, color: "#b45309", margin: "10px 0 4px" }}>Need to buy</div>
          {needList.map((i) => <div key={i} style={{ fontSize: 13, color: "#444", padding: "3px 0" }}>{i}</div>)}
        </div>
      )}

      <div style={cardStyle(isPrepDay ? "#ea580c" : "#999")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{isPrepDay ? "Prep day" : "Eating from prep"}</div>
          <div
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              background: dayPlan.status === "done" ? "#dcfce7" : dayPlan.status === "in_progress" ? "#fef9c3" : "#eee",
              color: dayPlan.status === "done" ? "#166534" : dayPlan.status === "in_progress" ? "#854d0e" : "#888",
              flexShrink: 0,
            }}
          >
            {isPrepDay ? (dayPlan.status === "done" ? "Done" : dayPlan.status === "in_progress" ? "In progress" : "Not started") : "—"}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          {dayPlan.dishes.map((d, i) => {
            const dish = getDishSpec(d.name);
            return (
              <div key={d.name} style={{ fontSize: 13, color: "#444", padding: "6px 0", borderTop: i > 0 ? "1px solid #eee" : "none" }}>
                {d.name} <span style={{ color: "#999" }}>· {dish.forMeal} · {dish.calories} kcal · serves {d.servings}</span>
              </div>
            );
          })}
        </div>

        {isPrepDay && (
          <button
            onClick={handleOpenCook}
            disabled={isFuture}
            style={{
              width: "100%",
              padding: 14,
              marginTop: 14,
              background: isFuture ? "#eee" : dayPlan.status === "done" ? "#f5f5f5" : "#111",
              color: isFuture ? "#999" : dayPlan.status === "done" ? "#333" : "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: isFuture ? "default" : "pointer",
            }}
          >
            {isFuture ? "Not yet" : dayPlan.status === "done" ? "View" : dayPlan.status === "in_progress" ? "Continue cooking" : "Start cooking"}
          </button>
        )}
        {!isPrepDay && <p style={{ fontSize: 12, color: "#999", marginTop: 10 }}>Nothing to cook today — these are from the last prep session.</p>}
      </div>

      <div style={sectionHeaderStyle()}>Dish details</div>
      {dayPlan.dishes.map((d) => {
        const dish = getDishSpec(d.name);
        return (
          <div key={d.name} style={cardStyle("#eee")}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>
              {dish.ingredients.length} ingredients · {dish.steps.length} steps · serves {d.servings}
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Still mock data and session-only (nothing saved to Supabase yet). Doesn't yet account for your real kitchen
        equipment or pantry — onboarding doesn't collect that yet, per the concept brief's known gap.
      </p>

      {cookModeOpen && <CookMode dayPlan={dayPlan} onUpdateDay={updateDay} onFinish={handleFinishCook} onClose={() => setCookModeOpen(false)} />}
    </main>
  );
}
