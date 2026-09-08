"use client";
import { useState } from "react";

// Mock data for now — same pattern as Home/Nutrition's first drafts.
// Real persistence + reading your actual onboarding answers (race goal,
// pace, equipment access) is a follow-up pass once this design lands.
const ACTIVITY_TYPES = ["Run", "Lift", "Swim", "Yoga", "Rest"];

const ACTIVITY_COLORS = {
  Rest: "#ccc",
  Run: "#16a34a",
  Lift: "#2563eb",
  Swim: "#0891b2",
  Yoga: "#9333ea",
};

const DEFAULT_DURATION = { Run: 35, Lift: 45, Swim: 40, Yoga: 30, Rest: 0 };

// A simple weekly rhythm, keyed by day-of-week (0=Sun..6=Sat). Fixed
// activity types only, per the validated finding: Lift/Run/Swim/Yoga,
// not free text.
const WEEKLY_TEMPLATE = {
  0: { type: "Rest", duration: 0, note: "" },
  1: { type: "Run", duration: 35, note: "Easy run" },
  2: { type: "Lift", duration: 45, note: "Upper body strength" },
  3: { type: "Rest", duration: 0, note: "" },
  4: { type: "Run", duration: 40, note: "Tempo run" },
  5: { type: "Lift", duration: 45, note: "Lower body strength" },
  6: { type: "Run", duration: 70, note: "Long run" },
};

const LIFT_EXERCISES = {
  "Upper body strength": [
    { name: "Bench press", sets: 4, reps: "8" },
    { name: "Bent-over row", sets: 4, reps: "8" },
    { name: "Overhead press", sets: 3, reps: "10" },
    { name: "Plank", sets: 3, reps: "45 sec" },
  ],
  "Lower body strength": [
    { name: "Squat", sets: 4, reps: "8" },
    { name: "Romanian deadlift", sets: 4, reps: "8" },
    { name: "Walking lunges", sets: 3, reps: "12/leg" },
    { name: "Calf raises", sets: 3, reps: "15" },
  ],
};
function getLiftExercises(note) {
  return LIFT_EXERCISES[note] || LIFT_EXERCISES["Upper body strength"];
}
function runSegments(note, duration) {
  if (note === "Long run") {
    return ["10 min easy warm-up jog", Math.max(10, duration - 20) + " min steady long-run pace", "10 min cooldown walk + stretch"];
  }
  if (note === "Tempo run") {
    return ["8 min easy warm-up jog", Math.max(10, duration - 16) + " min at tempo pace (comfortably hard)", "8 min cooldown jog"];
  }
  return ["5 min easy warm-up jog", Math.max(10, duration - 10) + " min steady pace, conversational effort", "5 min cooldown walk + stretch"];
}
const SWIM_SEGMENTS = ["400m warm-up, easy pace", "8 x 100m freestyle, 20 sec rest", "4 x 50m kick, 15 sec rest", "200m cooldown, easy pace"];
const YOGA_SEGMENTS = ["Sun Salutation A x5 (10 min)", "Standing sequence: Warrior I/II, Triangle (10 min)", "Balance poses: Tree, Half Moon (5 min)", "Cool-down stretches + Savasana (10 min)"];

