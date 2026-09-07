// We bring in the Express toolkit so we can build our web server
import express from "express";

// We bring in "pg" so our app can talk to our PostgreSQL database
import pg from "pg";

// This lets us read data sent from HTML forms
import bodyParser from "body-parser";

// We bring in Axios so our server can fetch data from other websites/APIs
import axios from "axios";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

// This tells Express: "understand form data sent from the browser"
app.use(bodyParser.urlencoded({ extended: true }));
// This tells Express: "anything inside the public folder can be accessed directly by the browser"
app.use(express.static("public"));

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
    // req.query holds anything after the "?" in the URL, like ?sortBy=rating
    // If nothing was specified, we default to sorting by title
    const sortBy = req.query.sortBy || "title";

    // We only allow these exact column names, to stay safe (never trust user input directly in SQL!)
    const allowedSorts = ["title", "rating", "date_read"];
    const sortColumn = allowedSorts.includes(sortBy) ? sortBy : "title";

    // Rating and date should show highest/most recent first, title should be alphabetical
    const sortDirection = sortColumn === "title" ? "ASC" : "DESC";

    const result = await db.query(
      `SELECT * FROM books ORDER BY ${sortColumn} ${sortDirection}`,
    );

    const books = result.rows;

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

// This shows the edit form for ONE specific book, pre-filled with its current data
app.get("/edit/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    // Find just the one book whose id matches what's in the URL
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    const book = result.rows[0];

    res.render("edit.ejs", { book: book });
  } catch (err) {
    console.error("Error fetching book to edit:", err);
    res.send("Something went wrong.");
  }
});

// This route asks the Open Library API for a book cover image, using its ISBN
app.get("/cover/:isbn", async (req, res) => {
  const isbn = req.params.isbn;

  try {
    // We ask Open Library for the cover image matching this ISBN
    // "?default=false" means: "if you don't have a real cover, tell us it failed instead of sending a blank image"
    const response = await axios.get(
      `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`,
      { responseType: "arraybuffer" } // this means "give me the raw image data"
    );

    // We tell the browser "this is a jpeg image" and send the picture back
    res.set("Content-Type", "image/jpeg");
    res.send(response.data);

  } catch (err) {
    // If Open Library doesn't have a cover for this ISBN, we end up here instead
    console.error("No cover found for ISBN:", isbn);

    // We build a simple grey placeholder image ourselves, so the page still looks okay
    res.set("Content-Type", "image/svg+xml");
    res.send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
        <rect width="100%" height="100%" fill="#ddd"/>
        <text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#555">No Cover</text>
      </svg>
    `);
  }
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
// This runs when the edit form is submitted - it updates the book in our database
app.post("/edit/:id", async (req, res) => {
  const bookId = req.params.id;
  const { title, author, isbn, notes, rating, date_read } = req.body;

  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, isbn = $3, notes = $4, rating = $5, date_read = $6 WHERE id = $7",
      [title, author, isbn, notes, rating, date_read, bookId]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.send("Something went wrong while updating your book.");
  }
});
// This runs when the Delete button is clicked - it removes the book from our database
app.post("/delete/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    // This SQL command removes the row that matches this specific id
    await db.query("DELETE FROM books WHERE id = $1", [bookId]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.send("Something went wrong while deleting your book.");
  }
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
