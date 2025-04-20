import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const SubscribeTiersPage = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
    paypalEmail: "",
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    // BACKEND: Fetch membership tiers for the creator
    // GET /api/user/:creatorId/tiers
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { tiers: [{ name, price, benefits: string }] }
    const mockTiers = [
      { name: "Basic", price: 5, benefits: "Access to posts, Monthly Q&A" },
      { name: "Premium", price: 10, benefits: "Exclusive content, Live streams, Shoutouts" },
      { name: "Elite", price: 20, benefits: "All Premium benefits, 1:1 chat, Merch" },
    ];
    setTiers(mockTiers);
  }, [creatorId]);

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePaymentInputChange = (e) => {
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = () => {
    // BACKEND: Process payment
    // POST /api/payments
    // Request: { creatorId, tierName, paymentMethod, paymentDetails: { cardNumber?, expiry?, cvv?, cardName?, paypalEmail? }, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Payment successful", subscriptionId: string }
    if (
      (paymentMethod === "card" &&
        paymentDetails.cardNumber &&
        paymentDetails.expiry &&
        paymentDetails.cvv &&
        paymentDetails.cardName) ||
      (paymentMethod === "paypal" && paymentDetails.paypalEmail)
    ) {
      alert(`Payment successful for ${selectedTier.name}!`);
      setShowPaymentModal(false);
      setPaymentDetails({
        cardNumber: "",
        expiry: "",
        cvv: "",
        cardName: "",
        paypalEmail: "",
      });
      // Mock: Set subscription status
      localStorage.setItem(`isSubscribed_${creatorId}`, "true");
      navigate(`/profile/${creatorId}`);
    } else {
      alert("Please fill in all required payment details.");
    }
  };

  return (
    <div className="container">
      <button
        onClick={() => navigate(`/profile/${creatorId}`)}
        className="back-button"
        style={{ marginBottom: "20px" }}
      >
        ← Back to Profile
      </button>
      <h2>Choose a Subscription Tier</h2>
      <div className="tiers">
        {tiers.length > 0 ? (
          tiers.map((tier, index) => (
            <div key={index} className="tier-card">
              <h4>{tier.name}</h4>
              <p className="price">${tier.price}/month</p>
              <ul>
                {tier.benefits.split(",").map((benefit, i) => (
                  <li key={i}>{benefit.trim()}</li>
                ))}
              </ul>
              <button onClick={() => handleSelectTier(tier)} className="button">
                Select Tier
              </button>
            </div>
          ))
        ) : (
          <p>No tiers available.</p>
        )}
      </div>

      {showPaymentModal && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <h3>Payment for {selectedTier.name}</h3>
            <p>Amount: ${selectedTier.price}/month</p>
            <div className="payment-method-toggle">
              <label>
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                Credit/Debit Card
              </label>
              <label>
                <input
                  type="radio"
                  value="paypal"
                  checked={paymentMethod === "paypal"}
                  onChange={() => setPaymentMethod("paypal")}
                />
                PayPal
              </label>
            </div>
            {paymentMethod === "card" ? (
              <div className="payment-form">
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="Card Number"
                  value={paymentDetails.cardNumber}
                  onChange={handlePaymentInputChange}
                  className="input"
                />
                <input
                  type="text"
                  name="expiry"
                  placeholder="MM/YY"
                  value={paymentDetails.expiry}
                  onChange={handlePaymentInputChange}
                  className="input"
                />
                <input
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  value={paymentDetails.cvv}
                  onChange={handlePaymentInputChange}
                  className="input"
                />
                <input
                  type="text"
                  name="cardName"
                  placeholder="Name on Card"
                  value={paymentDetails.cardName}
                  onChange={handlePaymentInputChange}
                  className="input"
                />
              </div>
            ) : (
              <div className="payment-form">
                <input
                  type="email"
                  name="paypalEmail"
                  placeholder="PayPal Email"
                  value={paymentDetails.paypalEmail}
                  onChange={handlePaymentInputChange}
                  className="input"
                />
              </div>
            )}
            <div className="payment-modal-actions">
              <button onClick={handlePaymentSubmit} className="button">
                Submit Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="button cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribeTiersPage;