import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ name: "", email: "", dateOfBirth: "", password: "", confirmPassword: "" });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", email: "", dateOfBirth: "", password: "", confirmPassword: "" };
    const today = new Date("2025-04-29");

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
      isValid = false;
    } else {
      const dob = new Date(dateOfBirth);
      if (dob >= today) {
        newErrors.dateOfBirth = "Date of birth must be before today";
        isValid = false;
      }
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, dateOfBirth, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Signup failed");
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        navigate("/dashboard");
      } catch (error) {
        setErrors({ ...errors, email: error.message });
      }
    }
  };

  return (
    <div className="container">
      <div className="form-box" style={{ maxWidth: "400px", margin: "50px auto" }}>
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <div>
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            {errors.name && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.name}</p>}
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            {errors.email && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.email}</p>}
          </div>
          <div>
            <label>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            {errors.dateOfBirth && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.dateOfBirth}</p>}
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            {errors.password && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.password}</p>}
          </div>
          <div>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            {errors.confirmPassword && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.confirmPassword}</p>}
          </div>
          <button type="submit" style={{ width: "100%", marginTop: "10px" }}>
            Sign Up
          </button>
        </form>
        <p style={{ marginTop: "10px", textAlign: "center" }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;