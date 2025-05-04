import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSubscription = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setSubscription(data.subscription);
      } catch (err) {
        setError(err.message || "Failed to fetch subscription");
      }
    };
    fetchSubscription();
  }, [navigate]);

  const handleCancel = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/subscription/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert("Subscription cancelled successfully!");
      setSubscription(null);
    } catch (err) {
      alert(err.message || "Failed to cancel subscription");
    }
  };

  return (
    <div className="container">
      <button
        onClick={() => navigate("/dashboard")}
        className="back-button"
        style={{ marginBottom: "20px" }}
      >
        ← Back to Dashboard
      </button>
      <h2>Your Subscription</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}
      {subscription ? (
        <div className="subscription-details">
          <p>
            <strong>Plan:</strong> {subscription.tierName}
          </p>
          <p>
            <strong>Price:</strong> ${subscription.price}/month
          </p>
          <p>
            <strong>Creator:</strong> {subscription.creatorName}
          </p>
          <p>
            <strong>Start Date:</strong>{" "}
            {new Date(subscription.startDate).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong> {subscription.status}
          </p>
          <button onClick={handleCancel} className="cancel-button">
            Cancel Subscription
          </button>
        </div>
      ) : (
        <p>No active subscription.</p>
      )}
      {/* FUTURE: Add option to upgrade/downgrade subscription */}
      {/* <button onClick={() => navigate('/upgrade-subscription')}>Upgrade Plan</button> */}
    </div>
  );
};

export default SubscriptionPage;