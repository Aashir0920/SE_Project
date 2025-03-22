import { useState, useEffect } from "react";
import subscriptionApi from "../api/subscriptionApi";
import "../index.css"; // ✅ Import global styles

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    subscriptionApi.getSubscription().then((res) => setSubscription(res.data));
  }, []);

  const handleCancel = async () => {
    await subscriptionApi.cancelSubscription();
    alert("Subscription Canceled!");
  };

  return (
    <div className="container">
      <h2>Subscription</h2>
      {subscription ? <p>Active Plan: <strong>{subscription.plan}</strong></p> : <p>No Active Subscription</p>}
      {subscription && <button onClick={handleCancel}>Cancel Subscription</button>}
    </div>
  );
};

export default Subscription;
