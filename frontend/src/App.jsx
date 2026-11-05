import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProfileSetup from "./pages/Profilesetup";
import VerifyOTP from "./pages/VerifyOTP";
import Chat from "./pages/chat";
import FindPeople from "./pages/FindPeople";
import MyProfile from "./pages/MyProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EditProfile from "./pages/EditProfile";
import ProtectRoute from "./ProtectRoute";
import ConnectionRequests from "./pages/ConnectionRequests";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/find-people" element={<FindPeople />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route
          path="/connection-requests"
          element={
            <ProtectRoute>
              <ConnectionRequests />{" "}
            </ProtectRoute>
          }
        />
        <Route
          path="/profile-setup"
          element={
            <ProtectRoute>
              {" "}
              <ProfileSetup />{" "}
            </ProtectRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectRoute>
              {" "}
              <Chat />{" "}
            </ProtectRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectRoute>
              {" "}
              <MyProfile />{" "}
            </ProtectRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
