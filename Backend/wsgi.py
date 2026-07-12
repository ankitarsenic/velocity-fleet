from app import create_app
from app.scheduler import init_scheduler
import os

app = create_app()

# Initialize scheduler only on the main process to avoid running twice in debug mode
if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
    init_scheduler(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
