"use client";
import { useState } from "react";

const GOAL_OPTIONS = [
  "Lose weight",
  "Build muscle",
  "General health",
  "Train for an event",
  "Eat healthier",
  "Reduce stress",
];

const MODULES = [
  {
    key: "nutrition",
    label: "Nutrition",
    desc: "Track what you eat and hit your daily targets.",
  },
  {
    key: "exercise",
    label: "Exercise and training",
    desc: "Get a workout plan that adapts to you over time.",
  },
  {
    key: "mealprep",
    label: "Meal-prep",
    desc: "Plan your week and batch-cook it in one guided session.",
  },
];

const FREQ_OPTIONS = ["0 days/week", "1-2 days/week", "3-4 days/week", "5+ days/week"];
const LENGTH_OPTIONS = ["15-30 min", "30-45 min", "45-60 min", "60+ min"];
const ACTIVITY_OPTIONS = ["Lifting", "Running", "Swimming", "Cycling", "Yoga", "Other"];
const ACCESS_OPTIONS = [
  "Gym",
  "Pool",
  "Outdoor running",
  "Indoor treadmill",
  "Home weights/bands",
  "Bodyweight only",
];
const INJURY_OPTIONS = ["None", "Knees", "Back", "Shoulder", "Other"];
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
const CUISINE_OPTIONS = ["Asian", "Indian", "Mediterranean", "Mexican", "American", "No preference"];
const CADENCE_OPTIONS = [
  { key: "weekly", label: "Once a week", desc: "One big batch-cook session." },
  { key: "fewtimes", label: "A few times a week", desc: "Smaller sessions, fresher food." },
  { key: "daily", label: "Most days", desc: "Little to no batching." },
];

function joinWithAnd(arr) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr[0] + " and " + arr[1];
  return arr.slice(0, -1).join(", ") + ", and " + arr[arr.length - 1];
}

function nextStep(current, modules) {
  const wantsFood = modules.nutrition || modules.mealprep;
  if (current === "goals") return "modules";
  if (current === "modules") {
    if (modules.exercise) return "trainerfreq";
    return wantsFood ? "food" : "done";
  }
  if (current === "trainerfreq") return "activities";
  if (current === "activities") return "access";
  if (current === "access") return "injuries";
  if (current === "injuries") return "calibration";
  if (current === "calibration") return "tone";
  if (current === "tone") return "trackingpref";
  if (current === "trackingpref") return wantsFood ? "food" : "done";
  if (current === "food") return "done";
  return "done";
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

export default function Onboarding() {
  const [step, setStep] = useState("goals");

  const [goals, setGoals] = useState([]);
  const [notes, setNotes] = useState("");
  const [modules, setModules] = useState({ nutrition: true, exercise: true, mealprep: true });

  const [currentFreq, setCurrentFreq] = useState("");
  const [desiredFreq, setDesiredFreq] = useState("");
  const [sessionLength, setSessionLength] = useState("");

  const [activities, setActivities] = useState([]);
  const [access, setAccess] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [injuryDetails, setInjuryDetails] = useState("");

  const [squatBench, setSquatBench] = useState("");
  const [milePace, setMilePace] = useState("");
  const [swimDistance, setSwimDistance] = useState("");
  const [notSure, setNotSure] = useState(false);

  const [tone, setTone] = useState("");
  const [trackingPref, setTrackingPref] = useState("");

  const [cuisines, setCuisines] = useState([]);
  const [cadence, setCadence] = useState("");

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
  const toggleAccess = toggleFrom(setAccess);
  const toggleInjury = toggleFrom(setInjuries);
  const toggleCuisine = toggleFrom(setCuisines);

  function goNext() {
    setStep(nextStep(step, modules));
  }

  const onModules = [
    modules.nutrition && "Nutrition",
    modules.exercise && "Exercise",
    modules.mealprep && "Meal-prep",
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
      {step === "goals" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What are your goals?</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Pick as many as apply.</p>
          <MultiChips options={GOAL_OPTIONS} selected={goals} onToggle={toggleGoal} />
          <input
            type="text"
            placeholder="Anything else? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...textInputStyle(), marginBottom: 24 }}
          />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "modules" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What do you want help with?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            Turn off anything you don't need.
          </p>
          {MODULES.map((m) => (
            <div
              key={m.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "12px 16px",
                background: "#f5f5f5",
                borderRadius: 10,
                marginBottom: 8,
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
          <MultiChips options={ACTIVITY_OPTIONS} selected={activities} onToggle={toggleActivity} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "access" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What do you have access to?</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Pick as many as apply.</p>
          <MultiChips options={ACCESS_OPTIONS} selected={access} onToggle={toggleAccess} />
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
            placeholder="Details (optional)"
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

      {step === "food" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>What are you into, food-wise?</h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Pick any cuisines you like.</p>
          <MultiChips options={CUISINE_OPTIONS} selected={cuisines} onToggle={toggleCuisine} />
          <p style={{ color: "#666", fontSize: 14, margin: "16px 0 8px" }}>How often do you cook?</p>
          <SingleChoiceCards options={CADENCE_OPTIONS} selected={cadence} onSelect={setCadence} />
          <ContinueButton onClick={goNext} />
        </div>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>You're set</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            {onModules.length > 0
              ? joinWithAnd(onModules) + (onModules.length > 1 ? " are on. " : " is on. ")
              : "Nothing extra is on. "}
            We'll ask about anything else the first time it matters.
          </p>
        </div>
      )}
    </main>
  );
}
