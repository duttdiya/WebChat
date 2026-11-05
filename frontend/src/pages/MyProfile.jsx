
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  async function fetchProfile() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view your profile.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/profile/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to load profile.");
        return;
      }

      setUser(data.user);
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  fetchProfile();
}, []);
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("username");

    navigate("/login", { replace: true });
  }



  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111B21] text-white">
        <p>{error || "Profile not found."}</p>
        <button onClick={() => navigate("/chat")} className="text-[#00A884]">
          Back to Chat
        </button>
      </div>
    );
  }

  const photoUrl = user.profilePicture
    ? `http://localhost:5000${user.profilePicture}`
    : "";

  return (
    <div className="min-h-screen bg-[#111B21] text-[#E9EDEF]">

      <header className="flex h-20 items-center justify-between border-b border-[#2A3942] bg-[#202C33] px-6">

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/chat")}
            className="text-2xl text-[#00A884]"
          >
            ←
          </button>

          <h1 className="text-lg font-semibold">My Profile</h1>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
        >
          Logout
        </button>

      </header>

      <main className="mx-auto max-w-md px-6 py-12">

        <div className="flex flex-col items-center">

          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#00A884] bg-[#075E54] text-4xl font-bold">

            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              user.username?.charAt(0).toUpperCase() || "U"
            )}

          </div>

        

          <h3 className="mt-2 text-sm text-[#8696A0]">
            {user.name}
          </h3>

          <p className="mt-4 text-center text-sm text-[#AEBAC1]">
            {user.bio || "No bio added yet."}
          </p>

        </div>

        <div className="mt-10 space-y-5 rounded-xl border border-[#2A3942] bg-[#202C33] p-5">

          <div>
            <p className="text-xs text-[#8696A0]">Email address</p>
            <p className="mt-1">{user.email}</p>
          </div>

          <div>
            <p className="text-xs text-[#8696A0]">Username</p>
            <p className="mt-1">@{user.username}</p>
          </div>

          <div>
            <p className="text-xs text-[#8696A0]">Date of birth</p>
            <p className="mt-1">
              {user.dob
                ? new Date(user.dob).toLocaleDateString()
                : "Not added"}
            </p>
          </div>

        </div>

        <button
          onClick={() => navigate("/edit-profile")}
          className="mt-6 w-full rounded-lg bg-[#00A884] py-3 font-semibold text-white hover:bg-[#06CF9C]"
        >
          Edit Profile
        </button>

      </main>
    </div>
  );
}

export default MyProfile;
