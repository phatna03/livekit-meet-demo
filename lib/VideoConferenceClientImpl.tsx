'use client';

import { formatChatMessageLinks, LocalUserChoices, RoomContext, VideoConference } from '@livekit/components-react';
import { useRouter } from 'next/navigation';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoPresets,
  type VideoCodec,
} from 'livekit-client';
import { DebugMode } from '@/lib/Debug';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
  userChoices: LocalUserChoices;
}) {
  console.log('VideoConferenceClientImpl rendered with props:', props);
  
  const router = useRouter();
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = useState(false);

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: props.codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, [e2eeEnabled, props.codec, keyProvider, worker]);

  const room = useMemo(() => new Room(roomOptions), [roomOptions]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  useEffect(() => {
    if (e2eeEnabled) {
      keyProvider.setKey(e2eePassphrase).then(() => {
        room.setE2EEEnabled(true).then(() => {
          setE2eeSetupComplete(true);
        });
      });
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, e2eePassphrase, keyProvider, room, setE2eeSetupComplete]);

  useEffect(() => {
    if (e2eeSetupComplete) {
      console.log('Connecting to room:', props.liveKitUrl, 'with token:', props.token);
      console.log('User choices:', props.userChoices);
      
      // Decode token to check username
      try {
        const tokenPayload = JSON.parse(atob(props.token.split('.')[1]));
        console.log('Token payload:', tokenPayload);
      } catch (e) {
        console.log('Could not decode token:', e);
      }
      
      room.connect(props.liveKitUrl, props.token, connectOptions).catch((error) => {
        console.error('Room connection error:', error);
      });
      
      // Set username
      if (props.userChoices.username) {
        console.log('Setting username to:', props.userChoices.username);
        room.localParticipant.setName(props.userChoices.username);
        // Also set metadata for display
        room.localParticipant.setMetadata(JSON.stringify({ name: props.userChoices.username }));
      }
      
      // Enable/disable camera and microphone based on user choices
      if (props.userChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          console.error('Enable camera error:', error);
        });
      } else {
        room.localParticipant.setCameraEnabled(false);
      }
      
      if (props.userChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          console.error('Enable microphone error:', error);
        });
      } else {
        room.localParticipant.setMicrophoneEnabled(false);
      }
    }
  }, [room, props.liveKitUrl, props.token, props.userChoices, connectOptions, e2eeSetupComplete]);

  useLowCPUOptimizer(room);

  // Add event listeners for debugging
  useEffect(() => {
    const handleConnected = () => {
      console.log('Room connected, local participant:', room.localParticipant);
      console.log('Local participant name:', room.localParticipant.name);
      console.log('Local participant identity:', room.localParticipant.identity);
      
      // Force set username if not set in token
      if (props.userChoices.username && !room.localParticipant.name) {
        console.log('Force setting username after connect:', props.userChoices.username);
        room.localParticipant.setName(props.userChoices.username);
        room.localParticipant.setMetadata(JSON.stringify({ name: props.userChoices.username }));
      }
      
      // Also try to set username after a delay to ensure room is stable
      setTimeout(() => {
        if (props.userChoices.username) {
          console.log('Delayed username set:', props.userChoices.username);
          room.localParticipant.setName(props.userChoices.username);
          room.localParticipant.setMetadata(JSON.stringify({ name: props.userChoices.username }));
        }
      }, 2000);
    };

    const handleParticipantConnected = (participant: any) => {
      console.log('Participant connected:', participant.identity, participant.name);
    };

    const handleDisconnected = () => {
      console.log('Room disconnected, redirecting to home');
      router.push('/');
    };

    room.on('connected', handleConnected);
    room.on('participantConnected', handleParticipantConnected);
    room.on('disconnected', handleDisconnected);

    return () => {
      room.off('connected', handleConnected);
      room.off('participantConnected', handleParticipantConnected);
      room.off('disconnected', handleDisconnected);
    };
  }, [room, router]);

  // Custom disconnect handler
  const handleCustomDisconnect = () => {
    console.log('Custom disconnect triggered');
    room.disconnect();
    router.push('/');
  };

  // Intercept disconnect button clicks
  useEffect(() => {
    const handleDisconnectClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const disconnectButton = target.closest('.lk-disconnect-button');
      
      if (disconnectButton) {
        console.log('Disconnect button clicked');
        event.preventDefault();
        event.stopPropagation();
        handleCustomDisconnect();
      }
    };

    document.addEventListener('click', handleDisconnectClick);
    
    return () => {
      document.removeEventListener('click', handleDisconnectClick);
    };
  }, [room, router]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={
            process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
          }
        />
        <DebugMode logLevel={LogLevel.debug} />
      </RoomContext.Provider>
    </div>
  );
}
