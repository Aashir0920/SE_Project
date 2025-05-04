import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaTachometerAlt, FaHeart, FaSearch } from "react-icons/fa";
import axios from "axios";
import "../index.css";

const FeedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [newComments, setNewComments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSubscribedPosts();

    if (location.state?.subscribed) {
      alert("Subscribed successfully!");
      fetchSubscribedPosts();
    }
  }, [navigate, token, location]);

  const fetchSubscribedPosts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/posts/creator", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error("Fetch subscribed posts error:", err);
      setError(err.response?.data?.message || "Failed to load posts. Please try again.");
      setPosts([]); // Clear posts on error
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const response = await axios.get(`http://localhost:5000/api/user?email=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResults(response.data.users);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectUser = async (user) => {
    // Check if already subscribed - This check can be moved to the subscribe page or backend
    // For now, navigate to the subscribe page
    navigate(`/subscribe/${user._id}`);
    setSearchQuery(""); // Clear search input
    setSearchResults([]); // Clear search results
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update the like count and likedBy status in the state
      setPosts(posts.map(post => {
        if (post._id === postId) {
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
      }));
    } catch (err) {
      console.error("Like post error:", err);
      setError(err.response?.data?.message || "Failed to like post.");
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setNewComments({ ...newComments, [postId]: value });
  };

  const handleComment = async (postId) => {
    const text = newComments[postId];
    if (!text) {
      setError("Comment text cannot be empty.");
      return;
    }
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update the comments in the state
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, response.data.comment],
          };
        }
        return post;
      }));
      setNewComments({ ...newComments, [postId]: "" }); // Clear the input
    } catch (err) {
      console.error("Comment post error:", err);
      setError(err.response?.data?.message || "Failed to add comment.");
    }
  };

  return (
    <div className="container">
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search creators by email..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((user) => (
              <li key={user._id} onClick={() => handleSelectUser(user)}>
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2>Feed</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}
      <div className="post-list">
        {posts.length === 0 ? (
          <p>No posts available. Subscribe to creators to see their posts.</p>
        ) : (
          posts
            .map((post) => {
              const hasLiked = post.likedBy.includes(userId);
              return (
                <div key={post._id} className="post-card">
                  <h3>{post.creatorName}</h3>
                  <p>{post.content.text}</p>

                  {/* Render Media */}
                  {post.type === 'media' && post.content.media && (
                    <div className="post-media">
                      {post.content.media.map((mediaItem, index) => (
                        mediaItem.type === 'image' ? (
                          <img key={index} src={`http://localhost:5000${mediaItem.url}`} alt="Post media" style={{ maxWidth: '100%', height: 'auto' }} />
                        ) : (
                          <video key={index} src={`http://localhost:5000${mediaItem.url}`} controls style={{ maxWidth: '100%', height: 'auto' }} />
                        )
                      ))}
                    </div>
                  )}

                  {/* Render Poll */}
                   {post.type === 'poll' && post.content.options && (
                    <div className="post-poll">
                      <p><strong>Poll:</strong></p>
                      <ul>
                        {post.content.options.map((option, index) => (
                          <li key={index}>{option.text}</li>
                        ))}
                      </ul>
                      {/* Poll voting logic would go here */}
                    </div>
                  )}

                   {/* Render Fundraiser */}
                    {post.type === 'fundraiser' && post.fundingGoal && (
                      <div className="post-fundraiser">
                        <p><strong>Fundraiser:</strong> Goal: ${post.fundingGoal} - Raised: ${post.currentAmount || 0}</p>
                        {/* Fundraiser contribution logic would go here */}
                      </div>
                    )}


                  <div className="post-actions">
                    <div className="like-section" onClick={() => handleLike(post._id)}>
                      <FaHeart style={{ color: hasLiked ? "red" : "gray", cursor: "pointer" }} />
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
                    {post.comments?.length > 0 && (
                      <div className="comments-list">
                        {post.comments.map((comment) => (
                          // Note: comment.userId here is just a string ID, not populated user object
                          // You might want to populate this in the backend if you want to show commenter's name
                          <div key={comment._id} className="comment">
                            <strong>{comment.userId}</strong>: {comment.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default FeedPage;