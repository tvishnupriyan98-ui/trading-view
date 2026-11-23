import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function sanitizeOrigin(raw?: string): string {
  const fallback = process.env.APP_URL || 'http://localhost:3000';
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function buildWindowsLauncherCmd(rawOrigin?: string): string {
  const appUrl = sanitizeOrigin(rawOrigin);
  return [
    '@echo off',
    'title TradingView India Desktop Launcher',
    `set "TV_URL=${appUrl}"`,
    'echo Launching TradingView India in standalone desktop mode...',
    'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (',
    '  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app=%TV_URL%',
    '  exit /b 0',
    ')',
    'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (',
    '  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app=%TV_URL%',
    '  exit /b 0',
    ')',
    'start "" "%TV_URL%"',
    'exit /b 0',
    '',
  ].join('\r\n');
}

export function buildLinuxInstallerSh(rawOrigin?: string): string {
  const appUrl = sanitizeOrigin(rawOrigin);
  return `#!/usr/bin/env bash
set -euo pipefail

APP_URL="${appUrl}"
DESKTOP_DIR="\${HOME}/.local/share/applications"
ICON_DIR="\${HOME}/.local/share/icons/hicolor/512x512/apps"
mkdir -p "$DESKTOP_DIR" "$ICON_DIR"

BROWSER=""
for bin in google-chrome chromium chromium-browser brave-browser microsoft-edge; do
  if command -v "$bin" >/dev/null 2>&1; then
    BROWSER="$(command -v "$bin")"
    break
  fi
done

if [ -z "$BROWSER" ]; then
  echo "No Chromium-based browser found. Opening in default browser via xdg-open."
  EXEC_CMD="xdg-open $APP_URL"
else
  EXEC_CMD="$BROWSER --app=$APP_URL --class=TradingViewIndia"
fi

curl -fsSL "$APP_URL/pwa-512x512.png" -o "$ICON_DIR/tradingview-india.png" 2>/dev/null || true

cat > "$DESKTOP_DIR/tradingview-india.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=TradingView India
Comment=Track All Markets — Supercharts, Nifty 50, Sensex & Screener
Exec=$EXEC_CMD
Icon=tradingview-india
Terminal=false
Categories=Finance;Network;
StartupWMClass=TradingViewIndia
EOF

chmod +x "$DESKTOP_DIR/tradingview-india.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DESKTOP_DIR" || true
echo "Installed TradingView India to $DESKTOP_DIR/tradingview-india.desktop"
`;
}

/**
 * Minimal deterministic POSIX ustar .tar builder (zero external tar binary needed), gzipped into .tar.gz.
 */
function createTarGz(files: Array<{ name: string; content: Buffer; mode?: number }>): Buffer {
  const blocks: Buffer[] = [];

  for (const file of files) {
    const header = Buffer.alloc(512, 0);
    const mode = file.mode ?? 0o644;
    const size = file.content.length;
    const mtime = Math.floor(Date.now() / 1000);

    header.write(file.name.slice(0, 100), 0, 'utf8');
    header.write(mode.toString(8).padStart(7, '0') + '\0', 100, 'ascii');
    header.write('0000000\0', 108, 'ascii');
    header.write('0000000\0', 116, 'ascii');
    header.write(size.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
    header.write(mtime.toString(8).padStart(11, '0') + '\0', 136, 'ascii');
    header.write('        ', 148, 'ascii');
    header.write('0', 156, 'ascii');
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');

    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 'ascii');

    blocks.push(header);
    blocks.push(file.content);

    const remainder = size % 512;
    if (remainder !== 0) {
      blocks.push(Buffer.alloc(512 - remainder, 0));
    }
  }

  // Two 512-byte zero blocks terminate tar archive
  blocks.push(Buffer.alloc(1024, 0));
  return zlib.gzipSync(Buffer.concat(blocks), { level: 9 });
}

export function buildAndroidApkKitTarGz(rawOrigin?: string): Buffer {
  const appUrl = sanitizeOrigin(rawOrigin);
  const parsed = new URL(appUrl);
  const root = 'tradingview-india-android-apk-kit';

  const twaManifest = JSON.stringify(
    {
      packageId: 'in.tradingview.clone.app',
      host: parsed.host,
      name: 'TradingView India',
      launcherName: 'TradingView',
      display: 'standalone',
      themeColor: '#000000',
      navigationColor: '#000000',
      backgroundColor: '#000000',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${appUrl}/pwa-512x512.png`,
      maskableIconUrl: `${appUrl}/pwa-maskable-512x512.png`,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: './android.keystore',
        alias: 'tradingview',
      },
      appVersionName: '1.0.0',
      appVersionCode: 1,
      shortcuts: [
        {
          name: 'Supercharts',
          shortName: 'Charts',
          url: '/#chart',
          chosenIconUrl: `${appUrl}/pwa-192x192.png`,
        },
      ],
      fallbackType: 'customtabs',
      orientation: 'default',
    },
    null,
    2,
  );

  const capacitorConfig = JSON.stringify(
    {
      appId: 'in.tradingview.clone.app',
      appName: 'TradingView India',
      webDir: 'dist',
      server: {
        url: appUrl,
        cleartext: parsed.protocol === 'http:',
      },
      android: {
        allowMixedContent: true,
        backgroundColor: '#000000',
      },
    },
    null,
    2,
  );

  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="in.tradingview.clone.app">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="TradingView India"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
        <activity
            android:name=".LauncherActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  const buildApkSh = `#!/usr/bin/env bash
set -euo pipefail

echo "=== TradingView India Android APK Builder ==="
echo "Target Hosted App URL: ${appUrl}"
echo ""
if ! command -v npx >/dev/null 2>&1; then
  echo "Error: Node.js / npx is required to run Bubblewrap CLI."
  exit 1
fi

echo "1. Updating Android TWA project from twa-manifest.json..."
npx --yes @bubblewrap/cli update --manifest=./twa-manifest.json

echo "2. Building signed release APK (app-release-signed.apk)..."
npx --yes @bubblewrap/cli build

echo "Done! Install on any Android phone via: adb install app-release-signed.apk"
`;

  const readme = `# TradingView India — Android APK Project Kit

Target URL: ${appUrl}

## Option 1: Instant Zero-APK Install on Android (Recommended)
1. Open \`${appUrl}\` in Chrome on your Android phone.
2. Tap **Install App** in the top bar (or Chrome menu ⋮ → **Install app**).
3. TradingView India installs with its adaptive icon, splash screen, offline cache, and full-screen standalone UI.

## Option 2: Compile a Sideloadable Android .apk (Bubblewrap TWA)
Requirements: Node.js 18+, JDK 17, Android SDK (auto-installed by Bubblewrap on first run).

\`\`\`bash
chmod +x build-apk.sh
./build-apk.sh
\`\`\`

This compiles \`app-release-signed.apk\` ready for Android phones or Google Play upload.

## Option 3: Capacitor Hybrid APK
Use the included \`capacitor.config.json\` and \`AndroidManifest.xml\` with \`npx cap add android && npx cap open android\`.
`;

  const entries: Array<{ name: string; content: Buffer; mode?: number }> = [
    { name: `${root}/README.md`, content: Buffer.from(readme, 'utf8') },
    { name: `${root}/twa-manifest.json`, content: Buffer.from(twaManifest, 'utf8') },
    { name: `${root}/capacitor.config.json`, content: Buffer.from(capacitorConfig, 'utf8') },
    { name: `${root}/AndroidManifest.xml`, content: Buffer.from(androidManifestXml, 'utf8') },
    { name: `${root}/build-apk.sh`, content: Buffer.from(buildApkSh, 'utf8'), mode: 0o755 },
  ];

  // Bundle the real generated PNG icons if present in public/
  for (const iconName of ['pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png']) {
    const iconPath = path.resolve(process.cwd(), 'public', iconName);
    if (fs.existsSync(iconPath)) {
      entries.push({
        name: `${root}/icons/${iconName}`,
        content: fs.readFileSync(iconPath),
      });
    }
  }

  return createTarGz(entries);
}
