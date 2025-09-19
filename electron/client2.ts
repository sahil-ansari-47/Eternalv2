import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:3000");

// Register user
socket.emit("register", "Cock");

// // Join multiple rooms
socket.emit("joinRoom", {
  room: "Fucking",
  roomId: "68cda15e2d5139917e756556",
});
// // socket.emit("joinRoom", "Room2");

// // Listen for private messages
// socket.on("privateMessage", (msg: { from: string; text: string }) => {
//   console.log(`💌 Private from ${msg.from}: ${msg.text}`);
// });

// // Listen for group/room messages
socket.on(
  "roomMessage",
  (msg: { id: string; room: string; roomId: string; from: string; text: string; timestamp: Date }) => {
    console.log(`👥 [${msg.room}] ${msg.from}: ${msg.text} ${msg.timestamp}`);
  }
);

// const message={
//     id: crypto.randomUUID(),
//     room: "Fucking",
//     roomId: "68cda15e2d5139917e756556",
//     text: "Hey Pussy",
//     from: "Cock",
//     timestamp: new Date(),
// }
// setTimeout(() => {
//   socket.emit("roomMessage", message);
// }, 2000);

// // Send a message to Room1
// setTimeout(() => {
//   socket.emit("roomMessage", { room: "Room1", text: "Hello Room1 🚀" });
// }, 2000);

// // Send a message to Room2
// setTimeout(() => {
//   socket.emit("roomMessage", { room: "Room2", text: "Hello Room2 🎉" });
// }, 6000);
