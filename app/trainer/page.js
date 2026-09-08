"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

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

// Equipment variants per exercise — only listed where it genuinely
// changes anything. Exercises with no entry here are bodyweight-only,
// so no equipment picker shows for them.
const EQUIPMENT_VARIANTS = {
  Squat: ["Barbell", "Smith machine", "Dumbbell (goblet)", "Bodyweight"],
  "Bench press": ["Barbell", "Smith machine", "Dumbbell", "Machine press"],
  "Overhead press": ["Barbell", "Dumbbell", "Smith machine", "Machine press"],
  "Bent-over row": ["Barbell", "Dumbbell", "Cable row", "Machine row"],
  "Romanian deadlift": ["Barbell", "Dumbbell", "Kettlebell"],
  "Walking lunges": ["Dumbbell", "Barbell", "Bodyweight"],
  "Calf raises": ["Machine", "Dumbbell", "Bodyweight"],
  "Bicep curls": ["Dumbbell", "Barbell", "Cable", "Resistance band"],
  "Tricep dips": ["Bodyweight", "Assisted machine", "Bench"],
  "Hammer curls": ["Dumbbell", "Cable", "Resistance band"],
};
function getWeightSuggestionText(name, equipment) {
  const spec = getExerciseSpec(name);
  if (equipment === "Bodyweight") return "Bodyweight";
  return spec.weight;
}

// Maps onboarding's "What do you have access to?" answers to which
// equipment variants are realistic. Returns null (meaning "don't
// filter, show everything") until onboarding access data is loaded.
function getAvailableEquipmentSet(access) {
  if (!access || access.length === 0) return null;
  if (access.includes("Bodyweight only")) return new Set(["Bodyweight"]);
  const set = new Set(["Bodyweight"]); // always available, needs no equipment
  if (access.includes("Gym")) {
    ["Barbell", "Smith machine", "Dumbbell (goblet)", "Dumbbell", "Machine press", "Cable row", "Machine row", "Kettlebell", "Machine", "Cable", "Assisted machine", "Bench"].forEach((e) => set.add(e));
  }
  if (access.includes("Home weights/bands")) {
    ["Dumbbell (goblet)", "Dumbbell", "Kettlebell", "Resistance band", "Bench"].forEach((e) => set.add(e));
  }
  if (access.includes("Resistance bands")) set.add("Resistance band");
  return set;
}
function getAvailableVariants(name, availableSet) {
  const all = EQUIPMENT_VARIANTS[name];
  if (!all) return null;
  if (!availableSet) return all;
  const filtered = all.filter((v) => availableSet.has(v));
  return filtered.length > 0 ? filtered : all; // don't show an empty picker
}
function getDefaultEquipment(name, availableSet) {
  const variants = getAvailableVariants(name, availableSet);
  return variants ? variants[0] : null;
}

const LIFT_FOCUS = {
  "Upper body": ["Bench press", "Bent-over row", "Overhead press", "Plank"],
  "Lower body": ["Squat", "Romanian deadlift", "Walking lunges", "Calf raises"],
  "Full body": ["Squat", "Bench press", "Bent-over row", "Plank"],
  Arms: ["Bicep curls", "Tricep dips", "Hammer curls", "Push-ups"],
  Core: ["Plank", "Russian twists", "Leg raises", "Bicycle crunches"],
};
const FOCUS_OPTIONS_LIFT = Object.keys(LIFT_FOCUS);

const ALTERNATES = {
  "Bench press": ["Push-ups", "Dumbbell press", "Incline press"],
  Squat: ["Goblet squat", "Leg press", "Lunges"],
  "Bent-over row": ["Seated cable row", "Lat pulldown"],
  "Overhead press": ["Arnold press", "Lateral raises"],
  "Romanian deadlift": ["Leg curls", "Good mornings"],
  "Walking lunges": ["Step-ups", "Bulgarian split squats"],
  "Calf raises": ["Seated calf raises"],
  Plank: ["Side plank", "Dead bug"],
  "Bicep curls": ["Concentration curls"],
  "Tricep dips": ["Skull crushers"],
  "Hammer curls": ["Cable curls"],
  "Push-ups": ["Incline push-ups"],
  "Russian twists": ["Wood choppers"],
  "Leg raises": ["Reverse crunches"],
  "Bicycle crunches": ["Mountain climbers"],
};

