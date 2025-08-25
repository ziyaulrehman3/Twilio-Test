import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

import { ApiCalling } from "./streamComp.js";

io.on("connection", (socket) => {
  socket.emit("getResponse", "Hellow to Socket.io");

  socket.on("hello", (data) => {
    console.log("Hello:", data);
  });

  socket.on("query", async (data) => {
    try {
      const response = await ApiCalling(data, null, socket);

      // console.log("Main Resp:", response);
    } catch (err) {
      console.log(err);
    }
  });
});

app.get("/query", async (req, res) => {
  const { query, threadId } = req.query;

  try {
    const response = await ApiCalling(query, threadId);
    console.log("Main Resp:", response);
  } catch (err) {
    console.log(err);
  }
});

server.listen("3002", () => {
  console.log("Server is running on port 3002");
});
