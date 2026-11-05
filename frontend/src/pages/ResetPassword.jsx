
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  async function handleReset(e) {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Please request a new password reset OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed.");
      }

      navigate("/login", {
        state: { message: "Password reset successful. Please log in." },
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
          Reset Password
        </h2>

        <p className="mb-6 mt-2 text-center text-sm text-gray-500">
          Enter the OTP sent to {email || "your email"} and choose a new password.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
          />

          <input
            type="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
          />

          {message && (
            <p className="text-sm text-red-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-md bg-green-600 py-2.5 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          <Link to="/login" className="text-green-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
