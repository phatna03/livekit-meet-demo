'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LocalUserChoices, TrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
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
  const [serverType, setServerType] = useState<'livekit' | 'custom'>('custom');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load available devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices);
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      if (audioDevices.length > 0) {
        setSelectedAudioDevice(audioDevices[0].deviceId);
      }
      if (videoDevices.length > 0) {
        setSelectedVideoDevice(videoDevices[0].deviceId);
      }
    });
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.cpDeviceControl}`)) {
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
    if (videoEnabled && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
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
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoEnabled, onError]);

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
        videoDeviceId: selectedVideoDevice || undefined,
        audioDeviceId: selectedAudioDevice || undefined,
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
              <div className={styles.cpDeviceHeader}>
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={styles.cpIconButton}
                >
                  <img
                    src={audioEnabled ? '/icons/mic_on.png' : '/icons/mic_off.png'}
                    alt="Microphone"
                    className={styles.cpDeviceIcon}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                  className={styles.cpDropdownButton}
                >
                  <span className={styles.cpDeviceText}>
                    {devices.find((d) => d.deviceId === selectedAudioDevice)?.label || 'Microphone'}
                  </span>
                  <span className={styles.cpDropdownArrow}>▼</span>
                </button>
              </div>
              {showAudioDropdown && (
                <div className={styles.cpDropdown}>
                  {devices
                    .filter((device) => device.kind === 'audioinput')
                    .map((device) => (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => {
                          setSelectedAudioDevice(device.deviceId);
                          setShowAudioDropdown(false);
                        }}
                        className={`${styles.cpDropdownItem} ${
                          device.deviceId === selectedAudioDevice ? styles.cpDropdownItemActive : ''
                        }`}
                      >
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className={styles.cpDeviceControl}>
              <div className={styles.cpDeviceHeader}>
                <button
                  type="button"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={styles.cpIconButton}
                >
                  <img
                    src={videoEnabled ? '/icons/cam_on.png' : '/icons/cam_off.png'}
                    alt="Camera"
                    className={styles.cpDeviceIcon}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideoDropdown(!showVideoDropdown)}
                  className={styles.cpDropdownButton}
                >
                  <span className={styles.cpDeviceText}>
                    {devices.find((d) => d.deviceId === selectedVideoDevice)?.label || 'Camera'}
                  </span>
                  <span className={styles.cpDropdownArrow}>▼</span>
                </button>
              </div>
              {showVideoDropdown && (
                <div className={styles.cpDropdown}>
                  {devices
                    .filter((device) => device.kind === 'videoinput')
                    .map((device) => (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => {
                          setSelectedVideoDevice(device.deviceId);
                          setShowVideoDropdown(false);
                        }}
                        className={`${styles.cpDropdownItem} ${
                          device.deviceId === selectedVideoDevice ? styles.cpDropdownItemActive : ''
                        }`}
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
              <img src="/icons/user_sm.png" alt="User" className={styles.cpUserIconSmall} />
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
