import { Server } from "socket.io";

const io = new Server(3001, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
    socket.to(room).emit("peer-joined");
  });

  socket.on("offer", (room, offer) => {
    socket.to(room).emit("offer", offer);
  });

  socket.on("answer", (room, answer) => {
    socket.to(room).emit("answer", answer);
  });

  socket.on("ice", (room, candidate) => {
    socket.to(room).emit("ice", candidate);
  });
});
