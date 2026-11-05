
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handlePhotoChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be 5 MB or less.");
      return;
    }

    setMessage("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!username.trim() || username.trim().length < 3) {
      setMessage("Username must contain at least 3 characters.");
      return;
    }

    if (!dob) {
      setMessage("Please enter your date of birth.");
      return;
    }

    if (new Date(dob) > new Date()) {
      setMessage("Date of birth cannot be in the future.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

    
      const formData = new FormData();

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to save profile.");
        return;
      }

      if (data.user?.email) {
        localStorage.setItem("email", data.user.email);
      }

     
      navigate("/chat");

    } catch (error) {
      console.error("Profile setup error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-md sm:p-8">

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-green-600">
            WebChat
          </h1>

          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            Set up your profile
          </h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">

          <div className="flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-green-500 bg-green-50">

              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl text-green-600">+</span>
              )}

            </div>

            <label
              htmlFor="photo"
              className="mt-3 cursor-pointer text-sm font-medium text-green-600 hover:underline"
            >
              Upload profile picture
            </label>

            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mt-3 w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-600 file:px-3 file:py-2 file:text-white hover:file:bg-green-700"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="dob"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Date of birth
            </label>

            <input
              id="dob"
              type="date"
              max={new Date().toLocaleDateString("en-CA")}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              About me
            </label>

            <textarea
              id="bio"
              rows={3}
              maxLength={160}
              placeholder="Write a little about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />

            <p className="mt-1 text-right text-xs text-gray-500">
              {bio.length}/160
            </p>
          </div>

          {message && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#00A884] py-3 font-semibold text-white hover:bg-[#06CF9C] disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
