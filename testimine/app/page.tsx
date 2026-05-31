"use client";
 
import { useMemo, useState, useEffect, useRef } from "react";
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
 
type SearchResult = {
  type: ViewType;
  value: string;
  label: string;
  sublabel: string;
};
 
const days = [
  { id: "1", name: "Esmaspäev" },
  { id: "2", name: "Teisipäev" },
  { id: "3", name: "Kolmapäev" },
  { id: "4", name: "Neljapäev" },
  { id: "5", name: "Reede" },
];
 
const timeSlots = [
  "08:45 - 10:00",
  "10:15 - 11:30",
  "12:00 - 13:15",
  "13:30 - 14:45",
  "15:00 - 16:15",
];
 
const ESTONIAN_DAYS: Record<number, string> = {
  0: "pühapäev", 1: "esmaspäev", 2: "teisipäev", 3: "kolmapäev",
  4: "neljapäev", 5: "reede", 6: "laupäev",
};
 
const ESTONIAN_MONTHS: Record<number, string> = {
  0: "jaanuar", 1: "veebruar", 2: "märts", 3: "aprill",
  4: "mai", 5: "juuni", 6: "juuli", 7: "august",
  8: "september", 9: "oktoober", 10: "november", 11: "detsember",
};
 
function lessonTimeRange(lesson: ScheduleItem) {
  return `${lesson.algus} - ${lesson.lopp}`;
}
 
function savedKey(type: ViewType, value: string) {
  return `${type}::${value}`;
}
 
function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
 
export default function Page() {
  const events = timetable.events as ScheduleItem[];
  const classes = timetable.classes as string[];
  const teachers = timetable.teachers as string[];
  const rooms = timetable.rooms as string[];
  const subjects = timetable.subjects as SubjectColor[];
 
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [viewType, setViewType] = useState<ViewType>("class");
  const [selectedClass, setSelectedClass] = useState(classes[0] || "");
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0] || "");
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] || "");
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const now = useNow();
 
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tunniplaan_saved");
      if (stored) setSavedPlans(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);
 
  function persistSaved(plans: SavedPlan[]) {
    setSavedPlans(plans);
    try { localStorage.setItem("tunniplaan_saved", JSON.stringify(plans)); } catch { /* ignore */ }
  }
 
  function currentKey() {
    if (viewType === "class") return savedKey("class", selectedClass);
    if (viewType === "teacher") return savedKey("teacher", selectedTeacher);
    return savedKey("room", selectedRoom);
  }
 
  function isSaved() {
    return savedPlans.some((p) => savedKey(p.type, p.value) === currentKey());
  }
 
  function toggleSave() {
    const key = currentKey();
    if (isSaved()) {
      persistSaved(savedPlans.filter((p) => savedKey(p.type, p.value) !== key));
    } else {
      const value = viewType === "class" ? selectedClass : viewType === "teacher" ? selectedTeacher : selectedRoom;
      persistSaved([...savedPlans, { type: viewType, value, savedAt: new Date().toISOString() }]);
    }
  }
 
  function removeSaved(plan: SavedPlan) {
    persistSaved(savedPlans.filter((p) => savedKey(p.type, p.value) !== savedKey(plan.type, plan.value)));
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
    if (type === "class") return "(icon)";
    if (type === "teacher") return "(icon)";
    return "(icon)";
  }
 
  // ── Universal search ───────────────────────────────────────────────
  const allSearchItems = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];
    classes.forEach((c) => results.push({ type: "class", value: c, label: c, sublabel: "Klass" }));
    teachers.forEach((t) => results.push({ type: "teacher", value: t, label: t, sublabel: "Õpetaja" }));
    rooms.forEach((r) => results.push({ type: "room", value: r, label: r, sublabel: "Ruum" }));
    return results;
  }, [classes, teachers, rooms]);
 
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSearchItems.filter((item) => item.value.toLowerCase().includes(q)).slice(0, 12);
  }, [searchQuery, allSearchItems]);
 
  function openSearchResult(result: SearchResult) {
    setViewType(result.type);
    if (result.type === "class") setSelectedClass(result.value);
    else if (result.type === "teacher") setSelectedTeacher(result.value);
    else setSelectedRoom(result.value);
    setSearchOpen(false);
    setSearchQuery("");
    setActiveTab("schedule");
  }
 
  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }
 
  // ── Subject colors ─────────────────────────────────────────────────
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, SubjectColor>();
    subjects.forEach((s) => map.set(s.name, s));
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
 
  const mobileLessons = useMemo(() => {
    return filteredEvents
      .filter((l) => l.paev === mobileDay.id)
      .sort((a, b) => Number(a.tund) - Number(b.tund));
  }, [filteredEvents, mobileDay]);
 
  function getLessonForCell(dayId: string, slot: string) {
    return filteredEvents.find((l) => l.paev === dayId && lessonTimeRange(l) === slot) ?? null;
  }
 
  function getSubjectStyles(subjectName: string) {
    const found = subjectColorMap.get(subjectName);
    return { backgroundColor: found?.backcolor || "#3b82f6", color: found?.forecolor || "#000000" };
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
 
  function goPreviousDay() { setMobileDayIndex((c) => (c === 0 ? days.length - 1 : c - 1)); }
  function goNextDay() { setMobileDayIndex((c) => (c === days.length - 1 ? 0 : c + 1)); }
 
  const timeStr = now.toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" });
  const dayName = ESTONIAN_DAYS[now.getDay()];
  const dateStr = `${dayName}, ${now.getDate()}. ${ESTONIAN_MONTHS[now.getMonth()]}`;

  // ── Inline search overlay JSX (NOT a sub-component, to avoid remount bug) ──
  const searchOverlayJSX = searchOpen ? (
    <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-icon-inline">⌕</span>
          <input
            ref={searchInputRef}
            className="search-input"
            placeholder="Otsi klassi, õpetajat või ruumi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          <button className="search-close" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>✕</button>
        </div>
        <div className="search-results">
          {searchQuery.trim() === "" ? (
            <div className="search-hint">Sisesta klass (nt 10A), õpetaja nimi või ruumi number</div>
          ) : searchResults.length === 0 ? (
            <div className="search-hint">Tulemusi ei leitud</div>
          ) : (
            searchResults.map((r) => (
              <button key={savedKey(r.type, r.value)} className="search-result-item" onClick={() => openSearchResult(r)}>
                <span className={`search-result-badge badge-${r.type}`}>{r.sublabel}</span>
                <span className="search-result-value">{r.value}</span>
                <span className="search-result-arrow">›</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  // CELLS MERGING IN TIMETABLE
  const MergedTimetable = () => {
    const grid = timeSlots.map((slot) =>
      days.map((day) => getLessonForCell(day.id, slot))
    );
    const skip: boolean[][] = timeSlots.map(() => days.map(() => false));
 
    return (
      <table className="timetable">
        <thead>
          <tr>
            <th className="time-col"></th>
            {days.map((day) => (
              <th key={day.id}>
                <span className="day-header">{day.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot, slotIdx) => (
            <tr key={slot}>
              <td className="time-col">{slot}</td>
              {days.map((day, dayIdx) => {
                if (skip[slotIdx][dayIdx]) return null;
                const lesson = grid[slotIdx][dayIdx];
                if (!lesson) {
                  return <td key={`${day.id}-${slot}`} className="slot-cell" />;
                }
                let span = 1;
                while (
                  slotIdx + span < timeSlots.length &&
                  grid[slotIdx + span][dayIdx]?.lessonId === lesson.lessonId
                ) {
                  skip[slotIdx + span][dayIdx] = true;
                  span++;
                }
                return (
                  <td key={`${day.id}-${slot}`} className="slot-cell merged-cell" rowSpan={span}>
                    <div className="lesson-card" style={getSubjectStyles(lesson.aine)}>
                      <div className="lesson-subject">{lesson.aine}</div>
                      <div className="lesson-meta">{lesson.opetaja}</div>
                      <div className="lesson-meta">Ruum: {lesson.ruum}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
 
  // HOME PAGE
  if (activeTab === "home") {
    return (
      <div className="page">
        {searchOverlayJSX}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-calendar-icon">(icon)</span>
            <span>Tunniplaan</span>
          </div>
          <div className="topbar-right">
            <button className="icon-button" aria-label="Otsi" onClick={openSearch}>⌕</button>
          </div>
        </header>
 
        <main className="content home-content">
          <div className="home-hero-text">
            <h1 className="home-school-name">Pelgulinna Kool</h1>
          </div>
          <div className="home-clock-card">
            <div className="home-clock-top">
              <span className="home-clock-icon">(icon)</span>
              <span className="home-clock-label">Praegu</span>
            </div>
            <div className="home-clock-time">{timeStr}</div>
            <div className="home-clock-date">{dateStr}</div>
          </div>
 
          <div className="home-section-title">Vali vaade</div>
 
          <div className="home-nav-cards">
            <button className="home-nav-card" onClick={() => { setViewType("class"); setActiveTab("schedule"); }}>
              <span className="home-nav-icon home-nav-icon-blue">(icon)</span>
              <div className="home-nav-text">
                <span className="home-nav-title">Klassi tunniplaan</span>
                <span className="home-nav-sub">Vaata oma klassi tundide ajakava</span>
              </div>
              <span className="home-nav-arrow">›</span>
            </button>
 
            <button className="home-nav-card" onClick={() => { setViewType("teacher"); setActiveTab("schedule"); }}>
              <span className="home-nav-icon home-nav-icon-green">(icon)</span>
              <div className="home-nav-text">
                <span className="home-nav-title">Õpetaja tunniplaan</span>
                <span className="home-nav-sub">Otsi õpetaja tunniplaani</span>
              </div>
              <span className="home-nav-arrow">›</span>
            </button>
 
            <button className="home-nav-card" onClick={() => { setViewType("room"); setActiveTab("schedule"); }}>
              <span className="home-nav-icon home-nav-icon-orange">(icon)</span>
              <div className="home-nav-text">
                <span className="home-nav-title">Ruumi tunniplaan</span>
                <span className="home-nav-sub">Vaata, millal ruum on vaba</span>
              </div>
              <span className="home-nav-arrow">›</span>
            </button>
          </div>
 
          {savedPlans.length > 0 && (
            <>
              <div className="home-section-row">
                <span className="home-section-title" style={{ marginBottom: 0 }}>Kiirvalik</span>
                <button className="home-vaata-koiki" onClick={() => setActiveTab("saved")}>Vaata kõiki</button>
              </div>
              <div className="home-quick-chips">
                {savedPlans.slice(0, 5).map((plan) => (
                  <button key={savedKey(plan.type, plan.value)} className="home-chip" onClick={() => openSaved(plan)}>
                    {plan.value}
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
 
        <nav className="bottom-nav">
          <div className="bottom-nav-item active" onClick={() => setActiveTab("home")}><span>(icon)</span><p>Avaleht</p></div>
          <div className="bottom-nav-item" onClick={() => setActiveTab("schedule")}><span>(icon)</span><p>Tunniplaan</p></div>
          <div className="bottom-nav-item" onClick={() => setActiveTab("saved")}>
            <span>(icon)</span><p>Salvestatud</p>
          </div>
        </nav>
      </div>
    );
  }
 
  // ── SAVED PAGE ─────────────────────────────────────────────────────
  if (activeTab === "saved") {
    return (
      <div className="page">
        {searchOverlayJSX}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-calendar-icon">(icon)</span>
            <span>Tunniplaan</span>
          </div>
          <div className="topbar-right">
            <button className="icon-button" onClick={openSearch}>⌕</button>
          </div>
        </header>
 
        <main className="content">
          <div className="view-header">
            <div className="view-header-left">
              <button className="back-button" onClick={() => setActiveTab("home")}>‹</button>
              <div>
                <h1 className="view-title">Salvestatud</h1>
                <p className="view-subtitle">Sinu salvestatud tunniplaanid</p>
              </div>
            </div>
          </div>
 
          {savedPlans.length === 0 ? (
            <div className="saved-empty">
              <div className="saved-empty-icon">:(</div>
              <p className="saved-empty-title">Salvestatud plaane pole</p>
              <p className="saved-empty-sub">Tunniplaanil vajuta (icon), et see siia salvestada.</p>
            </div>
          ) : (
            <div className="saved-list">
              {savedPlans.map((plan) => (
                <div key={savedKey(plan.type, plan.value)} className="saved-card">
                  <button className="saved-card-main" onClick={() => openSaved(plan)}>
                    <span className="saved-card-icon">{planIcon(plan.type)}</span>
                    <div className="saved-card-info">
                      <span className="saved-card-label">{planLabel(plan)}</span>
                      <span className="saved-card-type">
                        {plan.type === "class" ? "Klass" : plan.type === "teacher" ? "Õpetaja" : "Ruum"}
                      </span>
                    </div>
                  </button>
                  <button className="saved-card-remove" onClick={() => removeSaved(plan)} aria-label="Eemalda">✕</button>
                </div>
              ))}
            </div>
          )}
        </main>
 
        <nav className="bottom-nav">
          <div className="bottom-nav-item" onClick={() => setActiveTab("home")}><span>(icon)</span><p>Avaleht</p></div>
          <div className="bottom-nav-item" onClick={() => setActiveTab("schedule")}><span>(icon)</span><p>Tunniplaan</p></div>
          <div className="bottom-nav-item active"><span>(icon)</span><p>Salvestatud</p></div>
        </nav>
      </div>
    );
  }
 
  // SCHEDULE PAGE
  return (
    <div className="page">
      {searchOverlayJSX}
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-calendar-icon">(icon)</span>
          <span>Tunniplaan</span>
        </div>
        <div className="topbar-right">
          <button className="icon-button" aria-label="Otsi" onClick={openSearch}>⌕</button>
        </div>
      </header>
 
      <main className="content">
        <div className="view-header">
          <div className="view-header-left">
            <button className="back-button" onClick={() => setActiveTab("home")}>‹</button>
            <div>
              <h1 className="view-title">{getTitle()}</h1>
              <p className="view-subtitle">Nädala tunniplaan</p>
            </div>
          </div>
          <button
            className={`icon-button save-button${isSaved() ? " saved" : ""}`}
            aria-label={isSaved() ? "Eemalda salvestatud" : "Salvesta"}
            onClick={toggleSave}
          >
            {isSaved() ? "Unsave" : "Save"}
          </button>
        </div>
 
        <div className="view-switcher">
          <button className={viewType === "class" ? "switch-btn active" : "switch-btn"} onClick={() => setViewType("class")}>Klass</button>
          <button className={viewType === "teacher" ? "switch-btn active" : "switch-btn"} onClick={() => setViewType("teacher")}>Õpetaja</button>
          <button className={viewType === "room" ? "switch-btn active" : "switch-btn"} onClick={() => setViewType("room")}>Ruum</button>
        </div>
 
        <div className="selector-block">
          <label className="selector-label">{getLabel()}</label>
          {viewType === "class" && (
            <select className="selector" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {classes.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          )}
          {viewType === "teacher" && (
            <select className="selector" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
              {teachers.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {viewType === "room" && (
            <select className="selector" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
              {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
 
        <section className="desktop-schedule">
          <div className="timetable-wrapper">
            <MergedTimetable />
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
                  <div className="lesson-card mobile-card" style={getSubjectStyles(lesson.aine)}>
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
        <div className="bottom-nav-item" onClick={() => setActiveTab("home")}><span>(icon)</span><p>Avaleht</p></div>
        <div className="bottom-nav-item active">
          <span>(icon)</span>
          <p>{viewType === "class" ? "Tunniplaan" : viewType === "teacher" ? "Õpetaja" : "Ruum"}</p>
        </div>
        <div className="bottom-nav-item" onClick={() => setActiveTab("saved")}>
          <span>(icon)</span>
          <p>Salvestatud{savedPlans.length > 0 ? ` (${savedPlans.length})` : ""}</p>
        </div>
      </nav>
    </div>
  );
}