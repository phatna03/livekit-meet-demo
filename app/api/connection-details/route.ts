import { randomString } from '@/lib/client-utils';
import { getLiveKitURL } from '@/lib/getLiveKitURL';
import { ConnectionDetails } from '@/lib/types';
import { AccessToken, AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://livekit-token.ig3.ai';
// Hardcode LiveKit server config
const LIVEKIT_URL = 'wss://voicecmd-5kh2prv1.livekit.cloud'; // Thay đổi URL này
const API_KEY = 'APIh92oEKaRKRfn'; // Thay đổi API key này
const API_SECRET = 'If31jdI4UQErVAc6UBLDjpkfjWsR0ZOaPuQk1eUCfBgA'; // Thay đổi API secret này

const COOKIE_KEY = 'random-participant-postfix';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName');
    const participantName = request.nextUrl.searchParams.get('participantName');
    const metadata = request.nextUrl.searchParams.get('metadata') ?? '';
    const region = request.nextUrl.searchParams.get('region');
    const serverType = request.nextUrl.searchParams.get('serverType') || 'custom';

    console.log('API Route - Environment variables:', {
      BACKEND_API_URL,
      LIVEKIT_URL,
      API_KEY: API_KEY ? '***' : 'undefined',
      API_SECRET: API_SECRET ? '***' : 'undefined',
      roomName,
      participantName,
      serverType,
    });

    let randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value;

    if (typeof roomName !== 'string') {
      return new NextResponse('Missing required query parameter: roomName', { status: 400 });
    }
    if (participantName === null) {
      return new NextResponse('Missing required query parameter: participantName', { status: 400 });
    }

    // Generate random participant postfix if not exists
    if (!randomParticipantPostfix) {
      randomParticipantPostfix = randomString(4);
    }

    let data: ConnectionDetails;

    if (serverType === 'livekit') {
      // LiveKit Server mode - tạo token trực tiếp
      console.log('Using LiveKit server directly...');

      if (!LIVEKIT_URL) {
        throw new Error('LIVEKIT_URL is not defined');
      }
      if (!API_KEY || !API_SECRET) {
        throw new Error(
          'LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required for LiveKit server mode',
        );
      }

      const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL;
      if (livekitServerUrl === undefined) {
        throw new Error('Invalid region');
      }

      // Generate participant token directly
      const participantToken = await createParticipantToken(
        {
          identity: `${participantName}__${randomParticipantPostfix}`,
          name: participantName,
          metadata,
        },
        roomName,
      );

      data = {
        serverUrl: livekitServerUrl,
        roomName: roomName,
        participantToken: participantToken,
        participantName: participantName,
      };
    } else {
      // Custom Server mode - sử dụng backend API của team
      console.log('Using custom backend API...');

      const backendResponse = await fetch(`${BACKEND_API_URL}/createToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomName,
          participantName: `${participantName}__${randomParticipantPostfix}`,
          metadata: metadata,
        }),
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend API error: ${backendResponse.status} - ${errorText}`);
      }

      const backendData = await backendResponse.json();
      console.log('Backend API response:', backendData);
      
      // Debug: Check if token contains username
      try {
        const tokenPayload = JSON.parse(atob(backendData.participant_token.split('.')[1]));
        console.log('Backend token payload:', tokenPayload);
        console.log('Token contains name:', tokenPayload.name);
        console.log('Token contains identity:', tokenPayload.sub);
      } catch (e) {
        console.log('Could not decode backend token:', e);
      }

      // Fix server URL: convert https to wss if needed
      let serverUrl = backendData.server_url || LIVEKIT_URL || 'wss://livekit.ig3.ai:7880';
      if (serverUrl.startsWith('https://')) {
        serverUrl = serverUrl.replace('https://', 'wss://');
      }

      console.log('Final server URL:', serverUrl);

      data = {
        serverUrl: serverUrl,
        roomName: roomName,
        participantToken: backendData.participant_token,
        participantName: participantName,
      };
    }

    console.log('API Route - Response data:', data);

    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Set-Cookie': `${COOKIE_KEY}=${randomParticipantPostfix}; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=${getCookieExpirationTime()}`,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = '5m';
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}

function getCookieExpirationTime(): string {
  var now = new Date();
  var time = now.getTime();
  var expireTime = time + 60 * 120 * 1000;
  now.setTime(expireTime);
  return now.toUTCString();
}
