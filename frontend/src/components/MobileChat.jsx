
function MobileChat({ chat }) {
  const {
    navigate,
    myProfile,
    requestCount,
    selectedFriend,
    setSelectedFriend,
    search,
    setSearch,
    messages,
    messageStatuses,
    newMessage,
    loading,
    chatError,
    friendTyping,
    onlineUsers,
    messagesContainerRef,
    getPhoto,
    filteredConnections,
    handleTyping,
    sendMessage,
  } = chat;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#111B21] text-[#E9EDEF]">
      {!selectedFriend ? (
        <>
          <header className="flex shrink-0 items-center justify-between bg-[#202C33] px-5 py-5">
            <div>
              <h1 className="text-2xl font-bold text-[#00A884]">
                WebChat
              </h1>
              <p className="mt-1 text-xs text-[#8696A0]">
                Your conversations
              </p>
            </div>

            <button
              onClick={() => navigate("/my-profile")}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#00A884] bg-[#075E54] font-semibold"
            >
              {myProfile?.profilePicture ? (
                <img
                  src={getPhoto(myProfile.profilePicture)}
                  alt="My profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                myProfile?.username?.charAt(0).toUpperCase() || "U"
              )}
            </button>
          </header>

          <div className="shrink-0 px-4 py-3">
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-[#2A3942] px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-[#00A884]"
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
                  className="mt-5 rounded-lg bg-[#00A884] px-5 py-3 text-sm font-semibold text-white"
                >
                  Find People
                </button>
              </div>
            ) : (
              filteredConnections.map((item) => {
                const friend = item.user;
                const isOnline = onlineUsers.includes(friend._id);

                return (
                  <button
                    key={item.requestId}
                    onClick={() => setSelectedFriend(friend)}
                    className="flex w-full items-center gap-3 border-b border-[#2A3942] px-4 py-4 text-left active:bg-[#2A3942]"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${
                        isOnline
                          ? "border-[#00A884]"
                          : "border-[#8696A0]"
                      } bg-[#075E54] font-semibold`}
                    >
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

                      <p
                        className={`mt-1 text-xs ${
                          isOnline
                            ? "text-[#00A884]"
                            : "text-[#8696A0]"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>

                    <span className="text-xs text-[#8696A0]">
                      Connected
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <nav className="flex shrink-0 items-center justify-around border-t border-[#2A3942] bg-[#202C33] px-2 py-3">
            <button
              onClick={() => setSelectedFriend(null)}
              className="flex flex-col items-center gap-1 text-[#00A884]"
            >
              <svg
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
              </svg>
              <span className="text-[10px]">Chats</span>
            </button>

            <button
              onClick={() => navigate("/find-people")}
              className="flex flex-col items-center gap-1 text-[#8696A0]"
            >
              <svg
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
              <span className="text-[10px]">Explore</span>
            </button>

            <button
              onClick={() => navigate("/connection-requests")}
              className="relative flex flex-col items-center gap-1 text-[#8696A0]"
            >
              <svg
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>

              {requestCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00A884] px-1 text-[9px] text-white">
                  {requestCount}
                </span>
              )}

              <span className="text-[10px]">Requests</span>
            </button>

            <button
              onClick={() => navigate("/my-profile")}
              className="flex flex-col items-center gap-1 text-[#8696A0]"
            >
              <svg
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              <span className="text-[10px]">Profile</span>
            </button>
          </nav>
        </>
      ) : (
        <>
          <header className="flex shrink-0 items-center gap-3 border-b border-[#2A3942] bg-[#202C33] px-3 py-3">
            <button
              onClick={() => setSelectedFriend(null)}
              className="flex h-9 w-8 shrink-0 items-center justify-center text-[#E9EDEF]"
              aria-label="Back to chats"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${
                onlineUsers.includes(selectedFriend._id)
                  ? "border-[#00A884]"
                  : "border-[#8696A0]"
              } bg-[#075E54]`}
            >
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

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold">
                {selectedFriend.name}
              </h2>

              <p
                className={`text-xs ${
                  onlineUsers.includes(selectedFriend._id)
                    ? "text-[#00A884]"
                    : "text-[#8696A0]"
                }`}
              >
                {onlineUsers.includes(selectedFriend._id)
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </header>

          <div
            ref={messagesContainerRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
          >
            {messages.length === 0 ? (
              <div className="m-auto text-center">
                <h2 className="text-lg font-semibold">
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

                const status = message.isRead
                  ? "read"
                  : messageStatuses[message._id] || "sent";

                return (
                  <div
                    key={message._id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] break-words rounded-2xl px-4 py-2 ${
                        isMine
                          ? "rounded-br-sm bg-[#005C4B]"
                          : "rounded-bl-sm bg-[#202C33]"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>

                      {isMine && (
                        <div className="mt-1 flex justify-end">
                          <span
                            className={`text-xs font-semibold ${
                              status === "read"
                                ? "text-[#53BDEB]"
                                : "text-[#AEBAC1]"
                            }`}
                          >
                            {status === "sent" ? "✓" : "✓✓"}
                          </span>
                        </div>
                      )}
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

            {friendTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-[#202C33] px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#8696A0] [animation-delay:0ms]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#8696A0] [animation-delay:150ms]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#8696A0] [animation-delay:300ms]"></span>
                  </div>

                  <span className="text-xs text-[#8696A0]">
                    {selectedFriend.username || selectedFriend.name} is typing
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex shrink-0 items-center gap-2 border-t border-[#2A3942] bg-[#202C33] px-3 py-3"
          >
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="min-w-0 flex-1 rounded-full bg-[#2A3942] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#00A884]"
            />

            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default MobileChat;
