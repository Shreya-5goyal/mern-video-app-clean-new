import React from 'react';
import { Shield, Brain, AlertTriangle, UserCheck, MessageSquare, Hand, ThumbsUp, Activity } from 'lucide-react';
import './AILayer.css';

const AILayer = ({ aiState }) => {
    const {
        emotion,
        attentionScore,
        isFocused,
        gestures,
        captions,
        deepfakeRisk,
        isAvatarMode
    } = aiState;

    const getEmotionEmoji = (emo) => {
        switch (emo) {
            case 'Happy': return '😊';
            case 'Thinking': return '🤔';
            case 'Surprised': return '😮';
            case 'Sad': return '😢';
            default: return '😐';
        }
    };

    return (
        <div className="ai-layer-container">
            {/* Top Left: AI Status & Emotion */}
            <div className="ai-badge-group top-left">
                <div className={`ai-badge ${attentionScore > 70 ? 'active' : 'warning'}`}>
                    <Brain size={14} />
                    <span>Attention: {attentionScore}%</span>
                </div>
                <div className="ai-badge glass">
                    <span>{getEmotionEmoji(emotion)} {emotion}</span>
                </div>
            </div>

            {/* Top Right: Security & Risk */}
            <div className="ai-badge-group top-right">
                {deepfakeRisk > 30 && (
                    <div className="ai-badge danger pulse">
                        <AlertTriangle size={14} />
                        <span>Risk Detected</span>
                    </div>
                )}
                <div className="ai-badge success">
                    <Shield size={14} />
                    <span>Encrypted</span>
                </div>
            </div>

            {/* Center: Focus Warning */}
            {!isFocused && (
                <div className="focus-alert-overlay">
                    <div className="focus-card">
                        <Activity className="blink" />
                        <h3>Focus Alert</h3>
                        <p>Please stay attentive for better engagement</p>
                    </div>
                </div>
            )}

            {/* Bottom Center: Captions */}
            <div className="captions-container">
                {captions.map(cap => (
                    <div key={cap.id} className="caption-line">
                        <MessageSquare size={12} />
                        <span>{cap.text}</span>
                    </div>
                ))}
            </div>

            {/* Gestures Tooltip */}
            {gestures && (
                <div className="gesture-alert">
                    {gestures === 'wave' && <Hand className="float-up" />}
                    {gestures === 'thumbsup' && <ThumbsUp className="float-up" />}
                    <div className="gesture-label">{gestures.toUpperCase()}</div>
                </div>
            )}

            {/* Avatar Mode Overlay */}
            {isAvatarMode && (
                <div className="avatar-mode-overlay">
                    <div className="avatar-placeholder">
                        <UserCheck size={48} className="pulse-slow" />
                        <p>AI Avatar Mode Active</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AILayer;
