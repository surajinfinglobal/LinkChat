import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInfoPanel from "./components/ChatInfoPanel";
import EmptyChatState from "./components/EmptyChatState";
import { playReceivedSound, playSentSound } from "./utils/chatSounds";

import { useUser } from "./context/UserContext";

import {
  sharedMedia,
  sharedFiles,
  sharedLinks,
} from "./data/mockData";

import api from "./services/api";
import socket from "./services/socket";

function normalizeMessage(message) {
  const sender = message.sender;

  return {
    id: String(message._id || message.id),
    authorId: String(
      sender?._id || sender?.id || message.authorId || sender || ""
    ),
    authorName: sender?.fullName || message.authorName || "",
    type: message.messageType || message.type || "text",
    text: message.text || "",
    time: message.createdAt || message.time || new Date().toISOString(),
    status: message.status || "sent",
    reactions: message.reactions || [],
  };
}

const messageStatusRank = { sent: 0, delivered: 1, read: 2 };

// ============================================================
// CHAT PAGE
// ============================================================

function ChatPage() {
  const navigate = useNavigate();

  const { user: currentUser } = useUser();

  useEffect(() => {
    const savedTheme = localStorage.getItem('linkchat-theme') || 'light';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const effectiveTheme =
        savedTheme === 'system'
          ? (mediaQuery.matches ? 'dark' : 'light')
          : savedTheme;

      document.documentElement.classList.toggle('light', effectiveTheme === 'light');
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    };

    applyTheme();

    if (savedTheme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, []);

  // -----------------------------
  // State
  // -----------------------------

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});

  const [activeId, setActiveId] = useState(null);

  const [infoOpen, setInfoOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [toast, setToast] = useState(null);

  // ============================================================
  // LOAD CONVERSATIONS
  // ============================================================

  useEffect(() => {
    if (!currentUser) return;

    loadConversations();
  }, [currentUser]);

  const loadConversations = async () => {
    try {
      const response = await api.get("/conversations");

      const data = response.data.conversations || [];

      setConversations((previous) =>
        data.map((conversation) => {
          const id = String(conversation._id || conversation.id);
          const existing = previous.find(
            (item) => String(item._id || item.id) === id
          );

          return { ...conversation, unread: existing?.unread || 0 };
        })
      );

      // Agar conversation available hai
      // to first conversation automatically open karo
      if (data.length > 0) {
        setActiveId((currentActiveId) => {
          if (currentActiveId) {
            return currentActiveId;
          }

          return data[0]._id || data[0].id;
        });
      }
    } catch (error) {
      console.error(
        "Conversation loading error:",
        error.response?.data || error.message
      );
    }
  };

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    const conversationKey = String(conversationId);

    try {
      const response = await api.get(`/messages/${conversationKey}`);
      const loadedMessages = (response.data.messages || []).map(normalizeMessage);

      setMessages((previous) => {
        const mergedMessages = new Map(
          (previous[conversationKey] || []).map((message) => [message.id, message])
        );

        loadedMessages.forEach((message) => {
          const existingMessage = mergedMessages.get(message.id);
          const existingRank = messageStatusRank[existingMessage?.status] ?? 0;
          const loadedRank = messageStatusRank[message.status] ?? 0;

          mergedMessages.set(
            message.id,
            existingRank > loadedRank
              ? { ...message, status: existingMessage.status }
              : message
          );
        });

        return {
          ...previous,
          [conversationKey]: [...mergedMessages.values()].sort(
            (first, second) => new Date(first.time) - new Date(second.time)
          ),
        };
      });
    } catch (error) {
      console.error(
        "Messages loading error:",
        error.response?.data || error.message
      );
    }
  }, []);

  useEffect(() => {
    const handleUserStatus = ({ userId, status, lastSeen }) => {
      setConversations((previous) =>
        previous.map((conversation) => ({
          ...conversation,
          participants: conversation.participants?.map((participant) =>
            String(participant?._id || participant?.id) === String(userId)
              ? { ...participant, status, lastSeen }
              : participant
          ),
        }))
      );
    };

    const handleTypingStatus = ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      if (String(userId) === String(currentUser?.id || currentUser?._id)) return;

      setConversations((previous) =>
        previous.map((conversation) => {
          const id = String(conversation._id || conversation.id);
          if (String(conversationId) !== id) return conversation;

          return {
            ...conversation,
            typing: true,
          };
        })
      );
    };

    const handleStopTypingStatus = ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      if (String(userId) === String(currentUser?.id || currentUser?._id)) return;

      setConversations((previous) =>
        previous.map((conversation) => {
          const id = String(conversation._id || conversation.id);
          if (String(conversationId) !== id) return conversation;

          return {
            ...conversation,
            typing: false,
          };
        })
      );
    };

    const handleUserPrivacyUpdated = () => {
      loadConversations();
      if (activeId) loadMessages(activeId);
    };

    socket.on("user_status", handleUserStatus);
    socket.on("user_privacy_updated", handleUserPrivacyUpdated);
    socket.on("user_typing", handleTypingStatus);
    socket.on("user_stop_typing", handleStopTypingStatus);

    return () => {
      socket.off("user_status", handleUserStatus);
      socket.off("user_privacy_updated", handleUserPrivacyUpdated);
      socket.off("user_typing", handleTypingStatus);
      socket.off("user_stop_typing", handleStopTypingStatus);
    };
  }, [currentUser, activeId, loadMessages]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  // ============================================================
  // ACTIVE CONVERSATION
  // ============================================================
