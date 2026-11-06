
import { useEffect, useState } from "react";
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

    socket.on("connect_error", (error) => {
      console.log("Socket error:", error.message);
    });

    return () => {
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
      const senderId = message.sender._id || message.sender;
      const receiverId = message.receiver._id || message.receiver;

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

  const sendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (!socket.connected) {
      setChatError("Not connected. Please try again.");
      return;
    }

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

      <aside className="flex w-[65px] flex-col items-center border-r border-[#2A3942] bg-[#202C33] py-5">

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
          className="mt-4 rounded-xl p-3 text-[#AEBAC1] hover:bg-[#2A3942]"
        >
          +
        </button>

        <button
          onClick={() => navigate("/connection-requests")}
          className="relative mt-4 rounded-xl p-3 text-[#AEBAC1] hover:bg-[#2A3942]"
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

      <section className="flex w-[340px] flex-col border-r border-[#2A3942] bg-[#202C33] sm:w-[380px]">

        <header className="flex h-[72px] items-center px-5">
          <h1 className="text-2xl font-semibold">Chats</h1>
        </header>

        <div className="px-4 pb-3">
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
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#075E54] font-semibold">

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

                  <span className="text-xs text-[#00A884]">
                    Connected
                  </span>
                </button>
              );
            })
          )}

        </div>
      </section>

      <main className="flex min-w-0 flex-1 flex-col bg-[#111B21]">

        {selectedFriend ? (
          <>

            <header className="flex h-[72px] items-center gap-3 border-b border-[#2A3942] bg-[#202C33] px-6">

              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#075E54]">
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

              <div>
                <h2 className="font-semibold">
                  {selectedFriend.name}
                </h2>

                <p className="text-xs text-[#8696A0]">
                  @{selectedFriend.username || "user"}
                </p>
              </div>
            </header>

            {/* Messages */}
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
                  const senderId = message.sender._id || message.sender;

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
                        <p className="text-sm">
                          {message.text}
                        </p>
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

            <form
              onSubmit={sendMessage}
              className="flex items-center gap-3 border-t border-[#2A3942] bg-[#202C33] p-4"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-[#2A3942] px-5 py-3 text-sm outline-none"
              />

              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00A884] text-white hover:bg-[#008F72] disabled:opacity-50"
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
  );
}

export default Chat;
