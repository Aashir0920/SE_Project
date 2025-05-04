import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaTachometerAlt, FaPlus, FaLock, FaDollarSign, FaEnvelope, FaSignOutAlt } from "react-icons/fa";
import "../index.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // Fetch user role and ID
      fetch("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then((data) => {
          setUserRole(data.profile.role);
          setUserId(data.profile._id); // Set userId from the profile response
        })
        .catch(() => {
          setUserRole("supporter"); // Default to supporter if fetch fails
          setUserId(null); // Reset userId if fetch fails
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        {isCollapsed ? "☰" : "✕"}
      </button>
      <div className="sidebar-content">
        <h2 className="sidebar-title">{isCollapsed ? "" : "App Name"}</h2>
        <ul className="sidebar-menu">
          {!isAuthenticated ? (
            <>
              <li>
                <Link to="/">
                  <FaHome /> {!isCollapsed && "Home"}
                </Link>
              </li>
              <li>
                <Link to="/signup">
                  <FaUser /> {!isCollapsed && "Signup"}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/feed">
                  <FaHome /> {!isCollapsed && "Feed"}
                </Link>
              </li>
              <li>
                <Link to={userId ? `/creator/${userId}` : "/dashboard"}>
                  <FaUser /> {!isCollapsed && "My Profile"}
                </Link>
              </li>
              <li>
                <Link to="/dashboard">
                  <FaTachometerAlt /> {!isCollapsed && "Dashboard"}
                </Link>
              </li>
              <li>
                <Link to="/add-post">
                  <FaPlus /> {!isCollapsed && "Add Post"}
                </Link>
              </li>
              <li>
                <Link to="/messages">
                  <FaEnvelope /> {!isCollapsed && "Messages"}
                </Link>
              </li>
              <li>
                <Link to="/subscription">
                  <FaDollarSign /> {!isCollapsed && "Subscription"}
                </Link>
              </li>
              {userRole === "creator" && (
                <li>
                  <Link to="/membership-plans">
                    <FaDollarSign /> {!isCollapsed && "Membership Plans"}
                  </Link>
                </li>
              )}
              <li>
                <Link to="/2fa">
                  <FaLock /> {!isCollapsed && "2FA"}
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-button">
                  <FaSignOutAlt /> {!isCollapsed && "Logout"}
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;