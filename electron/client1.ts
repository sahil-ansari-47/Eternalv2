import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:3000");

// Register user
socket.emit("register", "Pussy");
const obj = {
  room: "Fucking",
//   roomId: "1234",
  participants: ["Pussy", "Cock"],
};
socket.emit("createRoom", obj);

// Join multiple rooms
socket.emit("joinRoom", { room: "Fucking", roomId: "68cda15e2d5139917e756556" });
// socket.emit("joinRoom", "Room2");

// Listen for private messages
// socket.on("privateMessage", (msg: { from: string; text: string }) => {
//   console.log(`💌 Private from ${msg.from}: ${msg.text}`);
// });

// Listen for group/room messages
// socket.on(
//   "roomMessage",
//   (msg: { from: string; text: string; room: string }) => {
//     console.log(`👥 [${msg.room}] ${msg.from}: ${msg.text}`);
//   }
// );

// Send a private message
// setTimeout(() => {
//   socket.emit("privateMessage", { to: "Sahil", text: "Hey Pussy👋" });
// }, 2000);

const message={
    id: crypto.randomUUID(),
    room: "Fucking",
    roomId: "68cda15e2d5139917e756556",
    text: "Hey Cock",
    from: "Pussy",
    timestamp: new Date(),
}
// Send a message to Room1
setTimeout(() => {
  socket.emit("roomMessage", message);
}, 1000);

// Send a message to Room2
// setTimeout(() => {
//   socket.emit("roomMessage", { room: "Room2", text: "Hello Room2 🎉" });
// }, 6000);
