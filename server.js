
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/voto-manual", (req, res) => {
  const { clave, id, carrera, opcion } = req.body;
  if (clave !== "caf") return res.json({ ok: false });

  let votantes = [];
  const ruta = "./data/votantes.json";
  if (fs.existsSync(ruta)) {
    votantes = JSON.parse(fs.readFileSync(ruta));
  }

  const index = votantes.findIndex(p => p.id === id);

  if (index !== -1) {
    if (votantes[index].voto) {
      return res.json({ ok: false, duplicado: true });
    } else {
      votantes[index].voto = true;
      votantes[index].opcion = opcion;
    }
  } else {
    votantes.push({ id, nombre: "Manual", carrera, voto: true, opcion });
  }

  fs.writeFileSync(ruta, JSON.stringify(votantes, null, 2));
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Servidor en puerto", port);
});
