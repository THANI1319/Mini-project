import os
import sqlite3
import traceback
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from docker_executor import execute_in_docker

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

DATABASE = os.path.join(os.path.dirname(__file__), 'database', 'performance.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# ==================== Routes ====================
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/live')
def live():
    return send_from_directory('../frontend', 'live.html')

@app.route('/results')
def results():
    return send_from_directory('../frontend', 'results.html')

@app.route('/system')
def system():
    return send_from_directory('../frontend', 'system.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

@app.route('/api/data')
def get_data():
    conn = get_db_connection()
    rows = conn.execute('SELECT technique, metric, value, unit FROM performance').fetchall()
    conn.close()
    result = {}
    for row in rows:
        metric = row['metric']
        if metric not in result:
            result[metric] = []
        result[metric].append({
            'technique': row['technique'],
            'value': row['value'],
            'unit': row['unit']
        })
    return jsonify(result)

# ==================== Live Benchmark API ====================
@app.route('/api/execute', methods=['POST'])
def execute():
    data = request.get_json()
    code = data.get('code', '')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    try:
        # Run sequentially to avoid CPU contention
        container_result = execute_in_docker(code, "python:3.9-slim", "container")
        vm_result = execute_in_docker(code, "python:3.9", "vm")

        comparison = {
            'startup_time': {
                'vm': vm_result['execution_time'],
                'container': container_result['execution_time'],
                'unit': 'seconds'
            },
            'cpu_usage': {
                'vm': vm_result['cpu_usage'],
                'container': container_result['cpu_usage'],
                'unit': '%'
            },
            'memory_usage': {
                'vm': vm_result['memory_usage'],
                'container': container_result['memory_usage'],
                'unit': 'MB'
            }
        }

        return jsonify({
            'docker': container_result,
            'vm': vm_result,
            'comparison': comparison
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)