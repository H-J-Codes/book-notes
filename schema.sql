-- This creates our books table with all the info we need to track
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    notes TEXT,
    rating INTEGER,
    date_read DATE
);