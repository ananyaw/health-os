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

export default function Onboarding() {
  const [step, setStep] = useState("goals");
  const [goals, setGoals] = useState([
    "Lose weight",
    "General health",
    "Train for an event",
  ]);
  const [notes, setNotes] = useState("");
  const [modules, setModules] = useState({
    nutrition: true,
    exercise: true,
    mealprep: true,
  });

  function toggleGoal(g) {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function toggleModule(key) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
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

  const onModules = [
    modules.nutrition && "nutrition",
    modules.exercise && "exercise",
    modules.mealprep && "meal-prep",
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
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>
            What are your goals?
          </h1>
          <p style={{ color: "#666", fontSize: 14 }}>Pick as many as apply.</p>
          <div style={{ margin: "16px 0" }}>
            {GOAL_OPTIONS.map((g) => (
              <span
                key={g}
                style={chipStyle(goals.includes(g))}
                onClick={() => toggleGoal(g)}
              >
                {g}
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Anything else? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 8,
              marginBottom: 24,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => setStep("modules")}
            style={{
              width: "100%",
              padding: 12,
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
            }}
          >
            Continue
          </button>
        </div>
      )}

      {step === "modules" && (
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>
            What do you want help with?
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            Turn off anything you don't need.
          </p>
          {[
            { key: "nutrition", label: "Nutrition" },
            { key: "exercise", label: "Exercise and training" },
            { key: "mealprep", label: "Meal-prep" },
          ].map((m) => (
            <div
              key={m.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "#f5f5f5",
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <span>{m.label}</span>
              <button
                onClick={() => toggleModule(m.key)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "none",
                  background: modules[m.key] ? "#dcfce7" : "#eee",
                  color: modules[m.key] ? "#166534" : "#888",
                  fontSize: 13,
                }}
              >
                {modules[m.key] ? "On" : "Off"}
              </button>
            </div>
          ))}
          <button
            onClick={() => setStep("done")}
            style={{
              width: "100%",
              padding: 12,
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              marginTop: 16,
            }}
          >
            Continue
          </button>
        </div>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>You're set</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            {onModules.length > 0
              ? onModules.join(", ") +
                (onModules.length > 1 ? " are on. " : " is on. ")
              : "Nothing extra is on. "}
            We'll ask about anything else the first time it matters.
          </p>
        </div>
      )}
    </main>
  );
}
