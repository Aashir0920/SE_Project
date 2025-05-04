import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperclip, FaImage, FaVideo, FaFile, FaTimesCircle } from "react-icons/fa"; // Added FaTimesCircle for remove attachment
import axios from "axios"; // Using axios for file uploads

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); // State for messages in the current conversation
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState(null); // State to hold the file object
  const [attachmentType, setAttachmentType] = useState(null); // State to hold the attachment type (image, video, file)
  const [error, setError] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId"); // Get logged-in user ID

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchConversations();

    // FUTURE: Implement real-time messaging via WebSockets for new messages

  }, [navigate, token]); // Added token to dependencies

  useEffect(() => {
    // Scroll to the latest message when messages state updates
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  useEffect(() => {
    // Fetch messages when a conversation is selected
    if (selectedConversation) {
      fetchMessages(selectedConversation.id); // Use the conversation ID from the backend
    } else {
      setMessages([]); // Clear messages if no conversation is selected
    }
  }, [selectedConversation, token]);


  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await axios.get("http://localhost:5000/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setError(err.response?.data?.message || "Failed to load conversations. Please try again.");
      setConversations([]); // Clear conversations on error
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId) => {
     setIsLoadingMessages(true);
    try {
       // Backend uses the combined senderId-recipientId format for conversationId
      const response = await axios.get(`http://localhost:5000/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error("Fetch messages error:", err);
      setError(err.response?.data?.message || "Failed to load messages. Please try again.");
       setMessages([]); // Clear messages on error
    } finally {
        setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation) => {
     // If selecting the same conversation, do nothing
     if (selectedConversation && selectedConversation.id === conversation.id) {
         return;
     }
    setSelectedConversation(conversation);
    // messages will be fetched by the useEffect when selectedConversation state updates
    setNewMessage(""); // Clear input when changing conversations
    setAttachment(null); // Clear any pending attachment
    setAttachmentType(null);
    setError(""); // Clear previous errors
  };

  const handleAttachment = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentType(type);
      setError(""); // Clear previous errors
    }
  };

   const handleRemoveAttachment = () => {
      setAttachment(null);
      setAttachmentType(null);
   };


  const handleSendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && !attachment)) {
      setError("Please enter a message or select an attachment.");
      return;
    }
    setIsSendingMessage(true);
    setError(""); // Clear previous errors

    try {
      let messageContent = {}; // Object to send in the content field

      if (attachment) {
        // First, upload the attachment
        const formData = new FormData();
        formData.append("attachment", attachment);

        const uploadResponse = await axios.post(
          "http://localhost:5000/api/messages/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data", // Important for file uploads
            },
          }
        );
        const { url, type } = uploadResponse.data.attachment;
        messageContent = {
          text: newMessage.trim(), // Include text if any, even with attachment
          attachmentUrl: url,
          attachmentType: type,
        };
      } else {
        // Sending a text-only message
        messageContent = { text: newMessage.trim() };
      }

      // Send the message data (including attachment info if uploaded)
      const sendResponse = await axios.post(
        "http://localhost:5000/api/messages",
        {
          recipientId: selectedConversation.otherUserId,
          content: messageContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add the newly sent message to the messages list
      setMessages([...messages, sendResponse.data.message]);

      // Clear input and attachment state
      setNewMessage("");
      setAttachment(null);
      setAttachmentType(null);

      // Refresh conversations to update the last message snippet
      fetchConversations();

    } catch (err) {
      console.error("Send message error:", err);
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Function to display message content (text or attachment)
  const renderMessageContent = (message) => {
     if (message.content.text && message.content.attachmentUrl) {
          // Message has both text and attachment
          return (
              <>
                  <p>{message.content.text}</p>
                  {renderAttachment(message.content.attachmentUrl, message.content.attachmentType)}
              </>
          );
     } else if (message.content.attachmentUrl) {
          // Message is just an attachment
          return renderAttachment(message.content.attachmentUrl, message.content.attachmentType);
     } else if (message.content.text) {
          // Message is just text
          return <p>{message.content.text}</p>;
     }
     return null; // Should not happen if validation works
  };

  // Function to display attachment
  const renderAttachment = (url, type) => {
     const absoluteUrl = `http://localhost:5000${url}`; // Construct absolute URL

     switch (type) {
         case 'image':
             return <img src={absoluteUrl} alt="Attachment" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', marginTop: '5px' }} />;
         case 'video':
             return <video src={absoluteUrl} controls style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', marginTop: '5px' }} />;
         case 'file':
              // You might want to extract filename from URL or store it separately
             const filename = url.split('/').pop(); // Simple way to get filename from URL
             return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '5px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none' }}>
                         <FaFile style={{ marginRight: '5px' }} /> Download File ({filename})
                     </a>;
         default:
             return <p>Unknown attachment type.</p>;
     }
  };


  return (
    <div className="messages-container"> {/* Use a specific class for messages layout */}
      <div className="conversations-list">
        <h3>Conversations</h3>
        {isLoadingConversations ? (
          <p>Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li
                key={conv.id} // Use the consistent conversation ID from backend
                onClick={() => handleSelectConversation(conv)}
                className={selectedConversation?.id === conv.id ? "selected" : ""}
              >
                 <div className="conversation-info">
                    {conv.otherUserPic && (
                       <img src={`http://localhost:5000${conv.otherUserPic}`} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }} />
                    )}
                   <h4>{conv.otherUserName || "Unknown User"}</h4>
                 </div>
                <p className="last-message">{conv.lastMessage}</p>
                <small>{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-window">
        {selectedConversation ? (
          <>
            <div className="chat-header">
               {selectedConversation.otherUserPic && (
                  <img src={`http://localhost:5000${selectedConversation.otherUserPic}`} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }} />
               )}
              <h4>{selectedConversation.otherUserName || "Unknown User"}</h4>
              {/* FUTURE: Add option to view recipient's profile */}
            </div>
            <div className="messages-list">
               {isLoadingMessages ? (
                   <p>Loading messages...</p>
               ) : messages.length === 0 ? (
                   <p>Start a conversation!</p>
               ) : (
                   messages.map((message) => (
                   <div
                       key={message._id}
                       className={`message ${message.senderId._id === userId ? "sent" : "received"}`} // Use populated sender ID
                   >
                       <div className="message-bubble">
                            {/* Display sender name/pic if different from selected conversation user (e.g., group chat),
                                but in 1-on-1, it's usually implicit */}
                             {/* <strong>{message.senderId.name}:</strong> */}
                           {renderMessageContent(message)} {/* Render text or attachment */}
                           <small className="timestamp">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                       </div>
                   </div>
                   ))
               )}
              <div ref={messagesEndRef} /> {/* Empty div for scrolling */}
            </div>
            <div className="message-input-area">
               {error && <p style={{ color: "#dc3545", marginBottom: '10px' }}>{error}</p>} {/* Display errors here */}

               {/* Display selected attachment preview */}
               {attachment && (
                 <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <p>Attached: {attachment.name || attachmentType}</p>
                   {attachmentType === 'image' && <img src={URL.createObjectURL(attachment)} alt="Preview" style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'cover' }} />}
                   {attachmentType === 'video' && <video src={URL.createObjectURL(attachment)} controls style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'cover' }} />}
                   <FaTimesCircle style={{ cursor: 'pointer', color: '#dc3545' }} onClick={handleRemoveAttachment} />
                 </div>
               )}

              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && !isSendingMessage) handleSendMessage(); }} // Send on Enter key
                className="message-input"
                 disabled={isSendingMessage} // Disable input while sending
              />
              <div className="attachment-buttons">
                  <label>
                    <FaImage style={{ cursor: "pointer" }} />
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleAttachment(e, "image")}
                    />
                  </label>
                  <label>
                    <FaVideo style={{ cursor: "pointer" }} />
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleAttachment(e, "video")}
                    />
                  </label>
                  <label>
                    <FaFile style={{ cursor: "pointer" }} />
                    <input
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => handleAttachment(e, "file")}
                    />
                  </label>
              </div>
              <button onClick={handleSendMessage} className="button" disabled={isSendingMessage}>
                {isSendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <p>Select a conversation to start messaging.</p>
        )}
      </div>
    </div>
  );
};

export default Messages;