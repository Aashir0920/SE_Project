import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaEnvelope, FaUser } from "react-icons/fa";

const FeedPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newComments, setNewComments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // BACKEND: Fetch posts from subscribed creators
    // GET /api/feed/posts
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { posts: [{ id, creatorId, creatorName, type, content, exclusive, media, fundingGoal?, currentAmount?, goalDeadline?, comments: [{ id, userId, text }], likes: number, likedBy: [string], ... }] }
    const storedPosts = JSON.parse(localStorage.getItem("userPosts") || "[]");
    const subscriptions = JSON.parse(localStorage.getItem("subscriptions") || '["creator_123"]');
    const initializedPosts = storedPosts
      .filter(post => subscriptions.includes(post.creatorId || "creator_123"))
      .map(post => ({
        ...post,
        creatorId: post.creatorId || "creator_123",
        creatorName: post.creatorName || "Creator One",
        comments: post.comments || [],
        likes: post.likes || 0,
        likedBy: post.likedBy || [],
      }));
    setPosts(initializedPosts);

    // BACKEND: Initialize creators for search
    // GET /api/creators
    // Response: { creators: [{ id, name }] }
    const mockCreators = [
      { id: "creator_123", name: "Creator One" },
      { id: "creator_456", name: "Creator Two" },
    ];
    localStorage.setItem("creators", JSON.stringify(mockCreators));
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    // BACKEND: Search creators by name
    // GET /api/creators/search?name=<query>
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { creators: [{ id, name }] }
    const creators = JSON.parse(localStorage.getItem("creators") || "[]");
    if (!query.trim()) {
      setSearchResults([]); // Hide results when query is empty
    } else {
      const filtered = creators.filter(creator =>
        creator.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const handleCreatorClick = (creatorId) => {
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/profile/${creatorId}`);
  };

  const handleVote = (postId, index) => {
    // BACKEND: Vote on a poll
    // POST /api/polls/vote
    // Request: { postId, optionIndex: index, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Vote recorded" }
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, selectedOption: index } : p
    );
    setPosts(updated);
  };

  const handleLike = (postId) => {
    // BACKEND: Like a post
    // POST /api/posts/:id/like
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Post liked", likes: number }
    const userId = "user_123";
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(userId);
        return {
          ...post,
          likes: hasLiked ? post.likes - 1 : post.likes + 1,
          likedBy: hasLiked
            ? post.likedBy.filter((id) => id !== userId)
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
    const updatedPosts = posts.map((post) => {
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
    // BACKEND: Navigate to messaging
    // GET /api/messages
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { messages: [{ id, sender, content, timestamp }] }
    navigate("/messages");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchResults.length > 0 && searchQuery.trim() && (
            <div className="search-results">
              {searchResults.map((creator) => (
                <div
                  key={creator.id}
                  className="search-result-item"
                  onClick={() => handleCreatorClick(creator.id)}
                >
                  {creator.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="feed-icons">
          <FaEnvelope
            className="feed-action-icon"
            title="Messages"
            onClick={handleMessageClick}
          />
          <FaUser
            className="feed-action-icon"
            title="Profile"
            onClick={handleProfileClick}
          />
        </div>
      </div>
      <h3>Your Feed</h3>
      <div className="post-feed">
        {posts.length === 0 && <p>No posts from subscribed creators yet.</p>}
        {posts.map((post) => {
          const userId = "user_123";
          const hasLiked = post.likedBy.includes(userId);
          return (
            <div key={post.id} className="post-wrapper">
              <div className="post-card">
                <h4>{post.creatorName}</h4>
                {post.type === "fundraiser" ? (
                  <>
                    <p>{post.content}</p>
                    <div className="fundraiser-progress">
                      <p>
                        Raised: ${post.currentAmount} of ${post.fundingGoal}
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
                                ? (post.currentAmount / post.fundingGoal) * 100
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
                ) : post.type === "poll" ? (
                  <>
                    <h4>{post.content.question}</h4>
                    {post.content.options.map((opt, index) => (
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
                ) : post.type === "image" ? (
                  <img
                    src={post.content}
                    alt="Post"
                    className="preview-image"
                  />
                ) : post.type === "video" ? (
                  <video controls className="preview-video">
                    <source src={post.content} />
                  </video>
                ) : (
                  <p>{post.content}</p>
                )}
                <div className="post-interactions">
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
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="comment">
                          <strong>{comment.userId}</strong>: {comment.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeedPage;