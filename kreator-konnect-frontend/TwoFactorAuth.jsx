import React, { useState } from "react";
import "../index.css";

const TwoFactorAuthPage = () => {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSendCode = () => {
    // BACKEND: Send 2FA verification code
    // POST /api/2fa/send-code
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Code sent" }
    setSent(true);
    alert("Verification code sent to your registered email/phone.");
  };

  const handleVerifyCode = () => {
    // BACKEND: Verify 2FA code
    // POST /api/2fa/verify
    // Request: { code, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "2FA enabled" }
    if (code === "123456") {
      setVerified(true);
      setEnabled(true);
      alert("Two-Factor Authentication has been enabled.");
    } else {
      alert("Invalid verification code.");
    }
  };

  const handleDisable = () => {
    // BACKEND: Disable 2FA
    // POST /api/2fa/disable
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "2FA disabled" }
    setEnabled(false);
    setCode("");
    setSent(false);
    setVerified(false);
    alert("Two-Factor Authentication has been disabled.");
  };

  return (
    <div className="container">
      <h2>Two-Factor Authentication</h2>
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
    </div>
  );
};

export default TwoFactorAuthPage;