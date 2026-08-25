"use client";
import { useState } from "react";

const GOAL_OPTIONS = [
  "Lose weight",
  "Build muscle / strength",
  "General health",
  "Train for an event",
  "Eat healthier",
  "Reduce stress",
  "Improve endurance",
  "Sleep better",
  "Increase energy",
  "Other",
];

const NON_DATED_GOALS = ["Lose weight", "Build muscle / strength", "Train for an event"];

const MODULES = [
  {
    key: "nutrition",
    label: "Nutrition",
    desc: "Track what you eat and hit your daily targets.",
    color: "#2563eb",
  },
  {
    key: "exercise",
    label: "Exercise and training",
    desc: "Get a workout plan that adapts to you over time.",
    color: "#16a34a",
  },
  {
    key: "mealprep",
    label: "Meal-prep",
    desc: "Plan your week and batch-cook it in one guided session.",
    color: "#ea580c",
  },
];

const FREQ_OPTIONS = ["0 days/week", "1-2 days/week", "3-4 days/week", "5+ days/week"];
const LENGTH_OPTIONS = ["15-30 min", "30-45 min", "45-60 min", "60+ min"];
const ACTIVITY_OPTIONS = [
  "Lifting",
  "Running",
  "Swimming",
  "Cycling",
  "Yoga",
  "Hiking",
  "Rowing",
  "HIIT/Bootcamp",
  "Pilates",
  "Other",
];
const BODYWEIGHT_ONLY = "Bodyweight only";
const ACCESS_OPTIONS = [
  "Gym",
  "Pool",
  "Outdoor running",
  "Indoor treadmill",
  "Home weights/bands",
  "Resistance bands",
  "Cardio machines (bike/rower)",
  BODYWEIGHT_ONLY,
  "Other",
];
const INJURY_OPTIONS = ["None", "Knees", "Back", "Shoulder", "Ankle", "Hip", "Wrist/elbow", "Neck", "Other"];
const TONE_OPTIONS = [
  { key: "push", label: "Push me hard", desc: "Be direct, prioritize progress." },
  { key: "balanced", label: "Balanced", desc: "Mix encouragement with honesty." },
  { key: "ease", label: "Ease me in", desc: "Go gentle, especially at first." },
];
const TRACKING_OPTIONS = [
  {
    key: "wearable",
    label: "Auto-sync from a wearable",
    desc: "Pull completed workouts from Apple Health automatically.",
  },
  {
    key: "manual",
    label: "Log it myself",
    desc: "Mark workouts done by hand, no wearable needed.",
  },
];
const CUISINE_OPTIONS = [
  "Asian",
  "Indian",
  "Mediterranean",
  "Mexican",
  "American",
  "Italian",
  "Thai",
  "Middle Eastern",
  "No preference",
  "Other",
];
const CADENCE_OPTIONS = [
  { key: "weekly", label: "Once a week", desc: "One big batch-cook session." },
  { key: "fewtimes", label: "A few times a week", desc: "Smaller sessions, fresher food." },
  { key: "daily", label: "Most days", desc: "Little to no batching." },
];

const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Other",
];

const EATING_PATTERN_OPTIONS = [
  { key: "2meals", label: "2 meals a day", desc: "Two larger meals, no snacking in between." },
  { key: "3meals", label: "3 meals a day", desc: "Standard breakfast, lunch, dinner." },
  { key: "grazing", label: "Grazing / small frequent meals", desc: "Many small meals throughout the day." },
  { key: "if", label: "Intermittent fasting", desc: "Eating window with a fasting period." },
  { key: "varies", label: "Varies day to day", desc: "No consistent pattern." },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { key: "sedentary", label: "Sedentary", desc: "Little to no exercise day to day." },
  { key: "light", label: "Lightly active", desc: "Light activity 1-3 days/week." },
  { key: "moderate", label: "Moderately active", desc: "Moderate activity 3-5 days/week." },
  { key: "very", label: "Very active", desc: "Hard exercise 6-7 days/week." },
];
const ACTIVITY_MULTIPLIERS = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };

const SCHEDULE_PREF_OPTIONS = [
  { key: "consistent", label: "Consistent weekly schedule", desc: "Same days and activities most weeks — easier to build a habit." },
  { key: "varied", label: "Varied schedule", desc: "Mix it up week to week based on how you're feeling or what's convenient." },
];

const ACTIVITY_PRIORITY_BASE = {
  Running: 3,
  Lifting: 3,
  Swimming: 2,
  Cycling: 2,
  Yoga: 1,
  Hiking: 1,
  Rowing: 1,
  "HIIT/Bootcamp": 1,
  Pilates: 1,
  Other: 1,
};

const SKIPPABLE_STEPS = [
  "goaldetails",
  "trainerfreq",
  "activities",
  "schedulepref",
  "access",
  "injuries",
  "calibration",
  "tone",
  "trackingpref",
  "nutrition",
  "mealprep",
];

function joinWithAnd(arr) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr[0] + " and " + arr[1];
  return arr.slice(0, -1).join(", ") + ", and " + arr[arr.length - 1];
}

function nextStep(current, modules, goals) {
  const hasNutrition = modules.nutrition;
  const hasMealprep = modules.mealprep;
  const hasExercise = modules.exercise;

  function afterModules() {
    if (hasExercise) return "trainerfreq";
    if (hasNutrition) return "nutrition";
    if (hasMealprep) return "mealprep";
    return "done";
  }
  function afterTrainer() {
    if (hasNutrition) return "nutrition";
    if (hasMealprep) return "mealprep";
    return "done";
  }

  if (current === "goals") return "goaldetails";
  if (current === "goaldetails") return "modules";
  if (current === "modules") return afterModules();
  if (current === "trainerfreq") return "activities";
  if (current === "activities") return "schedulepref";
  if (current === "schedulepref") return "access";
  if (current === "access") return "injuries";
  if (current === "injuries") return "calibration";
  if (current === "calibration") return "tone";
  if (current === "tone") return "trackingpref";
  if (current === "trackingpref") return afterTrainer();
  if (current === "nutrition") return hasMealprep ? "mealprep" : "done";
  if (current === "mealprep") return "done";
  return "done";
}

