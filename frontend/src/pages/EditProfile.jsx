
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function EditProfile() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const email = localStorage.getItem("email");

        if (!email) {
          setError("Please log in first.");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/profile/${encodeURIComponent(email)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        setUsername(data.user.username || "");
        setBio(data.user.bio || "");
        setDob(
          data.user.dob
            ? new Date(data.user.dob).toISOString().split("T")[0]
            : ""
        );

        if (data.user.profilePicture) {
          setPreview(
            `http://localhost:5000${data.user.profilePicture}`
          );
        }
      } catch (error) {
        setError(error.message);
      }
    }

    fetchProfile();
  }, []);

  function handlePhotoChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !dob) {
      setError("Username and date of birth are required.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("email", localStorage.getItem("email"));
      formData.append("username", username.trim());
      formData.append("dob", dob);
      formData.append("bio", bio);

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch(
        "http://localhost:5000/api/profile/setup",
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      localStorage.setItem("username", data.user.username);

      navigate("/my-profile", {
        state: { updated: true },
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111B21] text-[#E9EDEF]">

      <header className="flex h-20 items-center gap-4 border-b border-[#2A3942] bg-[#202C33] px-6">
        <button
          onClick={() => navigate("/my-profile")}
          className="text-2xl text-[#00A884]"
        >
          ←
        </button>

        <h1 className="text-lg font-semibold">
          Edit Profile
        </h1>
      </header>

      <main className="mx-auto max-w-md px-6 py-10">

        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-xl border border-[#2A3942] bg-[#202C33] p-6"
        >

          <div className="flex flex-col items-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#00A884] bg-[#075E54] text-4xl font-bold">

              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                username.charAt(0).toUpperCase() || "U"
              )}

            </div>

            <label className="mt-4 cursor-pointer text-sm font-medium text-[#00A884] hover:underline">
              Change Profile Picture

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#AEBAC1]">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-[#2A3942] bg-[#111B21] px-3 py-2 outline-none focus:border-[#00A884]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#AEBAC1]">
              Date of Birth
            </label>

            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg border border-[#2A3942] bg-[#111B21] px-3 py-2 text-white outline-none focus:border-[#00A884]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#AEBAC1]">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={4}
              placeholder="Write something about yourself..."
              className="w-full resize-none rounded-lg border border-[#2A3942] bg-[#111B21] px-3 py-2 outline-none focus:border-[#00A884]"
            />

            <p className="mt-1 text-right text-xs text-[#8696A0]">
              {bio.length}/160
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#00A884] py-3 font-semibold text-white hover:bg-[#06CF9C] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-profile")}
            className="w-full rounded-lg bg-[#2A3942] py-3 font-semibold text-white hover:bg-[#374750]"
          >
            Cancel
          </button>

        </form>
      </main>
    </div>
  );
}

export default EditProfile;
