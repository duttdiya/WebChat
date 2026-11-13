import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

function useChat() {
  const navigate = useNavigate();

  const [myProfile, setMyProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [requestCount, setRequestCount] = useState(0);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [friendTyping, setFriendTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const typingTimeout = useRef(null);
  const messagesContainerRef = useRef(null);

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
        const profileRes = await fetch("http://localhost:5000/api/profile/me", {
          headers,
        });

        const requestsRes = await fetch(
          "http://localhost:5000/api/users/requests/received",
          { headers },
        );

        const connectionsRes = await fetch(
          "http://localhost:5000/api/users/connections",
          { headers },
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
        setChatError(error.message);
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
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleUserStatus = ({ userId, isOnline }) => {
      setOnlineUsers((previous) => {
        if (isOnline) {
          return previous.includes(userId) ? previous : [...previous, userId];
        }

        return previous.filter((id) => id !== userId);
      });
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_status", handleUserStatus);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_status", handleUserStatus);
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
          },
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
    setFriendTyping(false);
    loadMessages();
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend) return;

    const markMessagesRead = () => {
      socket.emit("mark_messages_read", {
        senderId: selectedFriend._id,
      });
    };

    if (socket.connected) {
      markMessagesRead();
    }

    socket.on("connect", markMessagesRead);

    return () => {
      socket.off("connect", markMessagesRead);
    };
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
            (item) => item._id === message._id,
          );

          if (alreadyAdded) return oldMessages;

          return [...oldMessages, message];
        });

        if (senderId === friendId && socket.connected) {
          socket.emit("mark_messages_read", {
            senderId: friendId,
          });
        }
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

  useEffect(() => {
    const handleMessageStatus = ({ messageId, status }) => {
      setMessageStatuses((previous) => ({
        ...previous,
        [messageId]: status,
      }));
    };

    socket.on("message_status", handleMessageStatus);

    return () => {
      socket.off("message_status", handleMessageStatus);
    };
  }, []);

  useEffect(() => {
    const handleMessagesRead = ({ readerId }) => {
      if (readerId !== selectedFriend?._id) return;

      setMessages((previous) =>
        previous.map((message) => {
          const senderId = message.sender?._id || message.sender;

          if (senderId === myProfile?._id) {
            return { ...message, isRead: true };
          }

          return message;
        }),
      );
    };

    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("messages_read", handleMessagesRead);
    };
  }, [selectedFriend, myProfile]);

  useEffect(() => {
    const showError = (data) => {
      setChatError(data.message);
    };

    socket.on("message_error", showError);

    return () => {
      socket.off("message_error", showError);
    };
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, friendTyping, selectedFriend]);
  const getPhoto = (picture) => {
    if (!picture) return "";

    return `http://localhost:5000${picture}`;
  };

  const filteredConnections = connections.filter((item) => {
    const friend = item.user;

    const name = friend.name || "";
    const username = friend.username || "";

    return `${name} ${username}`.toLowerCase().includes(search.toLowerCase());
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
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      setChatError("Please select a valid photo or video.");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setChatError("File size must not exceed 50 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setChatError("");
  };
  const sendMedia = async () => {
    if (!selectedFile || !selectedFriend || uploading) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setUploading(true);
    setChatError("");

    const formData = new FormData();
    formData.append("media", selectedFile);

    try {
      const response = await fetch(
        `http://localhost:5000/api/messages/upload/${selectedFriend._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Media upload failed.");
      }

      setSelectedFile(null);
    } catch (error) {
      setChatError(error.message);
    } finally {
      setUploading(false);
    }
  };
  const sendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedFriend) return;

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

  return {
    navigate,
    myProfile,
    connections,
    requestCount,
    selectedFriend,
    setSelectedFriend,
    search,
    setSearch,
    messages,
    messageStatuses,
    newMessage,
    setNewMessage,
    loading,
    chatError,
    friendTyping,
    onlineUsers,
    messagesContainerRef,
    getPhoto,
    filteredConnections,
    handleTyping,
    sendMessage,
    selectedFile,
    setSelectedFile,
    uploading,
    handleFileSelect,
    sendMedia,
  };
}

export default useChat;
