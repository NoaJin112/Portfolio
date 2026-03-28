# Infrastructure Copilot Instructions

This repository contains infrastructure code across four stacks: **Bash**, **SaltStack**, **Ansible**, and **Python**.

## Stack Detection — Always apply this before generating code

Identify the active stack from the file or request context, then follow the matching instructions file automatically.

| File signal | Stack |
|-------------|-------|
| `*.sh`, `*.bash`, `#!/*bash` shebang | Bash → see `.github/instructions/bash/standards.instructions.md` |
| `*.sls`, path contains `salt/`, `states/`, `pillar/` | SaltStack → see `.github/instructions/salt/standards.instructions.md` |
| `*.yml` inside `playbooks/`, `roles/`, `tasks/`, `handlers/`, `inventory/`, `group_vars/` | Ansible → see `.github/instructions/ansible/standards.instructions.md` |
| `*.py`, `#!/*python3` shebang, path contains `tools/` or `src/` | Python → see `.github/instructions/python/standards.instructions.md` |

If the active file matches more than one stack, apply all matching instruction files.

## Universal Rules (all stacks, always)

- **Idempotency**: every operation must be safe to run multiple times. Guard writes, use atomic patterns, check before mutating.
- **No plaintext secrets**: secrets go in pillars (Salt), ansible-vault (Ansible), env vars (Bash/Python). Never hardcode.
- **Dry-run first**: every script or playbook must support a preview mode. Always show the dry-run command in your plan.
- **Plan before writing**: for any non-trivial change, present a brief plan (files affected, risk, rollback) before generating code.
- **Environments**: always validate against `dev | staging | prod`. Never default to `prod`.

## File Layout

```
infra/
├── scripts/           # Bash
├── salt/              # SaltStack (states/, pillar/, top.sls)
├── ansible/           # Ansible (playbooks/, roles/, inventory/)
└── tools/             # Python (src/, pyproject.toml)
```
