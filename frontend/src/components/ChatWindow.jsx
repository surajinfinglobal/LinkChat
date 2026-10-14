import { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import CallOverlay from './CallOverlay';
import IncomingCall from './IncomingCall';
import socket from "../services/socket";
import useWebRTC from '../hooks/useWebRTC';
import { getCustomWallpapers } from '../utils/customWallpapers';



const WALLPAPERS = {
  default: 'linear-gradient(135deg, #12151D 0%, #1B202B 100%)',
  aurora: 'linear-gradient(135deg, rgba(34,211,238,0.22) 0%, rgba(59,130,246,0.18) 100%)',
  sunset: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(239,68,68,0.18) 100%)',
  forest: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(14,165,233,0.18) 100%)',
  violet: 'linear-gradient(135deg, rgba(129,140,248,0.22) 0%, rgba(192,132,252,0.18) 100%)',
  mono: 'linear-gradient(135deg, #2E3543 0%, #0B0D13 100%)',
  'public-dark': "url('/dark.jpg')",
  'public-chat': "url('/bakground2.png')",
};

export default function ChatWindow({
  activeId,
  user,
  conversation,
  messages,
  currentUser,
  onSend,
  onToggleBlock,
  onReact,
  onDeleteForMe,
  onDeleteForEveryone,
  onBack,
  onOpenInfo,
  mobileHidden,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState([]);
const [deletedForEveryoneIds, setDeletedForEveryoneIds] = useState([]);
  const [call, setCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('linkchat-wallpaper') || 'default');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
  const typingTimeoutRef = useRef(null);
  const typingActiveRef = useRef(false);
  const currentUserId = currentUser?.id || currentUser?._id;

const {
    localStream,
    remoteStream,
    connectionState,
    toggleMute,
    toggleCamera,
    cleanup: cleanupWebRTC,
} = useWebRTC({
    socket,
    callId: call?.callId,
    remoteUserId: call?.receiverId || call?.callerId,
    isCaller: call?.isCaller === true,
    enabled: !!call && call?.status === 'connected',
    type: call?.type || 'voice',
});



// accept call 
const handleAcceptCall = () => {
  if (!incomingCall) return;

  socket.emit('accept_call', {
    callId: incomingCall.callId,
    callerId: incomingCall.callerId,
  });
  setCall({
    callId: incomingCall.callId,
    type: incomingCall.type,
    status: 'connected',
    callerId: incomingCall.callerId,
    user: incomingCall.caller,
    isCaller: false,
  });
  setIncomingCall(null);
};

// reject call 
const handleRejectCall = () => {
 if (!incomingCall) return;

   socket.emit('reject_call', {
    callId: incomingCall.callId,
    callerId: incomingCall.callerId,
  });
  setIncomingCall(null);
};

useEffect(() => {
    const handleCallAccepted = (data) => {
        console.log('Call accepted:', data);

        setCall((previous) => {
            if (!previous) return previous;

            if (
                String(previous.callId) !==
                String(data.callId)
            ) {
                return previous;
            }

            return {
                ...previous,
                status: 'connected',
                receiverId: String(data.receiverId),
                isCaller: true,
            };
        });
    };

    socket.on('call_accepted', handleCallAccepted);

    return () => {
        socket.off(
            'call_accepted',
            handleCallAccepted
        );
    };
}, []);

useEffect(() => {
  const handleCallRinging = (data) => {
    setCall((previous) => {
      if (!previous || String(previous.callId) !== String(data.callId)) {
        return previous;
      }

      return {
        ...previous,
        status: 'ringing',
      };
    });
  };

  socket.on('call_ringing', handleCallRinging);

  return () => {
    socket.off('call_ringing', handleCallRinging);
  };
}, []);

// reject event listner 
useEffect(() => {
  const handleCallRejected = (data) => {
    console.log('Call rejected:', data);

    if (!call?.callId || String(data.callId) !== String(call.callId)) {
      return;
    }

    cleanupWebRTC();
    setCall(null);
  };

  socket.on('call_rejected', handleCallRejected);

  return () => {
    socket.off('call_rejected', handleCallRejected);
  };
}, [call?.callId, cleanupWebRTC]);

useEffect(() => {
  const handleCallCancelled = ({ callId } = {}) => {
    if (
      !incomingCall?.callId ||
      String(incomingCall.callId) !== String(callId)
    ) {
      return;
    }

    setIncomingCall(null);
  };

  socket.on('call_cancelled', handleCallCancelled);
  return () => socket.off('call_cancelled', handleCallCancelled);
}, [incomingCall?.callId]);


  const handleVoiceCall = () => {
    const receiverId = chatUser?._id || chatUser?.id;

  if (!receiverId) {
    console.error('Receiver ID not found');
    return;
  }

  const callId = crypto.randomUUID();

setCall({
  callId,
  type: 'voice',
  status: 'calling',
  receiverId: String(receiverId),
  user: chatUser,
  isCaller: true,
});

  socket.emit('call_user', {
    callId,
    receiverId: String(receiverId),
    type: 'voice',
  });
};

const handleVideoCall = () => {
    const receiverId = chatUser?._id || chatUser?.id;

  if (!receiverId) {
    console.error('Receiver ID not found');
    return;
  }

  const callId = crypto.randomUUID();

  setCall({
     callId,
    type: 'video',
    status: 'calling',
    receiverId: String(receiverId),
    user: chatUser,
    isCaller: true,
  });

  socket.emit('call_user', {
    callId,
    receiverId: String(receiverId),
    type: 'video',
  });
};

const handleEndCall = () => {
    if (!call?.callId) {
        cleanupWebRTC();
        setCall(null);
        return;
    }

    if (call.isCaller && ['calling', 'ringing'].includes(call.status)) {
        socket.emit('cancel_call', { callId: call.callId });
        cleanupWebRTC();
        setCall(null);
        return;
    }

    const receiverId =
        call.receiverId ||
        call.callerId;

    if (receiverId) {
        socket.emit('end_call', {
            callId: call.callId,
            receiverId: String(receiverId),
        });
    }

    cleanupWebRTC();

    setCall(null);
};

useEffect(() => {
    const handleCallEnded = (data) => {
        console.log('Call ended:', data);

        const matchesActiveCall =
            Boolean(call?.callId) &&
            String(data.callId) === String(call.callId);
        const matchesIncomingCall =
            Boolean(incomingCall?.callId) &&
            String(data.callId) === String(incomingCall.callId);

        if (!matchesActiveCall && !matchesIncomingCall) {
            return;
        }

        cleanupWebRTC();

        if (matchesActiveCall) {
            setCall(null);
        }
        if (matchesIncomingCall) {
            setIncomingCall(null);
        }
    };

    socket.on('call_ended', handleCallEnded);

    return () => {
        socket.off('call_ended', handleCallEnded);
    };
}, [call?.callId, incomingCall?.callId, cleanupWebRTC]);

  useEffect(() => {
    const syncWallpaper = () => {
      setWallpaper(localStorage.getItem('linkchat-wallpaper') || 'default');
    };

    syncWallpaper();
    window.addEventListener('storage', syncWallpaper);
    return () => window.removeEventListener('storage', syncWallpaper);
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    if (!wallpaper.startsWith('custom:')) {
      setCustomWallpaperUrl('');
      return undefined;
    }

    getCustomWallpapers()
      .then((savedWallpapers) => {
        if (!active) return;
        const savedWallpaper = savedWallpapers.find((item) => item.id === wallpaper);
        if (!savedWallpaper) {
          setWallpaper('default');
          localStorage.setItem('linkchat-wallpaper', 'default');
          return;
        }

        objectUrl = URL.createObjectURL(savedWallpaper.image);
        setCustomWallpaperUrl(objectUrl);
      })
      .catch((error) => {
        console.error('Selected wallpaper loading error:', error);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [wallpaper]);

  const chatUser = user || conversation.participants?.find(
    (participant) =>
      String(participant?._id || participant?.id) !== String(currentUserId)
  );

// incomin call listener 
useEffect(()=>{
 const handleIncomingCall = (data) => {
    console.log('Incoming call:', data);

    setIncomingCall({
      callId: data.callId,
      type: data.type,
      callerId: data.callerId,
      caller: data.caller,
    });
  }
   socket.on('incoming_call', handleIncomingCall);

  return () => {
    socket.off('incoming_call', handleIncomingCall);
  };
},[]);
// if call unavilble 
useEffect(() => {
  const handleCallUnavailable = (data) => {
    console.log('Call unavailable:', data);

    if (!call?.callId || String(data.callId) !== String(call.callId)) {
      return;
    }

    if (data.reason === 'offline') {
      return;
    }

    cleanupWebRTC();
    setCall(null);
  };

  socket.on('call_unavailable', handleCallUnavailable);

  return () => {
    socket.off('call_unavailable', handleCallUnavailable);
  };
}, [call?.callId, cleanupWebRTC]);



  useEffect(() => {
  if (!activeId) return;

  socket.emit("join_conversation", activeId);

  return () => {
    clearTimeout(typingTimeoutRef.current);
    socket.emit("stop_typing", { conversationId: activeId });
    typingActiveRef.current = false;
  };
}, [activeId]);

useEffect(() => {
  if (!activeId) return;

  const handleUserTyping = (data) => {
    if (String(data.conversationId) !== String(activeId)) {
      return;
    }

    if (String(data.userId) === String(currentUserId)) {
      return;
    }

    setIsTyping(true);
  };

  const handleUserStopTyping = (data) => {
    if (String(data.conversationId) !== String(activeId)) {
      return;
    }

    if (String(data.userId) === String(currentUserId)) {
      return;
    }

    setIsTyping(false);
  };

  socket.on("user_typing", handleUserTyping);
  socket.on("user_stop_typing", handleUserStopTyping);

  return () => {
    socket.off("user_typing", handleUserTyping);
    socket.off("user_stop_typing", handleUserStopTyping);
  };
}, [activeId, currentUserId]);

  useEffect(() => {
    setReplyingTo(null);
    setIsTyping(false);
  }, [activeId]);

  const stopTyping = () => {
    clearTimeout(typingTimeoutRef.current);
    if (!typingActiveRef.current || !activeId) return;
    socket.emit("stop_typing", { conversationId: activeId });
    typingActiveRef.current = false;
  };

  const handleTypingChange = (hasText) => {
    if (!activeId || conversation.isBlocked) return;

    if (!hasText) {
      stopTyping();
      return;
    }

    if (!typingActiveRef.current) {
      socket.emit("typing", { conversationId: activeId });
      typingActiveRef.current = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1200);
  };

  const handleDeleteForMe = (messageId) => {
  if (!messageId || !activeId) return;

  if (onDeleteForMe) {
    onDeleteForMe(messageId);
    return;
  }

  // Immediately hide the message in this UI
  setDeletedForMeIds((previous) =>
    previous.includes(String(messageId))
      ? previous
      : [...previous, String(messageId)]
  );

  socket.emit('delete_message_for_me', {
    messageId: String(messageId),
    conversationId: String(activeId),
  });
};
useEffect(() => {
  const handleDeleteError = (data) => {
    if (
      data?.conversationId &&
      String(data.conversationId) !== String(activeId)
    ) {
      return;
    }

    if (data?.messageId) {
      const failedMessageId = String(data.messageId);
      setDeletedForMeIds((previous) =>
        previous.filter((messageId) => messageId !== failedMessageId)
      );
    }

    console.error("Message deletion failed:", data?.message);
    window.alert(data?.message || "Unable to delete message.");
  };

  socket.on("message_delete_error", handleDeleteError);

  return () => {
    socket.off("message_delete_error", handleDeleteError);
  };
}, []);

const handleDeleteForEveryone = (messageId) => {
  if (!messageId || !activeId) return;

  if (onDeleteForEveryone) {
    onDeleteForEveryone(messageId);
    return;
  }

  socket.emit('delete_message_for_everyone', {
    messageId: String(messageId),
    conversationId: String(activeId),
  });
};
  const handleReply = (message) => {
    setReplyingTo({
      authorName: message.authorId === currentUser.id ? 'Yourself' : message.authorName || conversation.name,
      text: message.text || (message.type === 'image' ? 'Photo' : message.fileName),
    });
  };



const handleSendMessage = async (text = "", replyTo = null, images = []) => {
  if (!String(text).trim() && images.length === 0) return false;
  if (!activeId || conversation.isBlocked) return false;

  const sent = await onSend(String(text).trim(), replyTo ?? replyingTo, images);
  if (sent !== false) {
    setReplyingTo(null);
  }
  return sent;
};
const visibleMessages = messages
  .filter((msg) => {
    const id = String(msg._id || msg.id);

    return !deletedForMeIds.includes(id);
  })
  .map((msg) => {
    const id = String(msg._id || msg.id);

    if (
      msg.deletedForEveryone ||
      deletedForEveryoneIds.includes(id)
    ) {
      return {
        ...msg,
        deletedForEveryone: true,
        text: '',
        images: [],
      };
    }

    return msg;
  });
useEffect(() => {
  const handleDeletedForMe = (data) => {
    if (String(data.conversationId) !== String(activeId)) return;

    setDeletedForMeIds((previous) =>
      previous.includes(String(data.messageId))
        ? previous
        : [...previous, String(data.messageId)]
    );
  };

  const handleDeletedForEveryone = (data) => {
    if (String(data.conversationId) !== String(activeId)) return;

    setDeletedForEveryoneIds((previous) =>
      previous.includes(String(data.messageId))
        ? previous
        : [...previous, String(data.messageId)]
    );
  };

  socket.on('message_deleted_for_me', handleDeletedForMe);
  socket.on(
    'message_deleted_for_everyone',
    handleDeletedForEveryone
  );

  return () => {
    socket.off('message_deleted_for_me', handleDeletedForMe);
    socket.off(
      'message_deleted_for_everyone',
      handleDeletedForEveryone
    );
  };
}, [activeId]);

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col h-full ${mobileHidden && !incomingCall && !call ? 'hidden md:flex' : 'flex'}`}
      style={{
        backgroundImage: customWallpaperUrl
          ? `url("${customWallpaperUrl}")`
          : WALLPAPERS[wallpaper] || WALLPAPERS.default,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <ChatHeader user={chatUser} conversation={conversation} onOpenInfo={onOpenInfo} onBack={onBack}
       onVoiceCall={handleVoiceCall}
      onVideoCall={handleVideoCall} />
      <MessageList
        messages={visibleMessages}
        activeId={activeId}
        conversation={conversation}
        currentUserId={currentUserId}
        onReply={handleReply}
        onReact={onReact}
        onDeleteForMe={handleDeleteForMe}
  onDeleteForEveryone={handleDeleteForEveryone}
        isTyping={isTyping}
      />
      {conversation.isBlocked ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-base-700/70 bg-base-900/90 px-4 py-3">
          <p className="text-sm text-base-300">
            {conversation.blockedByMe ? 'You blocked this user.' : 'You cannot message this user.'}
            {' '}Existing messages are still here.
          </p>
          {conversation.blockedByMe && (
            <button type="button" onClick={onToggleBlock} className="shrink-0 rounded-lg bg-accent-gradient px-3 py-2 text-xs font-semibold text-base-950">
              Unblock
            </button>
          )}
        </div>
      ) : (
        <MessageComposer onSend={handleSendMessage} onTypingChange={handleTypingChange} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
      )}
      <CallOverlay
        open={!!call}
      type={call?.type || 'voice'}
      user={call?.user}
      conversation={conversation}
      status={
          connectionState === 'connected'
              ? 'connected'
              : call?.status || 'calling'
      }
      localStream={localStream}
      remoteStream={remoteStream}
      onToggleMute={toggleMute}
      onToggleCamera={toggleCamera}
      onEnd={handleEndCall}
      />
    {/* <button onClick={handleTestIncomingCall} className="fixed bottom-5 right-5 z-[100] bg-accent-cyan text-base-950 px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform">
  Test Incoming Call
</button>
<button onClick={handleTestIncomingVideoCall} className="fixed bottom-16 right-5 z-[100] bg-accent-cyan text-base-950 px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform">
  Test Incoming Video Call
</button> */}

    <IncomingCall
  open={Boolean(incomingCall)}
  type={incomingCall?.type}
   user={incomingCall?.caller}
  conversation={conversation}
  onAccept={handleAcceptCall}
  onReject={handleRejectCall}
/>
    </div>
  );
}
