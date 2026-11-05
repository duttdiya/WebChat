
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      navigate("/reset-password", {
        state: { email: email.trim().toLowerCase() },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-green-600">
          WebChat
        </h1>

        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-800">
          Forgot Password?
        </h2>

        <p className="mb-6 mt-2 text-center text-sm text-gray-500">
          Enter your registered email to receive a reset OTP.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
          />

          {message && (
            <p className="text-sm text-red-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 py-2.5 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link to="/login" className="text-green-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
