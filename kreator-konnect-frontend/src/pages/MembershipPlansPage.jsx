import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Use axios for consistency
import "./MembershipPlansPage.css"; // Assuming this CSS file exists for styling

const MembershipPlansPage = () => {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]); // State to hold the creator's tiers
  const [form, setForm] = useState({ name: "", price: "", benefits: "" }); // State for the new tier form
  const [error, setError] = useState("");
  const [loadingTiers, setLoadingTiers] = useState(true); // Loading state for fetching tiers
  const [addingTier, setAddingTier] = useState(false); // Loading state for adding a tier


  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;;
    }

    fetchTiers(); // Fetch the creator's own tiers on component mount

  }, [navigate, token]); // Added token to dependencies


  // Fetch the logged-in user's tiers
  const fetchTiers = async () => {
    setLoadingTiers(true);
    try {
      // Use the new backend route to fetch the logged-in user's tiers
      const response = await axios.get("http://localhost:5000/api/tiers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTiers(response.data.tiers || []);
      setError(""); // Clear any previous errors on successful fetch
    } catch (err) {
      console.error("Fetch creator tiers error:", err);
      setError(err.response?.data?.message || "Failed to load your tiers. Please try again.");
      setTiers([]); // Clear tiers on error
    } finally {
      setLoadingTiers(false);
    }
  };

  // Handle input changes for the new tier form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle adding a new tier
  const addTier = async () => {
    setError(""); // Clear previous errors

    // Basic form validation
    if (!form.name.trim() || !form.price || form.price < 0 || !form.benefits.trim()) {
         setError("Please fill in all fields with valid data.");
         return;
    }

    setAddingTier(true);

    try {
      // Prepare benefits as an array of strings
      const benefitsArray = form.benefits.split(',').map(benefit => benefit.trim()).filter(benefit => benefit !== '');

      const response = await axios.post(
        "http://localhost:5000/api/tiers", // Use the existing create tier route
        {
          name: form.name.trim(),
          price: parseFloat(form.price), // Ensure price is a number
          benefits: benefitsArray,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Tier added successfully!");
      setForm({ name: "", price: "", benefits: "" }); // Clear the form
      fetchTiers(); // Refresh the list of tiers
      setError(""); // Clear error on success

    } catch (err) {
      console.error("Add tier error:", err);
      setError(err.response?.data?.message || "Failed to add tier. Please try again.");
    } finally {
        setAddingTier(false);
    }
  };

  // No handleSubscribe function here anymore, as this page is for creators


  return (
    <div className="container">
      <h2>Membership Plans (Your Tiers)</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>} {/* Display errors */}

      {/* Create a New Tier Section */}
      <div className="card-box creator-panel"> {/* Use a specific class for creator panel styling */}
        <h3>Create a New Tier</h3>
        <input
          type="text"
          name="name"
          placeholder="Tier Name"
          value={form.name}
          onChange={handleInputChange}
          style={{ marginBottom: "10px", display: "block", width: "100%" }}
        />
        <input
          type="number"
          name="price"
          placeholder="Price ($)"
          value={form.price}
          onChange={handleInputChange}
          style={{ marginBottom: "10px", display: "block", width: "100%" }}
        />
        <textarea
          name="benefits"
          placeholder="List of benefits (comma-separated)"
          value={form.benefits}
          onChange={handleInputChange}
          style={{ marginBottom: "10px", display: "block", width: "100%", minHeight: "80px" }}
        />
        <button onClick={addTier} className="button" disabled={addingTier}>
           {addingTier ? 'Adding Tier...' : 'Add Tier'}
        </button>
      </div>

      {/* Display Existing Tiers Section */}
      <div className="card-box" style={{ marginTop: "20px" }}> {/* Use a specific class for existing tiers display */}
        <h3>Your Existing Tiers</h3>
         {loadingTiers ? (
             <p>Loading your tiers...</p>
         ) : tiers.length === 0 ? (
           <p>You haven't created any tiers yet.</p>
         ) : (
           <div className="tiers-list"> {/* Use a specific class for the list layout */}
             {tiers.map((tier) => (
               <div key={tier._id} className="tier-card"> {/* Reuse tier-card class for individual tier display */}
                 <h4>{tier.name}</h4>
                 <p className="price">${tier.price}/month</p>
                 <ul>
                   {tier.benefits.map((benefit, i) => (
                     <li key={i}>{benefit}</li>
                   ))}
                 </ul>
                 {/* FUTURE: Add Edit and Delete buttons for each tier */}
               </div>
             ))}
           </div>
         )}
      </div>

       {/* Removed the user-facing "Compare Membership Tiers" section */}

    </div>
  );
};

export default MembershipPlansPage;