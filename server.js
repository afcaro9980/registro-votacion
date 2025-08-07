const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const xlsx = require("xlsx");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar almacenamiento para uploads
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/buscar", (req, res) => {
  const { id } = req.body;
  const votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));
  const persona = votantes.find(p => p.id === id);
  if (persona) {
    res.json({ encontrado: true, nombre: persona.nombre, voto: persona.voto });
  } else {
    res.json({ encontrado: false });
  }
});

app.post("/marcar", (req, res) => {
  const { id } = req.body;
  let votantes = JSON.parse(fs.readFileSync("./data/votantes.json"));
  const index = votantes.findIndex(p => p.id === id);
  if (index !== -1) {
    votantes[index].voto = true;
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
        votantes.push({ id: row.id, nombre: row.nombre, voto: false });
      }
    }
  });

  fs.writeFileSync("./data/votantes.json", JSON.stringify(votantes, null, 2));
  fs.unlinkSync(file.path);
  res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor en puerto ${port}`);
});