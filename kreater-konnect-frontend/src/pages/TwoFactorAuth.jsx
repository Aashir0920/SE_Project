import authApi from "../api/authApi";
import "../index.css";

const TwoFactorAuth = () => {
  const enable2FA = async () => {
    await authApi.enable2FA();
    alert("2FA Enabled!");
  };

  return (
    <div className="container">
      <h2>Two-Factor Authentication</h2>
      <button onClick={enable2FA}>Enable 2FA</button>
    </div>
  );
};

export default TwoFactorAuth;
