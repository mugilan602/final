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

// MySQL connection configuration
const dbConfig = {
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  connectTimeout: 20000, // Adjust as needed (in milliseconds)
};

// Middleware to acquire a connection for each request
app.use((req, res, next) => {
  const connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
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

  // Close the connection after executing queries
  req.mysqlConnection.end();

  res.redirect("/");
});

// Update the app.listen method
const port = process.env.PORT || 9002;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("Done");
});
