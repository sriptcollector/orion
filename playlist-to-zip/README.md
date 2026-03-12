# Playlist to Zip

Takes song names from Spotify playlists, finds the raw audio on SoundCloud, and packages everything into a downloadable zip of WAV or MP3 files.

## How it works

1. **Spotify playlist URL** → reads track names and artists via the Spotify API
2. **SoundCloud search** → searches SoundCloud for each track using yt-dlp (`scsearch1:Artist - Title`)
3. **Download** → grabs the highest quality audio from SoundCloud (no YouTube intros/outros)
4. **Zip** → packages all tracks into a single zip file

## Deploy to the web (free)

### Option 1: Railway (recommended)

1. Fork this repo on GitHub
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **New Project → Deploy from GitHub repo** and select your fork
4. Set the **Root Directory** to `playlist-to-zip`
5. Add environment variables in the Railway dashboard:
   - `SPOTIFY_CLIENT_ID` — from https://developer.spotify.com/dashboard
   - `SPOTIFY_CLIENT_SECRET` — from the same dashboard
6. Railway auto-deploys. You'll get a public `*.up.railway.app` URL.

### Option 2: Render

1. Fork this repo on GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo, set **Root Directory** to `playlist-to-zip`
4. Render will detect the Dockerfile automatically
5. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` as env vars
6. Deploy — you'll get a public `*.onrender.com` URL

### Option 3: Docker (any VPS)

```bash
cd playlist-to-zip
docker build -t playlist-to-zip .
docker run -p 8000:8000 \
  -e SPOTIFY_CLIENT_ID=your_id \
  -e SPOTIFY_CLIENT_SECRET=your_secret \
  playlist-to-zip
```

## Local setup

```bash
cd playlist-to-zip
pip install -r requirements.txt
```

You also need **ffmpeg** installed:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
winget install ffmpeg
```

### Spotify credentials

Create a Spotify app at https://developer.spotify.com/dashboard and set your credentials:

```bash
cp .env.example .env
# Edit .env with your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
```

No SoundCloud credentials needed — yt-dlp handles the search and download.

## Usage

### Web UI

```bash
python server.py
# Open http://localhost:8000
```

Paste a Spotify playlist URL, pick WAV or MP3, and hit Convert.

### CLI

```bash
# Spotify playlist → wav zip (default)
python cli.py "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"

# Spotify playlist → mp3 zip at 320kbps
python cli.py "https://open.spotify.com/playlist/..." -f mp3 -q 320

# Custom output directory
python cli.py "https://open.spotify.com/album/..." -o ~/Music
```

### API

```bash
# Start a job
curl -X POST http://localhost:8000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/playlist/...", "format": "wav"}'
# Returns: {"job_id": "abc123"}

# Check status
curl http://localhost:8000/api/status/abc123

# Download when done
curl -O http://localhost:8000/api/download/abc123
```
