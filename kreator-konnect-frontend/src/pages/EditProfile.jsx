import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setProfilePic(data.profile.profilePic);
        setBio(data.profile.bio);
        setSocialLinks(data.profile.socialLinks.join(","));
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleGoBack = () => {
    navigate("/profile");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/user/profile-pic", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setProfilePic(data.imageUrl);
    } catch (err) {
      setError(err.message || "Failed to upload profile picture");
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profilePic,
          bio,
          socialLinks: socialLinks.split(",").map((link) => link.trim()),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert("Profile changes saved successfully!");
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    }
  };

  const handleEnable2FA = () => {
    navigate("/2fa");
  };

  return (
    <div className="container">
      <button onClick={handleGoBack} className="back-button">
        ← Go Back to Profile
      </button>
      <h2>Edit Your Profile</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}
      <div className="image-section">
        <label className="image-label">Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="image-input"
        />
        {profilePic && (
          <div className="image-preview">
            <img src={profilePic} alt="Profile Preview" className="profile-preview" />
          </div>
        )}
      </div>
      <div className="form-section">
        <label>Bio</label>
        <textarea
          rows="4"
          placeholder="Write something about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="textarea"
        />
      </div>
      <div className="form-section">
        <label>Social Media Links</label>
        <input
          type="text"
          placeholder="Enter your links (comma-separated)"
          value={socialLinks}
          onChange={(e) => setSocialLinks(e.target.value)}
          className="input"
        />
      </div>
      <div className="button-group">
        <button onClick={handleEnable2FA} className="enable-2fa-button">
          Enable Two-Factor Authentication
        </button>
      </div>
      <div className="button-group">
        <button onClick={handleSave} className="save-button">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfile;