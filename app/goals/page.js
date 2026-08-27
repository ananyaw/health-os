"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// Fallback data — used until real onboarding answers / logged weight exist,
// so the screen isn't empty on a fresh Supabase project.
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

function lbToKg(lb) {
  return lb * 0.453592;
}
function kgToLb(kg) {
  return kg / 0.453592;
}

// Builds the weight data Goals needs (all values in kg internally),
// preferring real Supabase data and falling back to MOCK piece by piece
// when a piece isn't available yet (e.g. no weight logged yet, or
// onboarding hasn't been completed/saved).
function buildWeightData(profileAnswers, latestLog, earliestLog) {
  const unit = (profileAnswers && profileAnswers.weightUnit) || MOCK.weightUnit;
  const toKg = (v) => (unit === "lb" ? lbToKg(parseFloat(v)) : parseFloat(v));

  let startEntry = null;
  if (earliestLog) {
    startEntry = { value: earliestLog.weight_kg, date: earliestLog.log_date };
  } else if (profileAnswers && profileAnswers.currentWeight) {
    startEntry = { value: toKg(profileAnswers.currentWeight), date: toLocalISODate(new Date()) };
  }

  let goal = null;
  if (profileAnswers && profileAnswers.goalWeight && profileAnswers.weightGoalDate) {
    goal = { value: toKg(profileAnswers.goalWeight), date: profileAnswers.weightGoalDate };
  }

  let lastEntry = null;
  if (latestLog) {
    lastEntry = { value: latestLog.weight_kg, date: latestLog.log_date };
  } else if (startEntry) {
    lastEntry = startEntry;
  }

  if (!startEntry || !goal || !lastEntry) {
    return { ...MOCK.weight, unit: MOCK.weightUnit, isReal: false };
  }
  return { startEntry, lastEntry, goal, unit, isReal: true };
}

function buildEventData(profileAnswers) {
  if (!profileAnswers || !profileAnswers.eventDate) {
    return { ...MOCK.event, isReal: false };
  }
  return {
    name: profileAnswers.eventName || MOCK.event.name,
    date: profileAnswers.eventDate,
    goal: profileAnswers.eventGoal || "Finish",
    currentFreq: profileAnswers.currentFreq || profileAnswers.desiredFreq || "",
    isReal: true,
  };
}

function weightGoalStatus(weightData) {
  const { startEntry, lastEntry, goal } = weightData;
  const totalDays = daysBetween(startEntry.date, goal.date);
  const elapsedDays = daysBetween(startEntry.date, toLocalISODate(new Date()));
  const pct = totalDays > 0 ? Math.min(1, Math.max(0, elapsedDays / totalDays)) : 0;
  const expectedToday = startEntry.value + (goal.value - startEntry.value) * pct;
  const diff = lastEntry.value - expectedToday;
  const isLoss = goal.value < startEntry.value;
  const behindBy = isLoss ? diff : -diff;

  const denom = startEntry.value - goal.value;
  const progressPct =
    denom !== 0 ? Math.min(100, Math.max(0, ((startEntry.value - lastEntry.value) / denom) * 100)) : 100;

  let status = "on_track";
  if (behindBy > 1.5) status = "at_risk";
  else if (behindBy > 0.7) status = "behind";

  return { progressPct, status };
}

function eventGoalStatus(eventData) {
  const weeks = weeksBetween(eventData.date);
  const lowFreq =
    !eventData.currentFreq ||
    eventData.currentFreq === "0 days/week" ||
    eventData.currentFreq === "1-2 days/week";
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
  const [profileAnswers, setProfileAnswers] = useState(null);
  const [latestLog, setLatestLog] = useState(null);
  const [earliestLog, setEarliestLog] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [profileRes, latestRes, earliestRes] = await Promise.all([
        supabase.from("profile").select("answers").order("updated_at", { ascending: false }).limit(1),
        supabase.from("weight_logs").select("log_date, weight_kg").order("log_date", { ascending: false }).limit(1),
        supabase.from("weight_logs").select("log_date, weight_kg").order("log_date", { ascending: true }).limit(1),
      ]);
      if (cancelled) return;
      if (profileRes.data && profileRes.data.length > 0) setProfileAnswers(profileRes.data[0].answers);
      if (latestRes.data && latestRes.data.length > 0) setLatestLog(latestRes.data[0]);
      if (earliestRes.data && earliestRes.data.length > 0) setEarliestLog(earliestRes.data[0]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const weightData = buildWeightData(profileAnswers, latestLog, earliestLog);
  const eventData = buildEventData(profileAnswers);
  const weightStatus = weightGoalStatus(weightData);
  const eventStatus = eventGoalStatus(eventData);

  // Display in whichever unit the weight is tracked in; values are kg internally.
  const displayUnit = weightData.unit;
  const toDisplay = (kg) => (displayUnit === "lb" ? Math.round(kgToLb(kg) * 10) / 10 : Math.round(kg * 10) / 10);

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
          {toDisplay(weightData.lastEntry.value)}
          {displayUnit} now → {toDisplay(weightData.goal.value)}
          {displayUnit} by {formatDateShort(weightData.goal.date)}
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>{eventData.name}</div>
          <StatusChip status={eventStatus.status} />
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
          Goal: {eventData.goal} · {formatDateShort(eventData.date)}
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>
          {eventStatus.weeks !== null ? Math.round(eventStatus.weeks) + " weeks out" : "Add an event date"} · training{" "}
          {eventData.currentFreq}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <EditLink />
        </div>
      </div>

      {(!weightData.isReal || !eventData.isReal) && (
        <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
          {!weightData.isReal && !eventData.isReal
            ? "Showing placeholder data — complete onboarding and log a weight entry to see your real status here."
            : !weightData.isReal
            ? "Weight is showing placeholder data — log a weight entry and complete onboarding's weight goal to replace it."
            : "Event is showing placeholder data — set an event goal in onboarding to replace it."}
        </p>
      )}
    </main>
  );
}
