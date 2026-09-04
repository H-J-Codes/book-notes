// We bring in the Express toolkit so we can build our web server
import express from "express";

// We create our app - think of this as our actual website/server
const app = express();

// We choose which "door number" (port) our server listens on
const port = 3000;

// This says: "when someone visits the homepage (/), send back this message"
app.get("/", (req, res) => {
  res.send("Hello! My Book Notes app is working!");
});

// This starts our server and makes it listen for visitors
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
