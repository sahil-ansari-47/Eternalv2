import { createServer } from "http";
import express from "express";
import { UserModel } from "./models/User.js";
import { Server, Socket } from "socket.io";
import { generateId } from "./generateid.js";
import cors from "cors";
import { connectToDatabase } from "./db.js";
import {
  clerkMiddleware,
  clerkClient,
  requireAuth,
  getAuth,
} from "@clerk/express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});
app.use(clerkMiddleware());
const httpServer = createServer(app);

interface User {
  id: string;
  username: string;
}

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Map usernames to socket IDs
const users: Record<string, string> = {}; // username -> socketId
const sockets: Record<string, User> = {}; // socketId -> User

io.on("connection", (socket: Socket) => {
  console.log("🔗 User connected:", socket.id);

  // Register a user with a username
  socket.on("register", (username: string) => {
    users[username] = socket.id;
    sockets[socket.id] = { id: generateId(), username };
    console.log(`${username} registered with id ${socket.id}`);
  });

  // ✅ One-to-One Messaging
  socket.on("privateMessage", ({ to, text }: { to: string; text: string }) => {
    const fromUser = sockets[socket.id];
    const toSocketId = users[to]; // lookup by username

    if (fromUser && toSocketId) {
      io.to(toSocketId).emit("privateMessage", {
        from: fromUser.username,
        text,
      });
      console.log(`💌 ${fromUser.username} -> ${to}: ${text}`);
    }
  });

  // ✅ Join Room
  socket.on("joinRoom", (room: string) => {
    socket.join(room);
    const username = sockets[socket.id]?.username ?? "Unknown";
    console.log(`${username} joined room: ${room}`);

    io.to(room).emit("roomMessage", {
      from: "system",
      text: `${username} joined the room.`,
      room,
    });
  });

  // ✅ Room/Group Messaging
  socket.on("roomMessage", ({ room, text }: { room: string; text: string }) => {
    const fromUser = sockets[socket.id];
    if (fromUser) {
      io.to(room).emit("roomMessage", {
        from: fromUser.username,
        text,
        room,
      });
      console.log(`👥 [${room}] ${fromUser.username}: ${text}`);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const user = sockets[socket.id];
    if (user) {
      console.log(`${user.username} disconnected`);
      delete users[user.username];
      delete sockets[socket.id];
    }
  });
});

const syncUser = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    // console.log("Auth payload:", getAuth(req));
    console.log("Syncing user...");
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await clerkClient.users.getUser(userId);
    await UserModel.findOneAndUpdate(
      { uid: user.id },
      {
        username: user.username || user.firstName,
        avatar: user.imageUrl,
      },
      { upsert: true, new: true }
    );
    (req as any).user = user;
    next();
  } catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: "Failed to sync user" });
  }
};

app.get("/api/users", requireAuth(), syncUser, (req, res) => {
  res.json({ user: (req as any).user });
});

app.get("/api", async (req, res) => {
  return res.status(200).json({ message: "Health Check" });
});

httpServer.listen(3000, async () => {
  await connectToDatabase("mongodb+srv://sahil_ansari_47:Codename%4047@cluster0.2wo5v83.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
  console.log("🚀 Socket.IO server running on port 3000");
});
