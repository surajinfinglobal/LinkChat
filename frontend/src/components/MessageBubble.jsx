import { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Reply, Smile, FileText, Download } from 'lucide-react';
import MessageReaction from './MessageReaction';
import { formatTime } from '../utils/time';
import { quickReactions } from '../data/mockData';

export default function MessageBubble({ message, isMine, showAvatar, avatar, authorName, onReply, onReact }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const pickerButtonRef = useRef(null);
  const { type, text, time, status, reactions, replyTo, images, fileName, fileSize } = message;

  useEffect(() => {
    if (!showPicker) return;

    const closeOnOutsidePointer = (event) => {
      if (
        pickerRef.current?.contains(event.target) ||
        pickerButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setShowPicker(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [showPicker]);

  return (
    <div
      className={`group flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
    >
      {!isMine && (
        <div className="w-6 shrink-0">
          {showAvatar && <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover" />}
        </div>
      )}
{/* profileName */}
      <div className={`relative max-w-[78%] sm:max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && authorName && showAvatar && (
          <span className="text-[11px] font-medium text-accent-cyan mb-1 px-1"></span>
        )}

        {/* Hover action toolbar */}
        <div
          className={`absolute top-0 ${isMine ? 'right-full mr-1.5' : 'left-full ml-1.5'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-base-800 border border-base-600 rounded-full px-1 py-1 shadow-glow z-10`}
        >
          <button
            ref={pickerButtonRef}
            onClick={() => setShowPicker((s) => !s)}
            className="w-6 h-6 grid place-items-center rounded-full text-base-300 hover:text-accent-cyan hover:bg-base-700"
            aria-label="React"
          >
            <Smile size={13} />
          </button>
          <button
            onClick={() => onReply(message)}
            className="w-6 h-6 grid place-items-center rounded-full text-base-300 hover:text-accent-cyan hover:bg-base-700"
            aria-label="Reply"
          >
            <Reply size={13} />
          </button>
        </div>

        {showPicker && (
          <div
            ref={pickerRef}
            className={`absolute -top-11 ${isMine ? 'right-0' : 'left-0'} flex items-center gap-0.5 bg-base-800 border border-base-600 rounded-full px-1.5 py-1 shadow-panel z-20 animate-pop-in`}
          >
            {quickReactions.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onReact(message.id, e);
                  setShowPicker(false);
                }}
                className="w-7 h-7 grid place-items-center rounded-full hover:bg-base-700 text-base hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <div
          className={`relative px-3.5 py-2.5 rounded-2xl ${
            isMine
              ? 'bg-[#d9fdd3] text-[#111b21] rounded-br-sm dark:bg-[#005c4b] dark:text-[#e9edef] after:content-[\'\'] after:absolute after:bottom-0 after:right-[-6px] after:w-3 after:h-3 after:bg-[#d9fdd3] after:[clip-path:polygon(0_0,0_100%,100%_100%)] dark:after:bg-[#005c4b]'
              : 'bg-[#f0f2f5] text-[#111b21] rounded-bl-sm dark:bg-[#202c33] dark:text-[#e9edef] after:content-[\'\'] after:absolute after:bottom-0 after:left-[-6px] after:w-3 after:h-3 after:bg-[#f0f2f5] after:[clip-path:polygon(100%_0,100%_100%,0_100%)] dark:after:bg-[#202c33]'
          } ${type === 'image' ? 'p-1.5' : ''}`}
        >
          {replyTo && (
            <div
              className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 text-xs ${
                isMine ? 'bg-black/10 border-base-950/40' : 'bg-base-900/60 border-accent-cyan'
              }`}
            >
              <p className={`font-semibold ${isMine ? 'text-base-950/80' : 'text-accent-cyan'}`}>{replyTo.authorName}</p>
              <p className={`truncate ${isMine ? 'text-base-950/70' : 'text-base-300'}`}>{replyTo.text}</p>
            </div>
          )}

          {type === 'image' && (
            <div className={`grid gap-1 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-xl overflow-hidden`}>
              {images.map((src, i) => (
                <img key={i} src={src} alt="" className="w-full h-40 object-cover rounded-lg" />
              ))}
            </div>
          )}

          {type === 'file' && (
            <div className={`flex items-center gap-3 ${isMine ? '' : ''} min-w-[220px]`}>
              <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${isMine ? 'bg-black/15' : 'bg-base-700'}`}>
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className={`text-xs ${isMine ? 'text-base-950/70' : 'text-base-400'}`}>{fileSize}</p>
              </div>
              <Download size={16} className="shrink-0 cursor-pointer opacity-70 hover:opacity-100" />
            </div>
          )}

          {text && (type === 'text' || type === 'image' || type === 'file') && (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${type !== 'text' ? 'mt-2 px-1' : ''}`}>
              {text}
            </p>
          )}

          <div className={`flex items-center gap-1 mt-1 ${type !== 'text' ? 'px-1 pb-0.5' : ''} ${isMine ? 'justify-end' : 'justify-end'}`}>
            <span className={`text-[10px] ${isMine ? 'text-black/55 dark:text-white/60' : 'text-[#667781] dark:text-[#8696a0]'}`}>{formatTime(time)}</span>
            {isMine && (
              <span className={status === 'read' ? 'text-[#1689c7] dark:text-[#53bdeb]' : 'text-black/50 dark:text-white/65'}>
                {status === 'sent' ? <Check size={13} /> : <CheckCheck size={13} />}
              </span>
            )}
          </div>
        </div>

        <MessageReaction
          reactions={reactions}
          onToggle={(i) => onReact(message.id, reactions[i].emoji)}
        />
      </div>
    </div>
  );
}
