"""Local-only static test server with enough backlog for parallel browser assets."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent.parent), **kwargs)

    def log_message(self, *_):
        pass


class Server(ThreadingHTTPServer):
    request_queue_size = 128


Server(('127.0.0.1', 4173), Handler).serve_forever()
