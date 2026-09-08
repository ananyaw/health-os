"use client";
import { useState, useEffect } from "react";

// Mock data + mock "AI" chat matching for now — same pattern as Nutrition's
// estimate. Real reasoning (a proper Exceptions/coach chat) is a later,
// separate phase per the concept brief; this is a lightweight stand-in.
const ACTIVITY_TYPES = ["Run", "Lift", "Swim", "Yoga", "Rest"];
const ACTIVITY_COLORS = { Rest: "#ccc", Run: "#16a34a", Lift: "#2563eb", Swim: "#0891b2", Yoga: "#9333ea" };
const DEFAULT_DURATION = { Run: 35, Lift: 45, Swim: 40, Yoga: 30, Rest: 0 };
const DEFAULT_COLOR = "#666";

const WEEKLY_TEMPLATE = {
  0: { type: "Rest", duration: 0 },
  1: { type: "Run", duration: 35, focus: "Easy" },
  2: { type: "Lift", duration: 45, focus: "Upper body" },
  3: { type: "Rest", duration: 0 },
  4: { type: "Run", duration: 40, focus: "Tempo" },
  5: { type: "Lift", duration: 45, focus: "Lower body" },
  6: { type: "Run", duration: 70, focus: "Long run" },
};

// Flat library so any exercise (default or swapped-in) resolves to a
// real sets/reps/weight/rest/how-to spec. Recommended weight is a rough
// mock starting point, not personalized yet — a follow-up would pull
// this from onboarding's calibration answers.
const EXERCISE_LIBRARY = {
  "Bench press": { sets: 4, reps: "8", weight: "~60kg / 135lb to start", rest: 90, howTo: "Lie on the bench, grip slightly wider than shoulders, lower the bar to your chest, press back up. Keep feet flat and shoulder blades pinned." },
  "Bent-over row": { sets: 4, reps: "8", weight: "~40kg / 90lb to start", rest: 90, howTo: "Hinge at the hips with a flat back, pull the weight to your lower ribs, squeeze your shoulder blades together." },
  "Overhead press": { sets: 3, reps: "10", weight: "~30kg / 65lb to start", rest: 75, howTo: "Press the weight straight overhead from shoulder height, keep your core tight, avoid arching your lower back." },
  "Plank": { sets: 3, reps: "45 sec", weight: "Bodyweight", rest: 45, howTo: "Forearms on the ground, body in a straight line from head to heels, brace your core, don't let your hips sag." },
  "Squat": { sets: 4, reps: "8", weight: "~70kg / 155lb to start", rest: 120, howTo: "Bar on your upper back, feet shoulder-width, sit your hips back and down, keep your chest up, drive through your heels to stand." },
  "Romanian deadlift": { sets: 4, reps: "8", weight: "~50kg / 110lb to start", rest: 90, howTo: "Slight knee bend, hinge at the hips lowering the weight along your legs, feel a stretch in your hamstrings, drive your hips forward to stand." },
  "Walking lunges": { sets: 3, reps: "12/leg", weight: "Bodyweight or light dumbbells", rest: 60, howTo: "Step forward into a lunge, back knee toward the floor, push through your front heel into the next step." },
  "Calf raises": { sets: 3, reps: "15", weight: "Bodyweight", rest: 45, howTo: "Rise onto your toes as high as you can, pause, lower slowly under control." },
  "Bicep curls": { sets: 3, reps: "12", weight: "~10kg / 20lb dumbbells", rest: 60, howTo: "Elbows pinned to your sides, curl the weight up without swinging, lower slowly." },
  "Tricep dips": { sets: 3, reps: "12", weight: "Bodyweight", rest: 60, howTo: "Hands on a bench behind you, lower your body by bending your elbows to about 90°, press back up." },
  "Hammer curls": { sets: 3, reps: "12", weight: "~10kg / 20lb dumbbells", rest: 60, howTo: "Palms facing each other, curl up keeping your elbows still, lower with control." },
  "Push-ups": { sets: 3, reps: "15", weight: "Bodyweight", rest: 60, howTo: "Hands under shoulders, lower your chest to the floor keeping a straight line, press back up." },
  "Russian twists": { sets: 3, reps: "20", weight: "Bodyweight or light weight", rest: 45, howTo: "Sit with knees bent, lean back slightly, rotate your torso side to side." },
  "Leg raises": { sets: 3, reps: "15", weight: "Bodyweight", rest: 45, howTo: "Lying on your back, legs straight, raise them to vertical keeping your lower back down, lower slowly." },
  "Bicycle crunches": { sets: 3, reps: "20", weight: "Bodyweight", rest: 45, howTo: "Hands behind your head, bring opposite elbow to opposite knee in a pedaling motion." },
};
function getExerciseSpec(name) {
  return EXERCISE_LIBRARY[name] || { sets: 3, reps: "10", weight: "Moderate weight — adjust by feel", rest: 60, howTo: "Details coming soon for this one — look up proper form before trying it the first time." };
}

