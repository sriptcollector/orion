# Playlist to Zip

Convert Spotify playlists and SoundCloud DJ sets into zip files of MP3 or WAV audio.

## How it works

1. **Spotify** — Uses the Spotify API to read playlist/album track listings, then searches YouTube for each track and downloads the audio via yt-dlp
2. **SoundCloud** — Downloads tracks directly from SoundCloud URLs using yt-dlp

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

To use Spotify playlists, create a Spotify app at https://developer.spotify.com/dashboard and set your credentials:

```bash
cp .env.example .env
# Edit .env with your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
```

SoundCloud URLs work without any credentials.

## Usage

### CLI

```bash
# Spotify playlist → mp3 zip
python cli.py "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"

# SoundCloud set → wav zip
python cli.py "https://soundcloud.com/artist/sets/mix-name" -f wav

# Custom output directory and quality
python cli.py "https://open.spotify.com/album/..." -f mp3 -q 320 -o ~/Music
```

### Web UI

```bash
python server.py
# Open http://localhost:8000
```

Paste a URL, pick format/quality, and hit Convert. The browser will poll for progress and offer a download link when done.

### API

```bash
# Start a job
curl -X POST http://localhost:8000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/playlist/...", "format": "mp3", "quality": "192"}'
# Returns: {"job_id": "abc123"}

# Check status
curl http://localhost:8000/api/status/abc123

# Download when done
curl -O http://localhost:8000/api/download/abc123
```
