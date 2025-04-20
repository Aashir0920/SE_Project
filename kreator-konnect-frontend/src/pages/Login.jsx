import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // BACKEND: Authenticate user
    // POST /api/auth/login
    // Request: { email, password }
    // Response: { token, user: { id, role } }
    // Mock: Assume login success
    localStorage.setItem("userId", "user_123");
    alert("Logged in!");
    navigate("/feed");
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button onClick={handleLogin} className="button">
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;