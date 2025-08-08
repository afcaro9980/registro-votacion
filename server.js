
const express = require('express');
const fileUpload = require('express-fileupload');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

const VOTOS_FILE = path.join(__dirname, 'data', 'votos.json');
const CARRERAS = [
    'Naval', 'Industrial', 'Electronica', 'Construccion Civil',
    'Obras Civiles', 'Mecanica', 'Informatica', 'Bachillerato'
];

let votantes = [];

function guardarVotos(votos) {
    fs.writeFileSync(VOTOS_FILE, JSON.stringify(votos, null, 2));
}

function cargarVotos() {
    if (!fs.existsSync(VOTOS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VOTOS_FILE));
}

let votos = cargarVotos();

app.post('/cargar-excel', (req, res) => {
    if (!req.files || !req.files.excel) {
        return res.status(400).send('No se subió ningún archivo');
    }

    const workbook = xlsx.read(req.files.excel.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    votantes = data.map(v => ({ id: String(v.id), nombre: v.nombre, carrera: v.carrera }));
    res.send('Cargado correctamente');
});

app.post('/agregar-voto', (req, res) => {
    const { password, rut, carrera, opcion } = req.body;
    if (password !== 'admin123') return res.status(403).send('Contraseña incorrecta');
    if (!rut || !carrera || !opcion) return res.status(400).send('Datos incompletos');

    if (votos.some(v => v.rut === rut)) {
        return res.status(409).send('Este RUT ya votó');
    }

    votos.push({ rut, carrera, opcion });
    guardarVotos(votos);

    res.send('Voto agregado exitosamente');
});

app.post('/resultados', (req, res) => {
    const { password } = req.body;
    if (password !== 'admin123') return res.status(403).send('Contraseña incorrecta');

    const conteo = {};
    CARRERAS.forEach(c => conteo[c] = { Si: 0, No: 0, Nulo: 0 });

    votos.forEach(({ carrera, opcion }) => {
        if (conteo[carrera] && conteo[carrera][opcion] !== undefined) {
            conteo[carrera][opcion]++;
        }
    });

    res.json(conteo);
});

app.listen(PORT, () => console.log('Servidor en puerto', PORT));
