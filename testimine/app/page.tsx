
"use client";

import { useMemo, useState, useEffect } from "react";
import timetable from "./parser/tunniplaan.json";

type ViewType = "class" | "teacher" | "room";
type NavTab = "home" | "schedule" | "saved";

type ScheduleItem = {
  id: string;
  lessonId: string;
  aine: string;
  opetaja: string;
  klass: string;
  paev: string;
  tund: string;
  algus: string;
  lopp: string;
  ruum: string;
};

type SubjectColor = {
  name: string;
  forecolor: string;
  backcolor: string;
};

type SavedPlan = {
  type: ViewType;
  value: string;
  savedAt: string;
};

/* saaks lisada äkki date: (dayToday) vms, pole TEGELT vaja, sest nende tunniplaan ei muutu reaalajas, see on iga nädal sama */
const days = [
  { id: "1", name: "Esmaspäev"},
  { id: "2", name: "Teisipäev"},
  { id: "3", name: "Kolmapäev"},
  { id: "4", name: "Neljapäev"},
  { id: "5", name: "Reede"},
];

const timeSlots = [
  "08:45 - 10:00",
  "10:15 - 11:30",
  "12:00 - 13:15",
  "13:30 - 14:45",
  "15:00 - 16:15",
];

function lessonTimeRange(lesson: ScheduleItem) {
  return `${lesson.algus} - ${lesson.lopp}`;
}

function savedKey(type: ViewType, value: string) {
  return `${type}::${value}`;
}

