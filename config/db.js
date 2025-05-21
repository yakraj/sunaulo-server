const knex = require("knex");
let db;
try {
  db = knex({
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
  });
} catch (err) {
  console.error("Knex initialization error:", err);
}

module.exports = db;