const activeConversation = conversations.find(
  (conversation) =>
    String(conversation._id || conversation.id) ===
    String(activeId)
);

const selectedUser = activeConversation?.participants?.find(
  (participant) =>
    String(participant._id || participant.id) !==
    String(currentUser?.id || currentUser?._id)
);

const activeMessages = messages[String(activeId)] || [];

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = (text) => {
    setToast(text);

    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  // ============================================================
  // SELECT CONVERSATION
  // ============================================================

 const handleSelect = (id) => {
  setActiveId(id);

  setMobileView("chat");
  setInfoOpen(false);

  setConversations((prev) =>
    prev.map((conversation) => {
      const conversationId =
        conversation._id || conversation.id;

      if (
        String(conversationId) ===
        String(id)
      ) {
        return {
          ...conversation,
          unread: 0,
        };
      }

      return conversation;
    })
  );

};

  // ============================================================
  // SEARCH USER -> CREATE/GET CONVERSATION
  // ============================================================

  const handleUserSelect = async (selectedUser) => {
    if (!selectedUser?._id) {
      return;
    }

    try {
      const response = await api.post(
        "/conversations",
        {
          userId: selectedUser._id,
        }
      );

      const conversation =
        response.data.conversation;

      if (!conversation) {
        return;
      }

      const conversationId =
        conversation._id || conversation.id;

      // Existing conversation hai ya new?
      setConversations((prev) => {
        const exists = prev.some(
  (item) =>
    String(item._id || item.id) ===
    String(conversationId)
);
        if (exists) {
          return prev;
        }

        return [
          conversation,
          ...prev,
        ];
      });

      // Conversation open karo
      setActiveId(conversationId);
      await loadMessages(conversationId);

      // Mobile par chat view
      setMobileView("chat");

      setInfoOpen(false);
    } catch (error) {
  console.error(
    "Conversation create error:",
    error.response?.status,
    error.response?.data,
    error.message
  );

      showToast(
        error.response?.data?.message ||
          "Unable to create conversation"
      );
    }
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSend = (text) => {
    if (!currentUser || !activeId) {
      return;
    }
     playSentSound();
    socket.emit("send_message", {
      conversationId: activeId,
      text: text.trim(),
    });
  };

  const handleToggleBlock = async () => {
    const otherUserId = selectedUser?._id || selectedUser?.id;
    if (!otherUserId || !activeConversation) return;
    const nextBlockedByMe = !activeConversation.blockedByMe;

    try {
      if (!nextBlockedByMe) {
        await api.delete(`/blocks/${otherUserId}`);
        showToast('User unblocked. You can message them again.');
      } else {
        await api.post(`/blocks/${otherUserId}`);
        showToast('User blocked. Chat history is unchanged.');
      }

      setConversations((previous) =>
        previous.map((conversation) => {
          const conversationId = String(conversation._id || conversation.id);
          if (conversationId !== String(activeId)) return conversation;

          return {
            ...conversation,
            blockedByMe: nextBlockedByMe,
            isBlocked: nextBlockedByMe || Boolean(conversation.blockedMe),
          };
        })
      );
      await loadConversations();
      await loadMessages(activeId);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to update block settings');
    }
  };

  useEffect(() => {
    const handleBlockStatusChanged = () => {
      loadConversations();
      if (activeId) loadMessages(activeId);
    };

    const handleNewMessage = (message) => {
      const conversationId = String(
        message.conversationId?._id || message.conversationId
      );
      const normalizedMessage = normalizeMessage(message);
      const isActiveConversation = conversationId === String(activeId);
      const isOwnMessage =
        normalizedMessage.authorId === String(currentUser?.id || currentUser?._id);

      if (isActiveConversation && !isOwnMessage) {
        playReceivedSound();
      }

      if (
        isActiveConversation &&
        !isOwnMessage &&
        currentUser?.privacy?.readReceipts !== false
      ) {
        socket.emit("mark_messages_read", { conversationId });
      }

      setMessages((previous) => {
        const conversationMessages = previous[conversationId] || [];
        if (conversationMessages.some((item) => item.id === normalizedMessage.id)) {
          return previous;
        }

        return {
          ...previous,
          [conversationId]: [...conversationMessages, normalizedMessage],
        };
      });

      setConversations((previous) =>
        previous.map((conversation) => {
          const id = String(conversation._id || conversation.id);
          if (id !== conversationId) return conversation;

          return {
            ...conversation,
            unread:
              normalizedMessage.authorId !== String(currentUser?.id || currentUser?._id)
                ? isActiveConversation ? 0 : (conversation.unread || 0) + 1
                : conversation.unread || 0,
            lastMessage: {
              authorId: normalizedMessage.authorId,
              text: normalizedMessage.text,
              type: normalizedMessage.type,
            },
            lastMessageAt: normalizedMessage.time,
          };
        })
      );
    };

    const handleMessageError = ({ message }) => {
      showToast(message || 'Message could not be sent');
    };

    const handleReactionUpdate = ({ conversationId, messageId, reactions }) => {
      const conversationKey = String(conversationId);
      loadMessages(conversationKey);
    };

    const handleReactionError = ({ message }) => {
      showToast(message || 'Unable to update reaction');
    };

    const handleMessageStatusUpdated = ({ conversationId, messageIds, status }) => {
      const conversationKey = String(conversationId);
      const updatedIds = new Set(messageIds.map(String));

      setMessages((previous) => ({
        ...previous,
        [conversationKey]: (previous[conversationKey] || []).map((message) =>
          updatedIds.has(message.id) &&
          (messageStatusRank[status] ?? 0) > (messageStatusRank[message.status] ?? 0)
            ? { ...message, status }
            : message
        ),
      }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_updated', handleMessageStatusUpdated);
    socket.on('message_error', handleMessageError);
    socket.on('message_reactions_updated', handleReactionUpdate);
    socket.on('reaction_error', handleReactionError);
    socket.on('block_status_changed', handleBlockStatusChanged);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_updated', handleMessageStatusUpdated);
      socket.off('message_error', handleMessageError);
      socket.off('message_reactions_updated', handleReactionUpdate);
      socket.off('reaction_error', handleReactionError);
      socket.off('block_status_changed', handleBlockStatusChanged);
    };
  }, [activeId, currentUser, loadMessages]);

  // ============================================================
  // REACTION
  // ============================================================

  const handleReact = (messageId, emoji) => {
    if (!activeId) return;

    socket.emit('toggle_reaction', {
      conversationId: activeId,
      messageId,
      emoji,
    });
  };

  // ============================================================
  // MUTE
  // ============================================================

  const handleToggleMute = () => {
    setConversations((prev) =>
      prev.map((conversation) => {
        const conversationId =
          conversation._id || conversation.id;

        if (conversationId !== activeId) {
          return conversation;
        }

        return {
          ...conversation,
          muted: !conversation.muted,
        };
      })
    );
  };

  // ============================================================
  // NEW CONVERSATION
  // ============================================================

  const handleNewConversation = () => {
    showToast("Search a user by phone number");
  };

  // ============================================================
  // SETTINGS
  // ============================================================

  const handleOpenSettings = () => {
    navigate("/settings");
  };

  // ============================================================
  // USER NOT LOGGED IN
  // ============================================================

  if (!currentUser) {
    return null;
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <ChatLayout>
      {/* ================= SIDEBAR ================= */}

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onUserSelect={handleUserSelect}
        onOpenSettings={handleOpenSettings}
        onNewConversation={handleNewConversation}
        mobileHidden={mobileView === "chat"}
      />

      {/* ================= CHAT WINDOW ================= */}

      {activeConversation ? (
        <ChatWindow
          user={selectedUser}
          conversation={activeConversation}
          messages={activeMessages}
          currentUser={currentUser}
          onSend={handleSend}
          onToggleBlock={handleToggleBlock}
          activeId={activeId}
          onReact={handleReact}
          onBack={() => setMobileView("list")}
          onOpenInfo={() =>
            setInfoOpen((value) => !value)
          }
          mobileHidden={mobileView === "list"}
        />
      ) : (
        <EmptyChatState
          onNewConversation={handleNewConversation}
        />
      )}

      {/* ================= CHAT INFO ================= */}

      {activeConversation && infoOpen && (
        <>
          {/* Desktop */}

          <ChatInfoPanel
          user={selectedUser}
          conversation={activeConversation}
          media={sharedMedia[activeId] || []}
          files={sharedFiles[activeId] || []}
          links={sharedLinks[activeId] || []}
          muted={activeConversation?.muted || false}
          onToggleMute={handleToggleMute}
          onToggleBlock={handleToggleBlock}
          onClose={() => setInfoOpen(false)}
          isDrawer={false}
        />
          {/* Mobile overlay */}

          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
            onClick={() =>
              setInfoOpen(false)
            }
          />

          {/* Mobile drawer */}

          <ChatInfoPanel
            user={selectedUser}
            conversation={activeConversation}
            media={
              sharedMedia[activeId] || []
            }
            files={
              sharedFiles[activeId] || []
            }
            links={
              sharedLinks[activeId] || []
            }
            muted={activeConversation.muted}
            onToggleMute={handleToggleMute}
            onToggleBlock={handleToggleBlock}
            onClose={() => setInfoOpen(false)}
            isDrawer={true}
          />
        </>
      )}

      {/* ================= TOAST ================= */}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-base-800 border border-base-600 text-sm text-base-100 shadow-panel z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </ChatLayout>
  );
}

// ============================================================
// SETTINGS ROUTE
// ============================================================

function SettingsRoute() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  return <SettingsPage />;
}

// ============================================================
// APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Protected routes */}

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={<ChatPage />}
          />

          <Route
            path="/chat"
            element={<ChatPage />}
          />

          <Route
            path="/settings"
            element={<SettingsRoute />}
          />

          <Route
            path="*"
            element={<ChatPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}