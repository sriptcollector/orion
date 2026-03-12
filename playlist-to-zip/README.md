# Playlist to Zip

Takes song names from Spotify playlists, finds the raw audio on SoundCloud, and packages everything into a downloadable zip of WAV or MP3 files.

## How it works

1. **Spotify playlist URL** → reads track names and artists via the Spotify API
2. **SoundCloud search** → searches SoundCloud for each track using yt-dlp (`scsearch1:Artist - Title`)
3. **Download** → grabs the highest quality audio from SoundCloud (no YouTube intros/outros)
4. **Zip** → packages all tracks into a single zip file

## Setup

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
```

### Spotify credentials

Create a Spotify app at https://developer.spotify.com/dashboard and set your credentials:

```bash
cp .env.example .env
# Edit .env with your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
```

No SoundCloud credentials needed — yt-dlp handles the search and download.

## Usage

### CLI

```bash
# Spotify playlist → wav zip (default)
python cli.py "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"

# Spotify playlist → mp3 zip at 320kbps
python cli.py "https://open.spotify.com/playlist/..." -f mp3 -q 320

# Custom output directory
python cli.py "https://open.spotify.com/album/..." -o ~/Music
```

### Web UI

```bash
python server.py
# Open http://localhost:8000
```

Paste a Spotify playlist URL, pick WAV or MP3, and hit Convert.

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
