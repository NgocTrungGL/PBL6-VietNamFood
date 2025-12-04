"""Flask application entrypoint.

This file now attempts to locate the sibling virtual environment (../.venv)
and prepend its site-packages to sys.path when run with a system Python that
does not have dependencies installed. This lets you simply run:

    python app.py

without manually activating the virtual environment, provided the .venv
directory exists at backend/.venv.

If packages are still missing, create the venv:
    python -m venv ../.venv
    ../.venv/Scripts/pip install -r ../requirements.txt
"""

import sys, os, pathlib

def _ensure_venv_packages():
    """Prepend .venv site-packages paths if core deps (flask/jwt) not found.

    This is a lightweight convenience; activation is still the recommended
    practice for development. Safe because only prepends existing directories.
    """
    try:
        import flask  # noqa: F401
        import jwt    # noqa: F401
        return  # All good; running inside environment with deps.
    except ModuleNotFoundError:
        pass

    project_root = pathlib.Path(__file__).resolve().parents[1]  # backend/food_api -> backend
    venv_root = project_root / '.venv'

    # Common Windows & POSIX site-packages locations inside venv
    candidates = []
    # Windows layout
    candidates.append(venv_root / 'Lib' / 'site-packages')
    # POSIX layout (in case of WSL or different tooling)
    candidates.append(venv_root / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages')

    injected = False
    for p in candidates:
        if p.exists() and str(p) not in sys.path:
            sys.path.insert(0, str(p))
            injected = True

    if injected:
        try:
            import flask  # noqa: F401
            import jwt    # noqa: F401
        except ModuleNotFoundError:
            # Provide a clearer hint for the user.
            print("[WARN] Dependencies still missing. Install with: .venv\\Scripts\\pip install -r ../requirements.txt")
    else:
        # Silent if no venv; user may be intentionally using global env.
        pass

_ensure_venv_packages()

from flask import Flask
from routes.admin_auth import admin_auth_bp
from routes.food_routes import food_bp
from routes.category_routes import category_bp
from routes.ai_predictions_routes import ai_predictions_bp
from routes.banners_routes import banners_bp
from routes.favorites_routes import favorites_bp
from routes.food_images_routes import food_images_bp
from routes.food_ingredients_routes import food_ingredients_bp
from routes.ingredients_routes import ingredients_bp
from routes.users_routes import users_bp
from routes.recipes_routes import recipes_bp
from routes.reviews_routes import reviews_bp
from flask_cors import CORS
from routes.regions_routes import regions_bp
from routes.nutrition_routes import nutrition_bp

app = Flask(__name__)

# Allow CORS for development frontend (Vite default port 5173); configurable via ENV
# FRONTEND_ORIGIN may be a single origin or a comma-separated list of origins.
frontend_origin_env = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173")
frontend_origins = [o.strip() for o in frontend_origin_env.split(',') if o.strip()]
if not frontend_origins:
    frontend_origins = ["http://localhost:5173"]
CORS(app, resources={r"/*": {"origins": frontend_origins}})

# Expose API under /api so frontend (Vite) can call e.g. /api/auth/login
app.register_blueprint(admin_auth_bp, url_prefix='/api')
app.register_blueprint(category_bp, url_prefix='/api')
app.register_blueprint(food_bp, url_prefix='/api')
app.register_blueprint(ai_predictions_bp, url_prefix='/api')
app.register_blueprint(banners_bp, url_prefix='/api')
app.register_blueprint(favorites_bp, url_prefix='/api')
app.register_blueprint(food_images_bp, url_prefix='/api')
app.register_blueprint(food_ingredients_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api')
app.register_blueprint(ingredients_bp, url_prefix='/api')
app.register_blueprint(recipes_bp, url_prefix='/api')
app.register_blueprint(reviews_bp, url_prefix='/api')
app.register_blueprint(regions_bp, url_prefix='/api')
app.register_blueprint(nutrition_bp, url_prefix='/api')

if __name__ == "__main__":
    # Host 0.0.0.0 để có thể truy cập từ máy khác trong LAN nếu cần
    # Print registered routes to help debugging 404s on /api/* endpoints
    try:
        rules = sorted(app.url_map.iter_rules(), key=lambda r: r.rule)
        print("Registered routes:")
        for r in rules:
            methods = ','.join(sorted(r.methods))
            print(f"{r.rule} -> endpoint={r.endpoint} methods={methods}")
    except Exception:
        pass

    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
