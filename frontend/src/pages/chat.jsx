
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

function Chat() {
  const navigate = useNavigate();

  const [myProfile, setMyProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [requestCount, setRequestCount] = useState(0);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [friendTyping, setFriendTyping] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);

  const chatContainerRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging || !chatContainerRef.current) return;

      const container = chatContainerRef.current;
      const containerRect = container.getBoundingClientRect();

      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= 20 && newWidth <= 50) {
        setSidebarWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const profileRes = await fetch(
          "http://localhost:5000/api/profile/me",
          { headers }
        );

        const requestsRes = await fetch(
          "http://localhost:5000/api/users/requests/received",
          { headers }
        );

        const connectionsRes = await fetch(
          "http://localhost:5000/api/users/connections",
          { headers }
        );

        if (
          profileRes.status === 401 ||
          requestsRes.status === 401 ||
          connectionsRes.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("email");
          localStorage.removeItem("username");
          navigate("/login");
          return;
        }

        if (!profileRes.ok || !requestsRes.ok || !connectionsRes.ok) {
          throw new Error("Unable to load data");
        }

        const profileData = await profileRes.json();
        const requestsData = await requestsRes.json();
        const connectionsData = await connectionsRes.json();

        setMyProfile({
          ...profileData.user,
          _id: profileData.user.id,
        });

        setRequestCount(requestsData.requests.length);
        setConnections(connectionsData.connections);
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    };

    loadData();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    socket.auth = { token };
    socket.connect();

    const handleConnectError = (error) => {
      console.log("Socket error:", error.message);
    };

    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedFriend) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(
          `http://localhost:5000/api/messages/${selectedFriend._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        setMessages(data.messages);
      } catch (error) {
        console.log(error);
        setChatError(error.message);
      }
    };

    setMessages([]);
    setChatError("");
    loadMessages();
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend || !myProfile) return;

    const handleMessage = (message) => {
      const senderId = message.sender?._id || message.sender;
      const receiverId = message.receiver?._id || message.receiver;

      const myId = myProfile._id;
      const friendId = selectedFriend._id;

      if (
        (senderId === myId && receiverId === friendId) ||
        (senderId === friendId && receiverId === myId)
      ) {
        setMessages((oldMessages) => {
          const alreadyAdded = oldMessages.some(
            (item) => item._id === message._id
          );

          if (alreadyAdded) return oldMessages;

          return [...oldMessages, message];
        });
      }
    };

    socket.on("new_message", handleMessage);

    return () => {
      socket.off("new_message", handleMessage);
    };
  }, [selectedFriend, myProfile]);

  useEffect(() => {
    if (!selectedFriend) {
      setFriendTyping(false);
      return;
    }

    const handleTyping = (data) => {
      if (data.senderId === selectedFriend._id) {
        setFriendTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.senderId === selectedFriend._id) {
        setFriendTyping(false);
      }
    };

    socket.on("user_typing", handleTyping);
    socket.on("user_stopped_typing", handleStopTyping);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stopped_typing", handleStopTyping);
    };
  }, [selectedFriend]);

  const getPhoto = (picture) => {
    if (!picture) return "";

    return `http://localhost:5000${picture}`;
  };

  const filteredConnections = connections.filter((item) => {
    const friend = item.user;

    const name = friend.name || "";
    const username = friend.username || "";

    return `${name} ${username}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const handleTyping = (e) => {
    const text = e.target.value;

    setNewMessage(text);

    if (!selectedFriend || !socket.connected) return;

    if (!text.trim()) {
      clearTimeout(typingTimeout.current);

      socket.emit("stop_typing", {
        receiverId: selectedFriend._id,
      });

      return;
    }

    socket.emit("typing", {
      receiverId: selectedFriend._id,
    });

    clearTimeout(typingTimeout.current);

    const receiverId = selectedFriend._id;

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", {
        receiverId,
      });
    }, 1000);
  };

  const sendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (!socket.connected) {
      setChatError("Not connected. Please try again.");
      return;
    }

    clearTimeout(typingTimeout.current);

    socket.emit("stop_typing", {
      receiverId: selectedFriend._id,
    });

    socket.emit("send_message", {
      receiverId: selectedFriend._id,
      text: newMessage,
    });

    setNewMessage("");
    setChatError("");
  };

  useEffect(() => {
    const showError = (data) => {
      setChatError(data.message);
    };

    socket.on("message_error", showError);

    return () => {
      socket.off("message_error", showError);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#111B21] text-[#E9EDEF]">

      <aside className="flex w-[65px] shrink-0 flex-col items-center border-r border-[#2A3942] bg-[#202C33] py-5">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00A884] text-xl font-bold text-white">
          W
        </div>

        <button
          onClick={() => setSelectedFriend(null)}
          className="mt-8 rounded-xl p-3 text-[#00A884] hover:bg-[#2A3942]"
        >
          Chats
        </button>

        <button
          onClick={() => navigate("/find-people")}
          className="mt-4 rounded-xl p-3 text-[#00A884] hover:bg-[#2A3942]"
        >
          +
        </button>

        <button
          onClick={() => navigate("/connection-requests")}
          className="relative mt-4 rounded-xl p-3 text-[#00A884] hover:bg-[#2A3942]"
        >
          Requests

          {requestCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 text-xs text-white">
              {requestCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate("/my-profile")}
          className="mt-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#075E54] font-semibold"
        >
          {myProfile?.profilePicture ? (
            <img
              src={getPhoto(myProfile.profilePicture)}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            myProfile?.username?.charAt(0).toUpperCase() || "U"
          )}
        </button>

      </aside>

      <div
        ref={chatContainerRef}
        className={`flex flex-1 min-w-0 overflow-hidden ${
          isDragging ? "select-none cursor-col-resize" : ""
        }`}
      >

        <section
          className="flex shrink-0 flex-col overflow-hidden border-r border-[#2A3942] bg-[#202C33]"
          style={{ width: `${sidebarWidth}%` }}
        >

          <header className="flex h-[72px] shrink-0 items-center px-5">
            <h1 className="text-2xl font-semibold">Chats</h1>
          </header>

          <div className="shrink-0 px-4 pb-3">
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-[#2A3942] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto">

            {loading ? (
              <p className="p-6 text-center text-sm text-[#8696A0]">
                Loading chats...
              </p>
            ) : filteredConnections.length === 0 ? (
              <div className="px-6 py-12 text-center">

                <h3 className="font-semibold">No chats yet</h3>

                <p className="mt-2 text-sm text-[#8696A0]">
                  Find people and connect with them.
                </p>

                <button
                  onClick={() => navigate("/find-people")}
                  className="mt-5 rounded-lg bg-[#00A884] px-5 py-2 text-sm font-semibold text-white"
                >
                  Find People
                </button>

              </div>
            ) : (
              filteredConnections.map((item) => {
                const friend = item.user;

                return (
                  <button
                    key={item.requestId}
                    onClick={() => setSelectedFriend(friend)}
                    className={`flex w-full items-center gap-3 border-b border-[#2A3942] px-4 py-4 text-left hover:bg-[#2A3942] ${
                      selectedFriend?._id === friend._id
                        ? "bg-[#2A3942]"
                        : ""
                    }`}
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075E54] font-semibold">
                      {friend.profilePicture ? (
                        <img
                          src={getPhoto(friend.profilePicture)}
                          alt={friend.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        friend.username?.charAt(0).toUpperCase() ||
                        friend.name?.charAt(0).toUpperCase() ||
                        "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">
                        {friend.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-[#8696A0]">
                        @{friend.username || "user"}
                      </p>
                    </div>

                    <span className="hidden text-xs text-[#00A884] lg:inline">
                      Connected
                    </span>

                  </button>
                );
              })
            )}

          </div>
        </section>

        <div
          onPointerDown={() => setIsDragging(true)}
          className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-[#2A3942] hover:bg-[#00A884]"
          style={{ touchAction: "none" }}
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 -left-1 -right-1"></div>
        </div>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#111B21]">

          {selectedFriend ? (
            <>

              <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#2A3942] bg-[#202C33] px-6">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075E54]">
                  {selectedFriend.profilePicture ? (
                    <img
                      src={getPhoto(selectedFriend.profilePicture)}
                      alt={selectedFriend.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedFriend.username?.charAt(0).toUpperCase() ||
                    selectedFriend.name?.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    {selectedFriend.name}
                  </h2>

                  <p className="truncate text-xs text-[#8696A0]">
                    @{selectedFriend.username || "user"}
                  </p>
                </div>

              </header>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">

                {messages.length === 0 ? (
                  <div className="m-auto text-center">

                    <h2 className="text-xl font-semibold">
                      Start a conversation
                    </h2>

                    <p className="mt-2 text-sm text-[#8696A0]">
                      Send your first message to {selectedFriend.name}.
                    </p>

                  </div>
                ) : (
                  messages.map((message) => {
                    const senderId =
                      message.sender?._id || message.sender;

                    const isMine = senderId === myProfile?._id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] break-words rounded-xl px-4 py-3 ${
                            isMine ? "bg-[#005C4B]" : "bg-[#202C33]"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}

                {chatError && (
                  <p className="text-center text-sm text-red-400">
                    {chatError}
                  </p>
                )}

              </div>

              {friendTyping && (
                <p className="shrink-0 px-4 py-2 text-sm text-[#00A884]">
                  typing...
                </p>
              )}

              <form
                onSubmit={sendMessage}
                className="flex shrink-0 items-center gap-3 border-t border-[#2A3942] bg-[#202C33] p-4"
              >

                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="min-w-0 flex-1 rounded-full bg-[#2A3942] px-5 py-3 text-sm outline-none"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white hover:bg-[#008F72] disabled:opacity-50"
                >
                  ➤
                </button>

              </form>

            </>
          ) : (

            <div className="flex flex-1 items-center justify-center">

              <div className="max-w-md px-6 text-center">

                <h2 className="text-2xl font-semibold">
                  Welcome to WebChat
                </h2>

                <p className="mt-3 text-sm text-[#8696A0]">
                  Select a friend from your chat list to open a conversation.
                  Your accepted connections will appear here.
                </p>

              </div>

            </div>

          )}

        </main>

      </div>
    </div>
  );
}

export default Chat;
