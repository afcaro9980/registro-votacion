
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const votosPath = path.join(__dirname, 'data', 'votos.json');
const votantesPath = path.join(__dirname, 'data', 'votantes.json');

const carreras = ["Naval", "Industrial", "Electronica", "Construccion Civil", "Obras Civiles", "Mecanica", "Informatica", "Bachillerato"];
const PASSWORD = 'caf';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));

app.post('/voto-manual', (req, res) => {
    const { password, rut, carrera, opcion } = req.body;
    if (password !== PASSWORD) return res.json({ message: 'Contraseña incorrecta.' });
    if (!rut || !carrera || !opcion) return res.json({ message: 'Faltan campos obligatorios.' });
    let votos = [];
    if (fs.existsSync(votosPath)) votos = JSON.parse(fs.readFileSync(votosPath));
    if (votos.find(v => v.rut === rut)) return res.json({ message: 'Este RUT ya votó.' });
    votos.push({ rut, carrera, opcion });
    fs.writeFileSync(votosPath, JSON.stringify(votos, null, 2));
    res.json({ message: 'Voto registrado exitosamente.' });
});

app.get('/resultados', (req, res) => {
    const { password } = req.query;
    if (password !== PASSWORD) return res.json({ error: 'Contraseña incorrecta.' });
    let votos = [];
    if (fs.existsSync(votosPath)) votos = JSON.parse(fs.readFileSync(votosPath));
    const total = votos.length || 1;
    const contar = arr => ({
        si: Math.round(100 * arr.filter(v => v.opcion === 'si').length / arr.length || 0),
        no: Math.round(100 * arr.filter(v => v.opcion === 'no').length / arr.length || 0),
        nulo: Math.round(100 * arr.filter(v => v.opcion === 'nulo').length / arr.length || 0),
    });
    const porCarrera = {};
    for (const c of carreras) {
        const subset = votos.filter(v => v.carrera === c);
        porCarrera[c] = contar(subset);
    }
    res.json({ total: contar(votos), porCarrera });
});

app.listen(PORT, () => console.log('Servidor en puerto', PORT));
