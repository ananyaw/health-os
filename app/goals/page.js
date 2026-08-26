"use client";

// Mock data for now — same pattern as Home. Once real onboarding answers and
// logged history persist (Supabase), this reads from that instead.
const MOCK = {
  weightUnit: "kg",
  weight: {
    startEntry: { value: 76, date: "2026-07-01" },
    lastEntry: { value: 74.2, date: offsetDate(-1) },
    goal: { value: 67, date: "2026-12-31" },
  },
  event: {
    name: "10-mile race",
    date: "2026-10-04",
    goal: "Finish comfortably",
    currentFreq: "3-4 days/week",
    milePace: "10:30",
  },
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
function daysBetween(aIso, bIso) {
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / (1000 * 60 * 60 * 24);
}
function weeksBetween(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  return (target.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7);
}
function formatDateShort(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function weightGoalStatus() {
  const { startEntry, lastEntry, goal } = MOCK.weight;
  const totalDays = daysBetween(startEntry.date, goal.date);
  const elapsedDays = daysBetween(startEntry.date, toLocalISODate(new Date()));
  const pct = totalDays > 0 ? Math.min(1, Math.max(0, elapsedDays / totalDays)) : 0;
  const expectedToday = startEntry.value + (goal.value - startEntry.value) * pct;
  const diff = lastEntry.value - expectedToday;
  const isLoss = goal.value < startEntry.value;
  const behindBy = isLoss ? diff : -diff;

  const progressPct = Math.min(
    100,
    Math.max(0, ((startEntry.value - lastEntry.value) / (startEntry.value - goal.value)) * 100)
  );

  let status = "on_track";
  if (behindBy > 1.5) status = "at_risk";
  else if (behindBy > 0.7) status = "behind";

  return { progressPct, status };
}

function eventGoalStatus() {
  const weeks = weeksBetween(MOCK.event.date);
  const lowFreq =
    !MOCK.event.currentFreq ||
    MOCK.event.currentFreq === "0 days/week" ||
    MOCK.event.currentFreq === "1-2 days/week";
  let status = "on_track";
  if (weeks !== null && weeks < 4 && lowFreq) status = "at_risk";
  else if (weeks !== null && weeks < 8 && lowFreq) status = "behind";
  return { weeks, status };
}

const STATUS_META = {
  on_track: { label: "On track", color: "#16a34a", bg: "#f0fdf4" },
  behind: { label: "Behind", color: "#b45309", bg: "#fffbeb" },
  at_risk: { label: "At risk", color: "#b91c1c", bg: "#fef2f2" },
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
  return { width: Math.min(100, Math.max(0, pct)) + "%", background: color, height: "100%", borderRadius: 999 };
}

function StatusChip({ status }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: meta.color,
        background: meta.bg,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {meta.label}
    </span>
  );
}

function EditLink() {
  return <span style={{ fontSize: 12, color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}>Edit</span>;
}

export default function Goals() {
  const weightStatus = weightGoalStatus();
  const eventStatus = eventGoalStatus();

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Goals</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
        What everything else in the app is optimizing for.
      </p>

      <div style={cardStyle("#2563eb")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Weight</div>
          <StatusChip status={weightStatus.status} />
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
          {MOCK.weight.lastEntry.value}
          {MOCK.weightUnit} now → {MOCK.weight.goal.value}
          {MOCK.weightUnit} by {formatDateShort(MOCK.weight.goal.date)}
        </div>
        <div style={progressBarOuter()}>
          <div style={progressBarInner(weightStatus.progressPct, STATUS_META[weightStatus.status].color)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <div style={{ fontSize: 12, color: "#999" }}>{Math.round(weightStatus.progressPct)}% of the way there</div>
          <EditLink />
        </div>
      </div>

      <div style={cardStyle("#16a34a")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{MOCK.event.name}</div>
          <StatusChip status={eventStatus.status} />
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
          Goal: {MOCK.event.goal} · {formatDateShort(MOCK.event.date)}
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>
          {eventStatus.weeks !== null ? Math.round(eventStatus.weeks) + " weeks out" : "Add an event date"} · training{" "}
          {MOCK.event.currentFreq}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <EditLink />
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Status here is a first pass at the same pace math from onboarding's "Your Plan" — not yet reading real
        logged history.
      </p>
    </main>
  );
}
