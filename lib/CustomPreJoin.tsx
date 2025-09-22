'use client';

import React, { useState, useRef } from 'react';
import { LocalUserChoices } from '@livekit/components-react';
import { useRouter } from 'next/navigation';

interface CustomPreJoinProps {
  defaults: Partial<LocalUserChoices>;
  onSubmit: (values: LocalUserChoices, serverType: 'livekit' | 'custom') => void;
  onError: (error: any) => void;
}

export function CustomPreJoin({ defaults, onSubmit, onError }: CustomPreJoinProps) {
  const router = useRouter();
  const [username, setUsername] = useState(defaults.username || '');
  const [videoEnabled, setVideoEnabled] = useState(defaults.videoEnabled ?? true);
  const [audioEnabled, setAudioEnabled] = useState(defaults.audioEnabled ?? true);
  const [isJoining, setIsJoining] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');
  const [serverType, setServerType] = useState<'livekit' | 'custom'>('custom');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load available devices
  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices);
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      if (videoDevices.length > 0) {
        setVideoDeviceId(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0) {
        setAudioDeviceId(audioDevices[0].deviceId);
      }
    });
  }, []);

  // Start camera preview
  React.useEffect(() => {
    if (videoEnabled && videoDeviceId) {
      navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: videoDeviceId },
        audio: false 
      }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }).catch((error) => {
        console.error('Error accessing camera:', error);
        onError(error);
      });
    }
  }, [videoEnabled, videoDeviceId, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsJoining(true);

    try {
      const values: LocalUserChoices = {
        username: username.trim(),
        videoEnabled,
        audioEnabled,
        videoDeviceId: videoDeviceId || undefined,
        audioDeviceId: audioDeviceId || undefined,
      };

      onSubmit(values, serverType);
    } catch (error) {
      onError(error);
      setIsJoining(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  const videoDevices = devices.filter(device => device.kind === 'videoinput');
  const audioDevices = devices.filter(device => device.kind === 'audioinput');

  return (
    <div className="custom-prejoin">
      <div className="prejoin-container">
        {/* Video Preview Area */}
        <div className="video-preview-area">
          {videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="preview-video"
            />
          ) : (
            <div className="video-placeholder">
              <div className="user-icon">👤</div>
            </div>
          )}
          <div className="signal-indicator">📶</div>
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          {/* Device Controls */}
          <div className="device-controls">
            <div className="device-control">
              <button
                type="button"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`device-btn ${!audioEnabled ? 'disabled' : ''}`}
              >
                <span className="device-icon">🎤</span>
                <span className="device-text">Microphone opt</span>
                <span className="dropdown-arrow">▼</span>
              </button>
            </div>

            <div className="device-control">
              <button
                type="button"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`device-btn ${!videoEnabled ? 'disabled' : ''}`}
              >
                <span className="device-icon">📹</span>
                <span className="device-text">Camera opt</span>
                <span className="dropdown-arrow">▼</span>
              </button>
            </div>
          </div>

          {/* Username Input */}
          <div className="username-section">
            <div className="username-input-container">
              <span className="user-icon-small">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="username-input"
                required
              />
            </div>
          </div>

          {/* Server Type Selection */}
          <div className="server-selection">
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="serverType"
                  value="livekit"
                  checked={serverType === 'livekit'}
                  onChange={(e) => setServerType(e.target.value as 'livekit' | 'custom')}
                />
                <span className="radio-label">LiveKit Server</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="serverType"
                  value="custom"
                  checked={serverType === 'custom'}
                  onChange={(e) => setServerType(e.target.value as 'livekit' | 'custom')}
                />
                <span className="radio-label">Custom Server</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isJoining || !username.trim()}
              className="join-button"
            >
              {isJoining ? 'Joining...' : 'Join Now'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-prejoin {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #1a1a1a;
          padding: 20px;
        }

        .prejoin-container {
          background: #2d2d2d;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .video-preview-area {
          position: relative;
          width: 100%;
          height: 300px;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: #1a1a1a;
        }

        .user-icon {
          font-size: 80px;
          color: #666;
        }

        .signal-indicator {
          position: absolute;
          bottom: 16px;
          left: 16px;
          font-size: 16px;
          color: #4CAF50;
        }

        .controls-section {
          padding: 24px;
          background: #2d2d2d;
        }

        .device-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .device-control {
          flex: 1;
        }

        .device-btn {
          width: 100%;
          padding: 12px 16px;
          background: #3a3a3a;
          border: 1px solid #555;
          border-radius: 8px;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .device-btn:hover {
          background: #4a4a4a;
        }

        .device-btn.disabled {
          opacity: 0.6;
        }

        .device-icon {
          font-size: 16px;
        }

        .device-text {
          flex: 1;
          text-align: left;
          font-size: 14px;
        }

        .dropdown-arrow {
          font-size: 12px;
          color: #999;
        }

        .username-section {
          margin-bottom: 20px;
        }

        .username-input-container {
          display: flex;
          align-items: center;
          background: #3a3a3a;
          border: 1px solid #555;
          border-radius: 8px;
          padding: 12px 16px;
          gap: 12px;
        }

        .user-icon-small {
          font-size: 16px;
          color: #999;
        }

        .username-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 16px;
          outline: none;
        }

        .username-input::placeholder {
          color: #999;
        }

        .server-selection {
          margin-bottom: 24px;
        }

        .radio-group {
          display: flex;
          gap: 24px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: white;
          font-size: 14px;
        }

        .radio-option input[type="radio"] {
          width: 16px;
          height: 16px;
          accent-color: #ff6b35;
        }

        .radio-label {
          user-select: none;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
        }

        .cancel-button {
          flex: 1;
          padding: 12px 24px;
          background: #3a3a3a;
          border: 1px solid #555;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button:hover {
          background: #4a4a4a;
        }

        .join-button {
          flex: 1;
          padding: 12px 24px;
          background: #ff6b35;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .join-button:hover:not(:disabled) {
          background: #e55a2b;
        }

        .join-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .prejoin-container {
            margin: 10px;
          }

          .device-controls {
            flex-direction: column;
          }

          .radio-group {
            flex-direction: column;
            gap: 12px;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
