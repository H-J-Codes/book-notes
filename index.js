// We bring in the Express toolkit so we can build our web server
import express from "express";

// We bring in "pg" so our app can talk to our PostgreSQL database
import pg from "pg";

// This lets us read data sent from HTML forms
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

// This tells Express: "understand form data sent from the browser"
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "123456",
  port: 5432,
});

db.connect();

// Homepage - for now we still show a placeholder count
// When someone visits the homepage, get all books from the database and show them
app.get("/", async (req, res) => {
  try {
    // This asks Postgres: "give me every row from the books table"
    const result = await db.query("SELECT * FROM books");

    // result.rows is a list (array) of all the books we got back
    const books = result.rows;

    // We send this list of books to our EJS page to display
    res.render("index.ejs", { books: books, bookCount: books.length });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.send("Something went wrong while loading your books.");
  }
});
// This shows our "Add a Book" form page
app.get("/add", (req, res) => {
  res.render("add.ejs");
});

// This runs when the form is submitted - it saves the new book into our database
app.post("/add", async (req, res) => {
  // req.body holds everything the user typed into the form
  const { title, author, isbn, notes, rating, date_read } = req.body;

  try {
    // This is the actual SQL command that inserts a new row into our books table
    await db.query(
      "INSERT INTO books (title, author, isbn, notes, rating, date_read) VALUES ($1, $2, $3, $4, $5, $6)",
      [title, author, isbn, notes, rating, date_read],
    );
    // After saving, send the user back to the homepage
    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err);
    res.send("Something went wrong while adding your book.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
