import mysql from "mysql";
import express from "express";
import { dirname } from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(bodyParser.urlencoded({extended:true}));

// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 10, // Adjust as needed
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  connectTimeout: 20000, // Adjust as needed (in milliseconds)
});

// Middleware to acquire a connection from the pool for each request
app.use((req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Attach the connection to the request for use in route handlers
    req.mysqlConnection = connection;

    // Pass control to the next middleware or route handler
    next();
  });
});

// Handle routes
app.get("/", (req, res) => {
  req.mysqlConnection.query('SELECT roll_number, name, status FROM students', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.render("index.ejs", { results });
  });
});

app.post("/submit", (req, res) => {
  const statusUpdates = req.body;
  Object.entries(statusUpdates).forEach(([name, status]) => {
    const query = `UPDATE students SET status = ? WHERE name = ?`;
    req.mysqlConnection.query(query, [status, name], (err, results) => {
      if (err) {
        console.error('Error updating database:', err);
        return res.status(500).send('Internal Server Error');
      }
    });
  });
  res.redirect("/");
});

app.use((req, res, next) => {
  if (req.mysqlConnection) {
    req.mysqlConnection.release();
  }
  next();
});

app.listen(process.env.port || 9002, () => {
  console.log(`Listening on port 3000`);
});
