// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
  id,
  title,
  amount::float AS amount,
  category,
  TO_CHAR(date, 'YYYY-MM-DD') AS date
FROM expenses
ORDER BY id;
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
  }
});

app.get("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(404).json({
      message: "Expense not found ! enter a number",
    });
  }
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        amount::float AS amount,
        category,
        TO_CHAR(date, 'YYYY-MM-DD') AS date
      FROM expenses
      WHERE id = $1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not foundd",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error", // improvment
    });
  }
});
const allowedCategories = [
    "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Other",
  ];
app.post("/api/expenses", async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      message: "Title is required",
    });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a number greater than 0",
    });
  }

  

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      message: "Invalid category",
    });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // validate date ()
    return res.status(400).json({
      message: "Date must be in YYYY-MM-DD format",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO expenses (title, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        title,
        amount::float AS amount,
        category,
        TO_CHAR(date, 'YYYY-MM-DD') AS date;
      `,
      [title.trim(), amount, category, date],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error",
    });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  // Check ID
  if (!/^\d+$/.test(id)) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  // Validate title
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      message: "Title is required",
    });
  }

  // Validate amount
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a number greater than 0",
    });
  }

  // Validate category
  

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      message: "Invalid category",
    });
  }

  // Validate date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      message: "Date must be in YYYY-MM-DD format",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE expenses
      SET
        title = $1,
        amount = $2,
        category = $3,
        date = $4
      WHERE id = $5
      RETURNING
        id,
        title,
        amount::float AS amount,
        category,
        TO_CHAR(date, 'YYYY-MM-DD') AS date;
      `,
      [title.trim(), amount, category, date, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error",
    });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM expenses
      WHERE id = $1
      RETURNING
        id,
        title,
        amount::float AS amount,
        category,
        TO_CHAR(date, 'YYYY-MM-DD') AS date;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      
      message: "Database error",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
