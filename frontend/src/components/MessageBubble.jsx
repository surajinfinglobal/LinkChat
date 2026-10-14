import { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Reply, Smile, FileText, Download,MoreVertical,Trash2} from 'lucide-react';
import MessageReaction from './MessageReaction';
import { formatTime } from '../utils/time';
import { quickReactions } from '../data/mockData';

export default function MessageBubble({ message, isMine, showAvatar, avatar, authorName, onReply, onReact,onDeleteForMe,onDeleteForEveryone }) {
  const [showPicker, setShowPicker] = useState(false);
  const [downloadedImages, setDownloadedImages] = useState({});
  const [downloadingImage, setDownloadingImage] = useState(null);
  const [imageDownloadError, setImageDownloadError] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const pickerRef = useRef(null);
  const pickerButtonRef = useRef(null);
  const { type, text, time, status, reactions, replyTo, fileName, fileSize } = message;
  const images = message.images || [];
  const [showMessageMenu, setShowMessageMenu] = useState(false);
const [deleteConfirmation, setDeleteConfirmation] = useState(null);

const messageId = message._id || message.id;
const isDeletedForEveryone = message.deletedForEveryone === true;
  async function downloadImage(image, index) {
    if (downloadingImage !== null) return;

    const src = typeof image === 'string' ? image : image.url;
    setDownloadingImage(index);
    setImageDownloadError('');

    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error('Image download failed');
      }

      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = typeof image === 'string'
        ? `image-${index + 1}`
        : image.originalName || `image-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setDownloadedImages((previous) => ({ ...previous, [index]: true }));
    } catch (error) {
      console.error('Image download error:', error);
      setImageDownloadError('Unable to download this image. Please try again.');
    } finally {
      setDownloadingImage(null);
    }
  }

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
  if (isDeletedForEveryone) {
  return (
    <div
      className={`group flex items-end gap-2 ${
        isMine ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {!isMine && (
        <div className="w-6 shrink-0">
          {showAvatar && (
            <img
              src={avatar}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
        </div>
      )}

      <div
        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 ${
          isMine
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-br-sm'
            : 'bg-[#f0f2f5] dark:bg-[#202c33] rounded-bl-sm'
        }`}
      >
        <p className="text-sm italic opacity-70 flex items-center gap-2">
          <Trash2 size={13} />
          This message was deleted
        </p>

        <div className="flex justify-end mt-1">
          <span className="text-[10px] opacity-60">
            {formatTime(time)}
          </span>
        </div>
      </div>
    </div>
  );
}

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
          <div className="relative">
  <button
    type="button"
    onClick={() => setShowMessageMenu((previous) => !previous)}
    className="w-6 h-6 grid place-items-center rounded-full
      text-base-300 hover:text-accent-cyan hover:bg-base-700"
    aria-label="Message options"
    aria-expanded={showMessageMenu}
  >
    <MoreVertical size={14} />
  </button>

  {showMessageMenu && (
    <div
      className={`absolute top-7 ${
        isMine ? 'right-0' : 'left-0'
      } w-48 rounded-xl border border-base-600
        bg-base-800 shadow-xl z-30 py-1`}
    >
      <button
        type="button"
        onClick={() => {
          setShowMessageMenu(false);
          setDeleteConfirmation('me');
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5
          text-sm text-base-200 hover:bg-base-700"
      >
        <Trash2 size={15} />
        Delete for me
      </button>

      {isMine && (
        <button
          type="button"
          onClick={() => {
            setShowMessageMenu(false);
            setDeleteConfirmation('everyone');
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5
            text-sm text-rose-400 hover:bg-base-700"
        >
          <Trash2 size={15} />
          Delete for everyone
        </button>
      )}
    </div>
  )}
</div>
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
          } ${images.length > 0 ? 'p-1.5' : ''}`}
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

          {images.length > 0 && (
            <div className={`grid gap-1 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-xl overflow-hidden`}>
              {images.map((image, i) => {
                const src = typeof image === 'string' ? image : image.url;
                const isBlurred = !isMine && !downloadedImages[i];

                return (
                <div key={`${src}-${i}`} className="relative overflow-hidden rounded-lg">
                  <img
                    src={src}
                    alt={typeof image === 'string' ? '' : image.originalName || 'Shared image'}
                    className={`w-full h-40 object-cover transition-all duration-300 ${isBlurred ? 'blur-lg scale-105' : ''}`}
                    onError={() => setFailedImages((previous) => ({ ...previous, [i]: true }))}
                  />
                  {failedImages[i] && (
                    <div className="absolute inset-0 grid place-items-center bg-black/60 px-3 text-center text-xs text-white">
                      Image could not be loaded
                    </div>
                  )}
                  {isBlurred && !failedImages[i] && (
                    <button
                      type="button"
                      onClick={() => downloadImage(image, i)}
                      disabled={downloadingImage !== null}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white text-xs font-medium disabled:cursor-wait"
                      aria-label="Download image to view"
                    >
                      <Download size={20} />
                      {downloadingImage === i ? 'Downloading…' : 'Download to view'}
                    </button>
                  )}
                </div>
                );
              })}
              {imageDownloadError && (
                <p role="alert" className="col-span-full px-1 text-xs text-rose-400">
                  {imageDownloadError}
                </p>
              )}
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

          {text && (type === 'text' || type === 'image' || type === 'mixed' || type === 'file') && (
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
      {deleteConfirmation && (
  <div className="absolute inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40 rounded-xl"
      onClick={() => setDeleteConfirmation(null)}
    />

    <div className="relative w-64 rounded-xl border border-base-600
      bg-base-800 p-4 shadow-2xl">
      <h3 className="text-sm font-semibold text-white">
        Delete message?
      </h3>

      <p className="mt-2 text-xs text-base-300">
        {deleteConfirmation === 'everyone'
          ? 'This message will be deleted for everyone in the conversation.'
          : 'This message will be removed only from your chat.'}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setDeleteConfirmation(null)}
          className="rounded-lg px-3 py-2 text-xs text-base-300
            hover:bg-base-700"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            const action = deleteConfirmation;
            setDeleteConfirmation(null);

            if (action === 'me') {
              onDeleteForMe?.(messageId);
            } else {
              onDeleteForEveryone?.(messageId);
            }
          }}
          className="rounded-lg bg-rose-600 px-3 py-2
            text-xs font-medium text-white hover:bg-rose-500"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
