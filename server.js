const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(express.static('public'));

const VOTES_FILE = path.join(__dirname, 'data', 'votos.json');

function loadVotes() {
    if (!fs.existsSync(VOTES_FILE)) return [];
    return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
}

function saveVotes(votes) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

app.post('/agregar-voto', (req, res) => {
    const { password, rut, carrera, opcion } = req.body;
    if (password !== 'caf') return res.status(403).send('Contraseña incorrecta');

    const votos = loadVotes();
    if (votos.find(v => v.rut === rut)) {
        return res.status(400).send('Este RUT ya ha votado');
    }

    votos.push({ rut, carrera, opcion });
    saveVotes(votos);
    res.send('Voto registrado con éxito');
});

app.post('/resultados', (req, res) => {
    const { password } = req.body;
    if (password !== 'caf') return res.status(403).send('Contraseña incorrecta');

    const votos = loadVotes();
    const resumen = {};
    let total = 0, totalParo = 0, totalSuspension = 0;

    votos.forEach(v => {
        if (!resumen[v.carrera]) {
            resumen[v.carrera] = { Paro: 0, 'Suspensión de clases': 0 };
        }
        resumen[v.carrera][v.opcion] = (resumen[v.carrera][v.opcion] || 0) + 1;

        // totales
        if (v.opcion === "Paro") totalParo++;
        if (v.opcion === "Suspensión de clases") totalSuspension++;
        total++;
    });

    res.json({ resumen, total, totalParo, totalSuspension });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));