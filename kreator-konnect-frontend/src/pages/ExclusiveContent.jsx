import { useEffect, useState } from "react";
import userApi from "../api/userApi";
import "../index.css"; // ✅ Import global styles

const ExclusiveContent = () => {
  const [content, setContent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    userApi.getExclusiveContent()
      .then(res => setContent(res.data))
      .catch(() => setError("Subscribe to access premium content"));
  }, []);

  return (
    <div className="container">
      <h2>Exclusive Content</h2>
      {error ? <p>{error}</p> : content.map((item) => <p key={item.id}>{item.title}</p>)}
    </div>
  );
};

export default ExclusiveContent;
