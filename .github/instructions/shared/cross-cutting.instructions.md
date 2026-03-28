---
applyTo: "infra/**,scripts/**,salt/**,ansible/**,tools/**"
description: "Shared infra rules applied to all infrastructure files"
---

# Shared Infrastructure Rules

## Idempotency

- **Bash**: guard with `[[ -f ... ]] ||` and atomic writes via `mktemp` + `mv`
- **Salt**: use `unless`/`onlyif` on `cmd.run`; prefer declarative state modules
- **Ansible**: use modules not `shell`; add `creates`/`removes`/`when` guards
- **Python**: check before mutating; use `atomic_write()`; never blindly overwrite

## Secrets

- **Bash**: `VAR=$(vault kv get -field=x secret/path)` — never `VAR="hardcoded"`
- **Salt**: `{{ salt['pillar.get']('service:secret') }}` — never inline in states
- **Ansible**: `ansible-vault` encrypted vars, always referenced via `vault_` prefix
- **Python**: `os.environ["SECRET"]` — never string literals; never log secret values

## Dry-Run Pattern

Every piece of infra code you write must have a safe preview path:

```bash
# Bash
run() { [[ "$DRY_RUN" == true ]] && echo "[DRY-RUN] $*" || "$@"; }

# Salt
salt '*' state.apply myservice test=True

# Ansible
ansible-playbook playbook.yml --check --diff

# Python
run_cmd([...], dry_run=args.dry_run)
```

## Change Workflow

```
1. Plan   → state files affected, risk level, rollback path
2. Preview → dry-run / --check on staging
3. Review  → required before prod
4. Apply   → run with full logging
5. Verify  → health checks confirm expected state
```

## Rollback Patterns

```bash
# Bash — capture before changing
OLD=$(current_version)
deploy "$NEW" || { warn "Rolling back"; deploy "$OLD"; exit 1; }
```

```python
# Python — snapshot before mutating
snapshot = read_current_config(host)
try:
    apply_new_config(host, new_config); verify_health(host)
except (DeploymentError, HealthCheckError):
    apply_new_config(host, snapshot); raise
```

## Testing Minimum Bar

| Stack | Framework | Minimum |
|-------|-----------|---------|
| Bash | `bats` | Smoke + dry-run test per script |
| Salt | `pytest-salt-factories` | Idempotency: apply twice, 0 changes second run |
| Ansible | `molecule` + `testinfra` | Convergence + idempotency per role |
| Python | `pytest` | ≥ 80 % coverage; `pytest-subprocess` for shell calls |
