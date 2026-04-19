const path = require("path");

const express = require("express");

const { getPantriesDb, getRecipesDb } = require("./src/db");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function normalizeToken(token) {
  if (!token) return "";
  const trimmed = String(token).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function requireAdmin(req, res, next) {
  const configured = normalizeToken(ADMIN_TOKEN);
  if (!configured) return res.status(503).json({ error: "admin_not_configured" });
  const token = normalizeToken(req.get("x-admin-token"));
  if (!token || token !== configured) return res.status(401).json({ error: "unauthorized" });
  next();
}

async function main() {
  const app = express();
  app.use(express.json());

  const pantriesDb = await getPantriesDb();
  const recipesDb = await getRecipesDb();

  app.get("/api/pantries", async (_req, res) => {
    const rows = await pantriesDb.find({}).sort({ name: 1 });
    res.json(rows);
  });

  app.get("/api/pantries/:id", async (req, res) => {
    const pantry = await pantriesDb.findOne({ id: req.params.id });
    if (!pantry) return res.status(404).json({ error: "not_found" });
    res.json(pantry);
  });

  app.get("/api/recipes", async (_req, res) => {
    const rows = await recipesDb.find({}).sort({ title: 1 });
    res.json(rows);
  });

  app.get("/api/recipes/:id", async (req, res) => {
    const recipe = await recipesDb.findOne({ id: req.params.id });
    if (!recipe) return res.status(404).json({ error: "not_found" });
    res.json(recipe);
  });

  app.post("/api/recipes", requireAdmin, async (req, res) => {
    const recipe = req.body;
    if (!recipe || typeof recipe.id !== "string" || !recipe.id.trim()) {
      return res.status(400).json({ error: "id_required" });
    }

    const existing = await recipesDb.findOne({ id: recipe.id });
    if (existing) return res.status(409).json({ error: "id_exists" });

    const inserted = await recipesDb.insert(recipe);
    res.status(201).json(inserted);
  });

  app.put("/api/recipes/:id", requireAdmin, async (req, res) => {
    const id = req.params.id;
    const recipe = req.body;
    if (!recipe || recipe.id !== id) return res.status(400).json({ error: "id_mismatch" });

    const updatedCount = await recipesDb.update({ id }, recipe, { returnUpdatedDocs: false });
    if (!updatedCount) return res.status(404).json({ error: "not_found" });
    const updated = await recipesDb.findOne({ id });
    res.json(updated);
  });

  app.delete("/api/recipes/:id", requireAdmin, async (req, res) => {
    const removed = await recipesDb.remove({ id: req.params.id }, { multi: false });
    if (!removed) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  });

  app.post("/api/pantries", requireAdmin, async (req, res) => {
    const pantry = req.body;
    if (!pantry || typeof pantry.id !== "string" || !pantry.id.trim()) {
      return res.status(400).json({ error: "id_required" });
    }

    const existing = await pantriesDb.findOne({ id: pantry.id });
    if (existing) return res.status(409).json({ error: "id_exists" });

    const inserted = await pantriesDb.insert(pantry);
    res.status(201).json(inserted);
  });

  app.put("/api/pantries/:id", requireAdmin, async (req, res) => {
    const id = req.params.id;
    const pantry = req.body;
    if (!pantry || pantry.id !== id) return res.status(400).json({ error: "id_mismatch" });

    const updatedCount = await pantriesDb.update({ id }, pantry, { returnUpdatedDocs: false });
    if (!updatedCount) return res.status(404).json({ error: "not_found" });
    const updated = await pantriesDb.findOne({ id });
    res.json(updated);
  });

  app.delete("/api/pantries/:id", requireAdmin, async (req, res) => {
    const removed = await pantriesDb.remove({ id: req.params.id }, { multi: false });
    if (!removed) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  });

  app.get("/api/admin/status", (req, res) => {
    res.json({ adminConfigured: Boolean(normalizeToken(ADMIN_TOKEN)) });
  });

  app.get("/api/admin/token-check", requireAdmin, (req, res) => {
    res.json({ ok: true });
  });

  app.use(express.static(path.resolve(__dirname)));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
