import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Input } from "./ui/input";
import { ChevronLeft } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
const socket = io("http://localhost:3000");

type Message = {
  id: string;
  from: string;
  to?: string;
  text: string;
  timestamp: Date;
  room?: string;
  chatKey: string;
};
type FriendRequest = {
  from: string;
  date: string;
};

type Group = {
  room: string;
  roomId: string;
};

type UserData = {
  uid: string;
  username: string;
  avatar: string;
  friends?: string[];
  friendrequests?: FriendRequest[];
  groups?: Group[];
};

type ChatMode = "private" | "group";

const RightPanel = () => {
  const { isSignedIn, getToken } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("private");
  const [targetUser, setTargetUser] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [room, setRoom] = useState<Group | null>(null); // for group chat
  const [inChat, setInChat] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  const [CreateGroup, setCreateGroup] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const fetchUser = async () => {
    if (isSignedIn) {
      const token = await getToken();
      const res = await fetch("http://localhost:3000/api/users/me", {
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
  useEffect(() => {
    fetchUser().catch((err) => console.error("Failed to sync user:", err));
  }, [isSignedIn, getToken, chatMode]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        let res;
        if (targetUser) {
          console.log(userData?.username, targetUser);
          res = await fetch(
            `http://localhost:3000/api/pvtmessages?from=${userData?.username}&to=${targetUser}`
          );
        } else if (room) {
          res = await fetch(
            `http://localhost:3000/api/roommessages?room=${room?.room}&roomId=${room?.roomId}`
          );
        } else {
          return;
        }
        const history = await res.json();
        const msg = history.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        console.log(msg);
        setMessages(msg);
        console.log(messages);
        // setTimeout(() => {
        //   currRef.current?.scrollIntoView({ behavior: "smooth" });
        // }, 0);
      } catch (err) {
        console.error("❌ Failed to fetch messages from Redis:", err);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [targetUser, room]);
  const fetchOlder = async () => {
    if (!messages.length) return;
    setLoadingMore(true);

    const oldest = new Date(messages[0].timestamp).toISOString();
    console.log("fetching older", oldest, messages[0]);
    const res = await fetch(
      `http://localhost:3000/api/pvtmessages/history?from=${userData?.username}&to=${targetUser}&before=${oldest}`
    );
    const data = await res.json();
    console.log(data);
    for (const message of data) {
      message.timestamp = new Date(message.timestamp);
    }
    console.log(data);
    const prevHeight = chatRef.current?.scrollHeight || 0;
    setMessages((prev) => [...data, ...prev]);
    setTimeout(() => {
      if (chatRef.current) {
        const newHeight = chatRef.current.scrollHeight;
        chatRef.current.scrollTop = newHeight - prevHeight;
      }
    }, 0);

    setLoadingMore(false);
  };

  // detect scroll top
  const handleScroll = () => {
    if (!chatRef.current || loadingMore) return;
    if (chatRef.current.scrollTop <= 0) {
      fetchOlder();
    }
  };

  useEffect(() => {
    // Register current user
    if (isSignedIn && userData?.username) {
      socket.emit("register", userData?.username);
      if (userData?.groups) {
        for (const group of userData?.groups) {
          socket.emit("joinRoom", group);
        }
      }
    } else {
      return;
    }

    // Listen for private messages
    socket.on(
      "privateMessage",
      (msg: {
        id: string;
        from: string;
        text: string;
        to: string;
        timestamp: Date;
        chatKey: string;
      }) => {
        msg.timestamp = new Date(msg.timestamp);  
        setMessages((prev) => [...prev, msg]);
      }
    );

    // Listen for room messages
    socket.on(
      "roomMessage",
      (msg: {
        id: string;
        from: string;
        text: string;
        chatKey: string;
        timestamp: Date;
        room: string;
      }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            // from: `${msg.from}@${msg.room}`,
            from: msg.from,
            text: msg.text,
            room: msg.room,
            timestamp: new Date(),
            chatKey: msg.chatKey,
          },
        ]);
      }
    );

    return () => {
      socket.off("privateMessage");
      socket.off("roomMessage");
    };
  }, [userData?.username]);

  function formatToIST(date: Date): string {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  const sendMessage = () => {
    if (!userData) return;
    if (!input.trim()) return;
    if (targetUser) {
      const chatKey = `chat:${[userData.username, targetUser]
        .sort()
        .join(":")}`;
      const message = {
        id: crypto.randomUUID(),
        to: targetUser,
        text: input,
        from: userData.username,
        timestamp: new Date(),
        chatKey,
      };
      socket.emit("privateMessage", message);
      setMessages((prev) => [...prev, message]);
    } else if (room) {
      const chatKey = `${room.room}:${room.roomId}`;
      const message = {
        id: crypto.randomUUID(),
        room: room.room,
        text: input,
        from: userData.username,
        timestamp: new Date(),
        chatKey,
        roomId: room.roomId,
      };
      console.log("sending...");
      socket.emit("roomMessage", message);
      setMessages((prev) => [...prev, message]);
    } else {
      return;
    }
    // if (!chatRef.current) return;
    // console.log(chatRef.current.scrollHeight);
    // if(currRef.current) currRef.current.scrollIntoView({ behavior: "smooth" });
    // chatRef.current.scrollTop = chatRef.current.scrollHeight;
    // console.log(chatRef.current.scrollHeight);
    setInput("");
  };

  const handleAddFriend = async (searchUser: string) => {
    if (!userData?.username) return;
    if (searchUser === userData.username)
      return console.log("You can't add yourself!");
    if (userData.friends?.includes(searchUser))
      return console.log("Already friends!");
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:3000/api/friends/add", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: userData.username,
          to: searchUser,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      console.log(`Friend request sent to ${data.to}`);
    } catch (err) {
      console.log("Error sending friend request:", err);
    }
  };

  const handleFriendRequest = async (from: string, accept: boolean) => {
    if (!userData?.username) return;
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:3000/api/friends/handle", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from,
          to: userData.username,
          accept,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log("Error", err);
    }
  };
  const handleCreateGroup = async () => {
    if (!userData) return;
    if (!groupName.trim()) {
      console.log("Group name cannot be empty");
      return;
    }
    if (selectedFriends.length === 0) {
      console.log("Select at least one friend");
      return;
    }
    socket.emit("createRoom", {
      room: groupName,
      roomId: crypto.randomUUID(),
      participants: [userData.username, ...selectedFriends],
    });
    setCreateGroup(false);
    setSelectedFriends([]);
    setGroupName("");
    fetchUser();
  };

  return (
    <div className="h-[calc(100vh-52px)] w-1/3 grow-0 flex flex-col bg-primary-sidebar text-white">
      {/* Messages */}
      <SignedIn>
        {!inChat && (
          <div className="flex w-full h-full divide-x divide-neutral-300">
            <div className="h-full w-1/3 flex flex-col">
              <div
                className="border-b border-neutral-300 py-2 cursor-pointer"
                onClick={() => setChatMode("private")}
              >
                Private
              </div>
              <div
                className="border-b border-neutral-300 py-2 cursor-pointer"
                onClick={() => setChatMode("group")}
              >
                Group
              </div>
              <div>{userData?.username ?? "Guest"}</div>
            </div>
            <div className="h-full w-2/3 flex flex-col">
              {chatMode === "private" ? (
                <>
                  <Input
                    id="search"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Search for a user"
                  />
                  <button
                    disabled={!searchUser.trim()}
                    className={`p-2 m-2 rounded ${
                      searchUser.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                    onClick={() => handleAddFriend(searchUser)}
                  >
                    Add Friend
                  </button>
                  {userData?.friends &&
                    userData?.friendrequests?.length !== 0 && (
                      <div className="text-center p-2">Friend requests</div>
                    )}
                  {userData?.friendrequests?.map((friendrequest) => (
                    <div
                      key={friendrequest.date}
                      className="text-center p-2 cursor-pointer flex flex-col"
                    >
                      <div>{friendrequest.from}</div>
                      <div>{friendrequest.date}</div>
                      <button
                        className="bg-green-500 cursor-pointer"
                        onClick={() => {
                          handleFriendRequest(friendrequest.from, true);
                          fetchUser();
                        }}
                      >
                        Accept
                      </button>
                      <button
                        className="bg-red-500 cursor-pointer"
                        onClick={() => {
                          handleFriendRequest(friendrequest.from, false);
                          fetchUser();
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  ))}
                  {userData?.friends?.map((friend) => (
                    <div
                      key={friend}
                      className="text-center p-2 cursor-pointer"
                      onClick={() => {
                        setInChat(true);
                        setTargetUser(friend);
                      }}
                    >
                      {friend}
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    className="text-center rounded-lg p-2 m-2 text-white bg-blue-600 cursor-pointer"
                    onClick={() => setCreateGroup(true)}
                  >
                    Create New Group
                  </button>
                  {CreateGroup && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="p-6 rounded-xl w-96 shadow-lg flex flex-col gap-4 border-2 border-neutral-300">
                        <h2 className="text-lg font-semibold text-center">
                          Create Group
                        </h2>
                        {/* Group Name Input */}
                        <input
                          type="text"
                          placeholder="Group name"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="border rounded-lg p-2 w-full"
                        />
                        {/* Friend List with Multi Select */}
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {userData?.friends?.map((friend: string) => (
                            <label
                              key={friend}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFriends.includes(friend)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFriends((prev) => [
                                      ...prev,
                                      friend,
                                    ]);
                                  } else {
                                    setSelectedFriends((prev) =>
                                      prev.filter((f) => f !== friend)
                                    );
                                  }
                                }}
                              />
                              {friend}
                            </label>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center gap-4">
                          <button
                            className="bg-gray-400 text-white px-3 py-1 rounded-lg"
                            onClick={() => {
                              setCreateGroup(false);
                              setSelectedFriends([]);
                              setGroupName("");
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg"
                            onClick={() => {
                              handleCreateGroup();
                            }}
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {(userData?.groups?.length === 0 ||
                    userData?.groups === undefined) && (
                    <div className="text-center">
                      You have no groups currently
                    </div>
                  )}
                  {userData?.groups?.map((group) => (
                    <div
                      key={group.roomId}
                      className="text-center p-2 cursor-pointer"
                      onClick={() => {
                        setInChat(true);
                        console.log(group);
                        setRoom(group);
                      }}
                    >
                      {group.room}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {inChat && (
          <div className="h-full">
            <div className="flex h-1/12 gap-2 border-b border-neutral-300 p-4">
              <ChevronLeft
                className="translate-y-0.5 cursor-pointer"
                onClick={() => {
                  setInChat(false);
                  setTargetUser("");
                  setRoom(null);
                }}
              />
              {targetUser || room?.room}
            </div>
            <div
              ref={chatRef}
              onScroll={handleScroll}
              className="overflow-y-scroll h-10/12 pb-1 flex flex-col gap-2"
            >
              {messages.length === 0 ? (
                <div className="text-center">
                  No messages. Start a conversation.
                </div>
              ) : (
                messages
                  .filter(
                    (msg) =>
                      msg.chatKey === `${room?.room}:${room?.roomId}` ||
                      msg.chatKey ===
                        `chat:${[userData?.username, targetUser]
                          .sort()
                          .join(":")}`
                  )
                  .map((msg, idx) => (
                    <div
                      ref={idx === messages.length - 1 ? currRef : null}
                      key={msg.id}
                      className={`flex px-4 ${
                        msg.from === userData?.username
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-2xl max-w-[70%] ${
                          msg.from === userData?.username
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-700 text-gray-100 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                        <span className="block text-xs text-gray-400 text-right">
                          {formatToIST(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="p-3 h-1/12 border-t border-gray-800 flex gap-2">
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
            </div>
          </div>
        )}
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
