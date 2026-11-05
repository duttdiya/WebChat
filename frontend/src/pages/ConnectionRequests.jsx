
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ConnectionRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Fetch received connection requests
  async function fetchRequests() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/users/requests/received",
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
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        setMessage(data.message || "Unable to load requests.");
        return;
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("Fetch requests error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  // Accept or reject a request
  async function handleRequest(requestId, action) {
    try {
      setProcessingId(requestId);
      setMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/users/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("username");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        setMessage(data.message || "Unable to update request.");
        return;
      }

      // Remove the handled request from the list
      setRequests((previousRequests) =>
        previousRequests.filter(
          (request) => request._id !== requestId
        )
      );

      setMessage(data.message);
    } catch (error) {
      console.error("Request update error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#111B21] text-[#E9EDEF]">

      {/* Header */}
      <header className="flex h-20 items-center gap-4 border-b border-[#2A3942] bg-[#202C33] px-6">

        <button
          onClick={() => navigate("/chat")}
          className="text-2xl text-[#AEBAC1] hover:text-[#00A884]"
        >
          ←
        </button>

        <div>
          <h1 className="text-lg font-semibold">
            Connection Requests
          </h1>

          <p className="text-xs text-[#8696A0]">
            Manage your incoming requests
          </p>
        </div>

      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-5 py-10">

        <h2 className="mb-6 text-xl font-semibold">
          Received Requests ({requests.length})
        </h2>

        {message && (
          <p className="mb-5 text-center text-sm text-[#00A884]">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-center text-[#8696A0]">
            Loading requests...
          </p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-[#2A3942] bg-[#202C33] p-10 text-center">
            <div className="mb-3 text-4xl">👥</div>

            <h3 className="font-semibold">
              No connection requests yet
            </h3>

            <p className="mt-2 text-sm text-[#8696A0]">
              When someone sends you a request, it will appear here.
            </p>

            <button
              onClick={() => navigate("/find-people")}
              className="mt-6 rounded-lg bg-[#00A884] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#06CF9C]"
            >
              Find People
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {requests.map((request) => {
              const sender = request.sender;

              if (!sender) return null;

              return (
                <div
                  key={request._id}
                  className="flex flex-col gap-4 rounded-xl border border-[#2A3942] bg-[#202C33] p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  {/* Sender Details */}
                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075E54] text-lg font-semibold text-white">

                      {sender.profilePicture ? (
                        <img
                          src={`http://localhost:5000${sender.profilePicture}`}
                          alt={sender.username || sender.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        sender.username?.charAt(0).toUpperCase() ||
                        sender.name?.charAt(0).toUpperCase() ||
                        "U"
                      )}

                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {sender.name}
                      </h3>

                      <p className="text-sm text-[#00A884]">
                        @{sender.username || "user"}
                      </p>

                      <p className="truncate text-xs text-[#8696A0]">
                        {sender.email}
                      </p>
                    </div>

                  </div>

                  {/* Accept and Reject */}
                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        handleRequest(request._id, "accept")
                      }
                      disabled={processingId === request._id}
                      className="flex-1 rounded-lg bg-[#00A884] px-4 py-2 text-sm font-semibold text-white hover:bg-[#06CF9C] disabled:opacity-50"
                    >
                      {processingId === request._id
                        ? "Please wait..."
                        : "Accept"}
                    </button>

                    <button
                      onClick={() =>
                        handleRequest(request._id, "reject")
                      }
                      disabled={processingId === request._id}
                      className="flex-1 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </main>
    </div>
  );
}

export default ConnectionRequests;
