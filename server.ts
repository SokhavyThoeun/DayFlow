import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");

// Initialize dummy DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ tasks: [], habits: [], mood: [], users: [] }));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth API ---
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    const db = readDB();
    if (db.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const newUser = { id: Date.now().toString(), email, password, name, xp: 0, level: 1 };
    db.users.push(newUser);
    writeDB(db);
    res.status(201).json({ user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find((u: any) => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  app.post("/api/user/update", (req, res) => {
    const { id, name, avatar } = req.body;
    const db = readDB();
    const user = db.users.find((u: any) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    writeDB(db);
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  });

  // --- Tasks API ---
  app.get("/api/tasks", (req, res) => {
    const db = readDB();
    res.json(db.tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const db = readDB();
    const newTask = { ...req.body, id: Date.now().toString() };
    db.tasks.push(newTask);
    writeDB(db);
    res.status(201).json(newTask);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const taskIndex = db.tasks.findIndex((t: any) => t.id === id);
    if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });
    
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...req.body };
    writeDB(db);
    res.json(db.tasks[taskIndex]);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.tasks = db.tasks.filter((t: any) => t.id !== id);
    writeDB(db);
    res.status(204).send();
  });

  // --- Habits API ---
  app.get("/api/habits", (req, res) => {
    const db = readDB();
    res.json(db.habits);
  });

  app.post("/api/habits", (req, res) => {
    const db = readDB();
    const newHabit = { ...req.body, id: Date.now().toString(), history: [] };
    db.habits.push(newHabit);
    writeDB(db);
    res.status(201).json(newHabit);
  });

  app.patch("/api/habits/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const habitIndex = db.habits.findIndex((h: any) => h.id === id);
    if (habitIndex === -1) return res.status(404).json({ error: "Habit not found" });
    
    db.habits[habitIndex] = { ...db.habits[habitIndex], ...req.body };
    writeDB(db);
    res.json(db.habits[habitIndex]);
  });

  app.delete("/api/habits/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.habits = db.habits.filter((h: any) => h.id !== id);
    writeDB(db);
    res.status(204).send();
  });

  // AI Assistant Proxy
  app.post("/api/ai/coach", async (req, res) => {
    res.status(403).json({ error: "Please use frontend Gemini SDK directly." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DayFlow Enterprise running at http://localhost:${PORT}`);
  });
}

startServer();
