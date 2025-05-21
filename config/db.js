const knex = require("knex");

// this is for supabase database

// let db;
// try {
//   db = knex({
//     client: "pg",
//     connection: {
//       connectionString: process.env.DATABASE_URL,
//       ssl: { rejectUnauthorized: false },
//     },
//   });
// } catch (err) {
//   console.error("Knex initialization error:", err);
// }

// this is for local database

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1", // or "localhost"
    user: "postgres",
    password: "yakraj123",
    database: "postgres",
    port: 5432,
  },
});

module.exports = db;
// module.exports = db;
