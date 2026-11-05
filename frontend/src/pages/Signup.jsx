// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// function Signup() {
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   async function handleSignup(e) {
//     e.preventDefault();
//     setError("");

//     if (!name.trim() || !phone.trim() || !email.trim() || !password) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
//       setError("Enter a valid phone number.");
//       return;
//     }

//     if (password.length < 8) {
//       setError("Password must be at least 8 characters.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const response = await fetch("http://localhost:5000/api/auth/signup", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name,
//           phone,
//           email,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data.message || "Signup failed. Please try again.");
//         return;
//       }

//       navigate("/verify-otp", {
//         state: { email: email.trim().toLowerCase() },
//       });
//     } catch (error) {
//       setError(
//         "Cannot connect to the server. Make sure your backend is running.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 text-white">
//       <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
//         <div className="mb-8 text-center">
//           <div className="mx-auto mb-4 flex h-20 w-40 items-center justify-center rounded-2xl bg-violet-600 px-4 text-3xl font-bold">
//             WebChat
//           </div>

//           <h1 className="text-3xl font-bold tracking-tight">
//             Create an account
//           </h1>

//           <p className="mt-2 text-sm text-slate-400">
//             Start conversations. Stay connected.
//           </p>
//         </div>

//         <form onSubmit={handleSignup} className="space-y-5">
//           <div>
//             <label
//               htmlFor="name"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               Full name
//             </label>

//             <input
//               id="name"
//               type="text"
//               autoComplete="name"
//               placeholder="Enter your full name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="phone"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               Phone number
//             </label>

//             <input
//               id="phone"
//               type="tel"
//               autoComplete="tel"
//               placeholder="e.g. +91 9876543210"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="email"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               Email address
//             </label>

//             <input
//               id="email"
//               type="email"
//               autoComplete="email"
//               placeholder="you@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="mb-2 block text-sm font-medium text-slate-200"
//             >
//               Password
//             </label>

//             <input
//               id="password"
//               type="password"
//               autoComplete="new-password"
//               placeholder="At least 8 characters"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           {error && (
//             <p
//               role="status"
//               className="rounded-lg bg-violet-500/10 p-3 text-sm text-violet-300"
//             >
//               {error}
//             </p>
//           )}

//          <button
//   type="submit"
//   disabled={loading}
//   className="w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
// >
//   {loading ? "Creating account..." : "Send OTP"}
// </button>
//         </form>

//         <p className="mt-6 text-center text-sm text-slate-400">
//           Already have an account?{" "}
//           <Link
//             to="/login"
//             className="font-medium text-violet-400 hover:text-violet-300"
//           >
//             Login
//           </Link>
//         </p>

//         <p className="mt-5 text-center text-xs text-slate-500">
//           Your conversations, all in one place.
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Signup;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      setError("Enter a valid phone number without spaces.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed. Please try again.");
        return;
      }

      navigate("/verify-otp", {
        state: { email: email.trim().toLowerCase() },
      });
    } catch (error) {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md sm:p-8">

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-green-600">
            WebChat
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create an account to start chatting
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Full name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Phone number
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="e.g. +919876543210"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Send OTP"}
          </button>

        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-green-600 hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;