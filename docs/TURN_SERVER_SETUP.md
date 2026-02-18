# How to Configure TURN Server for WebRTC

## What is a TURN Server?
Real-time communication (WebRTC) relies on establishing a direct connection between devices (Peer-to-Peer). However, in the real world, many devices are behind strict firewalls and NATs (Network Address Translators) that block direct connections.

- **STUN (Session Traversal Utilities for NAT)**: Tells your device what its public IP address is. It works for most simple networks.
- **TURN (Traversal Using Relays around NAT)**: Acts as a middleman relay. If a direct peer-to-peer connection fails, all video/audio data is routed through the TURN server. This ensures 100% connectivity but costs bandwidth.

## Why You Need It
If you notice that video calls fail when users are on different Wi-Fi networks (e.g., one on proper Wi-Fi, one on mobile data), you need a TURN server.

## How We Implemented It
We have updated the code to look for **TURN credentials in your environment variables**. This prevents hardcoding sensitive passwords in the source code.

### 1. Updated `useWebRTC.js`
Your application now dynamically checks for `VITE_TURN_URL`. If it finds it, it adds it to the list of "ICE Servers" used to establish the connection.

```javascript
/* frontend/src/hooks/useWebRTC.js */

// ... inside createPC function ...
const turnUrl = import.meta.env.VITE_TURN_URL;

const iceServers = [
    { urls: "stun:stun.l.google.com:19302" } // Always use free Google STUN
];

// If you set these in your .env file, they will be added automatically
if (turnUrl) {
    iceServers.push({
        urls: turnUrl,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
    });
}
```

### 2. How to Enable It (Action Required)
You need to get a TURN server. You have two options:

#### Option A: Use Metered.ca (Recommended - Free 50GB/month)
This is the easiest way to get started completely free.

1.  **Go to the Website**: Visit [Metered.ca](https://www.metered.ca/) and click "Start for Free".
2.  **Create Account**: Sign up with your email or Google account.
3.  **Access Dashboard**: Once logged in, you will be on the Dashboard.
4.  **Find Credentials**:
    *   Look for the **"TURN Credentials"** section (usually on the main dashboard or under a "Turn Server" tab).
    *   You will see a table with `iceServers`.
    *   Look for the row where "Type" is `turn`.
5.  **Copy Values**:
    *   **URL**: It will look like `turn:global.turn.metered.ca:80` (or port 443).
    *   **Username**: A random string (e.g., `83df92...`).
    *   **Credential/Password**: Another random string (e.g., `1a2b3c...`).

6.  **Update Your Code**:
    Open `d:\Spring Projects\assesment\frontend\.env` and paste them:

    ```env
    VITE_TURN_URL=turn:global.turn.metered.ca:80
    VITE_TURN_USERNAME=your_username_from_dashboard
    VITE_TURN_CREDENTIAL=your_password_from_dashboard
    ```

    > **Note**: Metered.ca might give you a URL like `turn:a.turn.metered.ca:443?transport=tcp`. You can use that entire string as the `VITE_TURN_URL`.

#### Option B: Host Your Own (Advanced)
You can host an open-source TURN server like **Coturn** on a cheap VPS (like DigitalOcean or AWS EC2).
1. Install Coturn: `sudo apt-get install coturn`
2. Edit config: `/etc/turnserver.conf`
3. Enable it and set your own username/password.
4. Add those details to your `.env` file as shown above.

## Verification
When you start a call with these variables set, check the browser console (F12). You will see a log message:
`[WebRTC] 🔄 Using Configured TURN Server`

If you see this, your application is production-ready for restricted networks!
