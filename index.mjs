import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { CONFIG } from "./config/env.mjs";

const app = express();
const upload = multer({ dest: "uploads/" });
const logsDir = "./logs";
const logFile = path.join(logsDir, "auditoria.json");
const usageFile = path.join(logsDir, "usage.json");

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

app.use(express.json());

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Logs endpoint
app.get("/logs", (req, res) => {
  const logs = {
    auditoria: fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "[]",
    uso: fs.existsSync(usageFile) ? fs.readFileSync(usageFile, "utf8") : "[]"
  };
  res.json(logs);
});

// Reset logs endpoint
app.post("/reset-logs", (req, res) => {
  const token = req.headers["x-reset-token"];
  if (token !== CONFIG.RESET_LOGS_TOKEN) {
    return res.status(403).json({ error: "Token inválido." });
  }
  fs.writeFileSync(logFile, "[]");
  fs.writeFileSync(usageFile, "[]");
  res.json({ message: "Logs limpos com sucesso." });
});

// Endpoint principal de extração
app.post("/extract-structured", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo PDF ausente." });

  const fileBuffer = fs.readFileSync(req.file.path);
  const hash_pdf = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  const logEntry = {
    date: new Date().toISOString(),
    ip: req.ip,
    file: req.file.originalname,
    hash_pdf,
    status: "processed"
  };

  fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

  res.json({
    message: "Extração concluída (mock)",
    hash_pdf,
    health: "good",
    tokens_gpt_extracao: 0,
    tokens_gpt_mes: 0
  });
});

app.listen(CONFIG.PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${CONFIG.PORT}`)
);
