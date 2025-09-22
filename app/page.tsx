'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import styles from '@/styles/Home.module.css';

function Tabs(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const tabIndex = searchParams?.get('tab') === 'custom' ? 1 : 0;

  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push(`/?tab=${tab}`);
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (onTabSelected) {
            onTabSelected(index);
          }
        }}
        aria-pressed={tabIndex === index}
      >
        {/* @ts-ignore */}
        {child?.props.label}
      </button>
    );
  });

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {/* @ts-ignore */}
      {props.children[tabIndex]}
    </div>
  );
}

function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const startMeeting = () => {
    if (e2ee) {
      router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      router.push(`/rooms/${generateRoomId()}`);
    }
  };
  return (
    <div className={styles.tabContent}>
      <p style={{ margin: 0, textAlign: 'center' }}>Video calls and meetings for everyone</p>
      <button
        style={{ marginTop: '1rem', marginBottom: '1rem' }}
        className="lk-button"
        onClick={startMeeting}
      >
        Start Meeting
      </button>
      <p style={{ margin: 0 }}>Connect, collaborate, and celebrate from anywhere with ig3 Meet</p>
      <div style={{ display: 'none', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomConnectionTab(props: { label: string }) {
  const router = useRouter();

  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    if (e2ee) {
      router.push(
        `/custom/?liveKitUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
    }
  };
  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p style={{ marginTop: 0 }}>
        Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
      </p>
      <input
        id="serverUrl"
        name="serverUrl"
        type="url"
        placeholder="LiveKit Server URL: wss://*.livekit.cloud"
        required
      />
      <textarea
        id="token"
        name="token"
        placeholder="Token"
        required
        rows={5}
        style={{ padding: '1px 2px', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

export default function Page() {
  const router = useRouter();
  const [joinLink, setJoinLink] = useState('');
  const [joinError, setJoinError] = useState('');

  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };

  const handleJoinMeeting = () => {
    setJoinError('');

    if (!joinLink.trim()) {
      setJoinError('Please enter a meeting link');
      return;
    }

    // Validate link format: [domain]/rooms/[room_name]
    const urlPattern = /^(https?:\/\/[^\/]+)?\/rooms\/([a-zA-Z0-9\-]+)$/;
    const match = joinLink.match(urlPattern);

    if (!match) {
      setJoinError('Invalid meeting link format. Please use: /rooms/room-name');
      return;
    }

    // Extract room name and navigate
    const roomName = match[2];
    router.push(`/rooms/${roomName}`);
  };

  const handleJoinLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinLink(e.target.value);
    if (joinError) {
      setJoinError('');
    }
  };

  return (
    <>
      <main className={styles.hpMain} data-lk-theme="default">
        <div className={styles.hpBackgroundImage}></div>

        {/* Header */}
        <header className={styles.hpHeader}>
          <h1 className={styles.hpTitle}>
            <span className={styles.hpIg3}>IG3</span>
            <span className={styles.hpMeet}>MEET</span>
          </h1>
        </header>

        {/* Content */}
        <div className={styles.hpContent}>
          <div className={styles.hpCard}>
            <p className={styles.hpCardTitle}>
              Video calls and <br />
              meetings for everyone
            </p>
            <p className={styles.hpCardDescription}>
              Connect, collaborate, and celebrate from anywhere with{' '}
              <span className={styles.hpCardDescriptionHighlight}>iG3 Meet</span>
            </p>
            <button className={styles.hpStartButton} onClick={startMeeting}>
              <img
                src="/icons/start_meeting.png"
                alt="Start Meeting"
                className={styles.hpStartButtonIcon}
              />
              Start Meeting
            </button>

            {/* Or separator */}
            <div className={styles.hpOrSeparator}>
              <div className={styles.hpOrLine}></div>
              <span className={styles.hpOrText}>Or</span>
              <div className={styles.hpOrLine}></div>
            </div>

            {/* Join section */}
            <div className={styles.hpJoinSection}>
              <div className={styles.hpJoinInputContainer}>
                <img src="/icons/input_link.png" alt="Link" className={styles.hpJoinInputIcon} />
                <input
                  type="text"
                  value={joinLink}
                  onChange={handleJoinLinkChange}
                  placeholder="Join using the meeting link or code"
                  className={styles.hpJoinInput}
                />
                <button className={styles.hpJoinButton} onClick={handleJoinMeeting}>
                  Join
                </button>
              </div>
              {joinError && <div className={styles.hpJoinError}>{joinError}</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.hpFooter}>
          <div className={styles.hpFooterLeft}>
            <p>@2025 iG3 Meet. All rights reserved.</p>
          </div>
          <div className={styles.hpFooterRight}>
            <a href="#" className={styles.hpSocialIcon} aria-label="Twitter">
              <img src="/icons/footer_x.png" alt="Twitter" className={styles.hpSocialIconIcon} />
            </a>
            <a href="#" className={styles.hpSocialIcon} aria-label="Discord">
              <img
                src="/icons/footer_discord.png"
                alt="Twitter"
                className={styles.hpSocialIconIcon}
              />
            </a>
            <a href="#" className={styles.hpSocialIcon} aria-label="Facebook">
              <img src="/icons/footer_chat.png" alt="Twitter" className={styles.hpSocialIconIcon} />
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
