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

app.post('/upload-votantes', (req, res) => {
    if (!req.files || !req.files.excelFile) {
        return res.status(400).send('No se subió ningún archivo');
    }

    const workbook = xlsx.read(req.files.excelFile.data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    fs.writeFileSync(path.join(__dirname, 'data', 'votantes.json'), JSON.stringify(data, null, 2));
    res.send('Votantes cargados');
});

app.post('/agregar-voto', (req, res) => {
    const { password, rut, carrera, opcion } = req.body;
    if (password !== 'clave123') return res.status(403).send('Contraseña incorrecta');

    const votos = loadVotes();
    if (votos.find(v => v.rut === rut)) {
        return res.status(400).send('Este RUT ya ha votado');
    }

    votos.push({ rut, carrera, opcion });
    saveVotes(votos);
    res.send('Voto registrado con éxito');
});

app.get('/resultados', (req, res) => {
    const { password } = req.query;
    if (password !== 'clave123') return res.status(403).send('Contraseña incorrecta');

    const votos = loadVotes();
    const resumen = {};

    votos.forEach(v => {
        if (!resumen[v.carrera]) {
            resumen[v.carrera] = { Si: 0, No: 0, Nulo: 0 };
        }
        resumen[v.carrera][v.opcion] = (resumen[v.carrera][v.opcion] || 0) + 1;
    });

    res.json(resumen);
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));