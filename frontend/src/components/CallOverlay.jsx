import { useEffect, useRef, useState } from 'react';

import {
    Mic,
    MicOff,
    Volume2,
    Video,
    VideoOff,
    PhoneOff,
    Phone,
    Maximize2,
    Minimize2,
    GripHorizontal,
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

export default function CallOverlay({
    open,
    type = 'voice',
    user,
    conversation,
    status = 'calling',
    onEnd,

    // WebRTC streams - optional for now
    localStream = null,
    remoteStream = null,
    // WebRTC controls - optional for now
    onToggleMute,
    onToggleCamera,
}) {
    const [minimized, setMinimized] = useState(false);

    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);

    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState(status);

    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const [position, setPosition] = useState({
        x: window.innerWidth - 380,
        y: window.innerHeight - 330,
    });

    const dragging = useRef(false);

    const dragOffset = useRef({
        x: 0,
        y: 0,
    });

    const name = user?.fullName || 'Unknown User';

    const avatar = getAvatarUrl(
        user?.avatar || conversation?.avatar,
        name
    );

    const isVideo = type === 'video';
    const isUserOnline = user?.status === 'online';

    /*
    |--------------------------------------------------------------------------
    | Sync call status
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!open) {
            setCallDuration(0);
            return;
        }

        setCallDuration(0);

        if (user?.status !== 'online') {
            setCallStatus('offline');
            return;
        }

        setCallStatus(status);
    }, [open, user?.status, status]);

    /*
    |--------------------------------------------------------------------------
    | Call duration
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!open || callStatus !== 'connected') {
            return;
        }

        const timer = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [open, callStatus]);

    /*
    |--------------------------------------------------------------------------
    | Reset UI when call opens
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!open) return;

        setMinimized(false);
        setMuted(false);
        setCameraOff(false);

        setPosition({
            x: Math.max(16, window.innerWidth - 380),
            y: Math.max(16, window.innerHeight - 330),
        });
    }, [open]);

    /*
    |--------------------------------------------------------------------------
    | Attach local stream
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!localVideoRef.current) return;

        localVideoRef.current.srcObject = localStream || null;
    }, [localStream]);

    /*
    |--------------------------------------------------------------------------
    | Attach remote video stream
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!remoteVideoRef.current) return;

        remoteVideoRef.current.srcObject = remoteStream || null;
    }, [remoteStream]);

    /*
    |--------------------------------------------------------------------------
    | Attach remote audio stream
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!remoteAudioRef.current) return;

        remoteAudioRef.current.srcObject = remoteStream || null;
    }, [remoteStream]);

    /*
    |--------------------------------------------------------------------------
    | Drag handlers
    |--------------------------------------------------------------------------
    */
    const handlePointerDown = (e) => {
        if (!minimized) return;

        dragging.current = true;

        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };

        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragging.current || !minimized) return;

        const widgetWidth = 360;
        const widgetHeight = 300;

        const nextX = e.clientX - dragOffset.current.x;
        const nextY = e.clientY - dragOffset.current.y;

        setPosition({
            x: Math.max(
                8,
                Math.min(
                    window.innerWidth - widgetWidth - 8,
                    nextX
                )
            ),
            y: Math.max(
                8,
                Math.min(
                    window.innerHeight - widgetHeight - 8,
                    nextY
                )
            ),
        });
    };

    const handlePointerUp = (e) => {
        dragging.current = false;

        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    /*
    |--------------------------------------------------------------------------
    | Mute
    |--------------------------------------------------------------------------
    */
    const handleToggleMute = () => {
        const nextValue = !muted;

        setMuted(nextValue);

        if (onToggleMute) {
            onToggleMute(nextValue);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Camera
    |--------------------------------------------------------------------------
    */
    const handleToggleCamera = () => {
        const nextValue = !cameraOff;

        setCameraOff(nextValue);

        if (onToggleCamera) {
            onToggleCamera(nextValue);
        }
    };

    if (!open) {
        return null;
    }

    const callStatusLabel =
        callStatus === 'offline'
            ? 'Offline'
            : callStatus === 'connected'
                ? formatDuration(callDuration)
                : callStatus === 'calling'
                    ? 'Calling...'
                    : 'Connecting...';

    /*
    |--------------------------------------------------------------------------
    | MINIMIZED CALL
    |--------------------------------------------------------------------------
    */

    if (minimized) {
        return (
            <div
                className="fixed z-[100] w-[360px] max-w-[calc(100vw-16px)] select-none"
                style={{
                    left: position.x,
                    top: position.y,
                }}
            >
                <div className="overflow-hidden rounded-2xl border border-base-700/80 bg-base-900 shadow-2xl shadow-black/50 ring-1 ring-white/5">

                    {/* Header */}
                    <div
                        className="flex cursor-move items-center justify-between border-b border-base-700/70 bg-base-850/95 px-3 py-2.5 backdrop-blur-xl"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    >
                        <div className="flex min-w-0 items-center gap-2.5">

                            <div className="relative shrink-0">
                                <img
                                    src={avatar}
                                    alt={name}
                                    className="h-9 w-9 rounded-full object-cover ring-2 ring-base-700"
                                />

                                <span
                                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-base-900 ${
                                        isUserOnline
                                            ? 'bg-emerald-400'
                                            : 'bg-red-500'
                                    }`}
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-base-100">
                                    {name}
                                </p>

                                <p className="text-[11px] text-base-400">
                                    {isVideo ? 'Video call' : 'Voice call'} ·{' '}
                                    {callStatusLabel}
                                </p>
                            </div>
                        </div>

                        <div className="ml-2 flex shrink-0 items-center gap-0.5">

                            <button
                                type="button"
                                title="Maximize"
                                aria-label="Maximize call"
                                onPointerDown={(e) =>
                                    e.stopPropagation()
                                }
                                onClick={() =>
                                    setMinimized(false)
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-base-400 transition hover:bg-base-700 hover:text-base-100"
                            >
                                <Maximize2 size={15} />
                            </button>

                            <button
                                type="button"
                                title="End call"
                                aria-label="End call"
                                onPointerDown={(e) =>
                                    e.stopPropagation()
                                }
                                onClick={onEnd}
                                className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                            >
                                <PhoneOff size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative h-[190px] overflow-hidden bg-base-950">

                        {isVideo ? (
                            <>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="absolute inset-0 h-full w-full object-cover"
                                />

                                {!remoteStream && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-base-900 via-base-900 to-base-950">
                                        <div className="relative">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-accent-cyan/10" />

                                            <img
                                                src={avatar}
                                                alt={name}
                                                className="relative h-20 w-20 rounded-full object-cover ring-4 ring-base-800 shadow-xl"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-white backdrop-blur-md">
                                    <Video size={11} />
                                    Video
                                </div>

                                {/* Local preview */}
                                <div className="absolute bottom-3 right-3 h-20 w-24 overflow-hidden rounded-xl border border-white/10 bg-base-800 shadow-lg">

                                    {cameraOff ? (
                                        <div className="flex h-full items-center justify-center text-base-500">
                                            <VideoOff size={18} />
                                        </div>
                                    ) : (
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-br from-base-900 via-base-900 to-base-950" />

                                <div className="relative flex h-full flex-col items-center justify-center">

                                    <div className="relative">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-accent-cyan/10" />

                                        <img
                                            src={avatar}
                                            alt={name}
                                            className="relative h-20 w-20 rounded-full object-cover ring-4 ring-base-800 shadow-xl"
                                        />
                                    </div>

                                    <p className="mt-3 text-xs text-base-400">
                                        {callStatusLabel}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-2.5 border-t border-base-700/70 bg-base-900 px-4 py-3">

                        <button
                            type="button"
                            title={muted ? 'Unmute' : 'Mute'}
                            aria-label={muted ? 'Unmute' : 'Mute'}
                            onClick={handleToggleMute}
                            className={`grid h-10 w-10 place-items-center rounded-full transition ${
                                muted
                                    ? 'bg-base-700 text-white'
                                    : 'bg-base-800 text-base-300 hover:bg-base-700 hover:text-white'
                            }`}
                        >
                            {muted ? (
                                <MicOff size={16} />
                            ) : (
                                <Mic size={16} />
                            )}
                        </button>

                        <CallControlButton
                            icon={Volume2}
                            label="Speaker"
                        />

                        {isVideo && (
                            <button
                                type="button"
                                title={
                                    cameraOff
                                        ? 'Turn camera on'
                                        : 'Turn camera off'
                                }
                                aria-label={
                                    cameraOff
                                        ? 'Turn camera on'
                                        : 'Turn camera off'
                                }
                                onClick={handleToggleCamera}
                                className={`grid h-10 w-10 place-items-center rounded-full transition ${
                                    cameraOff
                                        ? 'bg-base-700 text-white'
                                        : 'bg-base-800 text-base-300 hover:bg-base-700 hover:text-white'
                                }`}
                            >
                                {cameraOff ? (
                                    <VideoOff size={16} />
                                ) : (
                                    <Video size={16} />
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            title="End call"
                            aria-label="End call"
                            onClick={onEnd}
                            className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 active:scale-95"
                        >
                            <PhoneOff size={17} />
                        </button>
                    </div>

                    <div className="flex justify-center border-t border-base-800 bg-base-900 py-1">
                        <GripHorizontal
                            size={16}
                            className="text-base-700"
                        />
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MAXIMIZED CALL
    |--------------------------------------------------------------------------
    */

    return (
        <div className="fixed inset-0 z-[100] bg-base-950/95 backdrop-blur-xl">

            {/* Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-accent-cyan/10 blur-3xl" />

                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex h-16 items-center justify-between px-5">

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

                    <span className="text-sm font-medium text-base-200">
                        {isVideo ? 'Video call' : 'Voice call'}
                    </span>
                </div>

                <button
                    type="button"
                    title="Minimize"
                    aria-label="Minimize call"
                    onClick={() => {
                        setPosition({
                            x: Math.max(
                                16,
                                window.innerWidth - 380
                            ),
                            y: Math.max(
                                16,
                                window.innerHeight - 330
                            ),
                        });

                        setMinimized(true);
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl text-base-400 transition hover:bg-base-800 hover:text-base-100"
                >
                    <Minimize2 size={17} />
                </button>
            </div>

            {/* Main */}
            <div className="relative z-10 flex h-[calc(100%-8rem)] flex-col items-center justify-center px-6">

                {isVideo ? (
                    <div className="absolute inset-5 overflow-hidden rounded-3xl border border-base-700/60 bg-base-900">

                        {/* Remote video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        {/* Remote fallback */}
                        {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center bg-base-900">

                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-accent-cyan/10" />

                                    <img
                                        src={avatar}
                                        alt={name}
                                        className="relative h-32 w-32 rounded-full object-cover ring-4 ring-base-700 shadow-2xl"
                                    />

                                    <span
                                        role="status"
                                        aria-label={
                                            isUserOnline
                                                ? 'Online'
                                                : 'Offline'
                                        }
                                        title={
                                            isUserOnline
                                                ? 'Online'
                                                : 'Offline'
                                        }
                                        className={`absolute bottom-2 right-2 z-20 h-5 w-5 rounded-full border-4 border-base-950 shadow-lg ${
                                            isUserOnline
                                                ? 'bg-emerald-400'
                                                : 'bg-red-500'
                                        }`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Caller info */}
                        <div className="absolute bottom-5 left-5 z-10">
                            <p className="text-lg font-semibold text-white">
                                {name}
                            </p>

                            <p className="mt-1 text-sm text-base-400">
                                Video call · {callStatusLabel}
                            </p>
                        </div>

                        {/* Self preview */}
                        <div className="absolute right-4 top-4 z-10 h-32 w-24 overflow-hidden rounded-2xl border border-white/10 bg-base-800 shadow-xl">

                            {cameraOff ? (
                                <div className="flex h-full items-center justify-center text-base-500">
                                    <VideoOff size={22} />
                                </div>
                            ) : (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative">

                            <div className="absolute inset-0 animate-ping rounded-full bg-accent-cyan/10" />

                            <div className="relative rounded-full bg-gradient-to-br from-accent-cyan/40 to-accent-blue/30 p-1">

                                <img
                                    src={avatar}
                                    alt={name}
                                    className="h-32 w-32 rounded-full object-cover ring-4 ring-base-900"
                                />

                                <span
                                    className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-base-950 ${
                                        isUserOnline
                                            ? 'bg-emerald-400'
                                            : 'bg-red-400'
                                    }`}
                                />
                            </div>
                        </div>

                        <h2 className="mt-6 text-2xl font-semibold text-base-100">
                            {name}
                        </h2>

                        <p className="mt-2 text-sm text-base-400">
                            {callStatusLabel}
                        </p>
                    </>
                )}
            </div>

            {/* Remote audio */}
            <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                className="hidden"
            />

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">

                <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`grid h-12 w-12 place-items-center rounded-full border border-base-700 transition ${
                        muted
                            ? 'bg-base-700 text-white'
                            : 'bg-base-800/90 text-base-200 hover:bg-base-700'
                    }`}
                >
                    {muted ? (
                        <MicOff size={19} />
                    ) : (
                        <Mic size={19} />
                    )}
                </button>

                <CallControlButton
                    icon={Volume2}
                    label="Speaker"
                />

                {isVideo && (
                    <button
                        type="button"
                        onClick={handleToggleCamera}
                        className={`grid h-12 w-12 place-items-center rounded-full border border-base-700 transition ${
                            cameraOff
                                ? 'bg-base-700 text-white'
                                : 'bg-base-800/90 text-base-200 hover:bg-base-700'
                        }`}
                    >
                        {cameraOff ? (
                            <VideoOff size={19} />
                        ) : (
                            <Video size={19} />
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={onEnd}
                    aria-label="End call"
                    className="grid h-14 w-14 place-items-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 active:scale-95"
                >
                    <PhoneOff size={22} />
                </button>
            </div>
        </div>
    );
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return [
            hours,
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0'),
        ].join(':');
    }

    return `${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
}

function CallControlButton({
    icon: Icon,
    label,
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className="grid h-12 w-12 place-items-center rounded-full border border-base-700 bg-base-800/90 text-base-200 transition hover:bg-base-700 active:scale-95"
        >
            <Icon size={19} />
        </button>
    );
}
