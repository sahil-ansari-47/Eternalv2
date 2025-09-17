import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Input } from "./ui/input";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
const socket = io("http://localhost:3000");

type Message = {
  id: number;
  from: string;
  to?: string;
  text: string;
  room?: string;
};
type UserData = { username: string; };

type ChatMode = "private" | "group";

const RightPanel = () => {
  const { isSignedIn, getToken } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username] = useState("Guest"); // TODO: replace with login
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);
  const [targetUser] = useState("Sahil"); // Example for private chat
  const [room, setRoom] = useState<string>(""); // for group chat

  useEffect(() => {
    const fetchUser = async () => {
      if (isSignedIn) {
        const token = await getToken();
        const res = await fetch("http://localhost:3000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 send token
          },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error: ${res.status} - ${text}`);
        }
        const data = await res.json();
        setUserData(data.user);
      }
    };
    fetchUser().catch((err) => console.error("Failed to sync user:", err));
  }, [isSignedIn, getToken]);

  useEffect(() => {
    // Register current user
    socket.emit("register", username);

    // Listen for private messages
    socket.on("privateMessage", (msg: { from: string; text: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: msg.from, text: msg.text },
      ]);
    });

    // Listen for room messages
    socket.on(
      "roomMessage",
      (msg: { from: string; text: string; room: string }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            from: `${msg.from}@${msg.room}`,
            text: msg.text,
            room: msg.room,
          },
        ]);
      }
    );

    return () => {
      socket.off("privateMessage");
      socket.off("roomMessage");
    };
  }, [username]);

  const sendMessage = () => {
    if (!input.trim()) return;

    // Send private message
    socket.emit("privateMessage", { to: targetUser, text: input });

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "you", text: input },
    ]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-52px)] w-1/3 grow-0 flex flex-col bg-primary-sidebar text-white">
      {/* Messages */}
      <SignedIn>
        <div className="flex w-full h-full divide-x divide-neutral-300">
          <div className="h-full w-1/3 flex flex-col">
            <div
              className="border-b border-neutral-300 py-2"
              onClick={() => setChatMode("private")}
            >
              Private
            </div>
            <div
              className="border-b border-neutral-300 py-2"
              onClick={() => setChatMode("group")}
            >
              Group
            </div>
            <div>{userData?.username ?? "Guest"}</div>
          </div>
          <div className="h-full w-2/3 flex flex-col">
            {chatMode === "private" ? (
              <>
                <Input placeholder="Search for a user" />
                <div className="text-center p-2">Sahil</div>
                <div className="text-center p-2">Sandy</div>
                <div className="text-center p-2">Shivanjan</div>
              </>
            ) : (
              <>
                <div>Groups</div>
              </>
            )}
          </div>
        </div>
        {/* <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "you" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-2xl max-w-[70%] ${
                  msg.sender === "you"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-700 text-gray-100 rounded-bl-none"
                }`}
              >
                <span className="block text-xs text-gray-400">
                  {msg.sender}
                </span>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-800 flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 text-sm"
          >
            Send
          </button>
        </div> */}
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col h-full gap-4 justify-center items-center">
          <SignInButton
            mode="modal"
            className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500"
          />
          <p className="text-sm text-gray-400">
            Sign in to chat with other users
          </p>
        </div>
      </SignedOut>
    </div>
  );
};

export default RightPanel;
