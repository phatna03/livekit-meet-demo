'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LocalUserChoices, TrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../styles/CustomPreJoin.module.css';
import { encodePassphrase, randomString } from '@/lib/client-utils';

interface CustomPreJoinProps {
  defaults: Partial<LocalUserChoices>;
  onSubmit: (values: LocalUserChoices, serverType: 'livekit' | 'custom') => void;
  onError: (error: any) => void;
}

function CustomPreJoinComponent({ defaults, onSubmit, onError }: CustomPreJoinProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState(defaults.username || '');
  const [videoEnabled, setVideoEnabled] = useState(defaults.videoEnabled ?? true);
  const [audioEnabled, setAudioEnabled] = useState(defaults.audioEnabled ?? true);
  const [isJoining, setIsJoining] = useState(false);
  const [serverType, setServerType] = useState<'livekit' | 'custom'>('custom');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  // Check if debug mode is enabled
  const isDebugMode = searchParams.get('debug') === '1';

  // Get current room URL
  const roomUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Copy room URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      // You could add a toast notification here
      // alert('Room URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Room URL copied to clipboard!');
    }
  };

  // Load available devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
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
      }).catch((error) => {
        console.error('Error loading devices:', error);
      });
    }
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
    if (videoEnabled && videoRef.current && typeof navigator !== 'undefined' && navigator.mediaDevices) {
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
      // alert('Please enter your name');
      return;
    }

    setIsJoining(true);

    try {
      const values: LocalUserChoices = {
        username: username.trim(),
        videoEnabled,
        audioEnabled,
        videoDeviceId: selectedVideoDevice || '',
        audioDeviceId: selectedAudioDevice || '',
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
                  {devices.length > 0 ? devices
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
                    )) : (
                      <div className={styles.cpDropdownItem}>No devices available</div>
                    )}
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
                  {devices.length > 0 ? devices
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
                    )) : (
                      <div className={styles.cpDropdownItem}>No devices available</div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Room URL Display */}
          <div className={styles.cpRoomUrlSection}>
            <div className={styles.cpRoomUrlInputContainer}>
              <img src="/icons/meeting.png" alt="Meeting" className={styles.cpMeetingIcon} />
              <input
                type="text"
                value={roomUrl}
                readOnly
                className={styles.cpRoomUrlInput}
                placeholder="Room URL will appear here"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className={styles.cpCopyButton}
                title="Copy room URL"
              >
                <img src="/icons/copy.png" alt="Copy" className={styles.cpCopyIcon} />
              </button>
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

          {/* Server Type Selection - Only show in debug mode */}
          {isDebugMode && (
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
          )}

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

export function CustomPreJoin(props: CustomPreJoinProps) {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <CustomPreJoinComponent {...props} />
    </React.Suspense>
  );
}
