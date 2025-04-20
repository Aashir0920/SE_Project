import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MembershipPlansPage.css";

const MembershipPlansPage = () => {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", benefits: "" });

  useEffect(() => {
    // BACKEND: Fetch membership tiers
    // GET /api/tiers
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { tiers: [{ name, price, benefits: string }] }
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTier = () => {
    if (form.name && form.price && form.benefits) {
      // BACKEND: Create new membership tier
      // POST /api/tiers
      // Request: { name, price, benefits, headers: { Authorization: "Bearer <token>" } }
      // Response: { message: "Tier created", tierId: string }
      setTiers([...tiers, { ...form }]);
      setForm({ name: "", price: "", benefits: "" });
    }
  };

  const handleSubscribe = (tierId) => {
    // BACKEND: Subscribe to a tier
    // POST /api/tiers/subscribe
    // Request: { tierId, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Subscribed to tier" }
    alert(`Subscribed to ${tierId}`);
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
      <h2>Membership Plans</h2>
      <div className="membership-container">
        <div className="creator-panel">
          <h3>Create a New Tier</h3>
          <input
            type="text"
            name="name"
            placeholder="Tier Name"
            value={form.name}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="price"
            placeholder="Price ($)"
            value={form.price}
            onChange={handleInputChange}
          />
          <textarea
            name="benefits"
            placeholder="List of benefits (comma-separated)"
            value={form.benefits}
            onChange={handleInputChange}
          />
          <button onClick={addTier}>Add Tier</button>
        </div>
        <div className="user-panel">
          <h3>Compare Membership Tiers</h3>
          <div className="tiers">
            {tiers.map((tier, index) => (
              <div key={index} className="tier-card">
                <h4>{tier.name}</h4>
                <p className="price">${tier.price}/month</p>
                <ul>
                  {tier.benefits.split(",").map((benefit, i) => (
                    <li key={i}>{benefit.trim()}</li>
                  ))}
                </ul>
                <button onClick={() => handleSubscribe(tier.name)}>Subscribe</button>
              </div>
            ))}
            {tiers.length === 0 && <p>No tiers created yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlansPage;