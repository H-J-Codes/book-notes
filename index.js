// This loads our secret values from the .env file
import "dotenv/config";

// We bring in Express, pg, etc as before
import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Now we read our connection details from .env instead of writing them directly here
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

// Homepage - shows all books, with optional sorting
app.get("/", async (req, res) => {
  try {
    const sortBy = req.query.sortBy || "title";
    const allowedSorts = ["title", "rating", "date_read"];
    const sortColumn = allowedSorts.includes(sortBy) ? sortBy : "title";
    const sortDirection = sortColumn === "title" ? "ASC" : "DESC";

    const result = await db.query(
      `SELECT * FROM books ORDER BY ${sortColumn} ${sortDirection}`,
    );
    const books = result.rows;

    res.render("index.ejs", { books: books, bookCount: books.length });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).render("error.ejs", {
      message:
        "We couldn't load your books right now. Please try again in a moment.",
    });
  }
});

// Shows the "Add a Book" form page
app.get("/add", (req, res) => {
  res.render("add.ejs");
});

// Shows the edit form for ONE specific book
app.get("/edit/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [
      bookId,
    ]);
    const book = result.rows[0];

    // NEW: what if someone visits /edit/999 and no book with that id exists?
    if (!book) {
      return res.status(404).render("error.ejs", {
        message:
          "We couldn't find that book. It may have already been deleted.",
      });
    }

    res.render("edit.ejs", { book: book });
  } catch (err) {
    console.error("Error fetching book to edit:", err);
    res.status(500).render("error.ejs", {
      message: "We couldn't load this book's info right now. Please try again.",
    });
  }
});

// Saves a new book into the database
app.post("/add", async (req, res) => {
  const { title, author, isbn, notes, rating, date_read } = req.body;

  // NEW: basic validation before we even touch the database
  if (!title || !author) {
    return res.status(400).render("error.ejs", {
      message: "Please fill in at least the title and author before saving.",
    });
  }

  // NEW: make sure rating is actually between 1 and 5 if provided
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).render("error.ejs", {
      message: "Rating must be between 1 and 5.",
    });
  }

  try {
    await db.query(
      "INSERT INTO books (title, author, isbn, notes, rating, date_read) VALUES ($1, $2, $3, $4, $5, $6)",
      [title, author, isbn, notes, rating, date_read],
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).render("error.ejs", {
      message: "We couldn't save your book right now. Please try again.",
    });
  }
});

// Updates an existing book
app.post("/edit/:id", async (req, res) => {
  const bookId = req.params.id;
  const { title, author, isbn, notes, rating, date_read } = req.body;

  if (!title || !author) {
    return res.status(400).render("error.ejs", {
      message: "Please fill in at least the title and author before saving.",
    });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).render("error.ejs", {
      message: "Rating must be between 1 and 5.",
    });
  }

  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, isbn = $3, notes = $4, rating = $5, date_read = $6 WHERE id = $7",
      [title, author, isbn, notes, rating, date_read, bookId],
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).render("error.ejs", {
      message: "We couldn't update your book right now. Please try again.",
    });
  }
});

// Deletes a book
app.post("/delete/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    await db.query("DELETE FROM books WHERE id = $1", [bookId]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).render("error.ejs", {
      message: "We couldn't delete this book right now. Please try again.",
    });
  }
});

// Fetches a book cover image from Open Library, with a fallback if none exists
app.get("/cover/:isbn", async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(
      `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`,
      { responseType: "arraybuffer" },
    );
    res.set("Content-Type", "image/jpeg");
    res.send(response.data);
  } catch (err) {
    console.error("No cover found for ISBN:", isbn);
    res.set("Content-Type", "image/svg+xml");
    res.send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
        <rect width="100%" height="100%" fill="#ddd"/>
        <text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#555">No Cover</text>
      </svg>
    `);
  }
});

// NEW: catch-all for any URL that doesn't match anything above (a proper 404 page)
app.use((req, res) => {
  res.status(404).render("error.ejs", {
    message: "We couldn't find that page.",
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
