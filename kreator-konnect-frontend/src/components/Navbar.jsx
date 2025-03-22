import { Link } from "react-router-dom";
import "../index.css";

const Navbar = () => {
  return (
    <nav className="container">
      <ul style={{ display: "flex", justifyContent: "center", gap: "15px", listStyle: "none", padding: 0 }}>
        <li><Link to="/">Login</Link></li>
        <li><Link to="/signup">Signup</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/subscription">Subscription</Link></li>
        <li><Link to="/exclusive">Exclusive Content</Link></li>
        <li><Link to="/2fa">2FA</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
