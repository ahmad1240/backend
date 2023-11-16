// const express = require("express");

import express from "express";
const app = express();

// app.get("/", (req, res) => {
//   res.send("Server is Ready");
// });

// get a list of  5 Jokes

app.get("/api/jokes", (req, res) => {
  const jokes = [
    { id: 1, title: "A Joke", content: "This is Joke 1" },
    { id: 2, title: "Another Joke", content: "This is Joke 2" },
    { id: 3, title: "Third Joke", content: "This is Joke 3" },
    { id: 4, title: "Fourth Joke", content: "This is Joke 4" },
    { id: 5, title: "Fifth Joke", content: "This is Joke 5" },
  ];

  res.send(jokes);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server at http://localhost:${port}`);
});
