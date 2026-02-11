import subprocess
import sys

try:
    result = subprocess.run(
        ["npm", "install"],
        cwd="/Volumes/4TB-BAD/HumanAI/CoDRAG",
        capture_output=True,
        text=True,
        check=True
    )
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except subprocess.CalledProcessError as e:
    print("EXIT CODE:", e.returncode)
    print("STDOUT:", e.stdout)
    print("STDERR:", e.stderr)
except Exception as e:
    print("EXCEPTION:", str(e))
