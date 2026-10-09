import { useRef, useState, useEffect } from 'react';
import { Paperclip, Image as ImageIcon, Smile, Mic, Send, X, Square } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import EmojiSelector from './EmojiPicker';

export default function MessageComposer({ onSend, onTypingChange, replyingTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);

  const attachmentRef = useRef(null);
useEffect(()=>{
  const handleattachmentClickOutside = (event) =>{
    if(attachmentRef.current && !attachmentRef.current.contains(event.target)){
      setShowAttach(false);
    }
  };
  if (showAttach) {
    document.addEventListener('mousedown', handleattachmentClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleattachmentClickOutside);
  };
}, [showAttach]);



  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      emojiRef.current &&
      !emojiRef.current.contains(event.target)
    ) {
      setShowEmoji(false);
    }
  };

  if (showEmoji) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showEmoji]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [text]);

  useEffect(() => {
    if (!recording) return;
    setRecordSeconds(0);
    const t = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    onTypingChange(false);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
  const secs = String(recordSeconds % 60).padStart(2, '0');

  return (
    <div className="shrink-0 border-t border-base-700/70 bg-base-900/90 backdrop-blur-md px-3 sm:px-4 py-3">
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-base-800 border border-base-700 animate-fade-in">
          <div className="w-0.5 h-8 rounded-full bg-accent-cyan shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-accent-cyan">Replying to {replyingTo.authorName}</p>
            <p className="text-xs text-base-400 truncate">{replyingTo.text}</p>
          </div>
          <button onClick={onCancelReply} className="w-6 h-6 grid place-items-center rounded-full hover:bg-base-700 text-base-400 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-base-800 border border-rose-500/40 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <div className="flex-1 flex items-center gap-0.5 h-6 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="w-0.5 bg-rose-400/70 rounded-full shrink-0"
                style={{ height: `${8 + ((i * 37) % 16)}px` }}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-base-200 tabular-nums shrink-0">{mins}:{secs}</span>
          <button
            onClick={() => setRecording(false)}
            className="w-9 h-9 shrink-0 grid place-items-center rounded-xl bg-rose-500 text-white hover:brightness-110 active:scale-95 transition-all"
            aria-label="Stop recording"
          >
            <Square size={14} fill="currentColor" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          <div  ref={attachmentRef} className="relative">
            <ComposerIconButton icon={Paperclip} label="Attach file" onClick={() => { setShowAttach((s) => !s); setShowEmoji(false); }} active={showAttach} />
            {showAttach && <AttachmentMenu onClose={() => setShowAttach(false)} />}
          </div>
          {/* <ComposerIconButton icon={ImageIcon} label="Upload image" onClick={() => setShowAttach(true)} className="hidden sm:grid" /> */}

          <div className="flex-1 flex items-end bg-base-800 border border-base-700 rounded-2xl focus-within:ring-2 focus-within:ring-accent-cyan/40 focus-within:border-accent-cyan/40 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTypingChange(Boolean(e.target.value.trim()));
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="flex-1 resize-none bg-transparent px-4 py-2.5 text-sm text-base-100 placeholder:text-base-400 focus:outline-none max-h-40"
            />
            <div   ref={emojiRef} className="relative shrink-0 pr-1.5 pb-1.5 z-50">
              <ComposerIconButton
                icon={Smile}
                label="Emoji"
                onClick={() => {
                  setShowEmoji((s) => !s);
                  setShowAttach(false);
                }}
                active={showEmoji}
                small
              />
              {showEmoji && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <EmojiSelector
                    onSelect={(emoji) => {
                      setText((text) => text + emoji);
                      textareaRef.current?.focus();
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {text.trim() ? (
            <button
              onClick={handleSend}
              aria-label="Send message"
              className="w-11 h-11 shrink-0 grid place-items-center rounded-2xl bg-accent-gradient text-base-950 shadow-glow-accent hover:brightness-110 active:scale-95 transition-all"
            >
              <Send size={18} strokeWidth={2.4} />
            </button>
          ) : (
            <ComposerIconButton icon={Mic} label="Record voice message" onClick={() => setRecording(true)} large />
          )}
        </div>
      )}
    </div>
  );
}

function ComposerIconButton({ icon: Icon, label, onClick, active, className = '', small, large }) {
  const size = small ? 'w-8 h-8' : large ? 'w-11 h-11' : 'w-10 h-10';
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${size} shrink-0 grid place-items-center rounded-xl transition-all active:scale-95 ${active ? 'text-accent-cyan bg-accent-cyan/10' : 'text-base-300 hover:text-base-100 hover:bg-base-750'
        } ${className}`}
    >
      <Icon size={small ? 16 : 18} />
    </button>
  );
}
