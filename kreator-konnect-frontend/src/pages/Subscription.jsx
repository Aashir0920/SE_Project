import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // BACKEND: Fetch subscription details
    // GET /api/subscription
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { plan: string, nextBillingDate: string }
    // BACKEND: Fetch subscription history
    // GET /api/subscription/history
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { history: [{ date: string, amount: number }] }
    setSubscription({ plan: "Premium Plan", nextBillingDate: "May 15, 2025" });
    setHistory([
      { date: "March 15, 2025", amount: 10 },
      { date: "February 15, 2025", amount: 10 },
    ]);
  }, []);

  const handleCancel = () => {
    // BACKEND: Cancel subscription
    // POST /api/subscription/cancel
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Subscription cancelled" }
    alert("Subscription cancelled!");
  };

  const handleRenew = () => {
    // BACKEND: Renew subscription
    // POST /api/subscription/renew
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Subscription renewed" }
    alert("Subscription renewed!");
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
      <h2>Manage Your Subscription</h2>
      <div className="subscription-card">
        {subscription ? (
          <>
            <p>You're currently subscribed to the <strong>{subscription.plan}</strong>.</p>
            <p>Next billing date: <strong>{subscription.nextBillingDate}</strong></p>
            <button className="btn cancel" onClick={handleCancel}>Cancel Subscription</button>
            <button className="btn renew" onClick={handleRenew}>Renew Now</button>
          </>
        ) : (
          <p>Loading subscription details...</p>
        )}
        <h3>Subscription History</h3>
        <ul className="subscription-history">
          {history.map((entry, index) => (
            <li key={index}>{entry.date} - Paid ${entry.amount}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPage;