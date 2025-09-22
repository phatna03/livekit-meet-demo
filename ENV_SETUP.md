# Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc của project với nội dung sau:

## Cấu hình cho cả 2 chế độ

```env
# Backend API Configuration (cho Custom Server)
BACKEND_API_URL=https://livekit-token.ig3.ai

# LiveKit Server Configuration (cho LiveKit Server)
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Frontend Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_SHOW_SETTINGS_MENU=true
```

## Giải thích các biến:

### Backend API (cho Custom Server):
- `BACKEND_API_URL`: URL của API backend để tạo token

### LiveKit Server (cho LiveKit Server):
- `LIVEKIT_URL`: URL của LiveKit server (server-side)
- `LIVEKIT_API_KEY`: API key của LiveKit server (server-side)
- `LIVEKIT_API_SECRET`: API secret của LiveKit server (server-side)

### Frontend Configuration:
- `NEXT_PUBLIC_LIVEKIT_URL`: URL của LiveKit server (client-side)
- `NEXT_PUBLIC_BACKEND_URL`: URL của frontend
- `NEXT_PUBLIC_SHOW_SETTINGS_MENU`: Hiển thị menu settings

## Flow hoạt động:

### Custom Server Mode:
1. User chọn "Custom Server" trong PreJoin
2. Frontend gọi Next.js API route: `http://localhost:3000/api/connection-details?serverType=custom`
3. Next.js API route gọi backend API: `https://livekit-token.ig3.ai/createToken`
4. Backend API trả về: `{ server_url, participant_token }`
5. Next.js API route trả về cho frontend: `{ serverUrl, participantToken, roomName, participantName }`

### LiveKit Server Mode:
1. User chọn "LiveKit Server" trong PreJoin
2. Frontend gọi Next.js API route: `http://localhost:3000/api/connection-details?serverType=livekit`
3. Next.js API route tạo token trực tiếp từ LiveKit server
4. Next.js API route trả về cho frontend: `{ serverUrl, participantToken, roomName, participantName }`

## Lưu ý:

- **Custom Server**: Sử dụng backend API của team
- **LiveKit Server**: Sử dụng LiveKit server trực tiếp với API keys
- Server URL sẽ được lấy từ response của backend API (Custom) hoặc từ `LIVEKIT_URL` (LiveKit)
- Sử dụng Next.js API route để tránh vấn đề CORS
- Sử dụng `localhost` thay vì `127.0.0.1` để tránh CORS issues
- Đã thêm CORS headers vào API route