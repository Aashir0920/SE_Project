import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios"; // Using axios for consistency
import { FaHeart, FaTrashAlt } from "react-icons/fa"; // Added FaTrashAlt for delete icon

const CreatorProfile = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false); // State for subscription status to the viewed creator
  const [newComments, setNewComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false); // State to check if viewing own profile

  const userId = localStorage.getItem("userId"); // Get logged-in user ID
  const token = localStorage.getItem("token"); // Get token

  // Determine the effective creator ID (either from URL or logged-in user)
  const effectiveCreatorId = creatorId; // Use the creatorId from params directly, App.jsx handles the redirect for /profile

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Check if the effectiveCreatorId is the logged-in user's ID
    setIsOwnProfile(effectiveCreatorId === userId);

    if (!isValidObjectId(effectiveCreatorId)) {
      setErrors(["Invalid creator ID format"]);
      setLoading(false);
      setTimeout(() => navigate("/feed"), 3000); // Redirect after showing error
      return;
    }

    const fetchProfileData = async () => {
      try {
         setLoading(true); // Start loading


        // Fetch profile and posts concurrently
        const [profileResponse, postsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/user/${effectiveCreatorId}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/user/${effectiveCreatorId}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProfile(profileResponse.data.profile);
        setPosts(postsResponse.data.posts || []);


        // Only fetch subscription status if viewing someone else's profile
        if (!isOwnProfile) {
             const subscriptionStatusResponse = await axios.get(`http://localhost:5000/api/user/${effectiveCreatorId}/subscription-status`, {
                 headers: { Authorization: `Bearer ${token}` },
             });
             setIsSubscribed(subscriptionStatusResponse.data.isSubscribed);
        } else {
             setIsSubscribed(true); // Assume subscribed to yourself
        }


      } catch (err) {
        console.error("Fetch profile data error:", err);
        setErrors([err.response?.data?.message || "Failed to load profile data. Please try again."]);
        setProfile(null);
        setPosts([]);
        setIsSubscribed(false); // Assume not subscribed on error
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate, effectiveCreatorId, userId, token, isOwnProfile]); // Added isOwnProfile to dependencies

  const handleLike = async (postId) => {
    if (!token) return;
    try {
      await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      setErrors([err.response?.data?.message || "Failed to like post."]);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setNewComments({ ...newComments, [postId]: value });
  };

  const handleComment = async (postId) => {
    if (!token) return;
    const text = newComments[postId];
    if (!text || !text.trim()) { // Added trim validation
      setErrors(["Comment text cannot be empty."]);
      return;
    }
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, { text: text.trim() }, { // Send trimmed text
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => {
        if (post._id === postId) {
          // Assuming the backend returns the new comment with basic user info if populated
          // If not, you might need to fetch user info separately or adjust backend
          return {
            ...post,
            comments: [...post.comments, response.data.comment], // Assuming response.data.comment is the new comment object from backend
          };
        }
        return post;
      }));
      setNewComments({ ...newComments, [postId]: "" }); // Clear the input
    } catch (err) {
      console.error("Comment post error:", err);
      setErrors([err.response?.data?.message || "Failed to add comment."]);
    }
  };

  // Add Delete Post functionality (copied and adapted from OwnProfile.jsx)
  const handleDeletePost = async (postId) => {
    if (!token || !isOwnProfile) return; // Only allow delete on own profile
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(posts.filter(post => post._id !== postId));
        alert("Post deleted successfully!");
      } catch (err) {
        console.error("Delete post error:", err);
        setErrors([err.response?.data?.message || "Failed to delete post."]);
      }
    }
  };


   // Function to display post content (text, media, poll, fundraiser) - Adapted from FeedPage logic
   const renderPostContent = (post) => {
      // Check if post is locked and it's not the own profile
       const isLocked = post.exclusive && !isSubscribed && !isOwnProfile;

       if (isLocked) {
            return (
                 <div className="locked-overlay" style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                     <p>Exclusive Content. Subscribe to view.</p>
                 </div>
            );
       }


      return (
          <div className="post-content-details"> {/* Use a class for content details */}
              {post.content?.text && <p>{post.content.text}</p>}

              {/* Render Media */}
              {post.type === 'media' && post.content?.media && Array.isArray(post.content.media) && (
                <div className="post-media" style={{ marginTop: '10px' }}> {/* Use a class for media container */}
                  {post.content.media.map((mediaItem, index) => (
                    // Ensure absolute URL for media
                    mediaItem.type === 'image' ? (
                      <img key={index} src={`http://localhost:5000${mediaItem.url}`} alt="Post media" style={{ maxWidth: '100%', height: 'auto', display: 'block', marginBottom: '5px' }} />
                    ) : (
                      <video key={index} src={`http://localhost:5000${mediaItem.url}`} controls style={{ maxWidth: '100%', height: 'auto', display: 'block', marginBottom: '5px' }} />
                    )
                  ))}
                </div>
              )}

              {/* Render Poll */}
               {post.type === 'poll' && post.content?.options && Array.isArray(post.content.options) && (
                <div className="post-poll" style={{ marginTop: '10px' }}> {/* Use a class for poll container */}
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
                {post.type === 'fundraiser' && post.fundingGoal !== undefined && ( // Check for undefined as goal could be 0
                  <div className="post-fundraiser" style={{ marginTop: '10px' }}> {/* Use a class for fundraiser container */}
                    <p><strong>Fundraiser:</strong> Goal: ${post.fundingGoal} - Raised: ${post.currentAmount || 0}</p>
                    {/* Fundraiser contribution logic would go here */}
                  </div>
                )}
           </div>
      );
   };


  if (loading) {
    return <div className="container">Loading profile...</div>;
  }

  if (errors.length > 0) {
    return (
      <div className="container">
        {errors.map((err, index) => (
          <p key={index} style={{ color: "#dc3545" }}>{err}</p>
        ))}
      </div>
    );
  }

  if (!profile) {
      return <div className="container">Profile not found.</div>;
  }

  return (
    <div className="container">
      <div className="profile-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
         {/* Back button for viewing other profiles */}
         {!isOwnProfile && (
            <button onClick={() => navigate("/feed")} className="back-button" style={{ float: 'left' }}>
               ← Back to Feed
            </button>
         )}

        {profile.profilePic && (
          <img
            src={`http://localhost:5000${profile.profilePic}`} // Ensure absolute URL
            alt={`${profile.name}'s profile`}
            className="profile-picture"
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }}
          />
        )}
        <h2>{profile.name}</h2>
         {/* Display creator name only if viewing own profile (redundant otherwise) */}
         {/* {isOwnProfile && profile.creatorName && <p>({profile.creatorName})</p>} */}
        {profile.bio && <p>{profile.bio}</p>}
        {profile.socialLinks && profile.socialLinks.length > 0 && (
          <div className="social-links" style={{ marginTop: '10px' }}>
            {profile.socialLinks.map((link, index) => (
              <a key={index} href={link} target="_blank" rel="noopener noreferrer" style={{ marginRight: '10px' }}>
                Social Link {index + 1}
              </a>
            ))}
          </div>
        )}

        {/* Conditional buttons for own profile vs. other creator's profile */}
        {isOwnProfile ? (
          <div style={{ marginTop: '20px' }}>
             <button onClick={() => navigate("/edit-profile")} className="button" style={{ marginRight: '10px' }}>
               Edit Profile
             </button>
             <button onClick={() => navigate("/add-post")} className="button">
               Add Post
             </button>
             {/* Link to Membership Plans for creator */}
              <button onClick={() => navigate("/membership-plans")} className="button" style={{ marginLeft: '10px' }}>
                My Tiers
             </button>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {/* Show subscribe button or status based on isSubscribed */}
            {isSubscribed ? (
              <p>✅ Subscribed</p>
            ) : (
               <button onClick={() => navigate(`/subscribe/${effectiveCreatorId}`)} className="button">
                 Subscribe
               </button>
            )}
          </div>
        )}

      </div>

      <h3>{isOwnProfile ? "My Posts" : `${profile.name}'s Posts`}</h3>
      <div className="post-list">
        {posts.length === 0 ? (
          <p>{isOwnProfile ? "You have no posts yet." : `${profile.name} has no posts yet.`}</p>
        ) : (
          posts.map((post) => {
            const hasLiked = post.likedBy.includes(userId);
            // Check if post is exclusive and user is not subscribed (and it's not their own post)
            const isLocked = post.exclusive && !isSubscribed && !isOwnProfile; // Use isSubscribed state


            return (
              <div key={post._id} className={`post-card ${isLocked ? 'locked-post' : ''}`}>
                 {/* Render post content - will handle locked state inside */}
                 {renderPostContent(post)}

                 {/* Actions are available only if not locked OR on own profile */}
                 {(!isLocked || isOwnProfile) && (
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
                           // Note: comment.userId here is the populated user object from backend response
                           <div key={comment._id} className="comment">
                              <strong>{comment.userId?.name || comment.userId?._id || 'Unknown User'}</strong>: {comment.text} {/* Display commenter name */}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}

                 {/* Delete button only on own profile posts */}
                 {isOwnProfile && (
                     <FaTrashAlt
                       onClick={() => handleDeletePost(post._id)}
                       className="delete-icon"
                       style={{ marginTop: "10px", cursor: "pointer" }}
                     />
                 )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CreatorProfile;