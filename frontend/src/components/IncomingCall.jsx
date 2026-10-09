import {
  Phone,
  Video,
  PhoneOff,
  Volume2,
} from 'lucide-react';

function getAvatarUrl(value, name) {
  if (!value || value === 'null' || value === 'undefined') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0D8ABC&color=fff`;
  }

  if (value.startsWith('http') || value.startsWith('data:')) {
    return value;
  }

  return `http://localhost:5000${
    value.startsWith('/') ? '' : '/'
  }${value}`;
}

export default function IncomingCall({
  open,
  type = 'voice',
  user,
  conversation,
  onAccept,
  onReject,
}) {
  if (!open) {
    return null;
  }

  const name = user?.fullName || 'Unknown User';

  const avatar = getAvatarUrl(
    user?.avatar || conversation?.avatar,
    name
  );

  const isVideo = type === 'video';

  return (
    <div className="fixed right-5 top-5 z-[200] w-[360px] max-w-[calc(100vw-24px)]">
      <div className="overflow-hidden rounded-2xl border border-base-700/80 bg-base-900 shadow-2xl shadow-black/50 ring-1 ring-white/5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-700/70 bg-base-850/95 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-gradient-soft">
              {isVideo ? (
                <Video
                  size={16}
                  className="text-accent-cyan"
                />
              ) : (
                <Phone
                  size={16}
                  className="text-accent-cyan"
                />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-base-100">
                Incoming call
              </p>

              <p className="text-[11px] text-base-400">
                {isVideo ? 'Video call' : 'Voice call'}
              </p>
            </div>
          </div>

          <Volume2
            size={17}
            className="animate-pulse text-base-400"
          />
        </div>

        {/* Caller */}
        <div className="flex flex-col items-center px-5 pb-5 pt-7">
          <div className="relative">
            {/* Ring animation */}
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" />

            <div className="relative rounded-full bg-gradient-to-br from-accent-cyan/40 to-accent-blue/30 p-1">
              <img
                src={avatar}
                alt={name}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-base-900"
              />
            </div>

            {/* Online indicator */}
            <span
              className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-base-900 ${
                user?.status === 'online'
                  ? 'bg-emerald-400'
                  : 'bg-red-500'
              }`}
            />
          </div>

          <h2 className="mt-4 text-xl font-semibold text-base-100">
            {name}
          </h2>

          <p className="mt-1 text-sm text-base-400">
            {isVideo
              ? 'Incoming video call...'
              : 'Incoming voice call...'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-8 border-t border-base-700/70 bg-base-850/70 px-5 py-4">

          {/* Reject */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onReject}
              aria-label="Reject call"
              className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 active:scale-95"
            >
              <PhoneOff size={21} />
            </button>

            <span className="text-[11px] text-base-400">
              Decline
            </span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onAccept}
              aria-label="Accept call"
              className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95"
            >
              {isVideo ? (
                <Video size={21} />
              ) : (
                <Phone size={21} />
              )}
            </button>

            <span className="text-[11px] text-base-400">
              Accept
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}