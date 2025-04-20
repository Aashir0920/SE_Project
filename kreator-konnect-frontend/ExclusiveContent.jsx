import React, { useState, useEffect } from "react";

const ExclusiveContentPage = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [content, setContent] = useState([]);

  useEffect(() => {
    // BACKEND: Check subscription status
    // GET /api/user/subscription-status
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { isSubscribed: boolean }
    // BACKEND: Fetch exclusive content
    // GET /api/exclusive-content
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { content: [{ title: string, description: string }] }
    setContent([
      { title: "Behind-the-Scenes Vlog", description: "Only for our valued supporters!" },
      { title: "Early Access Episode", description: "Watch before everyone else 👀" },
    ]);
  }, []);

  const handleSubscribe = () => {
    // BACKEND: Subscribe to creator
    // POST /api/subscribe
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Subscribed successfully" }
    setIsSubscribed(true);
    alert("Subscribed!");
  };

  return (
    <div className="container">
      <h2>Exclusive Content</h2>
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
          <button className="btn subscribe" onClick={handleSubscribe}>Subscribe Now</button>
        </div>
      )}
    </div>
  );
};

export default ExclusiveContentPage;