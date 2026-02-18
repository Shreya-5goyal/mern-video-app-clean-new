import React from 'react';
import { BarChart2, Clock, Users, Zap, CheckCircle, Download, Home } from 'lucide-react';
import './PostCallAnalytics.css';

const PostCallAnalytics = ({ stats, userName, onBackHome }) => {
    const duration = Math.floor((Date.now() - stats.startTime) / 60000);
    const productivityScore = Math.floor(75 + Math.random() * 20); // Mock score

    return (
        <div className="analytics-container">
            <div className="analytics-card glass-morphism">
                <div className="analytics-header">
                    <div className="header-text">
                        <h1 className="gradient-text">Call Summary</h1>
                        <p>Analysis for {userName}'s session</p>
                    </div>
                    <div className="score-ring">
                        <div className="score-value">{productivityScore}</div>
                        <div className="score-label">Productivity</div>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-item">
                        <Clock className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">{duration} min</span>
                            <span className="stat-desc">Duration</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <Users className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">2</span>
                            <span className="stat-desc">Participants</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <Zap className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">88%</span>
                            <span className="stat-desc">Avg. Attention</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <BarChart2 className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">42%</span>
                            <span className="stat-desc">Speaking Ratio</span>
                        </div>
                    </div>
                </div>

                <div className="summary-section">
                    <h3><CheckCircle size={18} /> Key Action Items</h3>
                    <ul>
                        <li>Follow up on the architectural design next Tuesday.</li>
                        <li>Send the API documentation to the frontend team.</li>
                        <li>Review the security protocols for WebRTC.</li>
                    </ul>
                </div>

                <div className="emotion-chart">
                    <h3>Emotion Timeline</h3>
                    <div className="chart-mock">
                        {Object.keys(stats.emotions).map(emo => (
                            <div key={emo} className="chart-bar-group">
                                <div className="chart-bar" style={{ height: `${Math.max(20, stats.emotions[emo] * 10)}px` }}></div>
                                <span>{emo}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-actions">
                    <button className="btn-secondary" onClick={onBackHome}>
                        <Home size={18} /> Back to Home
                    </button>
                    <button className="btn-primary" onClick={() => alert('Summary PDF downloading...')}>
                        <Download size={18} /> Download Summary
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostCallAnalytics;
