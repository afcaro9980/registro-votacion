
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = 'caf';
const DATA_FILE = path.join(__dirname, 'data', 'votos.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Asegura existencia de archivo votos.json
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Agregar voto manual
app.post('/agregar-voto', (req, res) => {
    const { rut, carrera, opcion, clave } = req.body;
    if (clave !== PASSWORD) return res.send('Contraseña incorrecta.');

    let votos = JSON.parse(fs.readFileSync(DATA_FILE));
    if (votos.find(v => v.rut === rut)) {
        return res.send('Este RUT ya ha votado.');
    }

    votos.push({ rut, carrera, opcion });
    fs.writeFileSync(DATA_FILE, JSON.stringify(votos, null, 2));
    res.send('Voto agregado correctamente.');
});

// Mostrar resultados
app.post('/resultados', (req, res) => {
    const { clave } = req.body;
    if (clave !== PASSWORD) return res.send('Contraseña incorrecta.');

    const votos = JSON.parse(fs.readFileSync(DATA_FILE));
    const resultados = {};

    votos.forEach(voto => {
        if (!resultados[voto.carrera]) {
            resultados[voto.carrera] = { 'Sí': 0, 'No': 0, 'Nulo': 0 };
        }
        resultados[voto.carrera][voto.opcion]++;
    });

    let html = '<h1>Resultados por Carrera</h1>';
    for (const carrera in resultados) {
        html += `<h2>${carrera}</h2>`;
        html += `<p>Sí: ${resultados[carrera]['Sí']}</p>`;
        html += `<p>No: ${resultados[carrera]['No']}</p>`;
        html += `<p>Nulo: ${resultados[carrera]['Nulo']}</p>`;
    }
    res.send(html);
});

app.listen(PORT, () => console.log(`Servidor iniciado en http://localhost:${PORT}`));