const LIFT_FOCUS = {
  "Upper body": ["Bench press", "Bent-over row", "Overhead press", "Plank"],
  "Lower body": ["Squat", "Romanian deadlift", "Walking lunges", "Calf raises"],
  "Full body": ["Squat", "Bench press", "Bent-over row", "Plank"],
  "Arms": ["Bicep curls", "Tricep dips", "Hammer curls", "Push-ups"],
  "Core": ["Plank", "Russian twists", "Leg raises", "Bicycle crunches"],
};
const FOCUS_OPTIONS_LIFT = Object.keys(LIFT_FOCUS);

const ALTERNATES = {
  "Bench press": ["Push-ups", "Dumbbell press", "Incline press"],
  "Squat": ["Goblet squat", "Leg press", "Lunges"],
  "Bent-over row": ["Seated cable row", "Lat pulldown"],
  "Overhead press": ["Arnold press", "Lateral raises"],
  "Romanian deadlift": ["Leg curls", "Good mornings"],
  "Walking lunges": ["Step-ups", "Bulgarian split squats"],
  "Calf raises": ["Seated calf raises"],
  "Plank": ["Side plank", "Dead bug"],
  "Bicep curls": ["Concentration curls"],
  "Tricep dips": ["Skull crushers"],
  "Hammer curls": ["Cable curls"],
  "Push-ups": ["Incline push-ups"],
  "Russian twists": ["Wood choppers"],
  "Leg raises": ["Reverse crunches"],
  "Bicycle crunches": ["Mountain climbers"],
};

const RUN_FOCUS = {
  Easy: (d) => ["5 min easy warm-up jog", Math.max(10, d - 10) + " min steady pace, conversational effort", "5 min cooldown walk + stretch"],
  Tempo: (d) => ["8 min easy warm-up jog", Math.max(10, d - 16) + " min at tempo pace (comfortably hard)", "8 min cooldown jog"],
  "Long run": (d) => ["10 min easy warm-up jog", Math.max(10, d - 20) + " min steady long-run pace", "10 min cooldown walk + stretch"],
  "Sprints/Intervals": (d) => ["10 min warm-up jog", "8 x 200m sprint @ hard effort, 90 sec walk recovery between", "10 min cooldown jog"],
};
const FOCUS_OPTIONS_RUN = Object.keys(RUN_FOCUS);
function getRunSegments(focus, duration) {
  const fn = RUN_FOCUS[focus] || RUN_FOCUS.Easy;
  return fn(duration);
}
const SWIM_SEGMENTS = ["400m warm-up, easy pace", "8 x 100m freestyle, 20 sec rest", "4 x 50m kick, 15 sec rest", "200m cooldown, easy pace"];
const YOGA_SEGMENTS = ["Sun Salutation A x5 (10 min)", "Standing sequence: Warrior I/II, Triangle (10 min)", "Balance poses: Tree, Half Moon (5 min)", "Cool-down stretches + Savasana (10 min)"];

function getSteps(session) {
  if (session.type === "Lift") return (session.exercises || []).map((name) => ({ kind: "exercise", name, ...getExerciseSpec(name) }));
  if (session.type === "Run") return getRunSegments(session.focus, session.duration).map((text) => ({ kind: "segment", text }));
  if (session.type === "Swim") return SWIM_SEGMENTS.map((text) => ({ kind: "segment", text }));
  if (session.type === "Yoga") return YOGA_SEGMENTS.map((text) => ({ kind: "segment", text }));
  if (session.customLabel) return [{ kind: "segment", text: "Custom: " + session.customLabel + " — log it however works for you." }];
  return [];
}

