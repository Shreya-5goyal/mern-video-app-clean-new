import { useState } from 'react';
import { generateRoomId, isValidRoomId } from '../utils/utils';
import { useAuth } from '../context/AuthContext';
import { Video, Plus, LogOut, User, Zap, Shield, BrainCircuit, Sparkles } from 'lucide-react';
import './HomePage.css';

const HomePage = ({ onJoinRoom }) => {
    const { user, logout } = useAuth();
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');

    const handleCreateRoom = () => {
        const newRoomId = generateRoomId();
        onJoinRoom(newRoomId);
    };

    const handleJoinRoom = () => {
        const trimmedRoomId = roomId.trim().toUpperCase();
        if (!trimmedRoomId) {
            setError('Please enter a room ID');
            return;
        }
        if (!isValidRoomId(trimmedRoomId)) {
            setError('Invalid room ID (6 characters)');
            return;
        }
        onJoinRoom(trimmedRoomId);
    };

    return (
        <div className="home-container">
            <div className="bg-glow-1"></div>
            <div className="bg-glow-2"></div>

            <nav className="home-nav">
                <div className="logo-group">
                    <div className="logo-icon"><Video size={24} /></div>
                    <span className="logo-text">AI Connect</span>
                </div>
                <div className="nav-actions">
                    <div className="user-badge">
                        <User size={14} />
                        <span>{user?.name}</span>
                    </div>
                    <button onClick={logout} className="p-icon-btn" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <main className="home-hero">
                <div className="hero-content">
                    <div className="badge-featured">
                        <Sparkles size={12} />
                        <span>Powered by Advanced AI</span>
                    </div>
                    <h1 className="hero-title">
                        Next-Gen <span className="gradient-text">Video Experience</span>
                    </h1>
                    <p className="hero-subtitle">
                        Intelligent 1-on-1 communication with live emotional insights,
                        gesture controls, and secure biometric verification.
                    </p>

                    <div className="feature-pills">
                        <div className="pill"><BrainCircuit size={14} /> Emotion AI</div>
                        <div className="pill"><Zap size={14} /> Low Latency</div>
                        <div className="pill"><Shield size={14} /> Verified Scan</div>
                    </div>
                </div>

                <div className="join-card glass-morphism">
                    <div className="card-header">
                        <h3>Start a Conversation</h3>
                        <p>Join an existing room or create a new one</p>
                    </div>

                    <div className="hero-input-group">
                        <input
                            type="text"
                            placeholder="Room ID (e.g. ABC123)"
                            value={roomId}
                            onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(''); }}
                            maxLength={6}
                        />
                        {error && <span className="error-text">{error}</span>}
                    </div>

                    <div className="hero-button-group">
                        <button className="btn-primary full-width" onClick={handleJoinRoom} disabled={!roomId}>
                            <Video size={18} /> Join Secure Call
                        </button>
                        <div className="divider"><span>OR</span></div>
                        <button className="btn-secondary full-width" onClick={handleCreateRoom}>
                            <Plus size={18} /> Create New Meeting
                        </button>
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <p>&copy; 2026 AI Connect. All communications are end-to-end encrypted.</p>
            </footer>
        </div>
    );
};


export default HomePage;

