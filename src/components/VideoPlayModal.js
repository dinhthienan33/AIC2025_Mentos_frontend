// src/components/VideoPlayerModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';


const isYouTubeHost = (h) => /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h);

function buildYouTubeEmbedWithStart(videoUrl, startSeconds = 0) {
    try {
        const u = new URL(videoUrl);
        let id = null;
        if (u.hostname.includes('youtu.be')) {
            id = u.pathname.split('/').filter(Boolean)[0];
        } else if (u.hostname.includes('youtube.com')) {
            if (u.searchParams.get('v')) {
                id = u.searchParams.get('v');
            } else if (u.pathname.startsWith('/shorts/')) {
                id = u.pathname.split('/')[2];
            }
        }
        if (!id) return null;

        const start = Math.max(0, Math.floor(startSeconds || 0));

        const params = new URLSearchParams({
            autoplay: '1',
            rel: '0',
            modestbranding: '1',
            start: start.toString(),      // 👈 param start
        });
        return `https://www.youtube.com/embed/${id}?${params.toString()}`;
    } catch {
        return null;
    }
}


function parseTimeParam(t, fallback) {
    // supports "90", "90s", "1m30s", "1h2m3s"
    if (!t) return fallback || 0;
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    const re = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i;
    const m = t.match(re);
    if (!m) return fallback || 0;
    const h = parseInt(m[1] || '0', 10);
    const mm = parseInt(m[2] || '0', 10);
    const s = parseInt(m[3] || '0', 10);
    return h * 3600 + mm * 60 + s;
}
const VideoPlayerModal = ({ videoUrl, startSeconds = 0, markers = [], onClose }) => {
    const ytDivRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const htmlVideoRef = useRef(null);
    const [apiReady, setApiReady] = useState(!!window.YT?.Player);
    const [ytReady, setYtReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const isYouTube = useMemo(() => {
        try {
            const u = new URL(videoUrl);
            return isYouTubeHost(u.hostname.replace(/^www\./, ''));
        } catch {
            return false;
        }
    }, [videoUrl]);
    const seekTo = (sec) => {
        const t = Math.max(0, Math.floor(sec || 0));
        if (isYouTube && ytPlayerRef.current) {
            // Nếu đang dùng YouTube Iframe API
            ytPlayerRef.current.seekTo(t, true);
            ytPlayerRef.current.playVideo?.();
            if (isYouTube && ytReady && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                ytPlayerRef.current.seekTo(t, true);
                ytPlayerRef.current.playVideo?.();
            } else if (htmlVideoRef.current) {
                // Nếu là thẻ <video> HTML5
                htmlVideoRef.current.currentTime = t;
                htmlVideoRef.current.play().catch(() => { });
            }
        };
    }


    useEffect(() => {
        if (!isYouTube) return;
        if (window.YT?.Player) { setApiReady(true); return; }
        let script = document.querySelector('script[data-yt-api]');
        if (!script) {
            script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.dataset.ytApi = '1';
            document.body.appendChild(script);
        }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { prev?.(); setApiReady(true); };
    }, [isYouTube]);

    const sortedMarkers = useMemo(() => {
        return Array.from(new Set(
            (markers || []).map(n => Math.max(0, Math.floor(n)))
        )).sort((a, b) => a - b);
    }, [markers]);
    const jumpNext = () => {
        if (!sortedMarkers.length) return;
        const nextIdx = (currentIndex + 1) % sortedMarkers.length;
        setCurrentIndex(nextIdx);
        seekTo(sortedMarkers[nextIdx]);
    };


    useEffect(() => {
        // lock scroll + close on ESC
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = original;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const createdRef = useRef(false);
    // tạo player khi API sẵn sàng
    useEffect(() => {
        if (!isYouTube || !apiReady || !ytDivRef.current || createdRef.current) return;
        // lấy videoId
        let id = null;
        try {
            const u = new URL(videoUrl);
            if (u.hostname.includes('youtu.be')) {
                id = u.pathname.split('/').filter(Boolean)[0];
            } else if (u.hostname.includes('youtube.com')) {
                id = u.searchParams.get('v') || (u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : null);
            }
        } catch { }
        if (!id) return;

        // destroy cũ (nếu có) rồi tạo mới
        try { ytPlayerRef.current?.destroy?.(); } catch { }
        ytPlayerRef.current = new window.YT.Player(ytDivRef.current, {
            videoId: id,
            playerVars: {
                autoplay: 1, controls: 1, rel: 0, modestbranding: 1,
                start: Math.max(0, Math.floor(startSeconds || 0)),
            },
            events: {
                onReady: (e) => {
                    const s = Math.max(0, Math.floor(startSeconds || 0));
                    e.target.seekTo(s, true);
                    e.target.playVideo?.();
                    createdRef.current = true;

                    ytPlayerRef.current = e.target;
                    createdRef.current = true;
                    setYtReady(true);
                    e.target.seekTo(s, true);
                    e.target.playVideo?.();

                }
            }
        });
        return () => { try { ytPlayerRef.current?.destroy?.(); } catch { } };
    }, [isYouTube, apiReady, videoUrl])
    useEffect(() => {
        const s = Math.max(0, Math.floor(startSeconds || 0));
        if (isYouTube && ytReady && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
            ytPlayerRef.current.seekTo(s, true);
            ytPlayerRef.current.playVideo?.();
        } else if (htmlVideoRef.current) {
            htmlVideoRef.current.currentTime = s;
            htmlVideoRef.current.play().catch(() => { });
        }
    }, [startSeconds, isYouTube, ytReady]);
    useEffect(() => {
        if (isYouTube && ytPlayerRef.current) {
            let id = setInterval(() => {
                const d = Number(ytPlayerRef.current.getDuration?.() || 0);
                if (d > 0) { setDuration(d); clearInterval(id); }
            }, 200);
            return () => clearInterval(id);
        }
    }, [isYouTube, apiReady]);



    return (
        <div className="player-overlay" onClick={onClose}>
            <div
                className="player-container"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Video player"
            >
                <button className="player-close" onClick={onClose} aria-label="Close">×</button>
                {sortedMarkers.length > 0 && (
                    <button className="next-btn" onClick={jumpNext}>
                        Next
                    </button>
                )}
                {isYouTube ? (
                    <div className="player-iframe-wrapper" key="yt">
                        {/* 👇 YT sẽ replace đúng cái div này, wrapper bên ngoài vẫn ổn định */}
                        <div className="yt-anchor" ref={ytDivRef} />
                    </div>
                ) : (
                    <div className="player-video-wrapper" key="html">
                        <video
                            className="player-video"
                            ref={htmlVideoRef}
                            src={videoUrl}
                            controls
                            autoPlay
                            onLoadedMetadata={(e) => {
                                setDuration(e.currentTarget.duration || 0);
                                e.currentTarget.currentTime = startSeconds;
                            }}
                        />
                    </div>
                )}
                {sortedMarkers.length > 0 && duration > 0 && (
                    <div className="marker-bar">
                        {sortedMarkers.map((m, i) => (
                            <span
                                key={`mk-${i}`}
                                className="marker-dot"
                                style={{ left: `${(m / duration) * 100}%` }}
                                title={`Keyframe @ ${m}s`}
                                onClick={() => seekTo(m)}
                            />
                        ))}
                    </div>
                )}

                
            </div>
        </div>
    );
};

export default VideoPlayerModal;
