import React, { useState, useEffect } from "react";

const ExclusiveContentPage = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [content, setContent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/subscription-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setIsSubscribed(data.isSubscribed);
      } catch (err) {
        setError(err.message || "Failed to check subscription status");
      }
    };

    const fetchContent = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/exclusive-content", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setContent(data.content);
      } catch (err) {
        setError(err.message || "Failed to fetch content");
      }
    };

    fetchSubscriptionStatus();
    if (isSubscribed) fetchContent();
  }, [isSubscribed]);

  const handleSubscribe = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setIsSubscribed(true);
      alert("Subscribed successfully!");
    } catch (err) {
      setError(err.message || "Failed to subscribe");
    }
  };

  return (
    <div className="container">
      <h2>Exclusive Content</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}
      {isSubscribed ? (
        <div className="exclusive-content">
          <p>🎉 Welcome to your exclusive content feed!</p>
          {content.map((item, index) => (
            <div key={index} className="content-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="subscribe-prompt">
          <p>🚫 This content is for subscribers only.</p>
          <button className="btn subscribe" onClick={handleSubscribe}>
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  );
};

export default ExclusiveContentPage;