function matchFromText(text, options) {
  const lower = text.toLowerCase();
  return options.find((opt) => lower.includes(opt.toLowerCase())) || null;
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

function buildSessionForType(type, focus) {
  const base = { type, duration: DEFAULT_DURATION[type] || 30, status: "not_started" };
  if (type === "Lift") {
    base.focus = focus || "Upper body";
    base.exercises = [...(LIFT_FOCUS[base.focus] || LIFT_FOCUS["Upper body"])];
  } else if (type === "Run") {
    base.focus = focus || "Easy";
  }
  return base;
}

function getSessionForDate(iso, todayIso, overrides) {
  if (overrides[iso]) return overrides[iso];
  const template = WEEKLY_TEMPLATE[dayOfWeek(iso)];
  const status = iso < todayIso && template.type !== "Rest" ? "done" : "not_started";
  const session = buildSessionForType(template.type, template.focus);
  session.duration = template.duration;
  session.status = status;
  return session;
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
function smallBtnStyle() {
  return { padding: "8px 10px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 12, cursor: "pointer" };
}
function chipStyle(active) {
  return { padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", background: active ? "#111" : "#f0f0f0", color: active ? "#fff" : "#444" };
}

// Reusable "here are your options, or tell me what you want" picker.
// Presets are quick taps; the chat icon reveals a free-text field that
// runs a simple keyword match (mocked) against the same presets.
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
          <div key={opt} onClick={() => onPick(opt)} style={chipStyle(false)}>
            {opt}
          </div>
        ))}
        <div onClick={() => setShowChat((v) => !v)} style={{ ...chipStyle(showChat), background: showChat ? "#4338ca" : "#eef2ff", color: showChat ? "#fff" : "#4338ca" }}>
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

function RestTimer({ seconds, onSkip }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div style={{ background: "#eef2ff", borderRadius: 10, padding: 14, textAlign: "center", marginTop: 12 }}>
      <div style={{ fontSize: 12, color: "#4338ca", marginBottom: 4 }}>Resting…</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#4338ca" }}>
        {mins}:{String(secs).padStart(2, "0")}
      </div>
      <button onClick={onSkip} style={{ marginTop: 8, padding: "6px 14px", background: "#fff", border: "1px solid #c7d2fe", borderRadius: 8, fontSize: 12, color: "#4338ca", cursor: "pointer" }}>
        Skip rest
      </button>
    </div>
  );
}

