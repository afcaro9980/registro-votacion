const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const xlsx = require("xlsx");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/buscar", (req, res) => {
  const { id } = req.body;
  const votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));
  const persona = votantes.find(p => p.id === id);
  if (persona) {
    res.json({ encontrado: true, nombre: persona.nombre, voto: persona.voto, opcion: persona.opcion || null });
  } else {
    res.json({ encontrado: false });
  }
});

app.post("/marcar", (req, res) => {
  const { id, opcion } = req.body;
  let votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));
  const index = votantes.findIndex(p => p.id === id);
  if (index !== -1) {
    votantes[index].voto = true;
    votantes[index].opcion = opcion;
    fs.writeFileSync("./data/votantes.json", JSON.stringify(votantes, null, 2));
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.post("/cargar-excel", upload.single("archivo"), (req, res) => {
  const file = req.file;
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  let votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));

  data.forEach(row => {
    if (row.id && row.nombre) {
      if (!votantes.some(p => p.id === row.id)) {
        votantes.push({ id: row.id, nombre: row.nombre, carrera: row.carrera || "", voto: false });
      }
    }
  });

  fs.writeFileSync("./data/votantes.json", JSON.stringify(votantes, null, 2));
  fs.unlinkSync(file.path);
  res.redirect("/");
});

const port = process.env.PORT || 3000;

app.post("/resultados", (req, res) => {
  const { clave } = req.body;
  if (clave !== "caf") return res.json({ autorizado: false });

  const votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));
  const votos = votantes.filter(v => v.voto);
  const total = votos.length;
  const si = votos.filter(v => v.opcion === "Sí").length;
  const no = votos.filter(v => v.opcion === "No").length;

  const porcentaje_si = total ? ((si / total) * 100).toFixed(2) : 0;
  const porcentaje_no = total ? ((no / total) * 100).toFixed(2) : 0;

  const carreras = {};
  votos.forEach(v => {
    const carrera = v.carrera || "Sin carrera";
    if (!carreras[carrera]) carreras[carrera] = { si: 0, no: 0, total: 0 };
    if (v.opcion === "Sí") carreras[carrera].si++;
    if (v.opcion === "No") carreras[carrera].no++;
    carreras[carrera].total++;
  });

  for (const carrera in carreras) {
    const c = carreras[carrera];
    c.porcentaje_si = c.total ? ((c.si / c.total) * 100).toFixed(2) : "0.00";
    c.porcentaje_no = c.total ? ((c.no / c.total) * 100).toFixed(2) : "0.00";
  }

  res.json({ autorizado: true, total, si, no, porcentaje_si, porcentaje_no, carreras });
});          
  const { clave } = req.body;
  if (clave !== "caf") return res.json({ autorizado: false });

  const votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));
  const votos = votantes.filter(v => v.voto);
  const total = votos.length;
  const si = votos.filter(v => v.opcion === "Sí").length;
  const no = votos.filter(v => v.opcion === "No").length;

  const porcentaje_si = total ? ((si / total) * 100).toFixed(2) : 0;
  const porcentaje_no = total ? ((no / total) * 100).toFixed(2) : 0;

  res.json({ autorizado: true, total, si, no, porcentaje_si, porcentaje_no });
});


app.listen(port, () => {
  console.log(`Servidor en puerto ${port}`);
});