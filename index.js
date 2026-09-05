// We bring in the Express toolkit so we can build our web server
import express from "express";

// We bring in "pg" so our app can talk to our PostgreSQL database
import pg from "pg";

// We create our app - think of this as our actual website/server
const app = express();

// We choose which "door number" (port) our server listens on
const port = 3000;

// Here we set up the connection details for our database
// Think of this like writing down the address and key to unlock our filing cabinet
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "Mypassword", // put the password you set during Postgres install
  port: 5432,
});

// This actually opens the connection to our database
db.connect();

// This says: "when someone visits the homepage (/), send back this message"
app.get("/", (req, res) => {
  res.send("Hello! My Book Notes app is working!");
});

// This starts our server and makes it listen for visitors
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
