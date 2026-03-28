---
applyTo: "**/*.py,**/tools/**,**/src/**"
description: "Python infra/ops standards — applied to all .py files and tools/src paths"
---

# Python Standards (Infra / Ops)

## Script Entry Point

```python
#!/usr/bin/env python3
"""
deploy_service.py — Deploy or restart a named service.

Usage:
    python deploy_service.py --env prod --service myservice [--dry-run]
"""
from __future__ import annotations

import argparse
import logging
import sys

log = logging.getLogger(__name__)


def main() -> int:
    args = parse_args()
    setup_logging(args.verbose)
    try:
        run(args)
    except KeyboardInterrupt:
        log.warning("Interrupted by user")
        return 130
    except Exception as exc:          # pylint: disable=broad-except
        log.error("Fatal: %s", exc)
        if args.verbose:
            raise
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Argument Parsing

```python
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--env", required=True, choices=["dev", "staging", "prod"],
        help="Target environment",
    )
    parser.add_argument("--service", required=True, help="Service name")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args()
```

## Logging Setup

```python
def setup_logging(verbose: bool = False) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
```

## subprocess — Safe Shell Commands

```python
import subprocess
from typing import Sequence


def run_cmd(
    cmd: Sequence[str],
    *,
    dry_run: bool = False,
    capture: bool = False,
    check: bool = True,
) -> subprocess.CompletedProcess:
    log.debug("CMD: %s", " ".join(str(c) for c in cmd))
    if dry_run:
        log.info("[DRY-RUN] %s", " ".join(str(c) for c in cmd))
        return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")
    return subprocess.run(cmd, capture_output=capture, text=True, check=check)
```

Rules:
- **Always** pass commands as a list — never use `shell=True` with user input
- **Always** set `check=True` unless you explicitly handle non-zero exits
- Never log secret values even in debug mode

## Config Loading

```python
from dataclasses import dataclass, field
from pathlib import Path
import os, yaml


@dataclass
class ServiceConfig:
    name: str
    port: int = 8080
    log_level: str = "info"
    peers: list[str] = field(default_factory=list)

    @classmethod
    def load(cls, env: str, config_dir: Path) -> "ServiceConfig":
        cfg_file = config_dir / f"{env}.yml"
        if not cfg_file.exists():
            raise FileNotFoundError(f"Config not found: {cfg_file}")
        with cfg_file.open() as fh:
            raw = yaml.safe_load(fh)
        cfg = cls(**raw)
        if port_str := os.getenv("SERVICE_PORT"):   # 12-factor env override
            cfg.port = int(port_str)
        return cfg
```

## Atomic File Writes

```python
import tempfile
from pathlib import Path


def atomic_write(path: Path, content: str) -> None:
    """Write to temp file then rename — prevents partial writes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", dir=path.parent, delete=False, suffix=".tmp"
    ) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)
    tmp_path.replace(path)
    log.debug("Written: %s", path)
```

## Custom Exceptions

```python
class InfraError(RuntimeError):
    """Base for all infrastructure errors."""

class DeploymentError(InfraError): ...
class HealthCheckError(InfraError): ...
```

## HTTP Health Checks

```python
import time, httpx


def check_health(host: str, port: int, *, retries: int = 5, delay: float = 3.0) -> None:
    url = f"http://{host}:{port}/health"
    for attempt in range(1, retries + 1):
        try:
            httpx.get(url, timeout=5).raise_for_status()
            log.info("Health OK: %s", url)
            return
        except httpx.HTTPError as exc:
            log.warning("Attempt %d/%d: %s", attempt, retries, exc)
            if attempt < retries:
                time.sleep(delay)
    raise HealthCheckError(f"Not healthy at {url} after {retries} attempts")
```

## Remote Execution (Fabric)

```python
from fabric import ThreadingGroup


def deploy_to_hosts(hosts: list[str], service: str, dry_run: bool) -> None:
    if dry_run:
        log.info("[DRY-RUN] Would restart %s on %s", service, hosts)
        return
    group = ThreadingGroup(*hosts)
    results = group.run(f"systemctl restart {service}", hide=True, warn=True)
    for conn, result in results.items():
        (log.info if result.ok else log.error)(
            "%s %s", "OK" if result.ok else "FAILED", conn.host
        )
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files / modules | `snake_case.py` | `deploy_service.py` |
| Classes | `PascalCase` | `ServiceConfig`, `DeploymentError` |
| Functions / vars | `snake_case` | `run_cmd`, `dry_run` |
| Constants | `UPPER_SNAKE` | `DEFAULT_PORT`, `SSH_KEY` |
| Private | `_leading_underscore` | `_build_payload` |

## Tooling (always apply)

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.mypy]
strict = true
python_version = "3.11"
```

## Anti-patterns — never generate these

```python
# ✗ shell=True with user input — injection risk
subprocess.run(f"salt {target} state.apply", shell=True)
# ✓
subprocess.run(["salt", target, "state.apply"], check=True)

# ✗ Bare except
try:
    do_thing()
except:
    pass
# ✓
try:
    do_thing()
except subprocess.CalledProcessError as exc:
    log.error("Command failed: %s", exc)
    raise

# ✗ Mutable default argument
def deploy(hosts=[]):
# ✓
def deploy(hosts: list[str] | None = None) -> None:
    hosts = hosts or []

# ✗ Hardcoded secret
DB_PASS = "s3cr3t"
# ✓
DB_PASS = os.environ["DB_PASS"]   # fails loudly if missing

# ✗ Missing type hints on public function
def deploy(env, service):
# ✓
def deploy(env: str, service: str) -> None:
```
