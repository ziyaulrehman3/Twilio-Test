import dotenv from "dotenv";
dotenv.config();
import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello from Server");
});

app.listen(PORT, (req, res) => {
  console.log("Server is running on port " + PORT);
});
