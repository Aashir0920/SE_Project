import React, { useState, useEffect } from "react";
import "../index.css";

const TwoFactorAuthPage = () => {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetch2FAStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/2fa/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setEnabled(data.isTwoFactorEnabled);
      } catch (err) {
        setError(err.message || "Failed to fetch 2FA status");
      }
    };
    fetch2FAStatus();
  }, []);

  const handleSendCode = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/2fa/send-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSent(true);
      alert("Verification code sent to your registered email/phone.");
    } catch (err) {
      alert(err.message || "Failed to send verification code");
    }
  };

  const handleVerifyCode = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setEnabled(true);
      setSent(false);
      setCode("");
      alert("Two-Factor Authentication has been enabled.");
    } catch (err) {
      alert(err.message || "Invalid verification code");
    }
  };

  const handleDisable = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/2fa/disable", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setEnabled(false);
      setCode("");
      setSent(false);
      alert("Two-Factor Authentication has been disabled.");
    } catch (err) {
      alert(err.message || "Failed to disable 2FA");
    }
  };

  return (
    <div className="container">
      <h2>Two-Factor Authentication</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}
      {!enabled && (
        <>
          <p>
            Add an extra layer of security by enabling 2FA. A verification code
            will be sent to your registered email/phone.
          </p>
          {!sent ? (
            <button onClick={handleSendCode}>Send Verification Code</button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button onClick={handleVerifyCode}>Verify & Enable 2FA</button>
            </>
          )}
        </>
      )}
      {enabled && (
        <>
          <p>Two-Factor Authentication is currently <strong>enabled</strong>.</p>
          <button onClick={handleDisable}>Disable 2FA</button>
        </>
      )}
      {/* FUTURE: Integrate with email/SMS service (e.g., SendGrid, Twilio) */}
      {/* FUTURE: Add QR code for authenticator app setup */}
    </div>
  );
};

export default TwoFactorAuthPage;