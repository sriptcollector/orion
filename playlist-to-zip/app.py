"""FastAPI web service for playlist-to-zip conversion."""

import shutil
import time
import threading
import uuid
from pathlib import Path

from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from config import DOWNLOAD_DIR
from resolvers.spotify import SpotifyResolver
from resolvers.soundcloud import SoundCloudResolver
from downloader.audio import AudioDownloader, DownloadProgress
from zipper import create_zip

app = FastAPI(title="Playlist to Zip", version="1.0.0")
templates = Jinja2Templates(directory="templates")

# Track active jobs: job_id -> {status, progress, zip_path, error, name, created_at}
jobs: dict[str, dict] = {}

# Auto-delete zip files and job entries older than 30 minutes
CLEANUP_MAX_AGE_S = 30 * 60


def _cleanup_loop():
    """Background thread that removes old downloads every 5 minutes."""
    while True:
        time.sleep(300)
        now = time.time()
        expired = [jid for jid, j in jobs.items()
                   if now - j.get("created_at", now) > CLEANUP_MAX_AGE_S
                   and j["status"] in ("done", "error")]
        for jid in expired:
            job = jobs.pop(jid, None)
            if job and job.get("zip_path"):
                Path(job["zip_path"]).unlink(missing_ok=True)


_cleanup_thread = threading.Thread(target=_cleanup_loop, daemon=True)
_cleanup_thread.start()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/convert")
async def convert(request: Request, background_tasks: BackgroundTasks):
    """Start a conversion job. Returns a job ID to poll for status."""
    body = await request.json()
    url = body.get("url", "").strip()
    audio_format = body.get("format", "mp3")
    audio_quality = body.get("quality", "192")

    if not url:
        return JSONResponse({"error": "URL is required"}, status_code=400)

    if audio_format not in ("mp3", "wav"):
        return JSONResponse({"error": "Format must be mp3 or wav"}, status_code=400)

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "resolving",
        "progress": None,
        "zip_path": None,
        "error": None,
        "name": "",
        "created_at": time.time(),
    }

    background_tasks.add_task(_run_job, job_id, url, audio_format, audio_quality)
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
async def status(job_id: str):
    """Poll the status of a conversion job."""
    job = jobs.get(job_id)
    if not job:
        return JSONResponse({"error": "Job not found"}, status_code=404)

    response = {
        "status": job["status"],
        "name": job["name"],
        "error": job["error"],
    }

    progress = job.get("progress")
    if progress:
        response["progress"] = {
            "total": progress.total,
            "completed": progress.completed,
            "failed": progress.failed,
            "current_track": progress.current_track,
        }

    if job["status"] == "done":
        response["download_url"] = f"/api/download/{job_id}"

    return response


@app.get("/api/download/{job_id}")
async def download(job_id: str):
    """Download the completed zip file."""
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        return JSONResponse({"error": "Job not ready"}, status_code=404)

    zip_path = Path(job["zip_path"])
    if not zip_path.exists():
        return JSONResponse({"error": "File not found"}, status_code=404)

    return FileResponse(
        path=zip_path,
        filename=zip_path.name,
        media_type="application/zip",
    )


def _run_job(job_id: str, url: str, audio_format: str, audio_quality: str):
    """Background task that resolves, downloads, and zips tracks."""
    job = jobs[job_id]
    job_dir = DOWNLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Resolve the URL to a track list
        job["status"] = "resolving"

        if SpotifyResolver.can_handle(url):
            resolver = SpotifyResolver()
            name, tracks = resolver.resolve(url)
        elif SoundCloudResolver.can_handle(url):
            resolver = SoundCloudResolver()
            name, tracks = resolver.resolve(url)
        else:
            job["status"] = "error"
            job["error"] = (
                "Unsupported URL. Provide a Spotify playlist/album URL "
                "or a SoundCloud set/track URL."
            )
            return

        job["name"] = name

        if not tracks:
            job["status"] = "error"
            job["error"] = "No tracks found at this URL."
            return

        # Download all tracks
        job["status"] = "downloading"
        progress = DownloadProgress(total=len(tracks))
        job["progress"] = progress

        downloader = AudioDownloader(
            output_dir=job_dir,
            audio_format=audio_format,
            audio_quality=audio_quality,
        )
        results = downloader.download_all(tracks, progress)

        successful_files = [r.path for r in results if r.success]

        if not successful_files:
            job["status"] = "error"
            job["error"] = "Failed to download any tracks."
            return

        # Create zip
        job["status"] = "zipping"
        zip_path = create_zip(successful_files, name, DOWNLOAD_DIR)
        job["zip_path"] = str(zip_path)

        # Clean up individual files
        shutil.rmtree(job_dir, ignore_errors=True)

        job["status"] = "done"

    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)
        shutil.rmtree(job_dir, ignore_errors=True)
