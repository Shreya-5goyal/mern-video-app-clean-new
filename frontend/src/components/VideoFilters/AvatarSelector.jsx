import React, { useState } from 'react';
import './AvatarSelector.css';

// Predefined avatar configurations
export const AVATARS = [
    {
        id: 'astronaut',
        name: 'Astronaut',
        emoji: '👨‍🚀',
        bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        accent: '#00d4ff',
        badge: '🚀',
    },
    {
        id: 'wizard',
        name: 'Wizard',
        emoji: '🧙‍♂️',
        bg: 'linear-gradient(135deg, #1a0533, #4a0080, #2d0057)',
        accent: '#bf00ff',
        badge: '⚡',
    },
    {
        id: 'ninja',
        name: 'Ninja',
        emoji: '🥷',
        bg: 'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)',
        accent: '#ff4444',
        badge: '⚔️',
    },
    {
        id: 'robot',
        name: 'Robot',
        emoji: '🤖',
        bg: 'linear-gradient(135deg, #0d1117, #1c2128, #0d1117)',
        accent: '#00ff88',
        badge: '⚙️',
    },
    {
        id: 'alien',
        name: 'Alien',
        emoji: '👽',
        bg: 'linear-gradient(135deg, #001a00, #003300, #004d00)',
        accent: '#00ff44',
        badge: '🛸',
    },
    {
        id: 'vampire',
        name: 'Vampire',
        emoji: '🧛',
        bg: 'linear-gradient(135deg, #1a0000, #330000, #1a0000)',
        accent: '#ff0000',
        badge: '🩸',
    },
    {
        id: 'angel',
        name: 'Angel',
        emoji: '😇',
        bg: 'linear-gradient(135deg, #fff9e6, #ffe4b5, #ffd700)',
        accent: '#ffd700',
        badge: '✨',
    },
    {
        id: 'pirate',
        name: 'Pirate',
        emoji: '🏴‍☠️',
        bg: 'linear-gradient(135deg, #1a0e00, #3d2200, #1a0e00)',
        accent: '#ff8c00',
        badge: '⚓',
    },
    {
        id: 'superhero',
        name: 'Hero',
        emoji: '🦸',
        bg: 'linear-gradient(135deg, #000033, #000066, #000099)',
        accent: '#ffcc00',
        badge: '⚡',
    },
    {
        id: 'cat',
        name: 'Cat',
        emoji: '🐱',
        bg: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        accent: '#e94560',
        badge: '🐾',
    },
    {
        id: 'fox',
        name: 'Fox',
        emoji: '🦊',
        bg: 'linear-gradient(135deg, #2d1b00, #5c3600, #2d1b00)',
        accent: '#ff6b00',
        badge: '🌿',
    },
    {
        id: 'dragon',
        name: 'Dragon',
        emoji: '🐲',
        bg: 'linear-gradient(135deg, #0a1628, #1a3a5c, #0a1628)',
        accent: '#00bfff',
        badge: '🔥',
    },
    {
        id: 'supernova',
        name: 'Supernova',
        emoji: '💥',
        bg: 'radial-gradient(circle, #ff00cc, #3333ff)',
        accent: '#ffffff',
        badge: '✨',
    },
    {
        id: 'glitch',
        name: 'Glitch',
        emoji: '👾',
        bg: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)',
        accent: '#ffff00',
        badge: '⚡',
    },
];

// The animated avatar display shown during video call
export const AvatarDisplay = ({ avatar, userName, isAnimating = false }) => {
    const config = AVATARS.find(a => a.id === avatar) || AVATARS[0];

    return (
        <div
            className="avatar-display"
            style={{ background: config.bg }}
        >
            {/* Animated background particles */}
            <div className="avatar-particles">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            '--delay': `${i * 0.4}s`,
                            '--x': `${Math.random() * 100}%`,
                            '--color': config.accent,
                        }}
                    />
                ))}
            </div>

            {/* Glowing ring */}
            <div
                className={`avatar-ring ${isAnimating ? 'speaking' : ''}`}
                style={{ '--accent': config.accent }}
            >
                <div className="avatar-emoji-container">
                    <span className="avatar-main-emoji">{config.emoji}</span>
                    <span className="avatar-badge">{config.badge}</span>
                </div>
            </div>

            {/* Name tag */}
            <div className="avatar-name-tag" style={{ '--accent': config.accent }}>
                <span className="avatar-name">{userName || 'You'}</span>
                <span className="avatar-mode-label">Avatar Mode</span>
            </div>

            {/* Accent glow */}
            <div
                className="avatar-glow"
                style={{ background: `radial-gradient(circle, ${config.accent}22 0%, transparent 70%)` }}
            />
        </div>
    );
};

// Avatar selector panel
const AvatarSelector = ({ activeAvatar, onAvatarChange, userName }) => {
    const [preview, setPreview] = useState(activeAvatar);

    return (
        <div className="avatar-selector">
            <div className="avatar-selector-header">
                <h3>🎭 Choose Your Avatar</h3>
                <p>Shown when camera is off or avatar mode is active</p>
            </div>

            {/* Preview */}
            <div className="avatar-preview-mini">
                <AvatarDisplay avatar={preview} userName={userName} />
            </div>

            {/* Grid */}
            <div className="avatar-grid">
                {AVATARS.map(av => (
                    <button
                        key={av.id}
                        className={`avatar-option ${activeAvatar === av.id ? 'active' : ''}`}
                        style={{ '--accent': av.accent }}
                        onMouseEnter={() => setPreview(av.id)}
                        onMouseLeave={() => setPreview(activeAvatar)}
                        onClick={() => {
                            onAvatarChange(av.id);
                            setPreview(av.id);
                        }}
                    >
                        <span className="av-emoji">{av.emoji}</span>
                        <span className="av-name">{av.name}</span>
                        {activeAvatar === av.id && <span className="av-check">✓</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AvatarSelector;
