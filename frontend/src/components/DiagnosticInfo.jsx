import React, { useState, useEffect } from 'react';

const DiagnosticInfo = ({ localStream, remoteStream, connectionStatus }) => {
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [diagnosticData, setDiagnosticData] = useState({});

    useEffect(() => {
        const data = {
            localStreamId: localStream?.id || 'None',
            localTracks: localStream?.getTracks().map(t => `${t.kind}: ${t.id} (${t.enabled ? 'enabled' : 'disabled'})`) || [],
            remoteStreamId: remoteStream?.id || 'None',
            remoteTracks: remoteStream?.getTracks().map(t => `${t.kind}: ${t.id} (${t.enabled ? 'enabled' : 'disabled'})`) || [],
            connectionStatus,
            timestamp: new Date().toLocaleTimeString()
        };
        setDiagnosticData(data);
    }, [localStream, remoteStream, connectionStatus]);

    if (!showDiagnostics) {
        return (
            <button
                onClick={() => setShowDiagnostics(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: '1px solid #58a6ff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    zIndex: 1000
                }}
            >
                Show Diagnostics
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '400px',
            zIndex: 1000,
            border: '1px solid #58a6ff'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>🔍 Diagnostics</strong>
                <button
                    onClick={() => setShowDiagnostics(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff7b72',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Connection:</strong> {connectionStatus}
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Local Stream:</strong> {diagnosticData.localStreamId}
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {diagnosticData.localTracks?.map((track, i) => (
                        <li key={i}>{track}</li>
                    ))}
                </ul>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Remote Stream:</strong> {diagnosticData.remoteStreamId}
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {diagnosticData.remoteTracks?.map((track, i) => (
                        <li key={i}>{track}</li>
                    ))}
                </ul>
            </div>

            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '8px' }}>
                Updated: {diagnosticData.timestamp}
            </div>
        </div>
    );
};

export default DiagnosticInfo;
