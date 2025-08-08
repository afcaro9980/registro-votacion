
const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const votosPath = path.join(__dirname, "data", "votos.json");
const carreras = [
  "Naval",
  "Industrial",
  "Electronica",
  "Construccion Civil",
  "Obras Civiles",
  "Mecanica",
  "Informatica",
  "Bachillerato"
];

function leerVotos() {
  if (!fs.existsSync(votosPath)) {
    return [];
  }
  const data = fs.readFileSync(votosPath);
  return JSON.parse(data);
}

function guardarVotos(votos) {
  fs.writeFileSync(votosPath, JSON.stringify(votos, null, 2));
}

app.get("/", (req, res) => {
  res.render("index", { carreras });
});

app.post("/agregar-voto", (req, res) => {
  const { clave, rut, carrera, opcion } = req.body;
  if (clave !== "admin123") {
    return res.send("Contraseña incorrecta.");
  }

  const votos = leerVotos();
  if (votos.some((v) => v.rut === rut)) {
    return res.send("Este RUT ya ha votado.");
  }

  votos.push({ rut, carrera, opcion });
  guardarVotos(votos);
  res.send("Voto registrado correctamente.");
});

app.post("/mostrar-resultados", (req, res) => {
  const { clave } = req.body;
  if (clave !== "admin123") {
    return res.send("Contraseña incorrecta.");
  }

  const votos = leerVotos();
  const totales = votos.reduce((acc, { carrera, opcion }) => {
    if (!acc[carrera]) {
      acc[carrera] = { Si: 0, No: 0, Nulo: 0, total: 0 };
    }
    acc[carrera][opcion]++;
    acc[carrera].total++;
    return acc;
  }, {});

  res.render("resultados", { totales });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
