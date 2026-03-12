#!/usr/bin/env python3
"""CLI interface for playlist-to-zip conversion."""

import argparse
import shutil
import sys
from pathlib import Path

from resolvers.spotify import SpotifyResolver
from resolvers.soundcloud import SoundCloudResolver
from downloader.audio import AudioDownloader, DownloadProgress
from zipper import create_zip


def main():
    parser = argparse.ArgumentParser(
        description="Convert Spotify playlists and SoundCloud sets to zip files of audio."
    )
    parser.add_argument("url", help="Spotify playlist/album URL or SoundCloud set/track URL")
    parser.add_argument(
        "-f", "--format", choices=["wav", "mp3"], default="wav",
        help="Audio format (default: wav)",
    )
    parser.add_argument(
        "-q", "--quality", default="192",
        help="Audio quality/bitrate for mp3 in kbps (default: 192)",
    )
    parser.add_argument(
        "-o", "--output", default=".",
        help="Output directory for the zip file (default: current directory)",
    )
    args = parser.parse_args()

    url = args.url.strip()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Resolve
    print(f"Resolving URL: {url}")

    if SpotifyResolver.can_handle(url):
        resolver = SpotifyResolver()
        name, tracks = resolver.resolve(url)
    elif SoundCloudResolver.can_handle(url):
        resolver = SoundCloudResolver()
        name, tracks = resolver.resolve(url)
    else:
        print("Error: Unsupported URL. Provide a Spotify or SoundCloud URL.", file=sys.stderr)
        sys.exit(1)

    print(f"Found: {name} ({len(tracks)} tracks)")

    if not tracks:
        print("No tracks found.", file=sys.stderr)
        sys.exit(1)

    # Download
    temp_dir = output_dir / f".playlist_dl_{name[:20]}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    progress = DownloadProgress(total=len(tracks))
    downloader = AudioDownloader(
        output_dir=temp_dir,
        audio_format=args.format,
        audio_quality=args.quality,
    )

    print(f"\nDownloading {len(tracks)} tracks as {args.format.upper()}...\n")

    results = []
    for i, track in enumerate(tracks, 1):
        title = getattr(track, "title", str(track))
        print(f"  [{i}/{len(tracks)}] {title}...", end=" ", flush=True)
        result = downloader.download_track(track.search_query, track.safe_filename)
        results.append(result)
        if result.success:
            print("OK")
        else:
            print(f"FAILED ({result.error})")

    successful = [r for r in results if r.success]
    failed = [r for r in results if not r.success]

    print(f"\n{len(successful)} downloaded, {len(failed)} failed")

    if not successful:
        print("No tracks downloaded successfully.", file=sys.stderr)
        shutil.rmtree(temp_dir, ignore_errors=True)
        sys.exit(1)

    # Zip
    print(f"Creating zip archive...")
    zip_path = create_zip(
        [r.path for r in successful],
        name,
        output_dir,
    )

    # Clean up temp files
    shutil.rmtree(temp_dir, ignore_errors=True)

    print(f"Done! Saved to: {zip_path}")


if __name__ == "__main__":
    main()
