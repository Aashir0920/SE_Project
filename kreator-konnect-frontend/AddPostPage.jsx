import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddPostPage = () => {
  const navigate = useNavigate();
  const [postType, setPostType] = useState("text");
  const [text, setText] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [fundingGoal, setFundingGoal] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isExclusive, setIsExclusive] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [tagResults, setTagResults] = useState([]);

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // BACKEND: Upload multiple files
    // POST /api/upload/multiple
    // Request: FormData { files }
    // Response: { urls: [string] }
    const newMedia = files.map(file => {
      if (file.type.startsWith("image/")) {
        return { type: "image", url: URL.createObjectURL(file), name: file.name };
      } else if (file.type.startsWith("video/")) {
        return { type: "video", url: URL.createObjectURL(file), name: file.name };
      } else {
        return { type: "file", url: file.name, name: file.name };
      }
    });
    setMediaFiles([...mediaFiles, ...newMedia]);
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleTagSearch = (query) => {
    setTagSearch(query);
    // BACKEND: Fetch subscribed users
    // GET /api/subscriptions/users
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { users: [{ id, name }] }
    const subscribedUsers = JSON.parse(localStorage.getItem("creatorSubscriptions") || "[]");
    const mockUsers = [
      { id: "user_456", name: "Fan One" },
      { id: "user_789", name: "Fan Two" },
    ];
    localStorage.setItem("creatorSubscriptions", JSON.stringify(mockUsers.map(u => u.id)));
    if (!query.trim()) {
      setTagResults([]);
    } else {
      const filtered = mockUsers.filter(
        user =>
          user.name.toLowerCase().includes(query.toLowerCase()) &&
          !taggedUsers.includes(user.id)
      );
      setTagResults(filtered);
    }
  };

  const handleAddTag = (userId) => {
    const user = tagResults.find(u => u.id === userId);
    if (user && !taggedUsers.includes(userId)) {
      setTaggedUsers([...taggedUsers, userId]);
      setTagSearch("");
      setTagResults([]);
    }
  };

  const handleRemoveTag = (userId) => {
    setTaggedUsers(taggedUsers.filter(id => id !== userId));
  };

  const handleSubmit = () => {
    // BACKEND: Validate post data
    // POST /api/posts
    // Request: { type, content, pollOptions?, fundingGoal?, goalDeadline?, media?, exclusive, taggedUsers?, headers: { Authorization: "Bearer <token>" } }
    // Response: { post: { id, creatorId, type, content, ... } }
    if (
      (postType === "text" && !text.trim()) ||
      (postType === "media" && !text.trim() && mediaFiles.length === 0) ||
      (postType === "poll" && (!text.trim() || pollOptions.some(opt => !opt.trim()) || pollOptions.filter(opt => opt.trim()).length < 2)) ||
      (postType === "fundraiser" && (!text.trim() || !fundingGoal || !goalDeadline))
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const post = {
      id: Date.now().toString(),
      creatorId: "user_123",
      creatorName: "Creator One",
      type: postType,
      content:
        postType === "poll"
          ? { text, options: pollOptions.filter(opt => opt.trim()) }
          : postType === "fundraiser"
          ? { text }
          : postType === "media"
          ? { text, media: mediaFiles.map(file => ({ type: file.type, url: file.url })) }
          : { text },
      fundingGoal: postType === "fundraiser" ? parseFloat(fundingGoal) : undefined,
      currentAmount: postType === "fundraiser" ? 0 : undefined,
      goalDeadline: postType === "fundraiser" ? goalDeadline : undefined,
      exclusive: isExclusive,
      taggedUsers,
      comments: [],
      likes: 0,
      likedBy: [],
    };

    // Store post
    const storedPosts = JSON.parse(localStorage.getItem("userPosts") || "[]");
    localStorage.setItem("userPosts", JSON.stringify([...storedPosts, post]));

    // Send notifications to tagged users
    // BACKEND: Send message to tagged users
    // POST /api/messages/notify
    // Request: { userIds: [string], content: string, postId: string, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: "Notifications sent" }
    const storedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    const mockUsers = [
      { id: "user_456", name: "Fan One" },
      { id: "user_789", name: "Fan Two" },
    ];
    taggedUsers.forEach(userId => {
      const conversationId = `conv_${userId}`;
      const notification = {
        conversationId,
        senderId: "user_123",
        recipientId: userId,
        content: `You were tagged in a post by Creator One! #post_${post.id}`,
        type: "text",
        timestamp: Date.now(),
      };
      storedMessages.push(notification);
      // Initialize conversation if it doesn't exist
      const user = mockUsers.find(u => u.id === userId);
      if (user) {
        localStorage.setItem(`isSubscribed_user_123_${userId}`, "true");
      }
    });
    localStorage.setItem("messages", JSON.stringify(storedMessages));

    alert("Post created!");
    navigate("/profile");
  };

  return (
    <div className="container">
      <h2>Create a Post</h2>
      <div className="post-form">
        <select
          value={postType}
          onChange={(e) => {
            setPostType(e.target.value);
            setMediaFiles([]);
            setPollOptions(["", ""]);
            setFundingGoal("");
            setGoalDeadline("");
          }}
          className="input"
        >
          <option value="text">Text</option>
          <option value="media">Media</option>
          <option value="poll">Poll</option>
          <option value="fundraiser">Fundraiser</option>
        </select>

        <textarea
          placeholder={
            postType === "poll"
              ? "Poll question"
              : postType === "fundraiser"
              ? "Fundraiser description"
              : postType === "media"
              ? "Caption or description"
              : "What's on your mind?"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          rows="4"
          style={{ marginTop: "10px" }}
        />

        {postType === "poll" && (
          <>
            {pollOptions.map((opt, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Option ${index + 1}`}
                value={opt}
                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                className="input"
              />
            ))}
            <button onClick={handleAddPollOption} className="button">
              Add Option
            </button>
          </>
        )}

        {postType === "fundraiser" && (
          <>
            <input
              type="number"
              placeholder="Funding goal ($)"
              value={fundingGoal}
              onChange={(e) => setFundingGoal(e.target.value)}
              className="input"
            />
            <input
              type="date"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              className="input"
            />
          </>
        )}

        {postType === "media" && (
          <>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="input"
            />
            {mediaFiles.length > 0 && (
              <div className="media-preview" style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {mediaFiles.map((file, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    {file.type === "image" ? (
                      <img src={file.url} alt={file.name} style={{ maxWidth: "150px", borderRadius: "5px" }} />
                    ) : file.type === "video" ? (
                      <video controls src={file.url} style={{ maxWidth: "150px", borderRadius: "5px" }} />
                    ) : (
                      <p>{file.name}</p>
                    )}
                    <span
                      onClick={() => handleRemoveMedia(index)}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        background: "#ff0000",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="exclusive-section" style={{ marginTop: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={isExclusive}
              onChange={(e) => setIsExclusive(e.target.checked)}
            />
            Make this post exclusive (subscribers only)
          </label>
        </div>

        <div className="tag-section" style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Tag subscribed users..."
            value={tagSearch}
            onChange={(e) => handleTagSearch(e.target.value)}
            className="input"
          />
          {tagResults.length > 0 && tagSearch.trim() && (
            <div className="tag-results" style={{ border: "1px solid #ccc", borderRadius: "5px", maxHeight: "100px", overflowY: "auto" }}>
              {tagResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleAddTag(user.id)}
                  style={{ padding: "5px", cursor: "pointer", ":hover": { backgroundColor: "#f1f1f1" } }}
                >
                  {user.name}
                </div>
              ))}
            </div>
          )}
          {taggedUsers.length > 0 && (
            <div className="tagged-users" style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
              {taggedUsers.map((userId) => {
                const user = JSON.parse(localStorage.getItem("creatorSubscriptions") || "[]")
                  .map(id => ({ id, name: id === "user_456" ? "Fan One" : "Fan Two" }))
                  .find(u => u.id === userId);
                return (
                  <div
                    key={userId}
                    style={{
                      backgroundColor: "#e6f3ff",
                      padding: "5px 10px",
                      borderRadius: "15px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {user?.name || userId}
                    <span
                      onClick={() => handleRemoveTag(userId)}
                      style={{ marginLeft: "5px", cursor: "pointer" }}
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={handleSubmit} className="button" style={{ marginTop: "10px" }}>
          Post
        </button>
      </div>
    </div>
  );
};

export default AddPostPage;