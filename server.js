require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // Cambiamos fs por mongoose

const app = express();
app.use(express.json());
app.use(cors());

const ADMIN_PASSWORD = "WZ21TIERS539";

// --- CONEXIÓN A MONGO ---
// Render usará la variable MONGO_URI que configuramos en su panel
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión:", err));

// --- MODELO DE DATOS ---
const playerSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    region: String,
    sword: { type: String, default: "None" },
    axe: { type: String, default: "None" },
    crystal: { type: String, default: "None" },
    uhc: { type: String, default: "None" },
    smp: { type: String, default: "None" },
    nethpot: { type: String, default: "None" },
    diamondpot: { type: String, default: "None" },
    mace: { type: String, default: "None" }
});

const Player = mongoose.model('Player', playerSchema);

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20,
    HT3: 10, LT3: 6, HT4: 4, LT4: 3,
    HT5: 2, LT5: 1, None: 0
};

const modes = ["sword", "axe", "crystal", "uhc", "smp", "nethpot", "diamondpot", "mace"];

// Función para calcular puntos (ahora la usamos antes de enviar el JSON)
function getPoints(p) {
    let total = 0;
    modes.forEach(m => {
        total += levelPoints[p[m]] || 0;
    });
    return total;
}

// --- RUTAS ---

// Obtener todos los jugadores (Ordenados por puntos)
app.get("/players", async (req, res) => {
    try {
        let players = await Player.find().lean();
        players = players.map(p => ({
            ...p,
            points: getPoints(p)
        }));
        players.sort((a, b) => b.points - a.points);
        res.json(players);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener jugadores" });
    }
});

// Agregar Jugador
app.post("/player", async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    try {
        const newPlayer = new Player(req.body);
        await newPlayer.save();
        res.json({ status: "ok" });
    } catch (err) {
        res.status(400).json({ error: "Error al crear (nombre duplicado?)" });
    }
});

// Editar Jugador
app.put("/player/:name", async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    try {
        const updated = await Player.findOneAndUpdate(
            { name: req.params.name }, 
            req.body, 
            { new: true }
        );
        if (updated) res.json({ status: "ok" });
        else res.status(404).json({ error: "No encontrado" });
    } catch (err) {
        res.status(500).json({ error: "Error al editar" });
    }
});

// Eliminar Jugador
app.delete("/player/:name", async (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_PASSWORD) {
        return res.status(403).json({