function WorkoutMode({ session, onUpdateSession, onFinish, onClose }) {
  const steps = getSteps(session);
  const [stepIndex, setStepIndex] = useState(0);
  const [setsDoneByStep, setSetsDoneByStep] = useState({});
  const [restRemaining, setRestRemaining] = useState(null);
  const [howToOpen, setHowToOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState(null); // null | "workout" | "focus" | "exercise"

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const t = setTimeout(() => setRestRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [restRemaining]);

  const step = steps[stepIndex] || null;
  const isLastStep = stepIndex >= steps.length - 1;
  const setsDone = setsDoneByStep[stepIndex] || 0;

  function goToStep(i) {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, i)));
    setRestRemaining(null);
    setHowToOpen(false);
    setOpenPopover(null);
  }

  function handleLogSet() {
    if (!step || step.kind !== "exercise") return;
    const next = setsDone + 1;
    setSetsDoneByStep((prev) => ({ ...prev, [stepIndex]: next }));
    if (next < step.sets) setRestRemaining(step.rest);
  }

  function handleSwitchWorkout(type) {
    const built = buildSessionForType(type);
    onUpdateSession(built);
    setOpenPopover(null);
    goToStep(0);
    setSetsDoneByStep({});
  }
  function handleSwitchWorkoutCustom(text) {
    const matched = matchFromText(text, ACTIVITY_TYPES);
    if (matched) {
      handleSwitchWorkout(matched);
    } else {
      onUpdateSession({ type: "Custom", duration: session.duration, status: "in_progress", customLabel: text });
      setOpenPopover(null);
      goToStep(0);
      setSetsDoneByStep({});
    }
  }

  function handleChangeFocus(focus) {
    if (session.type === "Lift") {
      onUpdateSession({ ...session, focus, exercises: [...(LIFT_FOCUS[focus] || LIFT_FOCUS["Upper body"])] });
    } else if (session.type === "Run") {
      onUpdateSession({ ...session, focus });
    }
    setOpenPopover(null);
    goToStep(0);
    setSetsDoneByStep({});
  }
  function handleChangeFocusCustom(text) {
    const options = session.type === "Lift" ? FOCUS_OPTIONS_LIFT : FOCUS_OPTIONS_RUN;
    const matched = matchFromText(text, options);
    if (matched) {
      handleChangeFocus(matched);
    } else if (session.type === "Lift") {
      // Unknown focus by text — treat it as a one-off single custom exercise.
      onUpdateSession({ ...session, focus: text, exercises: [text] });
      setOpenPopover(null);
      goToStep(0);
      setSetsDoneByStep({});
    }
  }

  function handleSwitchExercise(name) {
    const nextExercises = [...session.exercises];
    nextExercises[stepIndex] = name;
    onUpdateSession({ ...session, exercises: nextExercises });
    setOpenPopover(null);
    setSetsDoneByStep((prev) => ({ ...prev, [stepIndex]: 0 }));
    setRestRemaining(null);
  }
  function handleSwitchExerciseCustom(text) {
    handleSwitchExercise(text);
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 60, overflowY: "auto" }}>
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: "#999" }}>
            Step {stepIndex + 1} of {steps.length || 1}
          </div>
          <span onClick={onClose} style={{ fontSize: 20, color: "#999", cursor: "pointer" }}>×</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{session.customLabel || session.focus || session.type}</div>
        <div style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>{session.type} · {session.duration} min</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <div onClick={() => setOpenPopover(openPopover === "workout" ? null : "workout")} style={smallBtnStyle()}>
            🔀 Switch workout
          </div>
          {(session.type === "Lift" || session.type === "Run") && (
            <div onClick={() => setOpenPopover(openPopover === "focus" ? null : "focus")} style={smallBtnStyle()}>
              🎯 Change focus
            </div>
          )}
          {step && step.kind === "exercise" && (
            <div onClick={() => setOpenPopover(openPopover === "exercise" ? null : "exercise")} style={smallBtnStyle()}>
              🔁 Switch this exercise
            </div>
          )}
        </div>

        {openPopover === "workout" && (
          <OptionsPopover title="Switch to…" options={ACTIVITY_TYPES} onPick={handleSwitchWorkout} onCustomSubmit={handleSwitchWorkoutCustom} />
        )}
        {openPopover === "focus" && (
          <OptionsPopover
            title="Change focus to…"
            options={session.type === "Lift" ? FOCUS_OPTIONS_LIFT : FOCUS_OPTIONS_RUN}
            onPick={handleChangeFocus}
            onCustomSubmit={handleChangeFocusCustom}
          />
        )}
        {openPopover === "exercise" && step && step.kind === "exercise" && (
          <OptionsPopover
            title={"Swap " + step.name + " for…"}
            options={ALTERNATES[step.name] || []}
            onPick={handleSwitchExercise}
            onCustomSubmit={handleSwitchExerciseCustom}
          />
        )}

        <div style={{ marginTop: 20 }}>
          {step && step.kind === "exercise" && (
            <div style={cardStyle(ACTIVITY_COLORS[session.type] || DEFAULT_COLOR)}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{step.name}</div>
              <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>
                Set {Math.min(setsDone + 1, step.sets)} of {step.sets} · {step.reps} reps
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Suggested weight: {step.weight}</div>

              <div onClick={() => setHowToOpen((v) => !v)} style={{ fontSize: 12, color: "#2563eb", cursor: "pointer", marginBottom: 10 }}>
                {howToOpen ? "▾ Hide how-to" : "▸ How do I do this?"}
              </div>
              {howToOpen && (
                <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: "#333", marginBottom: 8 }}>{step.howTo}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#999", background: "#f5f5f5", padding: "6px 10px", borderRadius: 8 }}>
                    ▶ Watch how-to video (coming soon)
                  </div>
                </div>
              )}

              {restRemaining !== null && restRemaining > 0 ? (
                <RestTimer seconds={restRemaining} onSkip={() => setRestRemaining(0)} />
              ) : setsDone >= step.sets ? (
                <div style={insightBoxStyle(true)}>✓ Exercise complete</div>
              ) : (
                <button onClick={handleLogSet} style={{ width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  Log set {setsDone + 1}
                </button>
              )}
            </div>
          )}

          {step && step.kind === "segment" && (
            <div style={cardStyle(ACTIVITY_COLORS[session.type] || DEFAULT_COLOR)}>
              <div style={{ fontSize: 15, color: "#333", marginBottom: 14 }}>{step.text}</div>
              <button
                onClick={() => (isLastStep ? onFinish() : goToStep(stepIndex + 1))}
                style={{ width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                {isLastStep ? "Finish workout" : "Mark done & next"}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0} style={{ ...smallBtnStyle(), opacity: stepIndex === 0 ? 0.4 : 1 }}>
            ← Previous
          </button>
          {step && step.kind === "exercise" && (
            <button
              onClick={() => (isLastStep ? onFinish() : goToStep(stepIndex + 1))}
              disabled={setsDone < step.sets}
              style={{ ...smallBtnStyle(), opacity: setsDone < step.sets ? 0.4 : 1 }}
            >
              {isLastStep ? "Finish workout" : "Next exercise →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Trainer() {
  const todayIso = toLocalISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [overrides, setOverrides] = useState({});
  const [workoutModeOpen, setWorkoutModeOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);

  const isFuture = selectedDate > todayIso;
  const session = getSessionForDate(selectedDate, todayIso, overrides);
  const isRest = session.type === "Rest";
  const color = ACTIVITY_COLORS[session.type] || DEFAULT_COLOR;

  function updateSession(patch) {
    setOverrides((prev) => {
      const current = prev[selectedDate] || getSessionForDate(selectedDate, todayIso, prev);
      return { ...prev, [selectedDate]: { ...current, ...patch } };
    });
  }
  function replaceSession(next) {
    setOverrides((prev) => ({ ...prev, [selectedDate]: next }));
  }

  function handleDaySwap(type) {
    replaceSession(buildSessionForType(type));
    setSwapOpen(false);
  }
  function handleDaySwapCustom(text) {
    const matched = matchFromText(text, ACTIVITY_TYPES);
    if (matched) {
      handleDaySwap(matched);
    } else {
      replaceSession({ type: "Custom", duration: 30, status: "not_started", customLabel: text });
      setSwapOpen(false);
    }
  }

  function handleOpenWorkout() {
    if (isFuture || isRest) return;
    if (session.status === "not_started") updateSession({ status: "in_progress" });
    setWorkoutModeOpen(true);
  }
  function handleFinish() {
    updateSession({ status: "done" });
    setWorkoutModeOpen(false);
  }

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
  const elapsedFraction = (dayOfWeek(todayIso) + 1) / 7;
  const expected = planned * elapsedFraction;
  const onPace = done >= expected - 0.5;

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Trainer</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>{formatDateLabel(selectedDate, todayIso)}</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
        {Array.from({ length: 7 }, (_, i) => offsetDate(i - 3, selectedDate)).map((iso) => {
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          const s = getSessionForDate(iso, todayIso, overrides);
          const dotColor = ACTIVITY_COLORS[s.type] || DEFAULT_COLOR;
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

      <div style={cardStyle(color)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{isRest ? "Rest day" : session.customLabel || session.focus || session.type}</div>
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

        <div style={{ marginTop: 12 }}>
          <div onClick={() => setSwapOpen((v) => !v)} style={smallBtnStyle()}>
            🔀 {isRest ? "Add a session instead" : "Swap"}
          </div>
          {swapOpen && <OptionsPopover title="Swap for…" options={ACTIVITY_TYPES} onPick={handleDaySwap} onCustomSubmit={handleDaySwapCustom} />}
        </div>

        {!isRest && (
          <button
            onClick={handleOpenWorkout}
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
          {getSteps(session).map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: "#444", padding: "6px 0", borderTop: i > 0 ? "1px solid #eee" : "none" }}>
              {s.kind === "exercise" ? s.name + " — " + s.sets + " x " + s.reps : s.text}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Still mock data and session-only (nothing saved to Supabase yet). Recommended weights are generic starting
        points, not personalized to you yet, and chat-based swaps use simple keyword matching, not real reasoning.
      </p>

      {workoutModeOpen && (
        <WorkoutMode session={session} onUpdateSession={updateSession} onFinish={handleFinish} onClose={() => setWorkoutModeOpen(false)} />
      )}
    </main>
  );
}
