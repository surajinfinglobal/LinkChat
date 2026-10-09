import { useCallback, useEffect, useRef, useState } from 'react';

export default function useWebRTC({
    socket,
    callId,
    remoteUserId,
    isCaller = false,
    enabled = false,
    type = 'voice',
}) {
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);

    // ICE candidates received before remote description
    const pendingIceCandidatesRef = useRef([]);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] =
        useState('new');

    /*
     * Create Peer Connection
     */
    const createPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302',
                },
            ],
        });

        /*
         * Remote audio/video
         */
        peer.ontrack = (event) => {
            const [stream] = event.streams;

            if (stream) {
                console.log('🎥 Remote stream received');

                setRemoteStream(stream);
            }
        };

        /*
         * ICE candidate generated
         */
        peer.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            console.log('🧊 ICE candidate generated');

            if (!socket || !callId || !remoteUserId) {
                return;
            }

            socket.emit('webrtc_ice_candidate', {
                callId,
                receiverId: String(remoteUserId),
                candidate: event.candidate,
            });
        };

        /*
         * Connection state
         */
        peer.onconnectionstatechange = () => {
            const state = peer.connectionState;

            console.log(
                '🔌 Connection state:',
                state
            );

            setConnectionState(state);
        };

        /*
         * ICE connection state
         */
        peer.oniceconnectionstatechange = () => {
            console.log(
                '🧊 ICE connection state:',
                peer.iceConnectionState
            );
        };

        peerConnectionRef.current = peer;

        return peer;
    }, [socket, callId, remoteUserId]);

    /*
     * Get microphone / camera
     */
    const getLocalStream = useCallback(async () => {
        if (localStreamRef.current) {
            return localStreamRef.current;
        }

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            throw new Error(
                'getUserMedia is not supported by this browser/context.'
            );
        }

        console.log(
            '🎙️ Requesting local media:',
            type
        );

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video',
            });

        localStreamRef.current = stream;

        setLocalStream(stream);

        console.log(
            '🎙️ Local stream obtained',
            stream
        );

        return stream;
    }, [type]);

    /*
     * Add local audio/video tracks
     */
    const addLocalTracks = useCallback(
        async (peer) => {
            const stream = await getLocalStream();

            stream.getTracks().forEach((track) => {
                const alreadyAdded = peer
                    .getSenders()
                    .some(
                        (sender) =>
                            sender.track?.kind ===
                            track.kind
                    );

                if (!alreadyAdded) {
                    peer.addTrack(track, stream);
                }
            });

            return stream;
        },
        [getLocalStream]
    );

    /*
     * Add queued ICE candidates
     */
    const flushPendingIceCandidates =
        useCallback(async (peer) => {
            if (!peer.remoteDescription) {
                return;
            }

            const candidates =
                pendingIceCandidatesRef.current;

            pendingIceCandidatesRef.current = [];

            for (const candidate of candidates) {
                try {
                    await peer.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );

                    console.log(
                        '🧊 Queued ICE candidate added'
                    );
                } catch (error) {
                    console.error(
                        'Failed to add queued ICE candidate:',
                        error
                    );
                }
            }
        }, []);

    /*
     * Create Offer
     */
    const createOffer = useCallback(async () => {
        console.log('📤 Creating offer');

        const peer = createPeerConnection();

        await addLocalTracks(peer);

        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);

        if (!socket || !callId || !remoteUserId) {
            return;
        }

        socket.emit('webrtc_offer', {
            callId,
            receiverId: String(remoteUserId),
            offer,
        });

        console.log(
            '📤 WebRTC offer sent:',
            callId
        );
    }, [
        createPeerConnection,
        addLocalTracks,
        socket,
        callId,
        remoteUserId,
    ]);

    /*
     * Handle Offer
     */
    const handleOffer = useCallback(
        async (offer) => {
            try {
                console.log(
                    '📥 Offer received'
                );

                const peer =
                    createPeerConnection();

                await addLocalTracks(peer);

                await peer.setRemoteDescription(
                    new RTCSessionDescription(offer)
                );

                /*
                 * Remote description is now available.
                 * Add queued ICE candidates.
                 */
                await flushPendingIceCandidates(
                    peer
                );

                const answer =
                    await peer.createAnswer();

                await peer.setLocalDescription(
                    answer
                );

                console.log(
                    '📤 Answer created'
                );

                if (
                    !socket ||
                    !callId ||
                    !remoteUserId
                ) {
                    return;
                }

                socket.emit('webrtc_answer', {
                    callId,
                    callerId: String(
                        remoteUserId
                    ),
                    answer,
                });

                console.log(
                    '📤 WebRTC answer sent:',
                    callId
                );
            } catch (error) {
                console.error(
                    'Failed to handle WebRTC offer:',
                    error
                );

                setConnectionState('failed');
            }
        },
        [
            createPeerConnection,
            addLocalTracks,
            flushPendingIceCandidates,
            socket,
            callId,
            remoteUserId,
        ]
    );

    /*
     * Handle Answer
     */
    const handleAnswer = useCallback(
        async (answer) => {
            console.log(
                '📥 Answer received'
            );

            const peer =
                peerConnectionRef.current;

            if (!peer || !answer) {
                return;
            }

            try {
                if (
                    peer.signalingState ===
                    'stable'
                ) {
                    console.log(
                        'Answer ignored because signaling state is stable'
                    );

                    return;
                }

                await peer.setRemoteDescription(
                    new RTCSessionDescription(answer)
                );

                console.log(
                    '✅ Remote answer applied'
                );

                await flushPendingIceCandidates(
                    peer
                );
            } catch (error) {
                console.error(
                    'Failed to handle WebRTC answer:',
                    error
                );

                setConnectionState('failed');
            }
        },
        [flushPendingIceCandidates]
    );

    /*
     * Handle ICE Candidate
     */
    const handleIceCandidate =
        useCallback(async (candidate) => {
            if (!candidate) {
                return;
            }

            console.log(
                '🧊 ICE candidate received'
            );

            const peer =
                peerConnectionRef.current;

            /*
             * Peer connection not ready yet
             */
            if (!peer) {
                pendingIceCandidatesRef.current.push(
                    candidate
                );

                console.log(
                    '🧊 ICE candidate queued - peer not ready'
                );

                return;
            }

            /*
             * Remote description not ready yet
             */
            if (!peer.remoteDescription) {
                pendingIceCandidatesRef.current.push(
                    candidate
                );

                console.log(
                    '🧊 ICE candidate queued - remote description not ready'
                );

                return;
            }

            try {
                await peer.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

                console.log(
                    '🧊 ICE candidate added'
                );
            } catch (error) {
                console.error(
                    'Failed to add ICE candidate:',
                    error
                );
            }
        }, []);

    /*
     * Start WebRTC
     */
    const startWebRTC = useCallback(
        async () => {
            try {
                console.log(
                    '📞 WebRTC started'
                );

                console.log(
                    'Starting WebRTC:',
                    {
                        callId,
                        isCaller,
                        type,
                    }
                );

                const peer =
                    createPeerConnection();

                await addLocalTracks(peer);

                /*
                 * Only caller creates offer.
                 * Receiver waits for offer.
                 */
                if (isCaller) {
                    await createOffer();
                }
            } catch (error) {
                console.error(
                    'Failed to start WebRTC:',
                    error
                );

                setConnectionState('failed');
            }
        },
        [
            callId,
            isCaller,
            type,
            createPeerConnection,
            addLocalTracks,
            createOffer,
        ]
    );

    /*
     * Mute / unmute microphone
     */
    const toggleMute = useCallback(
        (mute) => {
            const stream =
                localStreamRef.current;

            if (!stream) return;

            stream
                .getAudioTracks()
                .forEach((track) => {
                    track.enabled = !mute;
                });
        },
        []
    );

    /*
     * Camera on / off
     */
    const toggleCamera = useCallback(
        (cameraOff) => {
            const stream =
                localStreamRef.current;

            if (!stream) return;

            stream
                .getVideoTracks()
                .forEach((track) => {
                    track.enabled = !cameraOff;
                });
        },
        []
    );

    /*
     * Cleanup
     */
    const cleanup = useCallback(() => {
        console.log(
            '🧹 Cleaning WebRTC connection'
        );

        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;

            peerConnectionRef.current.onicecandidate =
                null;

            peerConnectionRef.current.onconnectionstatechange =
                null;

            peerConnectionRef.current.oniceconnectionstatechange =
                null;

            peerConnectionRef.current.close();

            peerConnectionRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            localStreamRef.current = null;
        }

        pendingIceCandidatesRef.current = [];

        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState('closed');
    }, []);

    /*
     * WebRTC signaling listeners
     */
    useEffect(() => {
        if (
            !socket ||
            !enabled ||
            !callId
        ) {
            return;
        }

        const handleOfferEvent = (data) => {
            if (
                String(data?.callId) !==
                String(callId)
            ) {
                return;
            }

            if (!data?.offer) {
                return;
            }

            handleOffer(data.offer);
        };

        const handleAnswerEvent = (data) => {
            if (
                String(data?.callId) !==
                String(callId)
            ) {
                return;
            }

            if (!data?.answer) {
                return;
            }

            handleAnswer(data.answer);
        };

        const handleIceEvent = (data) => {
            if (
                String(data?.callId) !==
                String(callId)
            ) {
                return;
            }

            if (!data?.candidate) {
                return;
            }

            handleIceCandidate(
                data.candidate
            );
        };

        socket.on(
            'webrtc_offer',
            handleOfferEvent
        );

        socket.on(
            'webrtc_answer',
            handleAnswerEvent
        );

        socket.on(
            'webrtc_ice_candidate',
            handleIceEvent
        );

        return () => {
            socket.off(
                'webrtc_offer',
                handleOfferEvent
            );

            socket.off(
                'webrtc_answer',
                handleAnswerEvent
            );

            socket.off(
                'webrtc_ice_candidate',
                handleIceEvent
            );
        };
    }, [
        socket,
        enabled,
        callId,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    ]);

    /*
     * Start / stop WebRTC
     */
    useEffect(() => {
        if (!enabled || !callId) {
            return;
        }

        startWebRTC();

        return () => {
            cleanup();
        };
    }, [
        enabled,
        callId,
        startWebRTC,
        cleanup,
    ]);

    return {
        localStream,
        remoteStream,
        connectionState,

        startWebRTC,
        toggleMute,
        toggleCamera,
        cleanup,
    };
}
