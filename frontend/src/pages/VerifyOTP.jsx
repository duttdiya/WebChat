// import { useEffect, useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";

// function VerifyOTP() {
//   const [otp, setOtp] = useState("");
//   const [message, setMessage] = useState("");
//   const [seconds, setSeconds] = useState(30);

//  const navigate = useNavigate();
// const location = useLocation();
// const email = location.state?.email;
// const [loading, setLoading] = useState(false);
//   useEffect(() => {
//     if (seconds <= 0) return;

//     const timer = setTimeout(() => {
//       setSeconds((prev) => prev - 1);
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, [seconds]);

  
// async function handleVerify(e) {
//   e.preventDefault();
//   setMessage("");

//   if (!email) {
//     setMessage("Email not found. Please sign up again.");
//     return;
//   }

//   if (!/^\d{6}$/.test(otp)) {
//     setMessage("Please enter a valid 6-digit OTP.");
//     return;
//   }

//   try {
//     setLoading(true);

//     const response = await fetch(
//       "http://localhost:5000/api/auth/verify-otp",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, otp }),
//       }
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       setMessage(data.message || "OTP verification failed.");
//       return;
//     }

//     navigate("/profile-setup", {
//       state: { email },
//     });
//   } catch {
//     setMessage("Cannot connect to the server.");
//   } finally {
//     setLoading(false);
//   }
// }

//   function handleResend() {
//     if (seconds > 0) return;

//     setOtp("");
//     setMessage("Demo only: connect the backend to send a new OTP.");
//     setSeconds(30);
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 text-white">
//       <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
//         <div className="mx-auto mb-6 flex h-20 w-40 items-center justify-center rounded-2xl bg-violet-600 px-4 text-3xl font-bold">
//           WebChat
//         </div>

//         <div className="mb-8 text-center">
//           <h1 className="text-3xl font-bold">Verify your email</h1>
//           <p className="mt-3 text-sm leading-6 text-slate-400">
//             We've sent a verification code to{" "}
//             <span className="font-medium text-slate-200">
//               {email || "your email address"}
//             </span>
//             . Enter the six-digit code below.
//           </p>
//         </div>

//         <form onSubmit={handleVerify} className="space-y-5">
//           <div>
//             <label
//               htmlFor="otp"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               Verification code
//             </label>

//             <input
//               id="otp"
//               type="text"
//               inputMode="numeric"
//               autoComplete="one-time-code"
//               maxLength={6}
//               placeholder="Enter 6-digit OTP"
//               value={otp}
//               onChange={(e) =>
//                 setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
//               }
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none transition placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           {message && (
//             <p
//               role="status"
//               className="rounded-lg bg-violet-500/10 p-3 text-sm text-violet-300"
//             >
//               {message}
//             </p>
//           )}

//           <button
//             type="submit"
//             className="w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500"
//           >
//             Verify OTP
//           </button>
//         </form>

//         <div className="mt-6 text-center text-sm text-slate-400">
//           {seconds > 0 ? (
//             <p>Resend code in {seconds}s</p>
//           ) : (
//             <button
//               type="button"
//               onClick={handleResend}
//               className="font-medium text-violet-400 hover:text-violet-300"
//             >
//               Resend OTP
//             </button>
//           )}
//         </div>

//         <p className="mt-6 text-center text-sm text-slate-400">
//           Wrong email?{" "}
//           <Link
//             to="/signup"
//             className="font-medium text-violet-400 hover:text-violet-300"
//           >
//             Go back
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default VerifyOTP;
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setTimeout(() => {
      setSeconds(seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  async function handleVerify(e) {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Email not found. Please sign up again.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }
localStorage.setItem("token", data.token);
localStorage.setItem("email", email);
      navigate("/profile-setup", {
        state: { email },
      });
    } catch {
      setMessage("Cannot connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (seconds > 0) return;

    setOtp("");
    setMessage("Please connect the resend OTP API to send a new code.");
    setSeconds(30);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md sm:p-8">

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-green-600">
            WebChat
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Verify your email to continue
          </p>
        </div>

        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
          Verify your email
        </h2>

        <p className="mb-6 text-center text-sm leading-6 text-gray-600">
          We've sent a verification code to{" "}
          <span className="font-medium text-gray-800">
            {email || "your email address"}
          </span>
          . Enter the six-digit code below.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">

          <div>
            <label
              htmlFor="otp"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-center text-xl tracking-widest outline-none focus:border-green-500"
            />
          </div>

          {message && (
            <p
              role="status"
              className="rounded-md bg-red-50 p-3 text-sm text-red-600"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

        </form>

        <div className="mt-5 text-center text-sm text-gray-600">
          {seconds > 0 ? (
            <p>Resend code in {seconds}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-green-600 hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          Wrong email?{" "}
          <Link
            to="/signup"
            className="font-medium text-green-600 hover:underline"
          >
            Go back
          </Link>
        </p>

      </div>
    </div>
  );
}

export default VerifyOTP;