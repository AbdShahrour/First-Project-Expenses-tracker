-- Expense Tracker: database schema
-- Run this file once to create the table and add some sample data.
-- Running it again deletes the table and starts from the sample data.

DROP TABLE IF EXISTS expenses;

CREATE TABLE expenses (
  id       SERIAL PRIMARY KEY,
  title    VARCHAR(100)  NOT NULL CHECK (btrim(title) <> ''),
  amount   NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(20)   NOT NULL CHECK (category IN ('Food', 'Transport', 'Bills', 'Entertainment', 'Other')),
  date     DATE          NOT NULL
);

-- aaa