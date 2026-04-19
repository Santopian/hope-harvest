const path = require("path");
const fs = require("fs/promises");

const Datastore = require("nedb-promises");

async function ensureSeeded(db, seedFile) {
  const count = await db.count({});
  if (count > 0) return;

  const seedPath = path.resolve(__dirname, "..", "seed", seedFile);
  const raw = await fs.readFile(seedPath, "utf8");
  const rows = JSON.parse(raw);
  if (Array.isArray(rows) && rows.length) {
    await db.insert(rows);
  }
}

async function getDb({ filename, seedFile, uniqueField }) {
  const dataDir = path.resolve(__dirname, "..", "data");
  await fs.mkdir(dataDir, { recursive: true });

  const db = Datastore.create({
    filename: path.resolve(dataDir, filename),
    autoload: true
  });

  if (uniqueField) await db.ensureIndex({ fieldName: uniqueField, unique: true });
  if (seedFile) await ensureSeeded(db, seedFile);
  return db;
}

async function getPantriesDb() {
  return getDb({ filename: "pantries.db", seedFile: "pantries.json", uniqueField: "id" });
}

async function getRecipesDb() {
  return getDb({ filename: "recipes.db", seedFile: "recipes.json", uniqueField: "id" });
}

module.exports = { getPantriesDb, getRecipesDb };
