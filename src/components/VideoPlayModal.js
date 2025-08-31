// src/components/VideoPlayerModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

const isYouTubeHost = (h) => /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h);

const VideoPlayerModal = ({
    videoUrl,
    startSeconds = 0,
    markers = [],
    keyframeRefs = [],     // mảng keyframe model trả về (có timestamp, keyframe_num, ...)
    onClose,
    videoId,
    csvBaseName,
    frameRate,
}) => {
    // === Refs & state
    const ytDivRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const htmlVideoRef = useRef(null);

    const [apiReady, setApiReady] = useState(!!window.YT?.Player);
    const [ytReady, setYtReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSec, setCurrentSec] = useState(Math.max(0, Math.floor(startSeconds || 0)));
    // marks hiển thị trên thanh marker
    const sortedMarkers = useMemo(
        () =>
            Array.from(new Set((markers || []).map(n => Math.max(0, Math.floor(n))))).sort((a, b) => a - b),
        [markers]
    );

    // danh sách pick xuất CSV (đúng format "videoId,frameIdx")
    const [picked, setPicked] = useState([]); // [{ line, sec, frameIdx }]

    // === helpers
    const formatTime = (s) => {
        const sec = Math.max(0, Math.floor(s || 0));
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const ss = sec % 60;
        return h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
            : `${m}:${String(ss).padStart(2, '0')}`;
    };

    const isYouTube = useMemo(() => {
        try {
            const u = new URL(videoUrl);
            return isYouTubeHost(u.hostname.replace(/^www\./, ''));
        } catch {
            return false;
        }
    }, [videoUrl]);

    const getCurrentTime = () => {
        if (isYouTube && ytReady && ytPlayerRef.current?.getCurrentTime) {
            return Number(ytPlayerRef.current.getCurrentTime() || 0);
        }
        if (htmlVideoRef.current) return Number(htmlVideoRef.current.currentTime || 0);
        return 0;
    };

    const seekTo = (sec) => {
        const t = Math.max(0, Math.floor(sec || 0));
        if (isYouTube && ytReady && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
            ytPlayerRef.current.seekTo(t, true);
            ytPlayerRef.current.playVideo?.();
        } else if (htmlVideoRef.current) {
            htmlVideoRef.current.currentTime = t;
            htmlVideoRef.current.play().catch(() => { });
        }
    };

    // === Load YT Iframe API (nếu là Youtube)
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

    // === ESC to close & lock scroll
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = original;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    // === Tạo player YouTube
    const createdRef = useRef(false);
    useEffect(() => {
        if (!isYouTube || !apiReady || !ytDivRef.current || createdRef.current) return;
        // Lấy videoId từ URL
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

        try { ytPlayerRef.current?.destroy?.(); } catch { }

        ytPlayerRef.current = new window.YT.Player(ytDivRef.current, {
            videoId: id,
            playerVars: {
                autoplay: 1, controls: 1, rel: 0, modestbranding: 1,
                start: Math.max(0, Math.floor(startSeconds || 0)),
            },
            events: {
                onReady: (e) => {
                    ytPlayerRef.current = e.target;
                    createdRef.current = true;
                    setYtReady(true);
                    const s = Math.max(0, Math.floor(startSeconds || 0));
                    e.target.seekTo(s, true);
                    e.target.playVideo?.();
                }
            }
        });

        return () => { try { ytPlayerRef.current?.destroy?.(); } catch { } };
    }, [isYouTube, apiReady, videoUrl, startSeconds]);

    // === Khi đổi startSeconds, tua tới
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

    // === Lấy duration
    useEffect(() => {
        if (isYouTube && ytPlayerRef.current) {
            const id = setInterval(() => {
                const d = Number(ytPlayerRef.current.getDuration?.() || 0);
                if (d > 0) { setDuration(d); clearInterval(id); }
            }, 200);
            return () => clearInterval(id);
        }
    }, [isYouTube, apiReady]);
    
    useEffect(() => {
        // chỉ poll khi player đã ready
        if (!(ytReady || htmlVideoRef.current)) return;
        let id = setInterval(() => {
            setCurrentSec(getCurrentTime());  // dùng hàm getCurrentTime bạn đã có
        }, 250); // 4Hz là mượt đủ
        return () => clearInterval(id);
    }, [ytReady]); // (HTML5 không cần ready flag, nhưng có cũng ok)

    // === Next marker
    const jumpNext = () => {
        if (!sortedMarkers.length) return;
        const nextIdx = (currentIndex + 1) % sortedMarkers.length;
        setCurrentIndex(nextIdx);
        seekTo(sortedMarkers[nextIdx]);
    };

    // === Map thời điểm -> keyframe của model (midpoint logic)
    const pickModelKeyframeAtTime = useMemo(() => {
        const refs = Array.from(keyframeRefs || [])
            .filter(k => Number.isFinite(k?.timestamp))
            .sort((a, b) => a.timestamp - b.timestamp);
        if (!refs.length) return () => null;
        const mids = refs.map((kf, i) =>
            i < refs.length - 1 ? (kf.timestamp + refs[i + 1].timestamp) / 2 : Infinity
        );
        return (tSec) => {
            const t = Math.max(0, Number(tSec) || 0);
            for (let i = 0; i < refs.length; i++) {
                if (t < mids[i]) return refs[i];
            }
            return refs[refs.length - 1];
        };
    }, [keyframeRefs]);

    // === Add keyframe (theo model)
    const addKeyframe = () => {
        const t = getCurrentTime();               // giây hiện tại
        const fps = frameRate || 30;              // nếu không truyền thì mặc định 30
        const frameIdx = Math.floor(t * fps);     // công thức của bạn
        const id = (videoId && String(videoId)) || 'video';
        const line = `${id},${frameIdx}`;

        setPicked(prev => {
            return prev.some(p => p.line === line)
                ? prev
                : [...prev, { line, sec: Math.floor(t), frameIdx }];
        });

    };


    // === Drag & delete cho picked list
    const onDragStartPicked = (i) => (e) => {
        e.dataTransfer.setData('text/plain', String(i));
        e.dataTransfer.effectAllowed = 'move';
    };
    const onDropPicked = (i) => (e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (Number.isNaN(from) || from === i) return;
        setPicked(prev => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(i, 0, item);
            return next;
        });
    };
    const removePicked = (i) => setPicked(prev => prev.filter((_, idx) => idx !== i));

    // === Download 1 item CSV
    const downloadOneCSV = (line) => {
        const blob = new Blob([line], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const base = (csvBaseName && csvBaseName.trim()) || 'keyframe';
        a.download = `${base}-${line.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
        a.style.visibility = 'hidden';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // === UI
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

                <div className="player-split">
                    {/* LEFT: video */}
                    <div className="player-left">
                        <div className="player-actions">
                            <button className="add-btn" onClick={addKeyframe}>＋ Add keyframe</button>
                            {sortedMarkers.length > 0 && (
                                <button className="next-btn" onClick={jumpNext}>Next</button>
                            )}
                        </div>

                        {isYouTube ? (
                            <div className="player-iframe-wrapper" key="yt">
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

                        {duration > 0 && (
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

                    {/* RIGHT: list */}
                    <aside className="player-right">
                        <div className="marks-header">Keyframes ({picked.length})</div>
                        <div className="marks-list">
                            {picked.map((p, i) => (
                                <div
                                    key={`li-${i}`}
                                    className="mark-item"
                                    draggable
                                    onDragStart={onDragStartPicked(i)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDropPicked(i)}
                                >
                                    <button className="mark-time" onClick={() => seekTo(p.sec)}>{p.line}</button>
                                    <button className="mark-dl" title="Download CSV" onClick={() => downloadOneCSV(p.line)}>⬇</button>
                                    <button className="mark-del" onClick={() => removePicked(i)}>✕</button>
                                </div>
                            ))}
                            {picked.length === 0 && (
                                <div className="marks-empty">Chưa có keyframe nào. Bấm “＋ Add keyframe”.</div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayerModal;
