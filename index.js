// We bring in the Express toolkit so we can build our web server
import express from "express";

// We bring in "pg" so our app can talk to our PostgreSQL database
import pg from "pg";

// We create our app - think of this as our actual website/server
const app = express();

// We choose which "door number" (port) our server listens on
const port = 3000;

// We tell Express to use EJS as our templating engine
app.set("view engine", "ejs");

// Here we set up the connection details for our database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "123456",
  port: 5432,
});

// This actually opens the connection to our database
db.connect();

// When someone visits the homepage, we render our index.ejs page
// and pass it some data to fill in the blanks
app.get("/", (req, res) => {
  res.render("index.ejs", { bookCount: 0 });
});

// This starts our server and makes it listen for visitors
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