function lbToKg(lb) {
  return lb * 0.453592;
}
function kgToLb(kg) {
  return kg / 0.453592;
}
function ftInToCm(ft, inch) {
  return (ft * 12 + inch) * 2.54;
}
function cmToFtIn(cm) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return { ft: ft, inch: inch };
}
function getWeightKg(valStr, unit) {
  const v = parseFloat(valStr);
  if (!v) return null;
  return unit === "lb" ? lbToKg(v) : v;
}

function computeSuggestedTargets({ age, sex, weightKg, goalWeightKg, heightCm, activityKey, goals }) {
  const ageNum = parseFloat(age);
  const weightNum = parseFloat(weightKg);
  const heightNum = parseFloat(heightCm);
  if (!ageNum || !weightNum || !heightNum || !sex) return null;

  const bmr =
    sex === "male"
      ? 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5
      : 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activityKey] || 1.2;
  const tdee = bmr * multiplier;

  const goalWeightNum = parseFloat(goalWeightKg);
  let calorieTarget = tdee;
  if (goalWeightNum && goalWeightNum < weightNum) {
    calorieTarget = tdee - 500;
  } else if (goalWeightNum && goalWeightNum > weightNum) {
    calorieTarget = tdee + 300;
  }

  const minFloor = sex === "male" ? 1500 : 1200;
  calorieTarget = Math.max(calorieTarget, minFloor);
  calorieTarget = Math.round(calorieTarget / 10) * 10;

  const wantsHighProtein = goals.includes("Lose weight") || goals.includes("Build muscle / strength");
  const proteinPerKg = wantsHighProtein ? 1.8 : 1.0;
  const proteinG = Math.round(proteinPerKg * weightNum);
  const proteinCals = proteinG * 4;

  const fatCals = calorieTarget * 0.27;
  const fatG = Math.round(fatCals / 9);

  const carbCals = Math.max(calorieTarget - proteinCals - fatCals, 0);
  const carbG = Math.round(carbCals / 4);

  return { calories: calorieTarget, protein: proteinG, carbs: carbG, fat: fatG };
}

