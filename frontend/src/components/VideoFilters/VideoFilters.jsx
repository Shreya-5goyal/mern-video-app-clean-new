import React, { useRef, useEffect, useState, useCallback } from 'react';
import './VideoFilters.css';

// Filter definitions
export const FILTERS = [
    { id: 'none', name: 'Normal', emoji: '🎥', css: 'none' },
    { id: 'grayscale', name: 'B&W', emoji: '⬛', css: 'grayscale(100%)' },
    { id: 'sepia', name: 'Vintage', emoji: '🟫', css: 'sepia(80%)' },
    { id: 'warm', name: 'Warm', emoji: '🔥', css: 'sepia(40%) saturate(150%) hue-rotate(-10deg)' },
    { id: 'cool', name: 'Cool', emoji: '❄️', css: 'saturate(120%) hue-rotate(180deg) brightness(1.1)' },
    { id: 'vivid', name: 'Vivid', emoji: '🌈', css: 'saturate(200%) contrast(110%)' },
    { id: 'blur', name: 'Dreamy', emoji: '✨', css: 'blur(2px) brightness(1.1) saturate(130%)' },
    { id: 'neon', name: 'Neon', emoji: '💜', css: 'hue-rotate(270deg) saturate(300%) brightness(0.9) contrast(120%)' },
    { id: 'sunset', name: 'Sunset', emoji: '🌅', css: 'sepia(30%) saturate(200%) hue-rotate(340deg) brightness(1.1)' },
    { id: 'matrix', name: 'Matrix', emoji: '💚', css: 'grayscale(100%) sepia(100%) hue-rotate(90deg) saturate(400%)' },
    { id: 'invert', name: 'Invert', emoji: '🔄', css: 'invert(80%) hue-rotate(180deg)' },
    { id: 'contrast', name: 'Drama', emoji: '🎭', css: 'contrast(150%) brightness(0.9) saturate(120%)' },
];

// Overlay stickers/AR effects
export const STICKERS = [
    { id: 'none', name: 'None', emoji: '❌' },
    { id: 'dog', name: 'Dog', emoji: '🐶' },
    { id: 'cat', name: 'Cat', emoji: '🐱' },
    { id: 'crown', name: 'Crown', emoji: '👑' },
    { id: 'glasses', name: 'Glasses', emoji: '🕶️' },
    { id: 'fire', name: 'Fire', emoji: '🔥' },
    { id: 'stars', name: 'Stars', emoji: '⭐' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
];

const FilterPicker = ({ activeFilter, onFilterChange, activeSticker, onStickerChange }) => {
    const [tab, setTab] = useState('filters');

    return (
        <div className="filter-picker">
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${tab === 'filters' ? 'active' : ''}`}
                    onClick={() => setTab('filters')}
                >
                    🎨 Filters
                </button>
                <button
                    className={`filter-tab ${tab === 'stickers' ? 'active' : ''}`}
                    onClick={() => setTab('stickers')}
                >
                    🎭 Stickers
                </button>
            </div>

            {tab === 'filters' && (
                <div className="filter-grid">
                    {FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            className={`filter-item ${activeFilter === filter.id ? 'active' : ''}`}
                            onClick={() => onFilterChange(filter.id)}
                            title={filter.name}
                        >
                            <span className="filter-emoji">{filter.emoji}</span>
                            <span className="filter-name">{filter.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {tab === 'stickers' && (
                <div className="filter-grid">
                    {STICKERS.map(sticker => (
                        <button
                            key={sticker.id}
                            className={`filter-item ${activeSticker === sticker.id ? 'active' : ''}`}
                            onClick={() => onStickerChange(sticker.id)}
                            title={sticker.name}
                        >
                            <span className="filter-emoji">{sticker.emoji}</span>
                            <span className="filter-name">{sticker.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sticker overlay renderer on canvas
const drawSticker = (ctx, stickerId, width, height) => {
    if (stickerId === 'none') return;

    ctx.save();
    const centerX = width / 2;
    const topY = height * 0.15;
    const fontSize = Math.min(width, height) * 0.15;

    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (stickerId) {
        case 'dog':
            // Dog ears
            ctx.font = `${fontSize * 1.2}px serif`;
            ctx.fillText('🐾', centerX - width * 0.25, topY);
            ctx.fillText('🐾', centerX + width * 0.25, topY);
            ctx.font = `${fontSize * 0.8}px serif`;
            ctx.fillText('🐶', centerX, height * 0.85);
            break;
        case 'cat':
            ctx.font = `${fontSize * 1.2}px serif`;
            ctx.fillText('🐱', centerX - width * 0.2, topY * 0.8);
            ctx.fillText('🐱', centerX + width * 0.2, topY * 0.8);
            break;
        case 'crown':
            ctx.font = `${fontSize * 1.5}px serif`;
            ctx.fillText('👑', centerX, topY * 0.6);
            break;
        case 'glasses':
            ctx.font = `${fontSize}px serif`;
            ctx.fillText('🕶️', centerX, height * 0.45);
            break;
        case 'fire':
            ctx.font = `${fontSize * 0.8}px serif`;
            ctx.fillText('🔥', centerX - width * 0.35, topY);
            ctx.fillText('🔥', centerX + width * 0.35, topY);
            ctx.fillText('🔥', centerX, topY * 0.5);
            break;
        case 'stars':
            ctx.font = `${fontSize * 0.6}px serif`;
            for (let i = 0; i < 5; i++) {
                const x = (width / 6) * (i + 0.5);
                const y = topY * (0.5 + Math.sin(i * 1.2) * 0.3);
                ctx.fillText('⭐', x, y);
            }
            break;
        case 'rainbow':
            ctx.font = `${fontSize * 2}px serif`;
            ctx.fillText('🌈', centerX, topY * 0.4);
            break;
        default:
            break;
    }
    ctx.restore();
};

// FilteredVideo component - applies CSS filter + canvas sticker overlay
export const FilteredVideo = ({ stream, isLocal = false, activeFilter = 'none', activeSticker = 'none', style = {} }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);

    const filterCss = FILTERS.find(f => f.id === activeFilter)?.css || 'none';

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream) return;
        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }
        video.play().catch(() => { });
    }, [stream]);

    // Canvas sticker overlay loop
    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas || !video || activeSticker === 'none') {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            return;
        }

        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!video.videoWidth) {
                animFrameRef.current = requestAnimationFrame(draw);
                return;
            }
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawSticker(ctx, activeSticker, canvas.width, canvas.height);
            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [activeSticker, stream]);

    return (
        <div className="filtered-video-wrapper" style={style}>
            <video
                ref={videoRef}
                autoPlay
                muted={isLocal}
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: isLocal ? 'scaleX(-1)' : 'none',
                    filter: filterCss,
                    transition: 'filter 0.4s ease',
                }}
            />
            {activeSticker !== 'none' && (
                <canvas
                    ref={canvasRef}
                    className="sticker-canvas"
                    style={{
                        transform: isLocal ? 'scaleX(-1)' : 'none',
                    }}
                />
            )}
        </div>
    );
};

export { FilterPicker };
export default FilterPicker;
