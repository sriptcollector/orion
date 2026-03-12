"""Download audio files from SoundCloud using yt-dlp."""

import re
from pathlib import Path
from dataclasses import dataclass, field

import yt_dlp

from config import AUDIO_FORMAT, AUDIO_QUALITY


@dataclass
class DownloadResult:
    filename: str
    path: Path
    success: bool
    error: str = ""


@dataclass
class DownloadProgress:
    total: int = 0
    completed: int = 0
    failed: int = 0
    current_track: str = ""
    results: list[DownloadResult] = field(default_factory=list)

    @property
    def is_done(self) -> bool:
        return (self.completed + self.failed) >= self.total


class AudioDownloader:
    """Downloads audio from SoundCloud using yt-dlp search."""

    def __init__(self, output_dir: Path, audio_format: str = "", audio_quality: str = ""):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.audio_format = audio_format or AUDIO_FORMAT
        self.audio_quality = audio_quality or AUDIO_QUALITY

    def _ydl_opts(self, filename: str) -> dict:
        output_template = str(self.output_dir / f"{filename}.%(ext)s")

        postprocessors = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": self.audio_format,
        }]

        if self.audio_format == "mp3":
            postprocessors[0]["preferredquality"] = self.audio_quality

        return {
            "format": "bestaudio/best",
            "outtmpl": output_template,
            "postprocessors": postprocessors,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
        }

    def download_track(self, query: str, filename: str) -> DownloadResult:
        """Download a single track by searching SoundCloud.

        `query` can be a direct SoundCloud URL or a search string like
        "Artist - Title" which will be searched on SoundCloud.
        """
        safe_name = re.sub(r'[<>:"/\\|?*]', '_', filename)
        opts = self._ydl_opts(safe_name)

        # If query isn't a URL, search SoundCloud (not YouTube)
        if not query.startswith(("http://", "https://")):
            query = f"scsearch1:{query}"

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([query])

            # Find the downloaded file
            expected = self.output_dir / f"{safe_name}.{self.audio_format}"
            if expected.exists():
                return DownloadResult(
                    filename=expected.name,
                    path=expected,
                    success=True,
                )

            # Search for any file matching the name pattern
            for f in self.output_dir.iterdir():
                if f.stem == safe_name:
                    return DownloadResult(
                        filename=f.name, path=f, success=True
                    )

            return DownloadResult(
                filename=safe_name, path=expected, success=False,
                error="File not found after download",
            )

        except Exception as e:
            return DownloadResult(
                filename=safe_name,
                path=self.output_dir / safe_name,
                success=False,
                error=str(e),
            )

    def download_all(self, tracks: list, progress: DownloadProgress | None = None) -> list[DownloadResult]:
        """Download a list of tracks. Each track must have `search_query` and `safe_filename` attrs."""
        if progress is None:
            progress = DownloadProgress(total=len(tracks))
        else:
            progress.total = len(tracks)

        results = []
        for track in tracks:
            progress.current_track = getattr(track, "title", str(track))
            result = self.download_track(track.search_query, track.safe_filename)
            results.append(result)

            if result.success:
                progress.completed += 1
            else:
                progress.failed += 1
            progress.results = results

        return results