function weeksBetween(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return ms / (1000 * 60 * 60 * 24 * 7);
}

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function isoDateFromWeeksFromNow(weeksFromNow) {
  const d = new Date(Date.now() + weeksFromNow * 7 * 24 * 60 * 60 * 1000);
  return toLocalISODate(d);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildWeightPlan({ goals, currentWeight, goalWeight, weightGoalDate, weightUnit }) {
  if (!goals.includes("Lose weight")) return null;
  const cur = parseFloat(currentWeight);
  const goal = parseFloat(goalWeight);
  const unitLabel = weightUnit;
  if (!cur || !goal) {
    return { title: "Weight", body: "Add your current and goal weight to see a suggested pace." };
  }

  const diff = cur - goal;
  const isLoss = diff > 0;
  const absDiff = Math.abs(diff);

  const negligible = weightUnit === "kg" ? 0.5 : 1;
  if (absDiff < negligible) {
    return { title: "Weight", body: "Your current and goal weight are basically the same — nothing to plan here." };
  }

  const isMetric = weightUnit === "kg";
  const safeMin = isLoss ? (isMetric ? 0.45 : 1) : (isMetric ? 0.1 : 0.25);
  const safeMax = isLoss ? (isMetric ? 0.9 : 2) : (isMetric ? 0.25 : 0.5);
  const midRate = (safeMin + safeMax) / 2;

  const weeks = weeksBetween(weightGoalDate);

  if (weeks === null || weeks <= 0) {
    const recWeeks = absDiff / midRate;
    const recIso = isoDateFromWeeksFromNow(recWeeks);
    return {
      title: "Weight",
      flag: true,
      field: "weightGoalDate",
      recommendedValue: recIso,
      applyLabel: "Use recommended date (" + formatDate(recIso) + ")",
      body:
        (weeks === null ? "Add a target date for " : "Your target date has passed for ") +
        cur + unitLabel + " → " + goal + unitLabel +
        ". At a sustainable pace (~" + midRate.toFixed(2) + unitLabel + "/week), that's about " +
        Math.round(recWeeks) + " weeks out — around " + formatDate(recIso) + ".",
    };
  }

  const impliedRate = absDiff / weeks;

  if (impliedRate > safeMax) {
    const recWeeks = absDiff / safeMax;
    const recIso = isoDateFromWeeksFromNow(recWeeks);
    return {
      title: "Weight",
      flag: true,
      field: "weightGoalDate",
      recommendedValue: recIso,
      applyLabel: "Use recommended date (" + formatDate(recIso) + ")",
      body:
        cur + unitLabel + " → " + goal + unitLabel + " by " + formatDate(weightGoalDate) +
        " implies ~" + impliedRate.toFixed(2) + unitLabel + "/week — faster than the generally sustainable range (" +
        safeMin + "-" + safeMax + unitLabel + "/week). A more realistic target date would be around " +
        formatDate(recIso) + " (~" + Math.round(recWeeks) + " weeks, " + safeMax + unitLabel + "/week).",
    };
  }

  const midIso = isoDateFromWeeksFromNow(weeks / 2);
  const midWeight = isLoss ? cur - absDiff / 2 : cur + absDiff / 2;
  return {
    title: "Weight",
    flag: false,
    body:
      cur + unitLabel + " → " + goal + unitLabel + " by " + formatDate(weightGoalDate) +
      " works out to ~" + impliedRate.toFixed(2) + unitLabel + "/week — a realistic pace. Halfway point: ~" +
      midWeight.toFixed(1) + unitLabel + " by " + formatDate(midIso) + ".",
    timeline: {
      color: "#2563eb",
      points: [
        { label: "Today", sub: cur + unitLabel, pct: 0 },
        { label: "Halfway", sub: midWeight.toFixed(1) + unitLabel + " · " + formatDateShort(midIso), pct: 50 },
        { label: "Goal", sub: goal + unitLabel + " · " + formatDateShort(weightGoalDate), pct: 100 },
      ],
    },
  };
}

function buildEventPlan({ goals, eventName, eventDate, eventGoal, currentFreq }) {
  if (!goals.includes("Train for an event") || !eventName) return null;
  const lowFreq = !currentFreq || currentFreq === "0 days/week" || currentFreq === "1-2 days/week";
  const goalIsFinishOriented = eventGoal && eventGoal.toLowerCase().indexOf("finish") !== -1;

  if (!eventDate) {
    return { title: "Event: " + eventName, body: "Add an event date so we can check whether your timeline is realistic." };
  }

  const weeks = weeksBetween(eventDate);

  if (weeks === null) {
    return { title: "Event: " + eventName, body: "Add a valid event date to check your timeline." };
  }
  if (weeks <= 0) {
    return { title: "Event: " + eventName, flag: true, body: "That date has already passed — double check it." };
  }

  const tight = weeks < 4 && lowFreq;

  if (tight && !goalIsFinishOriented) {
    return {
      title: "Event: " + eventName,
      flag: true,
      field: "eventGoal",
      recommendedValue: "Just finish comfortably",
      applyLabel: "Use this goal instead",
      body:
        "Only ~" + Math.round(weeks) + " weeks out, training " + (currentFreq || "rarely") +
        " — tight to build up safely. We'd recommend treating this one as a “just finish” goal rather than chasing a specific time.",
    };
  }

  if (tight && goalIsFinishOriented) {
    return {
      title: "Event: " + eventName,
      flag: false,
      body:
        "~" + Math.round(weeks) + " weeks out — a finish-focused goal is the right call given the short runway and current training frequency.",
      timeline: {
        color: "#16a34a",
        points: [
          { label: "Today", sub: "", pct: 0 },
          { label: eventName, sub: formatDateShort(eventDate) + " · " + (eventGoal || "Just finish"), pct: 100 },
        ],
      },
    };
  }

  return {
    title: "Event: " + eventName,
    flag: false,
    body:
      "~" + Math.round(weeks) + " weeks until " + eventName + (eventGoal ? " — goal: " + eventGoal : "") +
      ". Reasonable runway — we'll build the week-by-week plan once your trainer profile is set up.",
    timeline: {
      color: "#16a34a",
      points: [
        { label: "Today", sub: "", pct: 0 },
        { label: eventName, sub: formatDateShort(eventDate) + (eventGoal ? " · " + eventGoal : ""), pct: 100 },
      ],
    },
  };
}

function buildMuscleNote({ goals, muscleTarget, muscleGoalDate }) {
  if (!goals.includes("Build muscle / strength")) return null;
  return {
    title: "Muscle / strength",
    body: muscleTarget
      ? "Target: " + muscleTarget + (muscleGoalDate ? " by " + formatDate(muscleGoalDate) : "") + ". We'll track progress once training starts."
      : "No specific target set — we'll suggest one once training starts.",
  };
}

function buildSimpleGoalNotes({ goals, simpleGoalDates, otherGoalText }) {
  const simple = goals.filter((g) => NON_DATED_GOALS.indexOf(g) === -1);
  return simple.map((g) => ({
    title: g === "Other" && otherGoalText ? otherGoalText : g,
    body: simpleGoalDates[g] ? "Check-in by " + formatDate(simpleGoalDates[g]) + "." : "No check-in date set — that's fine, we'll follow up naturally.",
  }));
}

function parseFreqMid(freqStr) {
  if (!freqStr) return 3;
  if (freqStr.indexOf("0 days") === 0) return 0;
  if (freqStr.indexOf("1-2") === 0) return 2;
  if (freqStr.indexOf("3-4") === 0) return 4;
  if (freqStr.indexOf("5+") === 0) return 5;
  return 3;
}

function buildExerciseBreakdown({ activities, desiredFreq, goals, eventName }) {
  if (!activities || activities.length === 0) return null;
  const total = parseFreqMid(desiredFreq);
  if (total <= 0) return { total: 0, items: [] };

  const priorities = activities.map((a) => {
    let score = ACTIVITY_PRIORITY_BASE[a] || 1;
    if (a === "Lifting" && goals.indexOf("Build muscle / strength") !== -1) score += 2;
    if (a === "Running" && eventName && /run|marathon|mile|5k|10k/i.test(eventName)) score += 3;
    if (a === "Swimming" && eventName && /swim|triathlon/i.test(eventName)) score += 3;
    return { activity: a, score: score };
  });

  priorities.sort((a, b) => b.score - a.score);

  const counts = {};
  priorities.forEach((p) => {
    counts[p.activity] = 0;
  });

  let remaining = total;
  let idx = 0;
  let guard = 0;
  while (remaining > 0 && priorities.length > 0 && guard < 500) {
    const p = priorities[idx % priorities.length];
    counts[p.activity] += 1;
    remaining -= 1;
    idx += 1;
    guard += 1;
  }

  const items = priorities
    .map((p) => ({ activity: p.activity, perWeek: counts[p.activity] }))
    .filter((it) => it.perWeek > 0);
  return { total: total, items: items };
}

function chipStyle(active) {
  return {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid " + (active ? "#2563eb" : "#ccc"),
    background: active ? "#dbeafe" : "#fff",
    color: active ? "#1e3a8a" : "#333",
    margin: "0 8px 8px 0",
    fontSize: 14,
    cursor: "pointer",
  };
}

function textInputStyle() {
  return {
    width: "100%",
    padding: 10,
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 8,
    marginBottom: 12,
    boxSizing: "border-box",
  };
}

function sectionBoxStyle() {
  return {
    background: "#f5f5f5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  };
}

function sectionLabelStyle() {
  return {
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 8,
  };
}

function fieldCaptionStyle() {
  return {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  };
}

function applyButtonStyle() {
  return {
    padding: "8px 14px",
    background: "#fff",
    color: "#c2410c",
    border: "1px solid #fdba74",
    borderRadius: 8,
    fontSize: 13,
    marginTop: 8,
    cursor: "pointer",
  };
}

function sectionHeaderStyle() {
  return { fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 12px" };
}
function moduleResultBoxStyle(color) {
  return { background: "#f9f9f9", borderLeft: "4px solid " + color, borderRadius: 10, padding: 16, marginBottom: 16 };
}
function moduleResultTitleStyle() {
  return { fontWeight: 600, fontSize: 14, marginBottom: 10 };
}
function unitToggleStyle() {
  return { fontSize: 12, color: "#2563eb", textDecoration: "underline", cursor: "pointer" };
}
function stepperBtnStyle() {
  return {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: 16,
    lineHeight: "1",
    cursor: "pointer",
  };
}

function MultiChips({ options, selected, onToggle }) {
  return (
    <div style={{ margin: "16px 0" }}>
      {options.map((opt) => (
        <span key={opt} style={chipStyle(selected.includes(opt))} onClick={() => onToggle(opt)}>
          {opt}
        </span>
      ))}
    </div>
  );
}

function MultiChipsWithOther({ options, selected, onToggle, otherValue, onOtherChange, otherPlaceholder }) {
  const showOther = selected.includes("Other");
  return (
    <div>
      <MultiChips options={options} selected={selected} onToggle={onToggle} />
      {showOther && (
        <input
          type="text"
          placeholder={otherPlaceholder || "Tell us more"}
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          style={{ ...textInputStyle(), marginTop: -8 }}
        />
      )}
    </div>
  );
}

function SingleChoiceCards({ options, selected, onSelect }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <div
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid " + (active ? "#2563eb" : "#ddd"),
              background: active ? "#dbeafe" : "#fff",
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 500, color: active ? "#1e3a8a" : "#111" }}>{opt.label}</div>
            <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{opt.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function ContinueButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 12,
        background: "#111",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 15,
        marginTop: 8,
      }}
    >
      {label || "Continue"}
    </button>
  );
}

