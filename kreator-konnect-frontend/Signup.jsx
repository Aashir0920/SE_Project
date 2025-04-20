import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    // BACKEND: Register new user
    // POST /api/auth/signup
    // Request: { name, email, password, confirmPassword }
    // Response: { message: "User created", user: { id, email } }
    // On success: Redirect to login or auto-login
    // On failure: Show error message (e.g., "Email already exists")
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Account created!");
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;