export default function Page() {
  const events = timetable.events as ScheduleItem[];
  const classes = timetable.classes as string[];

  const [activeTab, setActiveTab] = useState<NavTab>("schedule");
  const [viewType, setViewType] = useState<ViewType>("class");
  const [selectedClass, setSelectedClass] = useState(classes[0] || "");
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

  // Load saved plans from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tunniplaan_saved");
      if (stored) setSavedPlans(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function persistSaved(plans: SavedPlan[]) {
    setSavedPlans(plans);
    try {
      localStorage.setItem("tunniplaan_saved", JSON.stringify(plans));
    } catch {
      // ignore
    }
  }

  function currentKey() {
    if (viewType === "class") return savedKey("class", selectedClass);
    if (viewType === "teacher") return savedKey("teacher", selectedTeacher);
    return savedKey("room", selectedRoom);
  }

  function isSaved() {
    return savedPlans.some(
      (p) => savedKey(p.type, p.value) === currentKey()
    );
  }

  function toggleSave() {
    const key = currentKey();
    if (isSaved()) {
      persistSaved(savedPlans.filter((p) => savedKey(p.type, p.value) !== key));
    } else {
      const value =
        viewType === "class"
          ? selectedClass
          : viewType === "teacher"
          ? selectedTeacher
          : selectedRoom;
      persistSaved([
        ...savedPlans,
        { type: viewType, value, savedAt: new Date().toISOString() },
      ]);
    }
  }

  function removeSaved(plan: SavedPlan) {
    persistSaved(
      savedPlans.filter((p) => savedKey(p.type, p.value) !== savedKey(plan.type, plan.value))
    );
  }

  function openSaved(plan: SavedPlan) {
    setViewType(plan.type);
    if (plan.type === "class") setSelectedClass(plan.value);
    else if (plan.type === "teacher") setSelectedTeacher(plan.value);
    else setSelectedRoom(plan.value);
    setActiveTab("schedule");
  }

  function planLabel(plan: SavedPlan) {
    if (plan.type === "class") return `Klass ${plan.value}`;
    if (plan.type === "teacher") return `Õpetaja ${plan.value}`;
    return `Ruum ${plan.value}`;
  }

  function planIcon(type: ViewType) {
    if (type === "class") return "Placeholder icon";
    if (type === "teacher") return "Placeholder icon";
    return "Placeholder icon";
  }

  const subjectColorMap = useMemo(() => {
    const map = new Map<string, SubjectColor>();
    subjects.forEach((subject) => map.set(subject.name, subject));
    return map;
  }, [subjects]);

  const filteredEvents = useMemo(() => {
    return events.filter((lesson) => {
      if (viewType === "class") return lesson.klass.split(" ").includes(selectedClass);
      if (viewType === "teacher") return lesson.opetaja === selectedTeacher;
      return lesson.ruum === selectedRoom;
    });
  }, [events, viewType, selectedClass, selectedTeacher, selectedRoom]);

  const mobileDay = days[mobileDayIndex];

  const classLessons = useMemo(() => {
    return events.filter((lesson) =>
      lesson.klass.split(" ").includes(selectedClass)
    );
  }, [events, selectedClass]);

  const mobileLessons = useMemo(() => {
    return classLessons
      .filter((lesson) => lesson.paev === mobileDay.id)
      .sort((a, b) => Number(a.tund) - Number(b.tund));
  }, [filteredEvents, mobileDay]);

  function getLessonForCell(dayId: string, slot: string) {
    return filteredEvents.find(
      (lesson) => lesson.paev === dayId && lessonTimeRange(lesson) === slot
    );
  }

  function getSubjectStyles(subjectName: string) {
    const found = subjectColorMap.get(subjectName);
    return {
      backgroundColor: found?.backcolor || "#3b82f6",
      color: found?.forecolor || "#000000",
    };
  }

  function getTitle() {
    if (viewType === "class") return "Klassi tunniplaan";
    if (viewType === "teacher") return "Õpetaja tunniplaan";
    return "Ruumi tunniplaan";
  }

  function getLabel() {
    if (viewType === "class") return "Vali klass:";
    if (viewType === "teacher") return "Vali õpetaja:";
    return "Vali ruum:";
  }

  function goPreviousDay() {
    setMobileDayIndex((c) => (c === 0 ? days.length - 1 : c - 1));
  }

  function goNextDay() {
    setMobileDayIndex((c) => (c === days.length - 1 ? 0 : c + 1));
  }

  // ── Saved plans page ──────────────────────────────────────────────
  if (activeTab === "saved") {
    return (
      <div className="page">
        <header className="topbar">
          <div className="topbar-left">
            <span>Tunniplaan</span>
          </div>
        </header>

        <main className="content">
          <div className="view-header">
            <div className="view-header-left">
              <div>
                <h1 className="view-title">Salvestatud</h1>
                <p className="view-subtitle">Sinu salvestatud tunniplaanid</p>
              </div>
            </div>
          </div>

          {savedPlans.length === 0 ? (
            <div className="saved-empty">
              <div className="saved-empty-icon">save icon</div>
              <p className="saved-empty-title">Salvestatud plaane pole</p>
              <p className="saved-empty-sub">
                Tunniplaanil vajuta save icon, et see siia salvestada.
              </p>
            </div>
          ) : (
            <div className="saved-list">
              {savedPlans.map((plan) => (
                <div key={savedKey(plan.type, plan.value)} className="saved-card">
                  <button
                    className="saved-card-main"
                    onClick={() => openSaved(plan)}
                  >
                    <span className="saved-card-icon">{planIcon(plan.type)}</span>
                    <div className="saved-card-info">
                      <span className="saved-card-label">{planLabel(plan)}</span>
                      <span className="saved-card-type">
                        {plan.type === "class"
                          ? "Klass"
                          : plan.type === "teacher"
                          ? "Õpetaja"
                          : "Ruum"}
                      </span>
                    </div>
                  </button>
                  <button
                    className="saved-card-remove"
                    onClick={() => removeSaved(plan)}
                    aria-label="Eemalda"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <div
            className="bottom-nav-item"
            onClick={() => setActiveTab("home")}
          >
            <span>Placeholder icon</span>
            <p>Avaleht</p>
          </div>
          <div
            className="bottom-nav-item"
            onClick={() => setActiveTab("schedule")}
          >
            <span>Placeholder icon</span>
            <p>Tunniplaan</p>
          </div>
          <div className="bottom-nav-item active">
            <span>Placeholder icon</span>
            <p>Salvestatud</p>
          </div>
        </nav>
      </div>
    );
  }
  // Main schedule page
  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <span>Tunniplaan</span>
        </div>
        <div className="topbar-right">
          <button className="icon-button" aria-label="Otsi">
            ⌕
          </button>
        </div>
      </header>

      <main className="content">
        <div className="view-header">
          <div className="view-header-left">
            <button className="back-button" aria-label="Tagasi">
              ‹
            </button>
            <div>
              <h1 className="view-title">Klassi tunniplaan</h1>
              <p className="view-subtitle">Päeva tunniplaan</p>
            </div>
          </div>

          <button
            className={`icon-button save-button${isSaved() ? " saved" : ""}`}
            aria-label={isSaved() ? "Eemalda salvestatud" : "Salvesta"}
            onClick={toggleSave}
            title={isSaved() ? "Eemalda salvestatud" : "Salvesta tunniplaan"}
          >
            {isSaved() ? "Unsave" : "Save"}
          </button>
        </div>

        <div className="view-switcher">
          <button
            className={viewType === "class" ? "switch-btn active" : "switch-btn"}
            onClick={() => setViewType("class")}
          >
            Klass
          </button>
          <button
            className={viewType === "teacher" ? "switch-btn active" : "switch-btn"}
            onClick={() => setViewType("teacher")}
          >
            Õpetaja
          </button>
          <button
            className={viewType === "room" ? "switch-btn active" : "switch-btn"}
            onClick={() => setViewType("room")}
          >
            Ruum
          </button>
        </div>

        <div className="selector-block">
          <label className="selector-label">{getLabel()}</label>

          {viewType === "class" && (
            <select
              className="selector"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map((klass) => (
                <option key={klass} value={klass}>{klass}</option>
              ))}
            </select>
          )}

          {viewType === "teacher" && (
            <select
              className="selector"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              {teachers.map((teacher) => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
          )}

          {viewType === "room" && (
            <select
              className="selector"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              {rooms.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          )}
        </div>

        <section className="desktop-schedule">
          <div className="timetable-wrapper">
            <table className="timetable">
              <thead>
                <tr>
                  <th className="time-col">Kellaaeg</th>
                  {days.map((day) => (
                    <th key={day.id}>
                      <span className="day-header">{day.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot}>
                    <td className="time-col">{slot}</td>
                    {days.map((day) => {
                      const lesson = getLessonForCell(day.id, slot);
                      return (
                        <td key={`${day.id}-${slot}`} className="slot-cell">
                          {lesson ? (
                            <div className="lesson-card" style={getSubjectStyles(lesson.aine)}>
                              <div className="lesson-subject">{lesson.aine}</div>
                              <div className="lesson-meta">{lesson.opetaja}</div>
                              <div className="lesson-meta">
                                Ruum: {lesson.ruum?.trim() ? lesson.ruum : "Pole saadaval, selgub jooksvalt"}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mobile-schedule">
          <div className="day-switcher">
            <button className="icon-button" onClick={goPreviousDay}>‹</button>
            <div className="day-switcher-center">
              <h2>{mobileDay.name}</h2>
            </div>
            <button className="icon-button" onClick={goNextDay}>›</button>
          </div>

          <div className="lesson-list">
            {mobileLessons.length === 0 ? (
              <div className="empty-card">Sellel päeval tunde pole</div>
            ) : (
              mobileLessons.map((lesson) => (
                <div key={lesson.id} className="lesson-row">
                  <div className="time-block">
                    <strong>{lesson.algus}</strong>
                    <span>{lesson.lopp}</span>
                  </div>
                  <div
                    className="lesson-card mobile-card"
                    style={{
                      backgroundColor: "#e5e7eb",
                      color: "#111827",
                    }}
                  >
                    <div className="lesson-subject">{lesson.aine}</div>
                    <div className="lesson-meta">{lesson.opetaja}</div>
                    <div className="lesson-meta">Ruum: {lesson.ruum}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <nav className="bottom-nav">
        <div
          className="bottom-nav-item"
          onClick={() => setActiveTab("home")}
        >
          <span>Placeholder icon</span>
          <p>Avaleht</p>
        </div>
        <div className="bottom-nav-item active">
          <span>Placeholder icon</span>
          <p>
            {viewType === "class"
              ? "Klass"
              : viewType === "teacher"
              ? "Õpetaja"
              : "Ruum"}
          </p>
        </div>
        <div
          className="bottom-nav-item"
          onClick={() => setActiveTab("saved")}
        >
          <span>{savedPlans.length > 0 ? "Placeholder icon" : "Placeholder icon"}</span>
          <p>Salvestatud{savedPlans.length > 0 ? ` (${savedPlans.length})` : ""}</p>
        </div>
      </nav>
    </div>
  );
}