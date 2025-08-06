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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor en puerto ${port}`);
});