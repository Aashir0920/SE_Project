import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../index.css"; // Assuming styling from index.css is used

const SubscribeTiersPage = () => {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false); // New state for subscription status

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId"); // Get logged-in user ID

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch both tiers and subscription status concurrently
    const fetchData = async () => {
        setLoading(true);
        try {
            const [tiersResponse, subStatusResponse] = await Promise.all([
                axios.get(`http://localhost:5000/api/tiers/${creatorId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`http://localhost:5000/api/user/${creatorId}/subscription-status`, {
                     headers: { Authorization: `Bearer ${token}` },
                 }),
            ]);

            setTiers(tiersResponse.data.tiers || []);
            setIsAlreadySubscribed(subStatusResponse.data.isSubscribed); // Set the new state

        } catch (err) {
             console.error("Fetch tiers or subscription status error:", err);
             setError(err.response?.data?.message || "Failed to load tiers or subscription status. Please try again.");
             setTiers([]);
             setIsAlreadySubscribed(false); // Assume not subscribed on error
        } finally {
            setLoading(false);
        }
    };

    fetchData();


  }, [navigate, token, creatorId]); // Added creatorId to dependencies


  const handleSubscribe = async (tierId) => {
     setError(""); // Clear previous errors

     if (isAlreadySubscribed) {
         setError("You are already subscribed to this creator.");
         return; // Prevent subscribing if already subscribed
     }

    try {
      await axios.post(
        "http://localhost:5000/api/subscription",
        { tierId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Subscribed successfully!");
      // After subscribing, navigate back to the feed and pass state for a success message
      navigate("/feed", { state: { subscribed: true } });

    } catch (err) {
      console.error("Subscribe error:", err);
      setError(err.response?.data?.message || "Failed to subscribe. Please try again.");
    }
  };


   if (loading) {
       return <div className="container">Loading tiers...</div>;
   }

  return (
    <div className="container">
      <button onClick={() => navigate("/feed")} className="back-button">
        ← Back to Feed
      </button>
      <h2>Subscribe to Creator</h2>
       {error && <p style={{ color: "#dc3545" }}>{error}</p>} {/* Display errors */}


      {isAlreadySubscribed ? ( // Conditional rendering based on subscription status
          <div className="already-subscribed-message" style={{ textAlign: 'center', marginTop: '20px' }}>
              <p>🎉 You are already subscribed to this creator!</p>
              {/* You might add a link to manage subscriptions here */}
               {/* <button onClick={() => navigate("/subscription")} className="button" style={{ marginTop: "10px" }}>
                 Manage Your Subscriptions
               </button> */}
          </div>
      ) : tiers.length === 0 ? ( // If not subscribed and no tiers
        <p>No tiers available for this creator.</p>
      ) : ( // If not subscribed and tiers are available, show tiers
        <div className="tier-list" style={{ marginTop: '20px' }}> {/* Use a specific class for tier list */}
          {tiers.map((tier) => (
            <div key={tier._id} className="tier-card" style={{ marginBottom: '15px' }}> {/* Use a specific class for tier cards */}
              <h3>{tier.name}</h3>
              <p className="price">${tier.price}/month</p>
              {tier.benefits && Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                 <ul>
                   {tier.benefits.map((benefit, index) => (
                     <li key={index}>{benefit}</li>
                   ))}
                 </ul>
              )}
              <button onClick={() => handleSubscribe(tier._id)} className="button" style={{ marginTop: "10px" }}>
                Subscribe to this Tier
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscribeTiersPage;