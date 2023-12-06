import mysql from "mysql";
import express from "express";
import { dirname } from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Create a connection pool without connection limit
const pool = mysql.createPool({
  // No connection limit
  // connectionLimit: 10, 

  // Your other configuration options
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

// Middleware to release the connection back to the pool after each request
app.use((req, res, next) => {
  if (req.mysqlConnection) {
    req.mysqlConnection.release((err) => {
      if (err) {
        console.error('Error releasing MySQL connection:', err);
      } else {
        console.log('MySQL connection released successfully');
      }
    });
  }
  next();
});

// Update the app.listen method
const port = process.env.PORT || 9002;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("Done");
});