function getGuideItems(session) {
  if (session.type === "Lift") return getLiftExercises(session.note).map((e) => e.name + " — " + e.sets + " x " + e.reps);
  if (session.type === "Run") return runSegments(session.note, session.duration);
  if (session.type === "Swim") return SWIM_SEGMENTS;
  if (session.type === "Yoga") return YOGA_SEGMENTS;
  return [];
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

function getSessionForDate(iso, todayIso, overrides) {
  if (overrides[iso]) return overrides[iso];
  const template = WEEKLY_TEMPLATE[dayOfWeek(iso)];
  const status = iso < todayIso && template.type !== "Rest" ? "done" : "not_started";
  return { type: template.type, duration: template.duration, note: template.note, status, checks: {} };
}

function cardStyle(color) {
  return { background: "#f9f9f9", borderLeft: "4px solid " + color, borderRadius: 10, padding: 16, marginBottom: 16 };
}
function insightBoxStyle(ok) {
  return { fontSize: 12, color: ok ? "#166534" : "#92400e", background: ok ? "#f0fdf4" : "#fffbeb", padding: "8px 10px", borderRadius: 8, marginTop: 10 };
}
function sectionHeaderStyle() {
  return { fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, margin: "20px 0 10px" };
}

function WeekStrip({ centerIso, todayIso, overrides, onPick }) {
  const days = [];
  for (let off = -3; off <= 3; off++) days.push(offsetDate(off, centerIso));
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
      {days.map((iso) => {
        const isSelected = iso === centerIso;
        const isToday = iso === todayIso;
        const session = getSessionForDate(iso, todayIso, overrides);
        const color = ACTIVITY_COLORS[session.type] || "#999";
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
              {new Date(iso + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#fff" : "#333", marginBottom: 6 }}>
              {new Date(iso + "T12:00:00").getDate()}
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, margin: "0 auto" }} />
          </div>
        );
      })}
    </div>
  );
}

function SessionModal({ session, onClose, onToggleCheck, onFinish }) {
  const items = getGuideItems(session);
  const isDone = session.status === "done";
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{session.note || session.type}</div>
            <div style={{ fontSize: 13, color: "#777" }}>
              {session.type} · {session.duration} min
            </div>
          </div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#999", cursor: "pointer" }}>×</span>
        </div>

        <div style={{ margin: "16px 0" }}>
          {items.map((line, i) => {
            const checked = !!session.checks[i];
            return (
              <div
                key={i}
                onClick={() => onToggleCheck(i)}
                style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: checked ? "#999" : "#333", padding: "10px 0", borderTop: i > 0 ? "1px solid #eee" : "none", cursor: "pointer", textDecoration: checked ? "line-through" : "none" }}
              >
                <span
                  style={{ width: 18, height: 18, borderRadius: 5, border: "1px solid " + (checked ? "#16a34a" : "#ccc"), background: checked ? "#16a34a" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}
                >
                  {checked ? "✓" : ""}
                </span>
                {line}
              </div>
            );
          })}
        </div>

        <button
          onClick={onFinish}
          style={{ width: "100%", padding: 16, background: isDone ? "#eee" : "#16a34a", color: isDone ? "#888" : "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: isDone ? "default" : "pointer" }}
        >
          {isDone ? "✓ Completed" : "Finish workout"}
        </button>
      </div>
    </div>
  );
}