function WeightInputs({ currentWeight, setCurrentWeight, goalWeight, setGoalWeight, weightUnit, toggleWeightUnit }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={fieldCaptionStyle()}>Weight</div>
        <span onClick={toggleWeightUnit} style={unitToggleStyle()}>
          {weightUnit === "lb" ? "Switch to kg" : "Switch to lb"}
        </span>
      </div>
      <input
        type="text"
        placeholder={"Current weight (" + weightUnit + ")"}
        value={currentWeight}
        onChange={(e) => setCurrentWeight(e.target.value)}
        style={textInputStyle()}
      />
      <input
        type="text"
        placeholder={"Goal weight (" + weightUnit + ")"}
        value={goalWeight}
        onChange={(e) => setGoalWeight(e.target.value)}
        style={textInputStyle()}
      />
    </div>
  );
}

function HeightInputs({ heightUnit, toggleHeightUnit, heightFeet, setHeightFeet, heightInches, setHeightInches, heightCm, setHeightCm }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={fieldCaptionStyle()}>Height</div>
        <span onClick={toggleHeightUnit} style={unitToggleStyle()}>
          {heightUnit === "ftin" ? "Switch to cm" : "Switch to ft/in"}
        </span>
      </div>
      {heightUnit === "ftin" ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Feet"
            value={heightFeet}
            onChange={(e) => setHeightFeet(e.target.value)}
            style={{ ...textInputStyle(), flex: 1, marginBottom: 0 }}
          />
          <input
            type="text"
            placeholder="Inches"
            value={heightInches}
            onChange={(e) => setHeightInches(e.target.value)}
            style={{ ...textInputStyle(), flex: 1, marginBottom: 0 }}
          />
        </div>
      ) : (
        <input
          type="text"
          placeholder="Height (cm)"
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          style={{ ...textInputStyle(), marginBottom: 12 }}
        />
      )}
    </div>
  );
}

