import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaEnvelope, FaTachometerAlt, FaHeart } from "react-icons/fa";

const OwnProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [posts, setPosts] = useState([]);
  const [newComments, setNewComments] = useState({});
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ profile: "", posts: "", subscription: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch profile");
        setProfile(data.profile);
      } catch (err) {
        setErrors((prev) => ({ ...prev, profile: err.message }));
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/posts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch posts");
        setPosts(data.posts || []);
      } catch (err) {
        setErrors((prev) => ({ ...prev, posts: err.message }));
      }
    };

    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/subscription-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch subscription status");
        setSubscriptionStatus(data);
      } catch (err) {
        setErrors((prev) => ({ ...prev, subscription: err.message }));
      }
    };

    Promise.all([fetchProfile(), fetchPosts(), fetchSubscriptionStatus()]).then(() => setLoading(false));
  }, [navigate]);

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleAddPost = () => {
    navigate("/add-post");
  };

  const handleVote = async (postId, index) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/polls/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, optionIndex: index }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to vote");
      setPosts(posts.map((p) => (p._id === postId ? { ...p, selectedOption: index } : p)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete post");
      setPosts(posts.filter((post) => post._id !== postId));
      alert("Post deleted!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to like post");
      setPosts(
        posts.map((post) =>
          post._id === postId
            ? { ...post, likes: data.likes, likedBy: data.likedBy }
            : post
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComment = async (postId) => {
    const commentText = newComments[postId]?.trim();
    if (!commentText) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add comment");
      setPosts(
        posts.map((post) =>
          post._id === postId
            ? { ...post, comments: [...post.comments, data.comment] }
            : post
        )
      );
      setNewComments({ ...newComments, [postId]: "" });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setNewComments({ ...newComments, [postId]: value });
  };

  const handleMessageClick = () => {
    navigate("/messages");
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="nav-buttons">
        <button onClick={() => navigate("/feed")} className="back-button">
          ← Back to Feed
        </button>
        <button onClick={() => navigate("/dashboard")} className="button">
          Go to Dashboard
        </button>
      </div>
      <div className="profile-container" style={{ position: "relative" }}>
        <div className="profile-box">
          <div className="profile-icons">
            <FaEnvelope
              className="profile-action-icon"
              title="Messages"
              onClick={handleMessageClick}
            />
            <FaTachometerAlt
              className="profile-action-icon"
              title="Dashboard"
              onClick={() => navigate("/dashboard")}
            />
          </div>
          {errors.profile && <p style={{ color: "#dc3545" }}>{errors.profile}</p>}
          {errors.subscription && <p style={{ color: "#dc3545" }}>{errors.subscription}</p>}
          {profile.profilePic && (
            <img
              src={profile.profilePic}
              alt="Profile"
              className="profile-preview"
              style={{ maxWidth: "150px", borderRadius: "50%" }}
            />
          )}
          <h2>{profile.bio || "No bio yet"}</h2>
          <div>
            <strong>Social Links:</strong>
            <ul className="social-links">
              {(profile.socialLinks?.filter((link) => link.trim()) || []).map((link, idx) => (
                <li key={idx}>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {new URL(link).hostname.replace("www.", "")}
                  </a>
                </li>
              ))}
              {!profile.socialLinks?.length && <li>No links added.</li>}
            </ul>
          </div>
          {subscriptionStatus && (
            <p>
              <strong>Subscription Status:</strong>{" "}
              {subscriptionStatus.isCreator ? "Creator" : "Subscriber"}
            </p>
          )}
          <button onClick={handleEditProfile} className="edit-button">
            Edit Profile
          </button>
          <button onClick={handleAddPost} className="save-button">
            Add Post
          </button>
        </div>
      </div>
      <h3>Your Feed</h3>
      {errors.posts && <p style={{ color: "#dc3545" }}>{errors.posts}</p>}
      <div className="post-feed">
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => {
            const userId = localStorage.getItem("userId");
            const hasLiked = post.likedBy.includes(userId);
            return (
              <div key={post._id} className="post-wrapper">
                <div className="post-card">
                  {post.exclusive && (
                    <span style={{ color: "#007bff", fontWeight: "bold", marginBottom: "5px", display: "block" }}>
                      [Exclusive]
                    </span>
                  )}
                  {post.content.text && <p>{post.content.text}</p>}
                  {post.type === "media" && post.content.media?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                      {post.content.media.map((file, index) => (
                        <div key={index}>
                          {file.type === "image" ? (
                            <img
                              src={`http://localhost:5000${file.url}`}
                              alt="Post media"
                              style={{ maxWidth: "200px", borderRadius: "5px" }}
                            />
                          ) : file.type === "video" ? (
                            <video
                              controls
                              src={`http://localhost:5000${file.url}`}
                              style={{ maxWidth: "200px", borderRadius: "5px" }}
                            />
                          ) : (
                            <p>{file.url}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {post.type === "fundraiser" && (
                    <>
                      <div className="fundraiser-progress">
                        <p>
                          Raised: ${post.currentAmount || 0} of ${post.fundingGoal}
                          {post.goalDeadline && (
                            <span> (Ends: {new Date(post.goalDeadline).toLocaleDateString()})</span>
                          )}
                        </p>
                        <div className="progress-bar" style={{ marginTop: "10px" }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${
                                post.fundingGoal > 0
                                  ? ((post.currentAmount || 0) / post.fundingGoal) * 100
                                  : 0
                              }%`,
                              height: "20px",
                              backgroundColor: "#007bff",
                              borderRadius: "5px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {post.type === "poll" && (
                    <>
                      <h4>{post.content.text}</h4>
                      {post.content.options?.map((opt, index) => (
                        <div key={index}>
                          <button
                            className="poll-button"
                            onClick={() => handleVote(post._id, index)}
                            disabled={post.votedBy?.includes(userId)}
                          >
                            {opt.text}
                          </button>
                          {post.selectedOption === index && <span> ✅</span>}
                        </div>
                      ))}
                    </>
                  )}
                  {post.taggedUsers?.length > 0 && (
                    <p style={{ marginTop: "5px" }}>
                      <strong>Tagged:</strong>{" "}
                      {post.taggedUsers.map((id) => id).join(", ")}
                    </p>
                  )}
                  <div className="post-interactions" style={{ marginTop: "10px" }}>
                    <div className="like-section">
                      <FaHeart
                        className={`like-icon ${hasLiked ? "liked" : ""}`}
                        onClick={() => handleLike(post._id)}
                      />
                      <span>{post.likes} {post.likes === 1 ? "Like" : "Likes"}</span>
                    </div>
                    <div className="comment-section">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComments[post._id] || ""}
                        onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                        className="comment-input"
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="comment-button"
                      >
                        Comment
                      </button>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="comments-list">
                        {post.comments.map((comment) => (
                          <div key={comment._id} className="comment">
                            <strong>{comment.userId}</strong>: {comment.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FaTrashAlt
                    onClick={() => handleDeletePost(post._id)}
                    className="delete-icon"
                    style={{ marginTop: "10px", cursor: "pointer" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OwnProfile;