export default function Trainer() {
  const todayIso = toLocalISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [overrides, setOverrides] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  const isFuture = selectedDate > todayIso;
  const session = getSessionForDate(selectedDate, todayIso, overrides);
  const isRest = session.type === "Rest";
  const color = ACTIVITY_COLORS[session.type] || "#999";

  function updateSession(iso, patch) {
    setOverrides((prev) => {
      const current = prev[iso] || getSessionForDate(iso, todayIso, prev);
      return { ...prev, [iso]: { ...current, ...patch } };
    });
  }

  function handleSwap() {
    const idx = ACTIVITY_TYPES.indexOf(session.type);
    const nextType = ACTIVITY_TYPES[(idx + 1) % ACTIVITY_TYPES.length];
    updateSession(selectedDate, { type: nextType, duration: DEFAULT_DURATION[nextType], note: "", status: "not_started", checks: {} });
  }
  function handleAdjustLength(delta) {
    if (isRest) return;
    updateSession(selectedDate, { duration: Math.max(10, session.duration + delta) });
  }
  function handleOpenSession() {
    if (isFuture || isRest) return;
    if (session.status === "not_started") updateSession(selectedDate, { status: "in_progress" });
    setModalOpen(true);
  }
  function handleToggleCheck(i) {
    const nextChecks = { ...session.checks, [i]: !session.checks[i] };
    updateSession(selectedDate, { checks: nextChecks });
  }
  function handleFinish() {
    updateSession(selectedDate, { status: "done" });
    setModalOpen(false);
  }

  // This week's adherence: how many non-Rest sessions are marked done
  // vs. how many were assigned, for the week containing the selected day.
  const weekStart = offsetDate(-dayOfWeek(selectedDate), selectedDate);
  let planned = 0;
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const iso = offsetDate(i, weekStart);
    const s = getSessionForDate(iso, todayIso, overrides);
    if (s.type !== "Rest") {
      planned += 1;
      if (s.status === "done") done += 1;
    }
  }
  const elapsedFraction = (dayOfWeek(todayIso === selectedDate ? todayIso : todayIso) + 1) / 7;
  const expected = planned * elapsedFraction;
  const onPace = done >= expected - 0.5;

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Trainer</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>{formatDateLabel(selectedDate, todayIso)}</p>

      <WeekStrip centerIso={selectedDate} todayIso={todayIso} overrides={overrides} onPick={setSelectedDate} />

      <div style={cardStyle(color)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{isRest ? "Rest day" : session.note || session.type}</div>
            {!isRest && (
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                {session.type} · {session.duration} min
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              background: session.status === "done" ? "#dcfce7" : session.status === "in_progress" ? "#fef9c3" : "#eee",
              color: session.status === "done" ? "#166534" : session.status === "in_progress" ? "#854d0e" : "#888",
              flexShrink: 0,
            }}
          >
            {session.status === "done" ? "Done" : session.status === "in_progress" ? "In progress" : isRest ? "—" : "Not started"}
          </div>
        </div>

        {!isRest && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={handleSwap} style={smallBtnStyle()}>
              Swap
            </button>
            <button onClick={() => handleAdjustLength(-15)} style={smallBtnStyle()}>
              −15 min
            </button>
            <button onClick={() => handleAdjustLength(15)} style={smallBtnStyle()}>
              +15 min
            </button>
          </div>
        )}
        {isRest && (
          <div style={{ marginTop: 12 }}>
            <button onClick={handleSwap} style={smallBtnStyle()}>
              Add a session instead
            </button>
          </div>
        )}

        {!isRest && (
          <button
            onClick={handleOpenSession}
            disabled={isFuture}
            style={{
              width: "100%",
              padding: 14,
              marginTop: 14,
              background: isFuture ? "#eee" : session.status === "done" ? "#f5f5f5" : "#111",
              color: isFuture ? "#999" : session.status === "done" ? "#333" : "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: isFuture ? "default" : "pointer",
            }}
          >
            {isFuture ? "Not yet" : session.status === "done" ? "View" : session.status === "in_progress" ? "Continue" : "Start workout"}
          </button>
        )}

        {!isFuture && !isRest && (
          <div style={insightBoxStyle(onPace)}>
            {done} of {planned} sessions done this week — {onPace ? "on pace." : "a bit behind pace."}
          </div>
        )}
      </div>

      <div style={sectionHeaderStyle()}>This session</div>
      {isRest ? (
        <p style={{ fontSize: 13, color: "#666" }}>Nothing assigned — recovery day.</p>
      ) : (
        <div style={cardStyle("#eee")}>
          {getGuideItems(session).map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: "#444", padding: "6px 0", borderTop: i > 0 ? "1px solid #eee" : "none" }}>
              {line}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Still mock data and session-only (nothing saved to Supabase yet). Doesn't read your real race goal or equipment
        access from onboarding yet — that's a follow-up once this layout feels right.
      </p>

      {modalOpen && (
        <SessionModal session={session} onClose={() => setModalOpen(false)} onToggleCheck={handleToggleCheck} onFinish={handleFinish} />
      )}
    </main>
  );
}

function smallBtnStyle() {
  return { flex: 1, padding: "8px 6px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 12, cursor: "pointer" };
}
