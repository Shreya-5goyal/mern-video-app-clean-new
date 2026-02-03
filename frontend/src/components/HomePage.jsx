import { useState } from 'react';
import { generateRoomId, isValidRoomId } from '../utils/utils';
import { useAuth } from '../context/AuthContext';
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
            <div className="background-gradient"></div>

            <div className="logout-container">
                <button onClick={logout} className="logout-btn">Logout</button>
            </div>

            <div className="home-content animate-fadeIn">
                <div className="home-header">
                    <h1 className="home-title">VideoConnect</h1>
                    <p className="home-subtitle">High-quality video calls, simplified.</p>
                </div>

                <div className="home-card glass-card">
                    <div className="user-welcome">
                        <p>Welcome, <strong>{user?.name}</strong></p>
                    </div>

                    <div className="input-group">
                        <label>Room ID</label>
                        <input
                            type="text"
                            placeholder="Enter 6-char ID"
                            value={roomId}
                            onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(''); }}
                            maxLength={6}
                        />
                        {error && <span className="error-text">{error}</span>}
                    </div>

                    <div className="button-group">
                        <button className="btn-primary" onClick={handleJoinRoom} disabled={!roomId}>
                            Join Room
                        </button>
                        <div className="divider">or</div>
                        <button className="btn-secondary" onClick={handleCreateRoom}>
                            Create New Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
