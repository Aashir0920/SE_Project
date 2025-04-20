import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaEnvelope, FaTachometerAlt, FaHeart } from "react-icons/fa";

const OwnProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [posts, setPosts] = useState([]);
  const [newComments, setNewComments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BACKEND: Fetch user profile
    // GET /api/user/profile
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { profile: { profilePic, bio, socialLinks } }
    const storedProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const defaultProfile = {
      profilePic: "",
      bio: "Welcome to my profile!",
      socialLinks: "",
    };
    setProfile({ ...defaultProfile, ...storedProfile });

    // BACKEND: Fetch user posts
    // GET /api/user/posts
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { posts: [{ id, type, content, exclusive, taggedUsers, ... }] }
    const storedPosts = JSON.parse(localStorage.getItem("userPosts") || "[]");
    const initializedPosts = storedPosts.map(post => ({
      ...post,
      content: post.content || {},
      comments: post.comments || [],
      likes: post.likes || 0,
      likedBy: post.likedBy || [],
      taggedUsers: post.taggedUsers || [],
      exclusive: post.exclusive || false,
    }));
    setPosts(initializedPosts.filter(p => p.creatorId === "user_123"));
    setLoading(false);
  }, []);

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleAddPost = () => {
    navigate("/add-post");
  };

  const handleVote = (postId, index) => {
    // BACKEND: Vote on a poll
    // POST /api/polls/vote
    // Request: { postId, optionIndex: index, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Vote recorded" }
    const updated = posts.map(p =>
      p.id === postId ? { ...p, selectedOption: index } : p
    );
    setPosts(updated);
  };

  const handleDeletePost = (postId) => {
    // BACKEND: Delete a post
    // DELETE /api/posts/:id
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Post deleted" }
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem("userPosts", JSON.stringify(updatedPosts));
    alert("Post deleted!");
  };

  const handleLike = (postId) => {
    // BACKEND: Like a post
    // POST /api/posts/:id/like
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Post liked", likes: number }
    const userId = "user_123";
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(userId);
        return {
          ...post,
          likes: hasLiked ? post.likes - 1 : post.likes + 1,
          likedBy: hasLiked
            ? post.likedBy.filter(id => id !== userId)
            : [...post.likedBy, userId],
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    localStorage.setItem("userPosts", JSON.stringify(updatedPosts));
  };

  const handleComment = (postId) => {
    // BACKEND: Add a comment to a post
    // POST /api/posts/:id/comments
    // Request: { text: string, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Comment added", comment: { id, userId, text } }
    const commentText = newComments[postId]?.trim();
    if (!commentText) return;
    const userId = "user_123";
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            { id: Date.now(), userId, text: commentText },
          ],
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    setNewComments({ ...newComments, [postId]: "" });
    localStorage.setItem("userPosts", JSON.stringify(updatedPosts));
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
      <button
        onClick={() => navigate("/feed")}
        className="back-button"
        style={{ marginBottom: "20px" }}
      >
        ← Back to Feed
      </button>
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
              {(profile.socialLinks?.split(",").filter(link => link.trim()) || []).map((link, idx) => (
                <li key={idx}>
                  <a href={link.trim()} target="_blank" rel="noopener noreferrer">
                    {new URL(link.trim()).hostname.replace("www.", "")}
                  </a>
                </li>
              ))}
              {!profile.socialLinks && <li>No links added.</li>}
            </ul>
          </div>
          <button onClick={handleEditProfile} className="edit-button">
            Edit Profile
          </button>
          <button onClick={handleAddPost} className="save-button">
            Add Post
          </button>
        </div>
      </div>
      <h3>Your Feed</h3>
      <div className="post-feed">
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map(post => {
            const userId = "user_123";
            const hasLiked = post.likedBy.includes(userId);
            return (
              <div key={post.id} className="post-wrapper">
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
                              src={file.url}
                              alt="Post media"
                              style={{ maxWidth: "200px", borderRadius: "5px" }}
                            />
                          ) : file.type === "video" ? (
                            <video
                              controls
                              src={file.url}
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
                            onClick={() => handleVote(post.id, index)}
                            disabled={post.selectedOption !== undefined}
                          >
                            {opt}
                          </button>
                          {post.selectedOption === index && <span> ✅</span>}
                        </div>
                      ))}
                    </>
                  )}
                  {post.taggedUsers?.length > 0 && (
                    <p style={{ marginTop: "5px" }}>
                      <strong>Tagged:</strong>{" "}
                      {post.taggedUsers.map(id => (id === "user_456" ? "Fan One" : "Fan Two")).join(", ")}
                    </p>
                  )}
                  <div className="post-interactions" style={{ marginTop: "10px" }}>
                    <div className="like-section">
                      <FaHeart
                        className={`like-icon ${hasLiked ? "liked" : ""}`}
                        onClick={() => handleLike(post.id)}
                      />
                      <span>{post.likes} {post.likes === 1 ? "Like" : "Likes"}</span>
                    </div>
                    <div className="comment-section">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComments[post.id] || ""}
                        onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                        className="comment-input"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="comment-button"
                      >
                        Comment
                      </button>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="comments-list">
                        {post.comments.map(comment => (
                          <div key={comment.id} className="comment">
                            <strong>{comment.userId}</strong>: {comment.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FaTrashAlt
                    onClick={() => handleDeletePost(post.id)}
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