function GoalTimeline({ points, color }) {
  const lastPct = points.length > 0 ? points[points.length - 1].pct : 100;
  return (
    <div style={{ position: "relative", height: 56, margin: "12px 0 44px" }}>
      <div style={{ position: "absolute", top: 8, left: 0, right: 0, height: 4, background: "#e5e7eb", borderRadius: 2 }} />
      <div style={{ position: "absolute", top: 8, left: 0, height: 4, width: lastPct + "%", background: color, borderRadius: 2 }} />
      {points.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: p.pct + "%",
            transform: "translateX(-50%)",
            textAlign: "center",
            width: 110,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              margin: "0 auto 6px",
              border: "2px solid #fff",
              boxShadow: "0 0 0 1px " + color,
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>{p.label}</div>
          {p.sub && <div style={{ fontSize: 10, color: "#888" }}>{p.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function Stepper({ label, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 8,
        marginBottom: 6,
      }}
    >
      <div style={{ fontSize: 13, color: "#333" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))} style={stepperBtnStyle()}>
          −
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, width: 20, textAlign: "center" }}>{value}</div>
        <button onClick={() => onChange(value + 1)} style={stepperBtnStyle()}>
          +
        </button>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState("goals");

  const [goals, setGoals] = useState([]);
  const [otherGoalText, setOtherGoalText] = useState("");
  const [notes, setNotes] = useState("");
  const [weightUnit, setWeightUnit] = useState("lb");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [weightGoalDate, setWeightGoalDate] = useState("");
  const [muscleTarget, setMuscleTarget] = useState("");
  const [muscleGoalDate, setMuscleGoalDate] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventGoal, setEventGoal] = useState("");
  const [simpleGoalDates, setSimpleGoalDates] = useState({});

  const [modules, setModules] = useState({ nutrition: true, exercise: true, mealprep: true });

  const [currentFreq, setCurrentFreq] = useState("");
  const [desiredFreq, setDesiredFreq] = useState("");
  const [sessionLength, setSessionLength] = useState("");

  const [activities, setActivities] = useState([]);
  const [otherActivityText, setOtherActivityText] = useState("");
  const [schedulePref, setSchedulePref] = useState("");
  const [exerciseBreakdownOverride, setExerciseBreakdownOverride] = useState(null);

  const [access, setAccess] = useState([]);
  const [otherAccessText, setOtherAccessText] = useState("");

  const [injuries, setInjuries] = useState([]);
  const [injuryDetails, setInjuryDetails] = useState("");

  const [squatBench, setSquatBench] = useState("");
  const [milePace, setMilePace] = useState("");
  const [swimDistance, setSwimDistance] = useState("");
  const [notSure, setNotSure] = useState(false);

  const [tone, setTone] = useState("");
  const [trackingPref, setTrackingPref] = useState("");

  const [cuisines, setCuisines] = useState([]);
  const [otherCuisineText, setOtherCuisineText] = useState("");
  const [cadence, setCadence] = useState("");

  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightUnit, setHeightUnit] = useState("ftin");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [dietary, setDietary] = useState([]);
  const [otherDietaryText, setOtherDietaryText] = useState("");
  const [eatingPattern, setEatingPattern] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetFat, setTargetFat] = useState("");

  function toggleGoal(g) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }
  function toggleModule(key) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleFrom(setter) {
    return (val) =>
      setter((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
  }
  const toggleActivity = toggleFrom(setActivities);
  const toggleInjury = toggleFrom(setInjuries);
  const toggleCuisine = toggleFrom(setCuisines);
  const toggleDietary = toggleFrom(setDietary);

  function toggleAccess(opt) {
    setAccess((prev) => {
      if (opt === BODYWEIGHT_ONLY) {
        return prev.includes(opt) ? [] : [BODYWEIGHT_ONLY];
      }
      const withoutBodyweight = prev.filter((x) => x !== BODYWEIGHT_ONLY);
      return withoutBodyweight.includes(opt)
        ? withoutBodyweight.filter((x) => x !== opt)
        : [...withoutBodyweight, opt];
    });
  }

  function setSimpleGoalDate(g, val) {
    setSimpleGoalDates((prev) => ({ ...prev, [g]: val }));
  }

  function toggleWeightUnit() {
    const nextUnit = weightUnit === "lb" ? "kg" : "lb";
    const convert = (valStr) => {
      const v = parseFloat(valStr);
      if (!v) return valStr;
      const converted = weightUnit === "lb" ? lbToKg(v) : kgToLb(v);
      return String(Math.round(converted * 10) / 10);
    };
    setCurrentWeight((v) => convert(v));
    setGoalWeight((v) => convert(v));
    setWeightUnit(nextUnit);
  }

  function toggleHeightUnit() {
    const nextUnit = heightUnit === "ftin" ? "cm" : "ftin";
    if (heightUnit === "ftin") {
      const ft = parseFloat(heightFeet) || 0;
      const inch = parseFloat(heightInches) || 0;
      if (ft || inch) {
        setHeightCm(String(Math.round(ftInToCm(ft, inch))));
      }
    } else {
      const cm = parseFloat(heightCm) || 0;
      if (cm) {
        const conv = cmToFtIn(cm);
        setHeightFeet(String(conv.ft));
        setHeightInches(String(conv.inch));
      }
    }
    setHeightUnit(nextUnit);
  }

  function goNext() {
    setStep(nextStep(step, modules, goals));
  }
  function skipOnboarding() {
    setStep("done");
  }
  function resetTargets() {
    setTargetCalories("");
    setTargetProtein("");
    setTargetCarbs("");
    setTargetFat("");
  }
  function applyRecommendation(field, value) {
    if (field === "weightGoalDate") setWeightGoalDate(value);
    if (field === "eventGoal") setEventGoal(value);
  }

  const onModules = [
    modules.nutrition && "Nutrition",
    modules.exercise && "Exercise",
    modules.mealprep && "Meal-prep",
  ].filter(Boolean);

  const showSkip = SKIPPABLE_STEPS.includes(step);

  const simpleGoalsSelected = goals.filter((g) => NON_DATED_GOALS.indexOf(g) === -1);

  const heightCmCanonical =
    heightUnit === "cm"
      ? parseFloat(heightCm) || null
      : (parseFloat(heightFeet) || 0) || (parseFloat(heightInches) || 0)
      ? ftInToCm(parseFloat(heightFeet) || 0, parseFloat(heightInches) || 0)
      : null;

  const nutritionSuggestion = computeSuggestedTargets({
    age,
    sex,
    weightKg: getWeightKg(currentWeight, weightUnit),
    goalWeightKg: getWeightKg(goalWeight, weightUnit),
    heightCm: heightCmCanonical,
    activityKey: activityLevel,
    goals,
  });

  const baseBreakdown = buildExerciseBreakdown({ activities, desiredFreq, goals, eventName });
  const breakdownMap =
    exerciseBreakdownOverride ||
    (baseBreakdown ? Object.fromEntries(baseBreakdown.items.map((it) => [it.activity, it.perWeek])) : null);
  const exerciseItems = breakdownMap ? activities.map((a) => ({ activity: a, count: breakdownMap[a] || 0 })) : [];
  const exerciseTotal = exerciseItems.reduce((sum, it) => sum + it.count, 0);

  function updateExerciseCount(activity, value) {
    const base = breakdownMap || {};
    setExerciseBreakdownOverride({ ...base, [activity]: Math.max(0, value) });
  }

  const planCards = [
    buildWeightPlan({ goals, currentWeight, goalWeight, weightGoalDate, weightUnit }),
    buildEventPlan({ goals, eventName, eventDate, eventGoal, currentFreq }),
    buildMuscleNote({ goals, muscleTarget, muscleGoalDate }),
    ...buildSimpleGoalNotes({ goals, simpleGoalDates, otherGoalText }),
  ].filter(Boolean);

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      {showSkip && (
        <div style={{ textAlign: "right", marginBottom: 12 }}>
          <span
            onClick={skipOnboarding}
            style={{ fontSize: 13, color: "#888", cursor: "pointer", textDecoration: "underline" }}
          >
            Skip for now
          </span>
        </div>
      )}

      {step === "goals" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What are your goals?</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            Pick as many as apply — this takes a couple minutes and helps personalize things right
            away.
          </p>
          <MultiChipsWithOther
            options={GOAL_OPTIONS}
            selected={goals}
            onToggle={toggleGoal}
            otherValue={otherGoalText}
            onOtherChange={setOtherGoalText}
            otherPlaceholder="What's your goal?"
          />
          <input
            type="text"
            placeholder="Anything else? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...textInputStyle(), marginTop: 16, marginBottom: 24 }}
          />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "modules" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What do you want help with?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            Turn off anything you don't need. Everything here can be changed later too.
          </p>
          {MODULES.map((m) => (
            <div
              key={m.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "14px 16px",
                background: "#f5f5f5",
                borderRadius: 10,
                borderLeft: "4px solid " + m.color,
                marginBottom: 16,
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{m.desc}</div>
              </div>
              <button
                onClick={() => toggleModule(m.key)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "none",
                  background: modules[m.key] ? "#dcfce7" : "#eee",
                  color: modules[m.key] ? "#166534" : "#888",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {modules[m.key] ? "On" : "Off"}
              </button>
            </div>
          ))}
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "goaldetails" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>A few specifics</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            Based on the goals you picked. All optional — skip anything you'd rather fill in later.
          </p>

          {goals.includes("Lose weight") && (
            <div style={sectionBoxStyle()}>
              <div style={sectionLabelStyle()}>Weight goal</div>
              <WeightInputs
                currentWeight={currentWeight}
                setCurrentWeight={setCurrentWeight}
                goalWeight={goalWeight}
                setGoalWeight={setGoalWeight}
                weightUnit={weightUnit}
                toggleWeightUnit={toggleWeightUnit}
              />
              <div style={fieldCaptionStyle()}>Target date</div>
              <input
                type="date"
                value={weightGoalDate}
                onChange={(e) => setWeightGoalDate(e.target.value)}
                style={{ ...textInputStyle(), marginBottom: 0 }}
              />
            </div>
          )}

          {goals.includes("Build muscle / strength") && (
            <div style={sectionBoxStyle()}>
              <div style={sectionLabelStyle()}>Muscle/strength goal (optional)</div>
              <input
                type="text"
                placeholder="Any specific target, e.g. bench 135 lb"
                value={muscleTarget}
                onChange={(e) => setMuscleTarget(e.target.value)}
                style={textInputStyle()}
              />
              <div style={fieldCaptionStyle()}>Target date (optional)</div>
              <input
                type="date"
                value={muscleGoalDate}
                onChange={(e) => setMuscleGoalDate(e.target.value)}
                style={{ ...textInputStyle(), marginBottom: 0 }}
              />
            </div>
          )}

          {goals.includes("Train for an event") && (
            <div style={sectionBoxStyle()}>
              <div style={sectionLabelStyle()}>Event details</div>
              <input
                type="text"
                placeholder="What are you training for? e.g. 10-mile race, marathon"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={textInputStyle()}
              />
              <div style={fieldCaptionStyle()}>Event date</div>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={textInputStyle()}
              />
              <input
                type="text"
                placeholder="What's your goal for it? e.g. just finish, sub-1:45"
                value={eventGoal}
                onChange={(e) => setEventGoal(e.target.value)}
                style={{ ...textInputStyle(), marginBottom: 0 }}
              />
            </div>
          )}

          {simpleGoalsSelected.length > 0 && (
            <div style={sectionBoxStyle()}>
              <div style={sectionLabelStyle()}>Check-in dates (optional)</div>
              <p style={{ fontSize: 12, color: "#777", marginTop: -4, marginBottom: 12 }}>
                These goals don't have a natural finish line, but a check-in date helps us follow
                up at the right time.
              </p>
              {simpleGoalsSelected.map((g) => (
                <div key={g} style={{ marginBottom: 10 }}>
                  <div style={fieldCaptionStyle()}>
                    {g === "Other" && otherGoalText ? otherGoalText : g}
                  </div>
                  <input
                    type="date"
                    value={simpleGoalDates[g] || ""}
                    onChange={(e) => setSimpleGoalDate(g, e.target.value)}
                    style={{ ...textInputStyle(), marginBottom: 0 }}
                  />
                </div>
              ))}
            </div>
          )}

          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "trainerfreq" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>How do you train today?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Current frequency</p>
          <MultiChips options={FREQ_OPTIONS} selected={currentFreq ? [currentFreq] : []} onToggle={setCurrentFreq} />
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Frequency you're aiming for</p>
          <MultiChips options={FREQ_OPTIONS} selected={desiredFreq ? [desiredFreq] : []} onToggle={setDesiredFreq} />
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Typical session length</p>
          <MultiChips options={LENGTH_OPTIONS} selected={sessionLength ? [sessionLength] : []} onToggle={setSessionLength} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "activities" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What activities interest you?</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Pick as many as apply.</p>
          <MultiChipsWithOther
            options={ACTIVITY_OPTIONS}
            selected={activities}
            onToggle={toggleActivity}
            otherValue={otherActivityText}
            onOtherChange={setOtherActivityText}
            otherPlaceholder="What other activity?"
          />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "schedulepref" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>How do you want your training scheduled?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>You can change this later.</p>
          <SingleChoiceCards options={SCHEDULE_PREF_OPTIONS} selected={schedulePref} onSelect={setSchedulePref} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "access" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What do you have access to?</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            Pick as many as apply. "Bodyweight only" is exclusive of the others, since it means no
            equipment at all.
          </p>
          <MultiChipsWithOther
            options={ACCESS_OPTIONS}
            selected={access}
            onToggle={toggleAccess}
            otherValue={otherAccessText}
            onOtherChange={setOtherAccessText}
            otherPlaceholder="What else do you have access to?"
          />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "injuries" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Any injuries or limitations?</h1>
          <p style={{ color: "#666", fontSize: 14 }}>So we can avoid or adapt around them.</p>
          <MultiChips options={INJURY_OPTIONS} selected={injuries} onToggle={toggleInjury} />
          <input
            type="text"
            placeholder="Details (optional) — describe any of the above, or 'Other'"
            value={injuryDetails}
            onChange={(e) => setInjuryDetails(e.target.value)}
            style={{ ...textInputStyle(), marginBottom: 24 }}
          />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "calibration" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>A few numbers to calibrate</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            Rough estimates are fine — we'll refine these as you go.
          </p>
          <input
            type="text"
            placeholder="Squat / bench, e.g. 135 / 95 lbs"
            value={squatBench}
            onChange={(e) => setSquatBench(e.target.value)}
            style={textInputStyle()}
          />
          <input
            type="text"
            placeholder="Comfortable mile pace, e.g. 10:30"
            value={milePace}
            onChange={(e) => setMilePace(e.target.value)}
            style={textInputStyle()}
          />
          <input
            type="text"
            placeholder="Comfortable swim distance, e.g. 500m"
            value={swimDistance}
            onChange={(e) => setSwimDistance(e.target.value)}
            style={{ ...textInputStyle(), marginBottom: 8 }}
          />
          <div
            onClick={() => setNotSure(!notSure)}
            style={{ fontSize: 13, color: "#2563eb", cursor: "pointer", marginBottom: 16 }}
          >
            {notSure ? "Got it — " : "Not sure? "}
            {notSure
              ? "leave these blank and we'll suggest a quick test in your first session."
              : "tap here"}
          </div>
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "tone" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>How should your trainer sound?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>You can change this later.</p>
          <SingleChoiceCards options={TONE_OPTIONS} selected={tone} onSelect={setTone} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "trackingpref" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>How do you want to track workouts?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            You can connect a wearable later even if you skip it now.
          </p>
          <SingleChoiceCards options={TRACKING_OPTIONS} selected={trackingPref} onSelect={setTrackingPref} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "nutrition" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Let's set up nutrition info</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            This helps us suggest daily calorie and macro targets on your results page.
          </p>

          <div style={sectionBoxStyle()}>
            <div style={sectionLabelStyle()}>About you</div>
            <WeightInputs
              currentWeight={currentWeight}
              setCurrentWeight={setCurrentWeight}
              goalWeight={goalWeight}
              setGoalWeight={setGoalWeight}
              weightUnit={weightUnit}
              toggleWeightUnit={toggleWeightUnit}
            />
            <input
              type="text"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={textInputStyle()}
            />
            <div style={{ fontSize: 13, color: "#666", margin: "4px 0 6px" }}>
              Sex (used only for the calorie estimate)
            </div>
            <div style={{ marginBottom: 12 }}>
              {["male", "female"].map((s) => (
                <span key={s} style={chipStyle(sex === s)} onClick={() => setSex(s)}>
                  {s === "male" ? "Male" : "Female"}
                </span>
              ))}
            </div>
            <HeightInputs
              heightUnit={heightUnit}
              toggleHeightUnit={toggleHeightUnit}
              heightFeet={heightFeet}
              setHeightFeet={setHeightFeet}
              heightInches={heightInches}
              setHeightInches={setHeightInches}
              heightCm={heightCm}
              setHeightCm={setHeightCm}
            />
          </div>

          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
            How active are you day to day (outside of workouts)?
          </p>
          <SingleChoiceCards options={ACTIVITY_LEVEL_OPTIONS} selected={activityLevel} onSelect={setActivityLevel} />

          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Any dietary restrictions?</p>
          <MultiChipsWithOther
            options={DIETARY_OPTIONS}
            selected={dietary}
            onToggle={toggleDietary}
            otherValue={otherDietaryText}
            onOtherChange={setOtherDietaryText}
            otherPlaceholder="What else?"
          />

          <p style={{ color: "#666", fontSize: 14, margin: "16px 0 8px" }}>How do you usually eat?</p>
          <SingleChoiceCards options={EATING_PATTERN_OPTIONS} selected={eatingPattern} onSelect={setEatingPattern} />

          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "mealprep" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What are you into, food-wise?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Pick any cuisines you like.</p>
          <MultiChipsWithOther
            options={CUISINE_OPTIONS}
            selected={cuisines}
            onToggle={toggleCuisine}
            otherValue={otherCuisineText}
            onOtherChange={setOtherCuisineText}
            otherPlaceholder="What other cuisine?"
          />
          <p style={{ color: "#666", fontSize: 14, margin: "16px 0 8px" }}>How often do you cook?</p>
          <SingleChoiceCards options={CADENCE_OPTIONS} selected={cadence} onSelect={setCadence} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "done" && (
        <div style={{ paddingTop: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, textAlign: "center" }}>Your Plan</h1>
          <p style={{ color: "#666", fontSize: 14, textAlign: "center", margin: "8px 0 20px" }}>
            {onModules.length > 0
              ? joinWithAnd(onModules) + (onModules.length > 1 ? " are on. " : " is on. ")
              : "Nothing extra is on. "}
            Here's your timeline, and how the modules get you there.
          </p>

          {planCards.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={sectionHeaderStyle()}>Your goals timeline</div>
              {planCards.map((card, i) => (
                <div
                  key={i}
                  style={{
                    background: card.flag ? "#fff7ed" : "#fff",
                    border: "1px solid " + (card.flag ? "#fdba74" : "#eee"),
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{card.title}</div>
                  {card.timeline && <GoalTimeline points={card.timeline.points} color={card.timeline.color} />}
                  <div style={{ fontSize: 13, color: "#444" }}>{card.body}</div>
                  {card.flag && card.field && card.recommendedValue && (
                    <button
                      onClick={() => applyRecommendation(card.field, card.recommendedValue)}
                      style={applyButtonStyle()}
                    >
                      {card.applyLabel || "Use recommended"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={sectionHeaderStyle()}>How we'll get there</div>

          {modules.nutrition && (
            <div style={moduleResultBoxStyle("#2563eb")}>
              <div style={moduleResultTitleStyle()}>Nutrition — daily averages</div>
              {nutritionSuggestion ? (
                <div>
                  <p style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                    A general estimate — not medical advice. Edit any number, or reset below.
                  </p>
                  <div style={fieldCaptionStyle()}>Calories (kcal)</div>
                  <input
                    type="number"
                    value={targetCalories !== "" ? targetCalories : String(nutritionSuggestion.calories)}
                    onChange={(e) => setTargetCalories(e.target.value)}
                    style={textInputStyle()}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={fieldCaptionStyle()}>Protein (g)</div>
                      <input
                        type="number"
                        value={targetProtein !== "" ? targetProtein : String(nutritionSuggestion.protein)}
                        onChange={(e) => setTargetProtein(e.target.value)}
                        style={textInputStyle()}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={fieldCaptionStyle()}>Carbs (g)</div>
                      <input
                        type="number"
                        value={targetCarbs !== "" ? targetCarbs : String(nutritionSuggestion.carbs)}
                        onChange={(e) => setTargetCarbs(e.target.value)}
                        style={textInputStyle()}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={fieldCaptionStyle()}>Fat (g)</div>
                      <input
                        type="number"
                        value={targetFat !== "" ? targetFat : String(nutritionSuggestion.fat)}
                        onChange={(e) => setTargetFat(e.target.value)}
                        style={{ ...textInputStyle(), marginBottom: 0 }}
                      />
                    </div>
                  </div>
                  <div onClick={resetTargets} style={{ fontSize: 13, color: "#2563eb", cursor: "pointer", marginTop: 8 }}>
                    Reset to suggested
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
                  Add your weight, age, sex, and height in the nutrition step to see suggested targets.
                </p>
              )}
            </div>
          )}

          {modules.exercise && (
            <div style={moduleResultBoxStyle("#16a34a")}>
              <div style={moduleResultTitleStyle()}>Exercise — weekly breakdown</div>
              {schedulePref && (
                <p style={{ fontSize: 12, color: "#777", marginBottom: 8 }}>
                  {schedulePref === "consistent"
                    ? "You prefer a consistent weekly schedule."
                    : "You prefer a varied schedule week to week."}
                </p>
              )}
              {exerciseItems.length > 0 ? (
                <div>
                  {exerciseItems.map(({ activity, count }) => (
                    <Stepper key={activity} label={activity} value={count} onChange={(v) => updateExerciseCount(activity, v)} />
                  ))}
                  <div style={{ fontSize: 12, color: "#777", marginTop: 8 }}>
                    Total: {exerciseTotal}x/week{desiredFreq ? " (you said " + desiredFreq + ")" : ""}
                  </div>
                  <div
                    onClick={() => setExerciseBreakdownOverride(null)}
                    style={{ fontSize: 13, color: "#2563eb", cursor: "pointer", marginTop: 8 }}
                  >
                    Reset to suggested
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
                  Pick some activities in the exercise questions to see a suggested weekly breakdown.
                </p>
              )}
            </div>
          )}

          {modules.mealprep && (
            <div style={moduleResultBoxStyle("#ea580c")}>
              <div style={moduleResultTitleStyle()}>Meal-prep</div>
              <p style={{ fontSize: 13, color: "#444" }}>
                {cuisines.length > 0 ? "Into " + joinWithAnd(cuisines) + ". " : ""}
                {cadence
                  ? "Cooking " + ((CADENCE_OPTIONS.find((c) => c.key === cadence) || {}).label || cadence) + "."
                  : "No cooking cadence set yet."}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
