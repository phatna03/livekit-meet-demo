'use client';

import React, { useState, useRef } from 'react';
import { LocalUserChoices } from '@livekit/components-react';
import { useRouter } from 'next/navigation';
import styles from '../styles/CustomPreJoin.module.css';

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
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load available devices
  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices);
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');

      if (videoDevices.length > 0) {
        setVideoDeviceId(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0) {
        setAudioDeviceId(audioDevices[0].deviceId);
      }
    });
  }, []);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.cpDeviceControl')) {
        setShowAudioDropdown(false);
        setShowVideoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Start camera preview
  React.useEffect(() => {
    if (videoEnabled && videoDeviceId) {
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: videoDeviceId },
          audio: false,
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
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
        videoDeviceId: videoDeviceId ? videoDeviceId : undefined,
        audioDeviceId: audioDeviceId ? audioDeviceId : undefined,
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

  const videoDevices = devices.filter((device) => device.kind === 'videoinput');
  const audioDevices = devices.filter((device) => device.kind === 'audioinput');

  return (
    <div className={styles.cpContainer}>
      <div className={styles.cpPrejoinContainer}>
        {/* Video Preview Area */}
        <div className={styles.cpVideoPreviewArea}>
          {videoEnabled ? (
            <video ref={videoRef} autoPlay muted playsInline className={styles.cpPreviewVideo} />
          ) : (
            <div className={styles.cpVideoPlaceholder}>
              <div className={styles.cpUserIcon}>
                <img src="/icons/user.png" alt="User" />
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className={styles.cpControlsSection}>
          {/* Device Controls */}
          <div className={styles.cpDeviceControls}>
            <div className={styles.cpDeviceControl}>
              <button
                type="button"
                onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                className={`${styles.cpDeviceBtn} ${!audioEnabled ? styles.disabled : ''}`}
              >
                <span className={styles.cpDeviceIcon}>🎤</span>
                <span className={styles.cpDeviceText}>
                  {audioDevices.find((d) => d.deviceId === audioDeviceId)?.label || 'Microphone'}
                </span>
                <span className={styles.cpDropdownArrow}>▼</span>
              </button>
              {showAudioDropdown && (
                <div className={styles.cpDropdown}>
                  {audioDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      type="button"
                      onClick={() => {
                        setAudioDeviceId(device.deviceId);
                        setShowAudioDropdown(false);
                      }}
                      className={`${styles.cpDropdownItem} ${device.deviceId === audioDeviceId ? styles.cpDropdownItemActive : ''}`}
                    >
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.cpDeviceControl}>
              <button
                type="button"
                onClick={() => setShowVideoDropdown(!showVideoDropdown)}
                className={`${styles.cpDeviceBtn} ${!videoEnabled ? styles.disabled : ''}`}
              >
                <span className={styles.cpDeviceIcon}>📹</span>
                <span className={styles.cpDeviceText}>
                  {videoDevices.find((d) => d.deviceId === videoDeviceId)?.label || 'Camera'}
                </span>
                <span className={styles.cpDropdownArrow}>▼</span>
              </button>
              {showVideoDropdown && (
                <div className={styles.cpDropdown}>
                  {videoDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      type="button"
                      onClick={() => {
                        setVideoDeviceId(device.deviceId);
                        setShowVideoDropdown(false);
                      }}
                      className={`${styles.cpDropdownItem} ${device.deviceId === videoDeviceId ? styles.cpDropdownItemActive : ''}`}
                    >
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Username Input */}
          <div className={styles.cpUsernameSection}>
            <div className={styles.cpUsernameInputContainer}>
              <span className={styles.cpUserIconSmall}>👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className={styles.cpUsernameInput}
                required
              />
            </div>
          </div>

          {/* Server Type Selection */}
          <div className={styles.cpServerSelection}>
            <div className={styles.cpRadioGroup}>
              <label className={styles.cpRadioOption}>
                <input
                  type="radio"
                  name="serverType"
                  value="livekit"
                  checked={serverType === 'livekit'}
                  onChange={(e) => setServerType(e.target.value as 'livekit' | 'custom')}
                />
                <span className={styles.cpRadioLabel}>LiveKit Server</span>
              </label>
              <label className={styles.cpRadioOption}>
                <input
                  type="radio"
                  name="serverType"
                  value="custom"
                  checked={serverType === 'custom'}
                  onChange={(e) => setServerType(e.target.value as 'livekit' | 'custom')}
                />
                <span className={styles.cpRadioLabel}>Custom Server</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.cpActionButtons}>
            <button type="button" onClick={handleCancel} className={styles.cpCancelButton}>
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isJoining || !username.trim()}
              className={styles.cpJoinButton}
            >
              {isJoining ? 'Joining...' : 'Join Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
