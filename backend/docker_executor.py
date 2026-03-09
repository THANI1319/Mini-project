import subprocess
import time
import json
import tempfile
import os
import logging

logging.basicConfig(level=logging.DEBUG)

def ensure_image(image):
    for attempt in range(3):
        try:
            subprocess.run(["docker", "inspect", image], capture_output=True, check=True, timeout=30)
            return True
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            logging.info(f"Pulling image {image} (attempt {attempt+1})")
            pull = subprocess.run(["docker", "pull", image], capture_output=True, text=True, timeout=180)
            if pull.returncode == 0:
                return True
            time.sleep(2)
    return False

def execute_in_docker(code, image="python:3.9-slim", name_suffix="container"):
    MAX_EXECUTION_TIME = 30
    start_total = time.time()

    if not ensure_image(image):
        return {
            'execution_time': None,
            'cpu_usage': None,
            'memory_usage': None,
            'output': f"Failed to pull image {image}"
        }

    # Warm‑up: run a tiny script to ensure image is fully ready
    try:
        warmup_cmd = ["docker", "run", "--rm", image, "python", "-c", "print('warmup')"]
        subprocess.run(warmup_cmd, capture_output=True, timeout=30)
    except Exception as e:
        logging.warning(f"Warm‑up failed (ignoring): {e}")

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(code)
        code_file = f.name

    try:
        # Start container (increased timeout to 120 seconds)
        cmd = [
            "docker", "run", "-d",
            "--memory", "256m", "--cpus", "0.5",
            "--network", "none",
            "-v", f"{code_file}:/code.py:ro",
            image, "python", "/code.py"
        ]
        logging.debug(f"Running command: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, check=False)
            logging.debug(f"Return code: {result.returncode}, stdout: {result.stdout}, stderr: {result.stderr}")
            if result.returncode != 0:
                return {
                    'execution_time': None,
                    'cpu_usage': None,
                    'memory_usage': None,
                    'output': f"Failed to start container: {result.stderr}"
                }
        except subprocess.TimeoutExpired:
            logging.error("docker run command timed out after 120 seconds")
            return {
                'execution_time': None,
                'cpu_usage': None,
                'memory_usage': None,
                'output': "docker run command timed out after 120 seconds"
            }

        container_id = result.stdout.strip()
        logging.debug(f"Started container {container_id}")

        # Monitoring loop
        start_time = time.time()
        cpu_samples, memory_samples = [], []
        container_exited = False
        killed = False

        while time.time() - start_time < MAX_EXECUTION_TIME:
            inspect = subprocess.run(["docker", "inspect", container_id], capture_output=True, text=True, timeout=20)
            if inspect.returncode != 0:
                container_exited = True
                break
            data = json.loads(inspect.stdout)[0]
            if data['State']['Status'] != 'running':
                container_exited = True
                break

            stats_cmd = ["docker", "stats", "--no-stream", "--format", "{{json .}}", container_id]
            stats_result = subprocess.run(stats_cmd, capture_output=True, text=True, timeout=20)
            if stats_result.returncode == 0 and stats_result.stdout.strip():
                try:
                    stats = json.loads(stats_result.stdout.strip())
                    cpu_str = stats.get('CPUPerc', '0%').replace('%', '')
                    cpu_samples.append(float(cpu_str))

                    mem_usage_str = stats.get('MemUsage', '0 / 0').split('/')[0].strip()
                    if 'MiB' in mem_usage_str:
                        mem_val = float(mem_usage_str.replace('MiB', ''))
                    elif 'GiB' in mem_usage_str:
                        mem_val = float(mem_usage_str.replace('GiB', '')) * 1024
                    else:
                        mem_val = 0
                    memory_samples.append(mem_val)
                except (json.JSONDecodeError, ValueError, KeyError):
                    pass
            time.sleep(0.5)

        if not container_exited:
            logging.debug(f"Container {container_id} timed out, killing")
            kill_result = subprocess.run(["docker", "kill", container_id], capture_output=True, timeout=30)
            if kill_result.returncode != 0:
                logging.error(f"Failed to kill container: {kill_result.stderr}")
            killed = True

        execution_time = time.time() - start_time

        # Get logs
        try:
            logs_result = subprocess.run(["docker", "logs", container_id], capture_output=True, text=True, timeout=60)
            output = logs_result.stdout + logs_result.stderr
        except subprocess.TimeoutExpired:
            output = "Log retrieval timed out."
        if killed:
            output += f"\n[Execution timed out after {MAX_EXECUTION_TIME} seconds]"

        # Remove container
        subprocess.run(["docker", "rm", "-f", container_id], capture_output=True, timeout=30)

        avg_cpu = sum(cpu_samples) / len(cpu_samples) if cpu_samples else 0
        avg_memory = sum(memory_samples) / len(memory_samples) if memory_samples else 0

        return {
            'execution_time': round(execution_time, 3),
            'cpu_usage': round(avg_cpu, 2),
            'memory_usage': round(avg_memory, 2),
            'output': output
        }
    except subprocess.TimeoutExpired as e:
        logging.error(f"Subprocess timed out: {e}")
        return {
            'execution_time': None,
            'cpu_usage': None,
            'memory_usage': None,
            'output': f"Execution failed due to timeout: {e}"
        }
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return {
            'execution_time': None,
            'cpu_usage': None,
            'memory_usage': None,
            'output': f"Unexpected error: {e}"
        }
    finally:
        try:
            os.unlink(code_file)
        except OSError:
            pass