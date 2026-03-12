"""Resolve Spotify playlist URLs into a list of track metadata."""

import re
from dataclasses import dataclass

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

from config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET


@dataclass
class Track:
    title: str
    artist: str
    album: str
    duration_s: int
    track_number: int

    @property
    def search_query(self) -> str:
        return f"{self.artist} - {self.title}"

    @property
    def safe_filename(self) -> str:
        name = f"{self.track_number:02d} - {self.artist} - {self.title}"
        return re.sub(r'[<>:"/\\|?*]', '_', name)


class SpotifyResolver:
    """Extracts track listings from Spotify playlist URLs."""

    PLAYLIST_PATTERN = re.compile(
        r"(?:https?://)?(?:open\.)?spotify\.com/playlist/([a-zA-Z0-9]+)"
    )
    ALBUM_PATTERN = re.compile(
        r"(?:https?://)?(?:open\.)?spotify\.com/album/([a-zA-Z0-9]+)"
    )

    def __init__(self):
        if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
            raise ValueError(
                "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set. "
                "Get credentials at https://developer.spotify.com/dashboard"
            )
        auth = SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
        )
        self.sp = spotipy.Spotify(auth_manager=auth)

    @classmethod
    def can_handle(cls, url: str) -> bool:
        return bool(cls.PLAYLIST_PATTERN.search(url) or cls.ALBUM_PATTERN.search(url))

    def resolve(self, url: str) -> tuple[str, list[Track]]:
        """Return (playlist_name, list_of_tracks) for a Spotify URL."""
        playlist_match = self.PLAYLIST_PATTERN.search(url)
        if playlist_match:
            return self._resolve_playlist(playlist_match.group(1))

        album_match = self.ALBUM_PATTERN.search(url)
        if album_match:
            return self._resolve_album(album_match.group(1))

        raise ValueError(f"Unrecognized Spotify URL: {url}")

    def _resolve_playlist(self, playlist_id: str) -> tuple[str, list[Track]]:
        playlist = self.sp.playlist(playlist_id)
        name = playlist["name"]
        tracks = []
        results = playlist["tracks"]
        idx = 1

        while results:
            for item in results["items"]:
                track = item.get("track")
                if not track:
                    continue
                tracks.append(Track(
                    title=track["name"],
                    artist=", ".join(a["name"] for a in track["artists"]),
                    album=track["album"]["name"],
                    duration_s=track["duration_ms"] // 1000,
                    track_number=idx,
                ))
                idx += 1
            results = self.sp.next(results) if results["next"] else None

        return name, tracks

    def _resolve_album(self, album_id: str) -> tuple[str, list[Track]]:
        album = self.sp.album(album_id)
        name = f"{album['artists'][0]['name']} - {album['name']}"
        tracks = []

        for item in album["tracks"]["items"]:
            tracks.append(Track(
                title=item["name"],
                artist=", ".join(a["name"] for a in item["artists"]),
                album=album["name"],
                duration_s=item["duration_ms"] // 1000,
                track_number=item["track_number"],
            ))

        return name, tracks
