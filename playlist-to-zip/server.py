#!/usr/bin/env python3
"""Run the playlist-to-zip web server."""

import uvicorn
from config import HOST, PORT

if __name__ == "__main__":
    uvicorn.run("app:app", host=HOST, port=PORT, reload=True)