// Segments are now slot-tagged objects, not plain strings, so any one
// segment can be swapped without regenerating the whole session.
function buildRunSegments(focus, duration) {
  if (focus === "Long run") {
    return [
      { slot: "warmup", text: "10 min easy warm-up jog" },
      { slot: "main", text: Math.max(10, duration - 20) + " min steady long-run pace" },
      { slot: "cooldown", text: "10 min cooldown walk + stretch" },
    ];
  }
  if (focus === "Tempo") {
    return [
      { slot: "warmup", text: "8 min easy warm-up jog" },
      { slot: "main", text: Math.max(10, duration - 16) + " min at tempo pace (comfortably hard)" },
      { slot: "cooldown", text: "8 min cooldown jog" },
    ];
  }
  if (focus === "Sprints/Intervals") {
    return [
      { slot: "warmup", text: "10 min warm-up jog" },
      { slot: "main", text: "8 x 200m sprint @ hard effort, 90 sec walk recovery between" },
      { slot: "cooldown", text: "10 min cooldown jog" },
    ];
  }
  return [
    { slot: "warmup", text: "5 min easy warm-up jog" },
    { slot: "main", text: Math.max(10, duration - 10) + " min steady pace, conversational effort" },
    { slot: "cooldown", text: "5 min cooldown walk + stretch" },
  ];
}
function buildSwimSegments() {
  return [
    { slot: "warmup", text: "400m warm-up, easy pace" },
    { slot: "main1", text: "8 x 100m freestyle, 20 sec rest" },
    { slot: "main2", text: "4 x 50m kick, 15 sec rest" },
    { slot: "cooldown", text: "200m cooldown, easy pace" },
  ];
}
function buildYogaSegments() {
  return [
    { slot: "seq1", text: "Sun Salutation A x5 (10 min)" },
    { slot: "seq2", text: "Standing sequence: Warrior I/II, Triangle (10 min)" },
    { slot: "seq3", text: "Balance poses: Tree, Half Moon (5 min)" },
    { slot: "cooldown", text: "Cool-down stretches + Savasana (10 min)" },
  ];
}
function buildSegmentsForType(type, focus, duration) {
  if (type === "Run") return buildRunSegments(focus, duration);
  if (type === "Swim") return buildSwimSegments();
  if (type === "Yoga") return buildYogaSegments();
  return [];
}

const FOCUS_OPTIONS_RUN = ["Easy", "Tempo", "Long run", "Sprints/Intervals"];

// Alternate content per segment slot — generic enough to reuse across
// focuses, since a fully tailored list per focus x slot would be a lot
// of hand-written content for what's still a mock pass.
const SEGMENT_ALTERNATES = {
  "Run:warmup": ["5 min easy jog", "8 min easy jog", "10 min easy jog", "5 min dynamic stretching only"],
  "Run:main": [
    "Steady pace, conversational effort",
    "Tempo pace, comfortably hard",
    "Intervals: 200m sprints, 90 sec recovery",
    "Fartlek: alternate 2 min hard / 2 min easy",
  ],
  "Run:cooldown": ["5 min walk + stretch", "8 min walk + stretch", "10 min walk + stretch", "Skip cooldown"],
  "Swim:warmup": ["300m warm-up, easy pace", "400m warm-up, easy pace", "500m warm-up, easy pace"],
  "Swim:main1": ["8 x 100m freestyle, 20 sec rest", "6 x 100m freestyle, 30 sec rest", "10 x 50m freestyle, 15 sec rest", "4 x 200m freestyle, 30 sec rest"],
  "Swim:main2": ["4 x 50m kick, 15 sec rest", "6 x 50m kick, 15 sec rest", "4 x 25m kick, 10 sec rest", "Skip kick set"],
  "Swim:cooldown": ["200m cooldown, easy pace", "300m cooldown, easy pace", "100m cooldown, easy pace"],
  "Yoga:seq1": ["Sun Salutation A x5 (10 min)", "Sun Salutation A x3 (6 min)", "Sun Salutation B x5 (12 min)"],
  "Yoga:seq2": ["Standing sequence: Warrior I/II, Triangle (10 min)", "Standing sequence: Warrior III, Chair (10 min)"],
  "Yoga:seq3": ["Balance poses: Tree, Half Moon (5 min)", "Balance poses: Eagle, Dancer (5 min)"],
  "Yoga:cooldown": ["Cool-down stretches + Savasana (10 min)", "Cool-down stretches + Savasana (15 min)"],
};
function getSegmentAlternates(type, slot) {
  return SEGMENT_ALTERNATES[type + ":" + slot] || [];
}

