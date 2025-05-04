import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FeedPage from "./pages/FeedPage";
import CreatorProfile from "./pages/CreatorProfile";
import EditProfile from "./pages/EditProfile";
import AddPostPage from "./pages/AddPostPage";
import Subscription from "./pages/Subscription"; // Note: This might be a placeholder component for user subscriptions
import ExclusiveContent from "./pages/ExclusiveContent";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import MembershipPlansPage from "./pages/MembershipPlansPage"; // For Creator's tiers
import Dashboard from "./pages/Dashboard";
import SubscribeTiersPage from "./pages/SubscribeTiersPage"; // For User subscribing to a creator's tiers
import Messages from "./pages/Messages";
import Sidebar from "./components/Sidebar";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/feed" element={<FeedPage />} />
          {/* Route for viewing any creator's profile */}
          <Route path="/creator/:creatorId" element={<CreatorProfile />} />
          {/* Redirect /profile to the logged-in user's specific creator profile page */}
          <Route path="/profile" element={
            // Safely redirect to the logged-in user's specific creator profile page
            // Check if userId exists in localStorage before redirecting
            localStorage.getItem("userId") ? (
                 // Ensure the userId is a non-empty string before using it in the URL
                 // Basic check for non-empty string - isValidObjectId check happens in backend
                 localStorage.getItem("userId").length > 0 ? (
                    <Navigate to={`/creator/${localStorage.getItem("userId")}`} />
                 ) : (
                     <Navigate to="/login" /> // Redirect to login if userId is empty string
                 )
            ) : (
                 <Navigate to="/login" /> // Redirect to login if userId is null or undefined
            )
          } />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/add-post" element={<AddPostPage />} />
          {/* Note: The /subscription route might be for a user viewing their own subscriptions */}
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/exclusive" element={<ExclusiveContent />} />
          <Route path="/2fa" element={<TwoFactorAuth />} />
          {/* This page is now primarily for Creators to manage their tiers */}
          <Route path="/membership-plans" element={<MembershipPlansPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* This page is for a User to subscribe to a specific Creator's tiers */}
          <Route path="/subscribe/:creatorId" element={<SubscribeTiersPage />} />
          <Route path="/messages" element={<Messages />} />
           {/* FUTURE: Add a catch-all route for 404 */}
            {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
        </Routes>
      </div>
    </>
  );
}

export default App;