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

let users = [];
io.on("connection", (socket) => {
  console.log("Client is Connect with Sokcet Id:", socket.id);
  users.push(socket.id);

  socket.on("msgToServer", (data) => {
    console.log(`Recives msg from ${socket.id} Client:`, data[0]);
    io.to(data[1]).emit("recive_msg", data[0]);
  });

  socket.emit("recive_msg", "Welcome to real time connection");

  io.emit("userList", users);

  socket.on("disconnect", () => {
    console.log("Client is Disconnected with Sokcet Id:", socket.id);
    users = users.filter((id) => id !== socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server is Running on Port 3000 helloo");
});
