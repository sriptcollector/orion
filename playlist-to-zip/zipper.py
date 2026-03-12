"""Package downloaded audio files into a zip archive."""

import re
import zipfile
from pathlib import Path


def create_zip(files: list[Path], zip_name: str, output_dir: Path) -> Path:
    """Create a zip archive from a list of audio file paths.

    Returns the path to the created zip file.
    """
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', zip_name)
    zip_path = output_dir / f"{safe_name}.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in files:
            if file_path.exists():
                zf.write(file_path, arcname=file_path.name)

    return zip_path
