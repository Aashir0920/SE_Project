import { useState, useEffect } from "react";
import userApi from "../api/userApi";
import "../index.css";

const Profile = () => {
  const [profile, setProfile] = useState({ name: "", bio: "", avatar: "" });

  useEffect(() => {
    userApi.getProfile().then((res) => setProfile(res.data));
  }, []);

  const handleUpdate = async () => {
    await userApi.updateProfile(profile);
    alert("Profile Updated!");
  };

  return (
    <div className="container">
      <h2>Profile</h2>
      <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Name" />
      <input type="text" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio" />
      <button onClick={handleUpdate}>Save</button>
    </div>
  );
};

export default Profile;
