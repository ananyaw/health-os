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

const SKIPPABLE_STEPS = [
  "trainerfreq",
  "activities",
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

function nextStep(current, modules) {
  const hasNutrition = modules.nutrition;
  const hasMealprep = modules.mealprep;
  const hasExercise = modules.exercise;
  const showGate = hasExercise || hasNutrition || hasMealprep;

  function afterTrainer() {
    if (hasNutrition) return "nutrition";
    if (hasMealprep) return "mealprep";
    return "done";
  }

  if (current === "goals") return "modules";
  if (current === "modules") return showGate ? "personalize" : "done";
  if (current === "personalize") return hasExercise ? "trainerfreq" : afterTrainer();
  if (current === "trainerfreq") return "activities";
  if (current === "activities") return "access";
  if (current === "access") return "injuries";
  if (current === "injuries") return "calibration";
  if (current === "calibration") return "tone";
  if (current === "tone") return "trackingpref";
  if (current === "trackingpref") return afterTrainer();
  if (current === "nutrition") return hasMealprep ? "mealprep" : "done";
  if (current === "mealprep") return "done";
  return "done";
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

function buildWeightPlan({ goals, currentWeight, goalWeight, weightGoalDate }) {
  if (!goals.includes("Lose weight")) return null;
  const cur = parseFloat(currentWeight);
  const goal = parseFloat(goalWeight);
  if (!cur || !goal) {
    return { title: "Weight", body: "Add your current and goal weight above to see a suggested pace." };
  }

  const diff = cur - goal;
  const isLoss = diff > 0;
  const absDiff = Math.abs(diff);

  if (absDiff < 0.5) {
    return { title: "Weight", body: "Your current and goal weight are basically the same — nothing to plan here." };
  }

  const safeMin = isLoss ? 0.25 : 0.15;
  const safeMax = isLoss ? 1.0 : 0.5;
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
        cur +
        "kg → " +
        goal +
        "kg. At a sustainable pace (~" +
        midRate.toFixed(2) +
        "kg/week), that's about " +
        Math.round(recWeeks) +
        " weeks out — around " +
        formatDate(recIso) +
        ".",
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
        cur +
        "kg → " +
        goal +
        "kg by " +
        formatDate(weightGoalDate) +
        " implies ~" +
        impliedRate.toFixed(2) +
        "kg/week — faster than the generally sustainable range (" +
        safeMin +
        "-" +
        safeMax +
        "kg/week). A more realistic target date would be around " +
        formatDate(recIso) +
        " (~" +
        Math.round(recWeeks) +
        " weeks, " +
        safeMax +
        "kg/week).",
    };
  }

  const midIso = isoDateFromWeeksFromNow(weeks / 2);
  const midWeight = isLoss ? cur - absDiff / 2 : cur + absDiff / 2;
  return {
    title: "Weight",
    flag: false,
    body:
      cur +
      "kg → " +
      goal +
      "kg by " +
      formatDate(weightGoalDate) +
      " works out to ~" +
      impliedRate.toFixed(2) +
      "kg/week — a realistic pace. Halfway point: ~" +
      midWeight.toFixed(1) +
      "kg by " +
      formatDate(midIso) +
      ".",
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
        "Only ~" +
        Math.round(weeks) +
        " weeks out, training " +
        (currentFreq || "rarely") +
        " — tight to build up safely. We'd recommend treating this one as a “just finish” goal rather than chasing a specific time.",
    };
  }

  if (tight && goalIsFinishOriented) {
    return {
      title: "Event: " + eventName,
      flag: false,
      body:
        "~" +
        Math.round(weeks) +
        " weeks out — a finish-focused goal is the right call given the short runway and current training frequency.",
    };
  }

  return {
    title: "Event: " + eventName,
    flag: false,
    body:
      "~" +
      Math.round(weeks) +
      " weeks until " +
      eventName +
      (eventGoal ? " — goal: " + eventGoal : "") +
      ". Reasonable runway — we'll build the week-by-week plan once your trainer profile is set up.",
  };
}

function buildMuscleNote({ goals, muscleTarget, muscleGoalDate }) {
  if (!goals.includes("Build muscle / strength")) return null;
  return {
    title: "Muscle / strength",
    body: muscleTarget
      ? "Target: " +
        muscleTarget +
        (muscleGoalDate ? " by " + formatDate(muscleGoalDate) : "") +
        ". We'll track progress once training starts."
      : "No specific target set — we'll suggest one once training starts.",
  };
}

function buildSimpleGoalNotes({ goals, simpleGoalDates, otherGoalText }) {
  const simple = goals.filter((g) => NON_DATED_GOALS.indexOf(g) === -1);
  return simple.map((g) => ({
    title: g === "Other" && otherGoalText ? otherGoalText : g,
    body: simpleGoalDates[g]
      ? "Check-in by " + formatDate(simpleGoalDates[g]) + "."
      : "No check-in date set — that's fine, we'll follow up naturally.",
  }));
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

export default function Onboarding() {
  const [step, setStep] = useState("goals");

  const [goals, setGoals] = useState([]);
  const [otherGoalText, setOtherGoalText] = useState("");
  const [notes, setNotes] = useState("");
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

  function goNext() {
    setStep(nextStep(step, modules));
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

  const suggestion = computeSuggestedTargets({
    age,
    sex,
    weightKg: currentWeight,
    goalWeightKg: goalWeight,
    heightCm,
    activityKey: activityLevel,
    goals,
  });

  const simpleGoalsSelected = goals.filter((g) => NON_DATED_GOALS.indexOf(g) === -1);

  const planCards = [
    buildWeightPlan({ goals, currentWeight, goalWeight, weightGoalDate }),
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

          {goals.includes("Lose weight") && (
            <div style={sectionBoxStyle()}>
              <div style={sectionLabelStyle()}>Weight goal</div>
              <input
                type="text"
                placeholder="Current weight (kg)"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                style={textInputStyle()}
              />
              <input
                type="text"
                placeholder="Goal weight (kg)"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                style={textInputStyle()}
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

      {step === "personalize" && (
        <div style={{ textAlign: "center", paddingTop: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Want to personalize further?</h1>
          <p style={{ color: "#666", fontSize: 14, margin: "12px 0 24px" }}>
            A few more questions about training and food help us tailor things immediately. Takes
            about 3 minutes. You can always fill this in later.
          </p>
          <ContinueButton onClick={goNext} label="Continue" />
          <div
            onClick={skipOnboarding}
            style={{
              fontSize: 13,
              color: "#888",
              textDecoration: "underline",
              cursor: "pointer",
              marginTop: 16,
            }}
          >
            Skip for now
          </div>
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
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Let's set up nutrition targets</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            This helps us suggest daily calorie and macro targets. Everything below is editable.
          </p>

          <div style={sectionBoxStyle()}>
            <div style={sectionLabelStyle()}>About you</div>
            <input
              type="text"
              placeholder="Current weight (kg)"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              style={textInputStyle()}
            />
            <input
              type="text"
              placeholder="Goal weight (kg, optional)"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              style={textInputStyle()}
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
            <input
              type="text"
              placeholder="Height (cm)"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              style={{ ...textInputStyle(), marginBottom: 0 }}
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

          {suggestion ? (
            <div style={sectionBoxStyle()}>
              <div style={sectionLabelStyle()}>Suggested daily targets</div>
              <p style={{ fontSize: 12, color: "#777", marginTop: -4, marginBottom: 12 }}>
                A general estimate based on what you shared above — not medical advice. Edit any
                number, or reset below.
              </p>
              <input
                type="number"
                placeholder="Calories"
                value={targetCalories !== "" ? targetCalories : String(suggestion.calories)}
                onChange={(e) => setTargetCalories(e.target.value)}
                style={textInputStyle()}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="Protein (g)"
                  value={targetProtein !== "" ? targetProtein : String(suggestion.protein)}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  style={{ ...textInputStyle(), flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Carbs (g)"
                  value={targetCarbs !== "" ? targetCarbs : String(suggestion.carbs)}
                  onChange={(e) => setTargetCarbs(e.target.value)}
                  style={{ ...textInputStyle(), flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Fat (g)"
                  value={targetFat !== "" ? targetFat : String(suggestion.fat)}
                  onChange={(e) => setTargetFat(e.target.value)}
                  style={{ ...textInputStyle(), flex: 1, marginBottom: 0 }}
                />
              </div>
              <div
                onClick={resetTargets}
                style={{ fontSize: 13, color: "#2563eb", cursor: "pointer", marginTop: 8 }}
              >
                Reset to suggested
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#999", fontStyle: "italic", marginBottom: 16 }}>
              Add your weight, age, sex, and height above to see suggested targets.
            </p>
          )}

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
        <div style={{ paddingTop: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, textAlign: "center" }}>You're set</h1>
          <p style={{ color: "#666", fontSize: 14, textAlign: "center", margin: "8px 0 24px" }}>
            {onModules.length > 0
              ? joinWithAnd(onModules) + (onModules.length > 1 ? " are on. " : " is on. ")
              : "Nothing extra is on. "}
            Here's how your goals stack up.
          </p>
          {planCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: card.flag ? "#fff7ed" : "#f0fdf4",
                border: "1px solid " + (card.flag ? "#fdba74" : "#bbf7d0"),
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{card.title}</div>
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
          {planCards.length === 0 && (
            <p style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
              We'll ask about anything else the first time it matters.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
