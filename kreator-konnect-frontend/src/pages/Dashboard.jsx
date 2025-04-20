import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [metrics, setMetrics] = useState({ views: 0, likes: 0, comments: 0 });
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({ accountNumber: "", routingNumber: "" });
  const [paypalEmail, setPaypalEmail] = useState("");
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const minimumThreshold = 50;

  useEffect(() => {
    // Apply theme to document
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    // BACKEND: Fetch monthly earnings
    // GET /api/earnings/monthly
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { earnings: number }
    setEarnings(150.75); // Mock data

    // BACKEND: Fetch subscriber count
    // GET /api/subscribers/count
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { count: number }
    setSubscribers(42); // Mock data

    // Simulate real-time subscriber updates
    // BACKEND: Poll for subscriber count
    // GET /api/subscribers/count
    const subscriberPoll = setInterval(() => {
      // Mock increment for demo
      setSubscribers((prev) => prev + Math.floor(Math.random() * 2));
    }, 10000); // Poll every 10s

    // BACKEND: Fetch engagement metrics
    // GET /api/posts/metrics
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { views: number, likes: number, comments: number }
    setMetrics({ views: 1200, likes: 150, comments: 45 }); // Mock data

    // BACKEND: Fetch payout history
    // GET /api/payouts/history
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { payouts: [{ id, date, amount, method, status }] }
    const storedHistory = JSON.parse(localStorage.getItem("payoutHistory") || "[]");
    setPayoutHistory(storedHistory);

    return () => clearInterval(subscriberPoll);
  }, []);

  const handlePayout = () => {
    setShowPayout(!showPayout);
  };

  const handlePayoutSubmit = () => {
    // BACKEND: Submit payout request
    // POST /api/payouts
    // Request: { method, amount, details: { accountNumber?, routingNumber?, paypalEmail? }, headers: { Authorization: "Bearer <token>" } }
    // Response: { payout: { id, date, amount, method, status } }
    if (!payoutMethod) {
      alert("Please select a payout method.");
      return;
    }
    if (payoutMethod === "bank" && (!bankDetails.accountNumber || !bankDetails.routingNumber)) {
      alert("Please provide bank account details.");
      return;
    }
    if (payoutMethod === "paypal" && !paypalEmail) {
      alert("Please provide PayPal email.");
      return;
    }
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < minimumThreshold) {
      alert(`Payout amount must be at least $${minimumThreshold}.`);
      return;
    }
    if (amount > earnings) {
      alert("Insufficient balance.");
      return;
    }

    const payout = {
      id: Date.now(),
      date: new Date().toISOString(),
      amount,
      method: payoutMethod,
      status: "Pending",
    };

    const updatedHistory = [...payoutHistory, payout];
    setPayoutHistory(updatedHistory);
    localStorage.setItem("payoutHistory", JSON.stringify(updatedHistory));

    alert("Payout request submitted!");
    setPayoutAmount("");
    setBankDetails({ accountNumber: "", routingNumber: "" });
    setPaypalEmail("");
    setPayoutMethod("");
  };

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/profile")}
          className="back-button"
        >
          ← Go Back to Profile
        </button>
        <button
          onClick={toggleTheme}
          style={{
            padding: "5px 10px",
            fontSize: "16px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
          }}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
      <h2>Creator Dashboard</h2>
      <div className="dashboard-grid" style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        {/* Earnings Card */}
        <div className="card-box" style={{ flex: "1 1 300px" }}>
          <h3>Monthly Earnings</h3>
          <p style={{ fontSize: "1.5rem", color: "var(--primary)" }}>${earnings.toFixed(2)}</p>
          <div className="progress-bar" style={{ marginTop: "10px" }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min((earnings / 1000) * 100, 100)}%`, // Assume $1000 as max for demo
                height: "20px",
                backgroundColor: "var(--primary)",
                borderRadius: "var(--border-radius)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--secondary)" }}>
            This Month (April 2025)
          </p>
        </div>

        {/* Subscribers Card */}
        <div className="card-box" style={{ flex: "1 1 300px" }}>
          <h3>Subscribers</h3>
          <p style={{ fontSize: "1.5rem", color: "var(--primary)" }}>{subscribers}</p>
          <p style={{ fontSize: "0.9rem", color: "var(--secondary)" }}>
            Updated in real-time
          </p>
        </div>

        {/* Engagement Metrics Card */}
        <div className="card-box" style={{ flex: "1 1 300px" }}>
          <h3>Engagement Metrics</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <p>Views: {metrics.views}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((metrics.views / 2000) * 100, 100)}%`, // Assume 2000 max
                    height: "10px",
                    backgroundColor: "var(--primary)",
                    borderRadius: "var(--border-radius)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
            <div>
              <p>Likes: {metrics.likes}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((metrics.likes / 500) * 100, 100)}%`, // Assume 500 max
                    height: "10px",
                    backgroundColor: "var(--primary)",
                    borderRadius: "var(--border-radius)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
            <div>
              <p>Comments: {metrics.comments}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((metrics.comments / 100) * 100, 100)}%`, // Assume 100 max
                    height: "10px",
                    backgroundColor: "var(--primary)",
                    borderRadius: "var(--border-radius)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="navigation-buttons" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          className="button"
          onClick={() => navigate("/subscription")}
        >
          Manage Subscription
        </button>
        <button
          className="button"
          onClick={() => navigate("/membership-plans")}
        >
          Manage Membership Plans
        </button>
        <button
          className="button"
          onClick={handlePayout}
        >
          Payout
        </button>
      </div>
      {showPayout && (
        <div className="payout-section" style={{ marginTop: "20px", padding: "20px", border: "1px solid var(--secondary)", borderRadius: "var(--border-radius)" }}>
          <h3>Request a Payout</h3>
          <div style={{ marginBottom: "10px" }}>
            <label>
              Payout Method:
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                style={{ marginLeft: "10px", padding: "5px" }}
              >
                <option value="">Select Method</option>
                <option value="bank">Bank Account</option>
                <option value="paypal">PayPal</option>
              </select>
            </label>
          </div>
          {payoutMethod === "bank" && (
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Account Number"
                value={bankDetails.accountNumber}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                }
                className="input"
                style={{ marginRight: "10px" }}
              />
              <input
                type="text"
                placeholder="Routing Number"
                value={bankDetails.routingNumber}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, routingNumber: e.target.value })
                }
                className="input"
              />
            </div>
          )}
          {payoutMethod === "paypal" && (
            <div style={{ marginBottom: "10px" }}>
              <input
                type="email"
                placeholder="PayPal Email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="input"
              />
            </div>
          )}
          <div style={{ marginBottom: "10px" }}>
            <input
              type="number"
              placeholder={`Enter amount (Min: $${minimumThreshold})`}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="input"
            />
            <p>Available Balance: ${earnings.toFixed(2)}</p>
          </div>
          <button onClick={handlePayoutSubmit} className="button">
            Submit Payout
          </button>
          <h3 style={{ marginTop: "20px" }}>Payout History</h3>
          {payoutHistory.length === 0 ? (
            <p>No payout history yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Date</th>
                  <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Amount</th>
                  <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Method</th>
                  <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((payout) => (
                  <tr key={payout.id}>
                    <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>
                      {new Date(payout.date).toLocaleDateString()}
                    </td>
                    <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>
                      ${payout.amount.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>
                      {payout.method === "bank" ? "Bank Account" : "PayPal"}
                    </td>
                    <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>
                      {payout.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;