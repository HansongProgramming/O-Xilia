import { Server } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    console.log("joined room", room);
    socket.to(room).emit("peer-joined");
  });

  socket.on("offer", (room, offer) => socket.to(room).emit("offer", offer));
  socket.on("answer", (room, answer) => socket.to(room).emit("answer", answer));
  socket.on("ice", (room, candidate) => socket.to(room).emit("ice", candidate));
});

server.listen(3001, () => console.log("signaling server running on 3001"));
