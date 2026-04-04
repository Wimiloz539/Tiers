const express = require("express")
const fs = require("fs")
const cors = require("cors")

const app = express()
app.use(express.json())
app.use(cors())

const DB_FILE = "./database.json"

// Función para cargar la DB de forma segura
function loadDB(){
    if (!fs.existsSync(DB_FILE)) {
        return { players: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE))
}

function saveDB(data){
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

const levelPoints = {
    HT1:60, LT1:45, HT2:30, LT2:20,
    HT3:10, LT3:6, HT4:4, LT4:3,
    HT5:2, LT5:1, None:0
}

const modes = [
    "sword","axe","crystal","uhc","smp",
    "nethpot","diamondpot","mace"
]

function calcPoints(player){
    let total = 0
    modes.forEach(m => {
        total += levelPoints[player[m]] || 0
    })
    return total
}

// --- RUTAS ---

app.get("/players", (req, res) => {
    let db = loadDB()
    db.players.forEach(p => {
        p.points = calcPoints(p)
    })
    db.players.sort((a, b) => (b.points || 0) - (a.points || 0))
    res.json(db.players)
})

// Ejemplo para la ruta POST (hacé lo mismo con PUT y DELETE)
app.post("/player", (req, res) => {
    const adminKey = req.headers['admin-key'];
    if (adminKey !== "WZ21TIERS539") { // Elegí una clave acá
        return res.status(403).json({ error: "No tenés permiso" });
    }

    let db = loadDB();
    db.players.push(req.body);
    saveDB(db);
    res.json({ status: "ok" });
});

app.put("/player/:name", (req, res) => {
    let db = loadDB()
    let p = db.players.find(x => x.name === req.params.name)
    if(!p){
        return res.status(404).json({error: "Jugador no encontrado"})
    }
    Object.assign(p, req.body)
    saveDB(db)
    res.json({status: "updated"})
})

app.delete("/player/:name", (req, res) => {
    let db = loadDB()
    db.players = db.players.filter(p => p.name !== req.params.name)
    saveDB(db)
    res.json({status: "deleted"})
})

// --- CONFIGURACIÓN DE PUERTO PARA RENDER ---
// IMPORTANTE: Solo un app.listen y al final del archivo
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
