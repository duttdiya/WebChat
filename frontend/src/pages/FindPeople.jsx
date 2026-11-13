
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function FindPeople() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();

    setMessage("");
    setUsers([]);
    setStatuses({});

    if (!search.trim()) {
      setMessage("Please enter an email or username.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(search.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("username");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        setMessage(data.message || "Search failed.");
        return;
      }

      const foundUsers = data.users || [];

      setUsers(foundUsers);

      if (foundUsers.length === 0) {
        setMessage("No users found.");
        return;
      }

      const results = await Promise.all(
        foundUsers.map(async (user) => {
          const statusResponse = await fetch(
            `http://localhost:5000/api/users/connection-status/${user._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!statusResponse.ok) {
            return [user._id, "none"];
          }

          const statusData = await statusResponse.json();

          return [user._id, statusData.status];
        })
      );

      setStatuses(Object.fromEntries(results));

    } catch (error) {
      console.log("Search error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(userId) {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setSendingId(userId);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/users/request/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("username");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        setMessage(data.message || "Unable to send request.");
        return;
      }

      setStatuses((previous) => ({
        ...previous,
        [userId]: "sent",
      }));

      setMessage("Connection request sent successfully!");

    } catch (error) {
      console.log("Request error:", error);
      setMessage("Unable to connect to server.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#111B21] text-[#E9EDEF]">

      <header className="flex h-20 items-center gap-4 border-b border-[#2A3942] bg-[#172229] px-6 shadow-sm">

  <button
    onClick={() => navigate("/chat")}
    className="group flex h-11 w-11 items-center justify-center rounded-xl border border-[#34434B] bg-[#202C33] text-[#AEBAC1] transition-all duration-200 hover:border-[#00A884] hover:bg-[#075E54] hover:text-white"
    title="Back to chat"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19l-7-7 7-7M8 12h13"
      />
    </svg>
  </button>

  <div>
    <h1 className="text-lg font-semibold tracking-wide text-[#E9EDEF]">
      Find People
    </h1>

    <p className="mt-1 text-xs text-[#8696A0]">
      Discover and connect with people on WebChat
    </p>
  </div>

</header>

      <main className="mx-auto max-w-2xl px-5 py-12">

        <div className="mb-8 text-center">

          <h2 className="text-2xl font-semibold">
            Find People
          </h2>

          <p className="mt-2 text-sm text-[#8696A0]">
            Search using email address or username.
          </p>

        </div>

        <form onSubmit={handleSearch} className="flex gap-2">

          <input
            type="text"
            placeholder="Enter email or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-[#2A3942] bg-[#202C33] px-4 py-3 text-sm outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#00A884] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>

        </form>

        {message && (
          <p className="mt-5 text-center text-sm text-[#AEBAC1]">
            {message}
          </p>
        )}

        <div className="mt-8 space-y-3">

          {users.map((user) => {

            const status = statuses[user._id];

            return (
              <div
                key={user._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#2A3942] bg-[#202C33] p-4"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075E54] font-semibold">

                    {user.profilePicture ? (
                      <img
                        src={`http://localhost:5000${user.profilePicture}`}
                        alt={user.username || user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user.username?.charAt(0).toUpperCase() ||
                      user.name?.charAt(0).toUpperCase() ||
                      "U"
                    )}

                  </div>

                  <div className="min-w-0">

                    <h3 className="font-semibold">
                      {user.name}
                    </h3>

                    <p className="text-sm text-[#00A884]">
                      @{user.username || "user"}
                    </p>

                    <p className="truncate text-xs text-[#8696A0]">
                      {user.email}
                    </p>

                  </div>

                </div>

                <div className="shrink-0">

                  {status === "none" && (
                    <button
                      onClick={() => sendRequest(user._id)}
                      disabled={sendingId === user._id}
                      className="rounded-lg bg-[#00A884] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {sendingId === user._id
                        ? "Sending..."
                        : "Add Friend"}
                    </button>
                  )}

                  {status === "sent" && (
                    <span className="rounded-lg bg-[#2A3942] px-3 py-2 text-sm text-[#AEBAC1]">
                      Request Sent
                    </span>
                  )}

                  {status === "received" && (
                    <button
                      onClick={() => navigate("/connection-requests")}
                      className="rounded-lg bg-[#00A884] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Respond
                    </button>
                  )}

                  {status === "accepted" && (
                    <span className="rounded-lg bg-[#075E54] px-3 py-2 text-sm text-white">
                      Connected
                    </span>
                  )}

                </div>

              </div>
            );
          })}

        </div>

        {!message && users.length === 0 && !loading && (
          <div className="mt-12 text-center">
            <p className="text-sm text-[#8696A0]">
              Search for someone to start connecting.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default FindPeople;
