import sys
from pathlib import Path

# Add backend directory to sys.path so that all imports like `from app.api...` resolve correctly
_root_dir = Path(__file__).resolve().parent.parent
_backend_dir = str(_root_dir / "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

_backend_app_dir = str(_root_dir / "backend" / "app")
__path__.append(_backend_app_dir)

