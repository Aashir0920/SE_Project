import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState("");

  useEffect(() => {
    // BACKEND: Fetch user profile
    // GET /api/user/profile
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { profile: { profilePic, bio, socialLinks } }
    const storedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (storedProfile) {
      setProfilePic(storedProfile.profilePic);
      setBio(storedProfile.bio);
      setSocialLinks(storedProfile.socialLinks);
    }
  }, []);

  const handleGoBack = () => {
    navigate("/profile");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
      // BACKEND: Upload profile picture
      // POST /api/user/profile-pic
      // Request: FormData { profilePic: file }
      // Response: { imageUrl: string }
    }
  };

  const handleSave = () => {
    const profileData = {
      profilePic,
      bio,
      socialLinks,
    };
    // BACKEND: Update user profile
    // POST /api/user/update-profile
    // Request: { profilePic, bio, socialLinks, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Profile updated" }
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    alert("Profile changes saved successfully!");
    navigate("/profile");
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