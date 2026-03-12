"""Resolve SoundCloud set/playlist URLs into downloadable track info."""

import re
from dataclasses import dataclass

import yt_dlp


@dataclass
class SoundCloudTrack:
    title: str
    artist: str
    url: str
    duration_s: int
    track_number: int

    @property
    def search_query(self) -> str:
        return self.url  # SoundCloud tracks can be downloaded directly

    @property
    def safe_filename(self) -> str:
        name = f"{self.track_number:02d} - {self.artist} - {self.title}"
        return re.sub(r'[<>:"/\\|?*]', '_', name)


class SoundCloudResolver:
    """Extracts track listings from SoundCloud set/playlist URLs."""

    SOUNDCLOUD_PATTERN = re.compile(
        r"(?:https?://)?(?:www\.)?soundcloud\.com/.+"
    )

    @classmethod
    def can_handle(cls, url: str) -> bool:
        return bool(cls.SOUNDCLOUD_PATTERN.match(url))

    def resolve(self, url: str) -> tuple[str, list[SoundCloudTrack]]:
        """Return (set_name, list_of_tracks) for a SoundCloud URL."""
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            raise ValueError(f"Could not extract info from: {url}")

        # Single track
        if "entries" not in info:
            track = SoundCloudTrack(
                title=info.get("title", "Unknown"),
                artist=info.get("uploader", "Unknown"),
                url=info.get("webpage_url", url),
                duration_s=int(info.get("duration", 0)),
                track_number=1,
            )
            return track.title, [track]

        # Playlist / set
        set_name = info.get("title", "SoundCloud Set")
        tracks = []
        for idx, entry in enumerate(info["entries"], start=1):
            if not entry:
                continue
            tracks.append(SoundCloudTrack(
                title=entry.get("title", "Unknown"),
                artist=entry.get("uploader", "Unknown"),
                url=entry.get("webpage_url", entry.get("url", "")),
                duration_s=int(entry.get("duration", 0)),
                track_number=idx,
            ))

        return set_name, tracks
