import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaDollarSign, FaUsers, FaChartLine, FaHistory } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [engagementMetrics, setEngagementMetrics] = useState({ views: 0, likes: 0, comments: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [bankDetails, setBankDetails] = useState({ accountNumber: "", routingNumber: "" });
  const [paypalEmail, setPaypalEmail] = useState("");
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [error, setError] = useState("");
  const [payoutRequestError, setPayoutRequestError] = useState("");
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [isCreator, setIsCreator] = useState(false); // Initialize as false to avoid premature creator checks
  const minimumThreshold = 50;

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      await fetchProfileAndCreatorStatus(token);
      if (isCreator) {
        // Only fetch creator-specific data if user is a creator
        fetchMetrics(token);
        fetchPayoutHistory(token);
        fetchRecentActivity(token);
      }
    };

    fetchData();
  }, [navigate, theme, isCreator]);

  const fetchProfileAndCreatorStatus = async (token) => {
    setLoadingProfile(true);
    try {
      const profileResponse = await axios.get("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileResponse.data.profile);

      const tiersResponse = await axios.get("http://localhost:5000/api/tiers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsCreator(tiersResponse.data.tiers && tiersResponse.data.tiers.length > 0);
    } catch (err) {
      console.error("Fetch profile or tiers error:", err);
      if (err.response?.status === 401) {
        // Handle invalid or expired token
        localStorage.removeItem("token");
        navigate("/login");
        setError("Session expired. Please log in again.");
      } else {
        setError(err.response?.data?.message || "Failed to load profile or creator status.");
      }
      setUser(null);
      setIsCreator(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchMetrics = async (token) => {
    setLoadingMetrics(true);
    try {
      const [earningsResponse, subscribersResponse, engagementResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/earnings/monthly", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/subscribers/count", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/posts/metrics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setEarnings(earningsResponse.data.earnings || 0);
      setSubscribers(subscribersResponse.data.count || 0);
      setEngagementMetrics(engagementResponse.data || { views: 0, likes: 0, comments: 0 });
    } catch (err) {
      console.error("Fetch metrics error:", err);
      setError(err.response?.data?.message || "Failed to load metrics.");
      setEarnings(0);
      setSubscribers(0);
      setEngagementMetrics({ views: 0, likes: 0, comments: 0 });
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchPayoutHistory = async (token) => {
    setLoadingPayouts(true);
    try {
      const response = await axios.get("http://localhost:5000/api/payouts/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayoutHistory(response.data.payouts || []);
    } catch (err) {
      console.error("Fetch payout history error:", err);
      setError(err.response?.data?.message || "Failed to load payout history.");
      setPayoutHistory([]);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const fetchRecentActivity = async (token) => {
    setLoadingActivity(true);
    try {
      const response = await axios.get("http://localhost:5000/api/user/activity", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentActivity(response.data.activity || []);
    } catch (err) {
      console.error("Fetch recent activity error:", err);
      setError(err.response?.data?.message || "Failed to load recent activity.");
      setRecentActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleRequestPayout = async () => {
    setPayoutRequestError("");
    if (earnings < minimumThreshold) {
      setPayoutRequestError(`Minimum earnings threshold of $${minimumThreshold} not met.`);
      return;
    }
    if (!payoutMethod) {
      setPayoutRequestError("Please select a payout method.");
      return;
    }
    if (payoutMethod === "bank" && (!bankDetails.accountNumber || !bankDetails.routingNumber)) {
      setPayoutRequestError("Bank account number and routing number are required for bank payout.");
      return;
    }
    if (payoutMethod === "paypal" && !paypalEmail) {
      setPayoutRequestError("PayPal email is required for PayPal payout.");
      return;
    }

    setIsRequestingPayout(true);
    const token = localStorage.getItem("token");

    const payoutDetails = payoutMethod === "bank" ? bankDetails : { paypalEmail };

    try {
      await axios.post(
        "http://localhost:5000/api/payouts",
        {
          amount: earnings,
          paymentMethod,
          details: payoutDetails,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Payout request submitted!");
      setShowPayout(false);
      fetchMetrics(token);
      fetchPayoutHistory(token);
    } catch (err) {
      console.error("Request payout error:", err);
      setPayoutRequestError(err.response?.data?.message || "Failed to request payout.");
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const formatActivityTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      {loadingProfile ? (
        <p>Loading profile data...</p>
      ) : error && !isCreator ? (
        <p style={{ color: "#dc3545" }}>{error}</p>
      ) : !user ? (
        <p>User data not available. Please try logging in again.</p>
      ) : null}

      {isCreator && (
        <div className="creator-dashboard-content">
          {error && <p style={{ color: "#dc3545" }}>{error}</p>}
          <div className="metrics-cards">
            <div className="metric-card">
              <FaDollarSign className="metric-icon" />
              <h3>Monthly Earnings</h3>
              {loadingMetrics ? <p>Loading...</p> : <p>${earnings.toFixed(2)}</p>}
            </div>
            <div className="metric-card">
              <FaUsers className="metric-icon" />
              <h3>Total Subscribers</h3>
              {loadingMetrics ? <p>Loading...</p> : <p>{subscribers}</p>}
            </div>
            <div className="metric-card">
              <FaChartLine className="metric-icon" />
              <h3>Engagement</h3>
              {loadingMetrics ? (
                <p>Loading...</p>
              ) : (
                <>
                  <p>Views: {engagementMetrics.views}</p>
                  <p>Likes: {engagementMetrics.likes}</p>
                  <p>Comments: {engagementMetrics.comments}</p>
                </>
              )}
            </div>
          </div>

          <div className="card-box" style={{ marginTop: "20px" }}>
            <h3>Payouts</h3>
            <button onClick={() => setShowPayout(!showPayout)} className="button" style={{ marginBottom: "10px" }}>
              {showPayout ? "Hide Payout Form" : "Request Payout"}
            </button>

            {showPayout && (
              <div className="payout-form">
                <h4>Request New Payout</h4>
                {payoutRequestError && <p style={{ color: "#dc3545", marginBottom: "10px" }}>{payoutRequestError}</p>}
                {earnings < minimumThreshold && (
                  <p style={{ color: "#ffc107", marginBottom: "10px" }}>
                    Current earnings (${earnings.toFixed(2)}) are below the minimum threshold of ${minimumThreshold}.
                  </p>
                )}
                <div style={{ marginBottom: "10px" }}>
                  <label>Amount to Payout:</label>
                  <p>
                    <strong>${earnings.toFixed(2)}</strong>
                  </p>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label>Payout Method:</label>
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} style={{ marginLeft: "10px" }}>
                    <option value="">Select Method</option>
                    <option value="bank">Bank Account</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                {payoutMethod === "bank" && (
                  <div style={{ marginBottom: "10px" }}>
                    <label>Bank Account Number:</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      style={{ marginLeft: "10px" }}
                    />
                    <label style={{ marginLeft: "20px" }}>Routing Number:</label>
                    <input
                      type="text"
                      value={bankDetails.routingNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                      style={{ marginLeft: "10px" }}
                    />
                  </div>
                )}

                {payoutMethod === "paypal" && (
                  <div style={{ marginBottom: "10px" }}>
                    <label>PayPal Email:</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      style={{ marginLeft: "10px" }}
                    />
                  </div>
                )}

                <button
                  onClick={handleRequestPayout}
                  className="button"
                  disabled={earnings < minimumThreshold || isRequestingPayout}
                >
                  {isRequestingPayout ? "Requesting..." : "Submit Payout Request"}
                </button>
              </div>
            )}

            <div className="payout-history" style={{ marginTop: "20px" }}>
              <h4>
                <FaHistory style={{ marginRight: "5px" }} /> Payout History
              </h4>
              {loadingPayouts ? (
                <p>Loading payout history...</p>
              ) : payoutHistory.length === 0 ? (
                <p>No payout history.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Date Requested</th>
                      <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Amount</th>
                      <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Method</th>
                      <th style={{ border: "1px solid var(--secondary)", padding: "8px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutHistory.map((payout) => (
                      <tr key={payout._id}>
                        <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>
                          {new Date(payout.requestDate).toLocaleDateString()}
                        </td>
                        <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>${payout.amount.toFixed(2)}</td>
                        <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>{payout.paymentMethod}</td>
                        <td style={{ border: "1px solid var(--secondary)", padding: "8px" }}>{payout.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card-box" style={{ marginTop: "20px" }}>
            <h3>Recent Activity</h3>
            {loadingActivity ? (
              <p>Loading recent activity...</p>
            ) : recentActivity.length === 0 ? (
              <p>No recent activity.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {recentActivity.map((activity, index) => (
                  <li
                    key={index}
                    style={{ marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}
                  >
                    <p>{activity.description}</p>
                    <small style={{ color: "#666" }}>{formatActivityTimestamp(activity.timestamp)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!loadingProfile && !isCreator && (
        <div className="supporter-dashboard-content">
          <h3>Welcome Supporter!</h3>
          {error && <p style={{ color: "#dc3545" }}>{error}</p>}
          <p>Your supporter dashboard content would go here.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;