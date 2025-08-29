// src/components/VideoPlayerModal.jsx
import React, { useEffect, useMemo } from 'react';

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

const VideoPlayerModal = ({ videoUrl, startSeconds = 0, onClose }) => {
    const isYouTube = useMemo(() => {
        try {
            const u = new URL(videoUrl);
            return isYouTubeHost(u.hostname.replace(/^www\./, ''));
        } catch {
            return false;
        }
    }, [videoUrl]);

    const ytEmbed = useMemo(
        () => (isYouTube ? buildYouTubeEmbedWithStart(videoUrl, startSeconds) : null),
        [isYouTube, videoUrl, startSeconds]
    );

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

                {isYouTube && ytEmbed ? (
                    <iframe
                        className="player-iframe"
                        src={buildYouTubeEmbedWithStart(videoUrl, startSeconds)}
                        title="YouTube player"
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                    />
                ) : (
                    <video
                        className="player-video"
                        src={videoUrl}
                        controls
                        autoPlay
                    />
                )}
            </div>
        </div>
    );
};

export default VideoPlayerModal;
