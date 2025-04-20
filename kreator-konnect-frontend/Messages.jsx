import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperclip, FaImage, FaVideo, FaFile } from "react-icons/fa";

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);

  useEffect(() => {
    // BACKEND: Fetch conversations for the creator
    // GET /api/messages/conversations
    // Request: { headers: { Authorization: "Bearer <token>" } }
    // Response: { conversations: [{ id, subscriberId, subscriberName, lastMessage, timestamp }] }
    const mockSubscribers = [
      { id: "user_456", name: "Fan One" },
      { id: "user_789", name: "Fan Two" },
    ];
    const storedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    const mockConversations = mockSubscribers.map(sub => {
      const convMessages = storedMessages.filter(m => m.conversationId === `conv_${sub.id}`);
      const lastMessage = convMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
      return {
        id: `conv_${sub.id}`,
        subscriberId: sub.id,
        subscriberName: sub.name,
        lastMessage: lastMessage?.content || "",
        timestamp: lastMessage?.timestamp || null,
      };
    });
    setConversations(mockConversations);

    // BACKEND: Initialize subscription status
    // GET /api/user/:creatorId/subscription-status
    mockSubscribers.forEach(sub =>
      localStorage.setItem(`isSubscribed_user_123_${sub.id}`, "true")
    );
  }, []);

  const handleSelectConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    setSelectedConversation(conv);
  };

  const handleSendMessage = () => {
    if (!selectedConversation || (!newMessage.trim() && !attachment)) return;

    // BACKEND: Verify subscription before sending
    // GET /api/user/:creatorId/subscription-status?subscriberId=<subscriberId>
    // Response: { isSubscribed: boolean }
    const isSubscriber = localStorage.getItem(
      `isSubscribed_user_123_${selectedConversation.subscriberId}`
    ) === "true";
    if (!isSubscriber && selectedConversation.subscriberId !== "user_123") {
      alert("Only subscribers can message.");
      return;
    }

    // BACKEND: Send message
    // POST /api/messages
    // Request: { conversationId, senderId, recipientId, content, type, headers: { Authorization: "Bearer <token>" } }
    // Response: { message: { conversationId, senderId, recipientId, content, type, timestamp } }
    const message = {
      conversationId: selectedConversation.id,
      senderId: "user_123",
      recipientId: selectedConversation.subscriberId,
      content: attachment || newMessage,
      type: attachmentType || "text",
      timestamp: Date.now(),
    };

    const storedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    localStorage.setItem("messages", JSON.stringify([...storedMessages, message]));

    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: newMessage || "[Attachment]", timestamp: Date.now() }
          : conv
      )
    );

    setNewMessage("");
    setAttachment(null);
    setAttachmentType(null);
  };

  const handleAttachment = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // BACKEND: Upload file
    // POST /api/upload
    // Request: FormData { file }
    // Response: { url: string }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result);
      setAttachmentType(type);
    };
    if (type === "file") {
      setAttachment(file.name);
      setAttachmentType("file");
    } else {
      reader.readAsDataURL(file);
    }
  };

  const getMessagesForConversation = (convId) => {
    // BACKEND: Fetch messages for a conversation
    // GET /api/messages/:conversationId
    // Response: { messages: [{ conversationId, senderId, recipientId, content, type, timestamp }] }
    const storedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    return storedMessages
      .filter(m => m.conversationId === convId)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  return (
    <div className="container" style={{ display: "flex", height: "80vh" }}>
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
          padding: "10px",
        }}
      >
        <h3>Conversations</h3>
        {conversations.length === 0 && <p>No conversations yet.</p>}
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => handleSelectConversation(conv.id)}
            style={{
              padding: "10px",
              cursor: "pointer",
              backgroundColor:
                selectedConversation?.id === conv.id ? "#e6f3ff" : "transparent",
              borderBottom: "1px solid #eee",
            }}
          >
            <strong>{conv.subscriberName}</strong>
            <p style={{ fontSize: "0.9em", color: "#666" }}>
              {conv.lastMessage || "No messages yet"}
            </p>
            {conv.timestamp && (
              <small>{new Date(conv.timestamp).toLocaleTimeString()}</small>
            )}
          </div>
        ))}
      </div>
      <div style={{ width: "70%", padding: "10px", display: "flex", flexDirection: "column" }}>
        {selectedConversation ? (
          <>
            <h3>Messages with {selectedConversation.subscriberName}</h3>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              {getMessagesForConversation(selectedConversation.id).map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    margin: "10px",
                    textAlign: msg.senderId === "user_123" ? "right" : "left",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor:
                        msg.senderId === "user_123" ? "#007bff" : "#f1f1f1",
                      color: msg.senderId === "user_123" ? "white" : "black",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      maxWidth: "70%",
                    }}
                  >
                    {msg.type === "image" && (
                      <img
                        src={msg.content}
                        alt="Attachment"
                        style={{ maxWidth: "200px", borderRadius: "5px" }}
                      />
                    )}
                    {msg.type === "video" && (
                      <video
                        controls
                        src={msg.content}
                        style={{ maxWidth: "200px", borderRadius: "5px" }}
                      />
                    )}
                    {msg.type === "file" && (
                      <a href={msg.content} download>
                        Download {msg.content}
                      </a>
                    )}
                    {msg.type === "text" && <p>{msg.content}</p>}
                    <small style={{ fontSize: "0.7em", opacity: 0.7 }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, padding: "8px", borderRadius: "5px" }}
              />
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
              <button onClick={handleSendMessage} className="button">
                Send
              </button>
            </div>
            {attachment && (
              <div style={{ marginTop: "10px" }}>
                <p>Attached: {attachmentType === "file" ? attachment : attachmentType}</p>
                {attachmentType === "image" && (
                  <img src={attachment} alt="Preview" style={{ maxWidth: "100px" }} />
                )}
                {attachmentType === "video" && (
                  <video src={attachment} controls style={{ maxWidth: "100px" }} />
                )}
              </div>
            )}
          </>
        ) : (
          <p>Select a conversation to start messaging.</p>
        )}
      </div>
    </div>
  );
};

export default Messages;