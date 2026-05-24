
"use client";

import { useMemo, useState } from "react";
import timetable from "./parser/tunniplaan.json";

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

const days = [
  { id: "1", name: "Esmaspäev", date: "31.03" },
  { id: "2", name: "Teisipäev", date: "01.04" },
  { id: "3", name: "Kolmapäev", date: "02.04" },
  { id: "4", name: "Neljapäev", date: "03.04" },
  { id: "5", name: "Reede", date: "04.04" },
];

export default function Page() {
  const events = timetable.events as ScheduleItem[];
  const classes = timetable.classes as string[];

  const [selectedClass, setSelectedClass] = useState(classes[0] || "");
  const [mobileDayIndex, setMobileDayIndex] = useState(0);

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
  }, [classLessons, mobileDay]);

  function goPreviousDay() {
    setMobileDayIndex((current) =>
      current === 0 ? days.length - 1 : current - 1
    );
  }

  function goNextDay() {
    setMobileDayIndex((current) =>
      current === days.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <span className="calendar-icon">ikoon</span>
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
        </div>

        <div className="selector-block">
          <label className="selector-label">Vali klass:</label>

          <select
            className="selector"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map((klass) => (
              <option key={klass} value={klass}>
                {klass}
              </option>
            ))}
          </select>
        </div>

        <section className="mobile-schedule" style={{ display: "block" }}>
          <div className="day-switcher">
            <button className="icon-button" onClick={goPreviousDay}>
              ‹
            </button>

            <div className="day-switcher-center">
              <h2>{mobileDay.name}</h2>
              <p>{mobileDay.date}</p>
            </div>

            <button className="icon-button" onClick={goNextDay}>
              ›
            </button>
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
        <div className="bottom-nav-item">
          <span>⌂</span>
          <p>Avaleht</p>
        </div>

        <div className="bottom-nav-item active">
          <span>♙</span>
          <p>Klass</p>
        </div>

        <div className="bottom-nav-item">
          <span>♡</span>
          <p>Salvestatud</p>
        </div>
      </nav>
    </div>
  );
}