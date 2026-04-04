const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = "./database.json";
const ADMIN_PASSWORD = "WZ21TIERS539";

// Cargar DB
function loadDB() {
    if (!fs.existsSync(DB_FILE)) return { players: [] };
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// Guardar DB
function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const levelPoints = {
    HT1: 60, LT1: 45, HT2: 30, LT2: 20,
    HT3: 10, LT3: 6, HT4: 4, LT4: 3,
    HT5: 2, LT5: 1, None: 0
};

const modes = ["sword", "axe", "crystal", "uhc", "smp", "nethpot", "diamondpot", "mace"];

function calcPoints(player) {
    let total = 0;
    modes.forEach(m => {
        total += levelPoints[player[m]] || 0;
    });
    return total;
}

// --- RUTAS ---

// Obtener todos los jugadores
app.get("/players", (req, res) => {
    let db = loadDB();
    db.players.forEach(p => {
        p.points = calcPoints(p);
    });
    db.players.sort((a, b) => (b.points || 0) - (a.points || 0));
    res.json(db.players);
});

// Agregar Jugador
app.post("/player", (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    let db = loadDB();
    db.players.push(req.body);
    saveDB(db);
    res.json({ status: "ok" });
});

// Editar Jugador
app.put("/player/:name", (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    let db = loadDB();
    const index = db.players.findIndex(p => p.name === req.params.name);
    if (index !== -1) {
        db.players[index] = { ...db.players[index], ...req.body };
        saveDB(db);
        res.json({ status: "ok" });
    } else {
        res.status(404).json({ error: "Jugador no encontrado" });
    }
});

// Eliminar Jugador
app.delete("/player/:name", (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    let db = loadDB();
    db.players = db.players.filter(p => p.name !== req.params.name);
    saveDB(db);
    res.json({ status: "ok" });
});

// Puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
