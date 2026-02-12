
import os
import sys
from pathlib import Path
from fnmatch import fnmatch
from datetime import datetime, timezone

# Mocking the context
repo_root = Path("/Volumes/4TB-BAD/HumanAI/CoDRAG")
exclude_globs = [
    "**/node_modules/**",
    "**/.git/**",
    "**/venv/**",
    "**/__pycache__/**",
    "**/dist/**",
    "**/build/**",
]
include_globs = [
    "**/*.py", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx",
    "**/*.go", "**/*.rs", "**/*.java",
    "**/*.c", "**/*.cpp", "**/*.cc", "**/*.h", "**/*.hpp",
]

def _to_posix(path: str) -> str:
    return path.replace("\\", "/")

def debug_trace_coverage():
    ignored_files = []
    
    print(f"Walking {repo_root}...")
    
    count = 0
    for root_dir, dirs, filenames in os.walk(repo_root):
        root_path = Path(root_dir)
        
        # Determine relative path for pruning logic simulation
        try:
            rel_root = _to_posix(str(root_path.relative_to(repo_root)))
        except ValueError:
            rel_root = ""

        for fname in filenames:
            file_path = root_path / fname
            if file_path.is_symlink():
                continue

            try:
                rel_path = _to_posix(str(file_path.relative_to(repo_root)))
            except ValueError:
                continue

            # Check if file matches include globs
            base = os.path.basename(rel_path)
            matches_any_include = False
            for g in include_globs:
                patterns = [g]
                if g.startswith("**/"):
                    patterns.append(g[3:])
                for p in patterns:
                    if fnmatch(rel_path, p) or fnmatch(base, p):
                        matches_any_include = True
                        break
                if matches_any_include:
                    break

            if not matches_any_include:
                continue

            # Check if excluded
            is_excluded = False
            for g in exclude_globs:
                patterns = [g]
                if g.startswith("**/"):
                    patterns.append(g[3:])
                for p in patterns:
                    if fnmatch(rel_path, p) or fnmatch(base, p):
                        is_excluded = True
                        break
                if is_excluded:
                    break

            if is_excluded:
                # REPLICATE THE CURRENT LOGIC IN trace.py
                path_parts = set(rel_path.split("/"))
                noisy_dirs = {
                    "node_modules", ".git", ".venv", "venv", "__pycache__", 
                    "dist", "build", ".next", ".DS_Store"
                }
                
                is_noisy_ext = any(rel_path.endswith(ext) for ext in [".pyc", ".pyo", ".pyd"])
                is_noisy_dir = not path_parts.isdisjoint(noisy_dirs)
                
                if not (is_noisy_dir or is_noisy_ext):
                    ignored_files.append(rel_path)
                    if len(ignored_files) < 10:
                        print(f"IGNORED (Clean): {rel_path}")
                else:
                    # It was noisy
                    pass
            
            count += 1
            if count % 10000 == 0:
                print(f"Scanned {count} files...")

    print(f"Total 'Clean' Ignored Files: {len(ignored_files)}")
    if len(ignored_files) > 0:
        print("First 20 ignored files:")
        for f in ignored_files[:20]:
            print(f" - {f}")

if __name__ == "__main__":
    debug_trace_coverage()
