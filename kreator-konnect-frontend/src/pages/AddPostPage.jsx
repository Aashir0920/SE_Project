import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Use axios for consistency and file uploads
import { FaTrashAlt, FaTimesCircle } from "react-icons/fa"; // Import delete icon if needed for media removal and FaTimesCircle for remove attachment
import "../index.css"; // Assuming styling from index.css is used


const AddPostPage = () => {
  const navigate = useNavigate();
  const [postType, setPostType] = useState("text");
  const [text, setText] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [fundingGoal, setFundingGoal] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // State to hold file objects
  const [isExclusive, setIsExclusive] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [taggedUsers, setTaggedUsers] = useState([]); // State to hold { _id, name, profilePic } objects
  const [tagResults, setTagResults] = useState([]); // State for search results { _id, name, email, profilePic }

  const [errors, setErrors] = useState({}); // State for form validation errors
  const [submitError, setSubmitError] = useState(""); // State for submission errors
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading


  const token = localStorage.getItem("token");

   useEffect(() => {
    if (!token) {
      navigate("/login");
    }
   }, [navigate, token]);


  const handleAddPollOption = () => {
     // Prevent adding empty options if previous ones are empty (optional validation)
     // if (pollOptions[pollOptions.length - 1].trim() === "") {
     //     return;
     // }
    setPollOptions([...pollOptions, ""]);
  };

  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

   const handleRemovePollOption = (index) => {
       setPollOptions(pollOptions.filter((_, i) => i !== index));
   };


  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    // You might want to limit file types or number of files here
    setMediaFiles([...mediaFiles, ...files]);
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  // Handle search for users to tag
  const handleTagSearch = async (e) => {
    const query = e.target.value;
    setTagSearch(query);
    setTagResults([]); // Clear previous results

    if (query.length > 2) { // Minimum characters to search
      try {
        // Use the existing backend route to search users by email
        const response = await axios.get(`http://localhost:5000/api/user?email=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

         // Filter out users who are already tagged
        const filteredResults = response.data.users.filter(user =>
            !taggedUsers.some(taggedUser => taggedUser._id === user._id) // Check if user._id is already in taggedUsers
        );

        setTagResults(filteredResults);

      } catch (err) {
        console.error("Tag search error:", err);
        // Optionally set a specific error for search
      }
    } else {
      setTagResults([]); // Clear results if query is too short
    }
  };

  // Handle adding a user to the tagged list
  const handleAddTag = (user) => { // Now takes the full user object
    // Check if the user is already tagged (double-check, although filtering helps)
    if (!taggedUsers.some(taggedUser => taggedUser._id === user._id)) {
      setTaggedUsers([...taggedUsers, { _id: user._id, name: user.name, profilePic: user.profilePic }]); // Store user object
      setTagSearch(""); // Clear search input
      setTagResults([]); // Clear search results
    }
  };

  // Handle removing a user from the tagged list
  const handleRemoveTag = (userIdToRemove) => { // Now takes the user ID
    setTaggedUsers(taggedUsers.filter(user => user._id !== userIdToRemove));
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    if (postType === 'text' && !text.trim() && mediaFiles.length === 0) {
       newErrors.text = 'Text content or media is required for text posts.';
    }
    if (postType === 'media' && mediaFiles.length === 0) {
      newErrors.mediaFiles = 'At least one media file is required for media posts.';
    }
    if (postType === 'poll') {
       if (pollOptions.length < 2) {
           newErrors.pollOptions = 'At least two options are required for a poll.';
       } else if (pollOptions.some(option => !option.trim())) {
           newErrors.pollOptions = 'All poll options must have text.';
       }
    }
    if (postType === 'fundraiser') {
      if (!fundingGoal || isNaN(fundingGoal) || parseFloat(fundingGoal) <= 0) {
        newErrors.fundingGoal = 'A valid funding goal is required for fundraiser posts.';
      }
       // Optional: Add validation for goalDeadline
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // Handle post submission
  const handleSubmit = async () => {
    setSubmitError(""); // Clear previous submit errors

    if (!validateForm()) {
        setSubmitError("Please fix the errors in the form.");
        return;
    }

    setIsSubmitting(true);

    const formData = new FormData();

    // Append basic text content
    formData.append("text", text.trim());
    formData.append("type", postType);
    formData.append("exclusive", isExclusive);

    // Append data based on post type
    if (postType === 'poll') {
        // Backend expects options as an array of { text: string }
        formData.append("options", JSON.stringify(pollOptions.map(opt => ({ text: opt.trim() }))));
    } else if (postType === 'fundraiser') {
        formData.append("fundingGoal", parseFloat(fundingGoal));
         if (goalDeadline) formData.append("goalDeadline", goalDeadline);
    }

    // Append tagged users (send an array of user IDs)
     formData.append("taggedUsers", JSON.stringify(taggedUsers.map(user => user._id)));


    // Append media files
    mediaFiles.forEach((file, index) => {
      formData.append(`media`, file); // Append each file with the key 'media'
    });

     // Optional: Append scheduleTime if implemented

    try {
      const response = await axios.post("http://localhost:5000/api/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Important for file uploads
        },
      });

      alert("Post created successfully!");
      // Redirect to the user's profile page or feed after successful post
      navigate(`/profile`); // Redirect to own profile
      // Or navigate('/feed');

    } catch (err) {
      console.error("Post creation error:", err);
      setSubmitError(err.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="container">
      <h2>Add New Post</h2>
       {submitError && <p style={{ color: "#dc3545", marginBottom: "10px" }}>{submitError}</p>} {/* Display submission errors */}

      <div className="post-form"> {/* Use a specific class for form styling */}
        {/* Post Type Selection */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px" }}>Post Type:</label>
          <select value={postType} onChange={(e) => setPostType(e.target.value)}>
            <option value="text">Text</option>
            <option value="media">Media</option>
            <option value="poll">Poll</option>
            <option value="fundraiser">Fundraiser</option>
          </select>
        </div>

        {/* Text Input (for Text, Poll, Fundraiser) */}
        {(postType === "text" || postType === "poll" || postType === "fundraiser") && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Text Content:</label>
            <textarea
              rows="4"
              placeholder={`Enter text content for your ${postType} post...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
             {errors.text && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.text}</p>}
          </div>
        )}

        {/* Media Upload (for Media) */}
        {postType === "media" && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Media Files:</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple // Allow multiple file selection
              onChange={handleMediaChange}
              style={{ display: "block", marginBottom: "10px" }}
            />
             {errors.mediaFiles && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.mediaFiles}</p>}
             {/* Display selected media file names and previews */}
            {mediaFiles.length > 0 && (
               <div className="media-preview" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                   {mediaFiles.map((file, index) => (
                       <div key={index} style={{ position: 'relative', border: '1px solid #ccc', padding: '5px', borderRadius: '5px' }}>
                            {file.type.startsWith('image/') && <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />}
                            {file.type.startsWith('video/') && <video src={URL.createObjectURL(file)} controls style={{ width: '80px', height: '80px', objectFit: 'cover' }} />}
                             {!file.type.startsWith('image/') && !file.type.startsWith('video/') && <p>{file.name}</p>} {/* Display filename for other types */}

                            <FaTimesCircle
                               style={{
                                   position: 'absolute',
                                   top: '-8px',
                                   right: '-8px',
                                   cursor: 'pointer',
                                   color: '#dc3545',
                                   background: '#fff',
                                   borderRadius: '50%',
                                   fontSize: '16px'
                               }}
                               onClick={() => handleRemoveMedia(index)}
                            />
                       </div>
                   ))}
               </div>
            )}
          </div>
        )}

        {/* Poll Options Input (for Poll) */}
        {postType === "poll" && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Poll Options:</label>
            {pollOptions.map((option, index) => (
              <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  style={{ flex: 1, padding: "8px" }}
                />
                 {pollOptions.length > 2 && ( // Allow removing options if more than 2
                      <button onClick={() => handleRemovePollOption(index)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}>
                         ✕ {/* Use a simple X or icon */}
                      </button>
                 )}
              </div>
            ))}
            <button onClick={handleAddPollOption} className="button secondary" style={{ marginTop: "5px" }}>
              Add Option
            </button>
             {errors.pollOptions && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.pollOptions}</p>}
          </div>
        )}

        {/* Fundraiser Details Input (for Fundraiser) */}
        {postType === "fundraiser" && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Funding Goal ($):</label>
            <input
              type="number"
              placeholder="Enter goal amount"
              value={fundingGoal}
              onChange={(e) => setFundingGoal(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
             {errors.fundingGoal && <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>{errors.fundingGoal}</p>}
            {/* Optional: Goal Deadline Input */}
             {/* <label style={{ display: "block", marginTop: "10px", marginBottom: "5px" }}>Goal Deadline (Optional):</label>
             <input
                 type="date"
                 value={goalDeadline}
                 onChange={(e) => setGoalDeadline(e.target.value)}
                 style={{ width: "100%", padding: "10px" }}
             /> */}
          </div>
        )}

        {/* Exclusive Content Checkbox */}
        <div style={{ marginBottom: "15px" }}>
          <label>
            <input
              type="checkbox"
              checked={isExclusive}
              onChange={(e) => setIsExclusive(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Exclusive Content (for subscribers only)
          </label>
        </div>

        {/* Tag Users (by email search) */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Tag Users (Search by Email):</label>
          <input
            type="text"
            placeholder="Search users to tag..."
            value={tagSearch}
            onChange={handleTagSearch}
            style={{ width: "100%", padding: "10px" }}
          />
           {/* Display search results */}
          {tagResults.length > 0 && (
            <div className="tag-search-results" style={{ border: "1px solid #ccc", maxHeight: "150px", overflowY: "auto", marginTop: "5px" }}>
              {tagResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleAddTag(user)} // Pass the full user object
                  style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "10px" }}
                >
                   {user.profilePic && <img src={`http://localhost:5000${user.profilePic}`} alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />}
                  {user.name} ({user.email})
                </div>
              ))}
            </div>
          )}
           {/* Display tagged users */}
          {taggedUsers.length > 0 && (
            <div className="tagged-users" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              {taggedUsers.map((user) => ( // Map over user objects
                <div
                  key={user._id}
                  style={{
                    backgroundColor: "var(--secondary)", // Use a theme variable for background
                    color: "var(--text)", // Use a theme variable for text color
                    padding: "6px 12px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.9rem"
                  }}
                >
                   {user.profilePic && <img src={`http://localhost:5000${user.profilePic}`} alt="Profile" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                   {user.name || user._id} {/* Display name, fallback to ID */}
                  <span
                    onClick={() => handleRemoveTag(user._id)} // Remove by ID
                    style={{ marginLeft: "5px", cursor: "pointer", color: "var(--text)" }}
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FUTURE: Schedule Post Time Input */}
         {/* <div style={{ marginBottom: "15px" }}>
             <label style={{ display: "block", marginBottom: "5px" }}>Schedule Post (Optional):</label>
             <input
                 type="datetime-local"
                 value={scheduleTime}
                 onChange={(e) => setScheduleTime(e.target.value)}
                 style={{ width: "100%", padding: "10px" }}
             />
         </div> */}


        <button onClick={handleSubmit} className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Create Post'}
        </button>
      </div>
    </div>
  );
};

export default AddPostPage;