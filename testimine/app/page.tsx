"use client";

import { useMemo, useState } from "react";
import timetable from "./parser/tunniplaan.json";

type ViewType = "class" | "teacher" | "room";

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

const days = [
  { id: "1", name: "Esmaspäev", date: "31.03" },
  { id: "2", name: "Teisipäev", date: "01.04" },
  { id: "3", name: "Kolmapäev", date: "02.04" },
  { id: "4", name: "Neljapäev", date: "03.04" },
  { id: "5", name: "Reede", date: "04.04" },
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

export default function Page() {
  const events = timetable.events as ScheduleItem[];
  const classes = timetable.classes as string[];
  const teachers = timetable.teachers as string[];
  const rooms = timetable.rooms as string[];
  const subjects = timetable.subjects as SubjectColor[];

  const [viewType, setViewType] = useState<ViewType>("class");
  const [selectedClass, setSelectedClass] = useState(classes[0] || "");
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0] || "");
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] || "");
  const [mobileDayIndex, setMobileDayIndex] = useState(0);

  const subjectColorMap = useMemo(() => {
    const map = new Map<string, SubjectColor>();
    subjects.forEach((subject) => {
      map.set(subject.name, subject);
    });
    return map;
  }, [subjects]);

  const filteredEvents = useMemo(() => {
    return events.filter((lesson) => {
      if (viewType === "class") {
        return lesson.klass.split(" ").includes(selectedClass);
      }

      if (viewType === "teacher") {
        return lesson.opetaja === selectedTeacher;
      }

      return lesson.ruum === selectedRoom;
    });
  }, [events, viewType, selectedClass, selectedTeacher, selectedRoom]);

  const mobileDay = days[mobileDayIndex];

  const mobileLessons = useMemo(() => {
    return filteredEvents
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
    setMobileDayIndex((current) => (current === 0 ? days.length - 1 : current - 1));
  }

  function goNextDay() {
    setMobileDayIndex((current) => (current === days.length - 1 ? 0 : current + 1));
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <span className="calendar-icon">📅</span>
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
              <h1 className="view-title">{getTitle()}</h1>
              <p className="view-subtitle">Nädala tunniplaan</p>
            </div>
          </div>

          <button className="icon-button desktop-only" aria-label="Salvesta">
            ♡
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
                <option key={klass} value={klass}>
                  {klass}
                </option>
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
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
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
                <option key={room} value={room}>
                  {room}
                </option>
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
                      <span className="day-date">{day.date}</span>
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
                            <div
                              className="lesson-card"
                              style={getSubjectStyles(lesson.aine)}
                            >
                              <div className="lesson-subject">{lesson.aine}</div>
                              <div className="lesson-meta">{lesson.opetaja}</div>
                              <div className="lesson-meta">Ruum: {lesson.ruum}</div>
                              <div className="lesson-meta">
                                {lesson.algus} - {lesson.lopp}
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
                    style={getSubjectStyles(lesson.aine)}
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
          <p>
            {viewType === "class"
              ? "Klass"
              : viewType === "teacher"
              ? "Õpetaja"
              : "Ruum"}
          </p>
        </div>

        <div className="bottom-nav-item">
          <span>♡</span>
          <p>Salvestatud</p>
        </div>
      </nav>
    </div>
  );
}