var fs = require("fs");
var xml2js = require("xml2js");

function formatTime(time) {
  if (!time) return "";
  return time.slice(0, 2) + ":" + time.slice(2);
}

function cleanId(id, prefix) {
  if (!id) return "";
  return id.replace(prefix, "");
}

fs.readFile("untis.xml", "utf8", function (err, xmldata) {
  if (err) {
    console.log("XML faili lugemisel tekkis viga:");
    console.log(err);
    return;
  }

  xml2js.parseString(xmldata, function (err, results) {
    if (err) {
      console.log("XML parsimisel tekkis viga:");
      console.log(err);
      return;
    }

    var document = results.document;

    var classes =
      document.classes?.[0]?.class?.map(function (klass) {
        return cleanId(klass.$.id, "CL_");
      }) || [];

    var teachers =
      document.teachers?.[0]?.teacher?.map(function (teacher) {
        return cleanId(teacher.$.id, "TR_");
      }) || [];

    var rooms =
      document.rooms?.[0]?.room?.map(function (room) {
        return cleanId(room.$.id, "RM_");
      }) || [];

    var subjects =
      document.subjects?.[0]?.subject?.map(function (subject) {
        return {
          name: cleanId(subject.$.id, "SU_"),
          forecolor: subject.forecolor?.[0] || "",
          backcolor: subject.backcolor?.[0] || "",
        };
      }) || [];

    var lessons = document.lessons?.[0]?.lesson || [];

    var events = [];

    lessons.forEach(function (lesson) {
      var lessonId = lesson.$.id;

      var aine = cleanId(lesson.lesson_subject?.[0]?.$?.id, "SU_");
      var opetaja = cleanId(lesson.lesson_teacher?.[0]?.$?.id, "TR_");
      var klass = cleanId(lesson.lesson_classes?.[0]?.$?.id, "CL_");

      var times = lesson.times?.[0]?.time || [];

      times.forEach(function (time, index) {
        var paev = time.assigned_day?.[0] || "";
        var tund = time.assigned_period?.[0] || "";
        var algus = formatTime(time.assigned_starttime?.[0]);
        var lopp = formatTime(time.assigned_endtime?.[0]);
        var ruum = cleanId(time.assigned_room?.[0]?.$?.id, "RM_");

        events.push({
          id: lessonId + "-" + index,
          lessonId: lessonId,
          aine: aine,
          opetaja: opetaja,
          klass: klass,
          paev: paev,
          tund: tund,
          algus: algus,
          lopp: lopp,
          ruum: ruum,
        });
      });
    });

    var output = {
      classes: classes,
      teachers: teachers,
      rooms: rooms,
      subjects: subjects,
      events: events,
    };

    fs.writeFile(
      "tunniplaan.json",
      JSON.stringify(output, null, 2),
      function (err) {
        if (err) {
          console.log("JSON faili koostamisel tekkis viga:");
          console.log(err);
          return;
        }

        console.log("tunniplaan.json fail on loodud");
      }
    );
  });
});