function getSteps(session, availableSet) {
  if (session.type === "Lift") {
    return (session.exercises || []).map((name) => {
      const equipment = (session.equipmentByExercise && session.equipmentByExercise[name]) || getDefaultEquipment(name, availableSet);
      return { kind: "exercise", name, equipment, ...getExerciseSpec(name), weight: getWeightSuggestionText(name, equipment) };
    });
  }
  if (session.type === "Run" || session.type === "Swim" || session.type === "Yoga") {
    return (session.segments || []).map((seg) => ({ kind: "segment", slot: seg.slot, text: seg.text }));
  }
  if (session.customLabel) return [{ kind: "segment", slot: "custom", text: "Custom: " + session.customLabel + " — log it however works for you." }];
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
    base.equipmentByExercise = {};
  } else if (type === "Run") {
    base.focus = focus || "Easy";
    base.segments = buildSegmentsForType("Run", base.focus, base.duration);
  } else if (type === "Swim" || type === "Yoga") {
    base.segments = buildSegmentsForType(type);
  }
  return base;
}

function getSessionForDate(iso, todayIso, overrides) {
  if (overrides[iso]) return overrides[iso];
  const template = WEEKLY_TEMPLATE[dayOfWeek(iso)];
  const status = iso < todayIso && template.type !== "Rest" ? "done" : "not_started";
  const session = buildSessionForType(template.type, template.focus);
  session.duration = template.duration;
  if (session.type === "Run") session.segments = buildSegmentsForType("Run", session.focus, session.duration);
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

function WorkoutMode({ session, availableSet, todayIso, onUpdateSession, onFinish, onClose }) {
  const steps = getSteps(session, availableSet);
  const [stepIndex, setStepIndex] = useState(0);
  const [setsDoneByStep, setSetsDoneByStep] = useState({});
  const [restRemaining, setRestRemaining] = useState(null);
  const [howToOpen, setHowToOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState(null); // null | "workout" | "focus" | "exercise" | "equipment" | "segment"
  const [lastLog, setLastLog] = useState(null); // most recent real weight/reps for this exercise, from history
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const t = setTimeout(() => setRestRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [restRemaining]);

  const step = steps[stepIndex] || null;
  const isLastStep = stepIndex >= steps.length - 1;
  const setsDone = setsDoneByStep[stepIndex] || 0;
  const hasProgress = stepIndex > 0 || Object.values(setsDoneByStep).some((v) => v > 0);

  // Pull the real last-logged weight/reps for whichever exercise is
  // currently up, so the suggestion is based on your own history, not
  // just a generic library number.
  useEffect(() => {
    if (!step || step.kind !== "exercise") return;
    let cancelled = false;
    async function loadHistory() {
      const { data } = await supabase
        .from("exercise_logs")
        .select("weight, reps")
        .eq("exercise_name", step.name)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (data && data.length > 0) {
        setLastLog(data[0]);
        setWeightInput(data[0].weight != null ? String(data[0].weight) : "");
        setRepsInput(data[0].reps != null ? String(data[0].reps) : String(step.reps));
      } else {
        setLastLog(null);
        setWeightInput("");
        setRepsInput(String(step.reps));
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step && step.name]);

  function goToStep(i) {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, i)));
    setRestRemaining(null);
    setHowToOpen(false);
    setOpenPopover(null);
  }

  async function handleLogSet() {
    if (!step || step.kind !== "exercise") return;
    const next = setsDone + 1;
    const weightVal = parseFloat(weightInput);
    // Best-effort save — don't block the workout if this fails.
    supabase
      .from("exercise_logs")
      .insert({
        log_date: todayIso,
        exercise_name: step.name,
        equipment: step.equipment || null,
        set_number: next,
        weight: isNaN(weightVal) ? null : weightVal,
        reps: repsInput || String(step.reps),
      })
      .then(() => {});
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
      onUpdateSession({ ...session, focus, exercises: [...(LIFT_FOCUS[focus] || LIFT_FOCUS["Upper body"])], equipmentByExercise: {} });
    } else if (session.type === "Run") {
      onUpdateSession({ ...session, focus, segments: buildSegmentsForType("Run", focus, session.duration) });
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
      onUpdateSession({ ...session, focus: text, exercises: [text], equipmentByExercise: {} });
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

  function handleChangeEquipment(equipment) {
    const nextMap = { ...(session.equipmentByExercise || {}), [step.name]: equipment };
    onUpdateSession({ ...session, equipmentByExercise: nextMap });
    setOpenPopover(null);
  }
  function handleChangeEquipmentCustom(text) {
    handleChangeEquipment(text);
  }

  function handleSwitchSegment(newText) {
    const nextSegments = session.segments.map((seg, i) => (i === stepIndex ? { ...seg, text: newText } : seg));
    onUpdateSession({ ...session, segments: nextSegments });
    setOpenPopover(null);
  }
  function handleSwitchSegmentCustom(text) {
    handleSwitchSegment(text);
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
          {!hasProgress && (
            <div onClick={() => setOpenPopover(openPopover === "workout" ? null : "workout")} style={smallBtnStyle()}>
              🔀 Switch workout
            </div>
          )}
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
          {step && step.kind === "exercise" && EQUIPMENT_VARIANTS[step.name] && (
            <div onClick={() => setOpenPopover(openPopover === "equipment" ? null : "equipment")} style={smallBtnStyle()}>
              🛠 Equipment
            </div>
          )}
          {step && step.kind === "segment" && getSegmentAlternates(session.type, step.slot).length > 0 && (
            <div onClick={() => setOpenPopover(openPopover === "segment" ? null : "segment")} style={smallBtnStyle()}>
              🔁 Switch this segment
            </div>
          )}
        </div>

        {openPopover === "workout" && !hasProgress && (
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
        {openPopover === "equipment" && step && step.kind === "exercise" && (
          <OptionsPopover
            title={"Do " + step.name + " with…"}
            options={getAvailableVariants(step.name, availableSet) || []}
            onPick={handleChangeEquipment}
            onCustomSubmit={handleChangeEquipmentCustom}
          />
        )}
        {openPopover === "segment" && step && step.kind === "segment" && (
          <OptionsPopover
            title="Swap this segment for…"
            options={getSegmentAlternates(session.type, step.slot)}
            onPick={handleSwitchSegment}
            onCustomSubmit={handleSwitchSegmentCustom}
          />
        )}

        <div style={{ marginTop: 20 }}>
          {step && step.kind === "exercise" && (
            <div style={cardStyle(ACTIVITY_COLORS[session.type] || DEFAULT_COLOR)}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{step.name}</div>
              <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>
                Set {Math.min(setsDone + 1, step.sets)} of {step.sets}
              </div>
              {step.equipment && <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Equipment: {step.equipment}</div>}
              {lastLog ? (
                <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
                  Last time: {lastLog.weight != null ? lastLog.weight : "—"} · {lastLog.reps} reps
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>No history yet — suggested starting point: {step.weight}, {step.reps} reps</div>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Weight</div>
                  <input
                    type="text"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder={step.equipment === "Bodyweight" ? "Bodyweight" : step.weight}
                    style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Reps</div>
                  <input
                    type="text"
                    value={repsInput}
                    onChange={(e) => setRepsInput(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                  />
                </div>
              </div>

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
  const [access, setAccess] = useState(null); // null = not loaded yet, from onboarding's "What do you have access to?"

  useEffect(() => {
    let cancelled = false;
    async function loadAccess() {
      const { data } = await supabase.from("profile").select("answers").order("updated_at", { ascending: false }).limit(1);
      if (cancelled) return;
      if (data && data.length > 0 && data[0].answers) setAccess(data[0].answers.access || []);
    }
    loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);
  const availableSet = getAvailableEquipmentSet(access);

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
          {getSteps(session, availableSet).map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: "#444", padding: "6px 0", borderTop: i > 0 ? "1px solid #eee" : "none" }}>
              {s.kind === "exercise" ? s.name + (s.equipment ? " (" + s.equipment + ")" : "") + " — " + s.sets + " x " + s.reps : s.text}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Which equipment shows up by default now follows your onboarding "access" answers, and weight/reps suggestions
        come from your real logged history once you have any — both save to Supabase. The day/week schedule itself is
        still mock, and chat-based swaps use simple keyword matching, not real reasoning.
      </p>

      {workoutModeOpen && (
        <WorkoutMode
          session={session}
          availableSet={availableSet}
          todayIso={todayIso}
          onUpdateSession={updateSession}
          onFinish={handleFinish}
          onClose={() => setWorkoutModeOpen(false)}
        />
      )}
    </main>
  );
}
