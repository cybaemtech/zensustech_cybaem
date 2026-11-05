import sys
from pathlib import Path

# Add backend directory to sys.path
_root_dir = Path(__file__).resolve().parent.parent
_backend_dir = str(_root_dir / "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Import the actual FastAPI application from backend/app/main.py
import importlib.util
_main_path = str(Path(_backend_dir) / "app" / "main.py")
_spec = importlib.util.spec_from_file_location("backend_app_main", _main_path)
_mod = importlib.util.module_from_spec(_spec)
sys.modules["backend_app_main"] = _mod
_spec.loader.exec_module(_mod)

app = _mod.app
