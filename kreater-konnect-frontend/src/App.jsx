import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import ExclusiveContent from "./pages/ExclusiveContent";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/exclusive" element={<ExclusiveContent />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
      </Routes>
    </>
  );
}

export default App;
