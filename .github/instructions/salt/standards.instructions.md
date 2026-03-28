---
applyTo: "**/*.sls,**/salt/**,**/states/**,**/pillar/**"
description: "SaltStack standards — applied to all .sls files and salt/ paths"
---

# SaltStack Standards

## State File Structure

```yaml
# states/myservice/init.sls
{% set cfg = salt['pillar.get']('myservice', {}) %}
{% set env = salt['grains.get']('environment', 'dev') %}

myservice_package:
  pkg.installed:
    - name: {{ cfg.get('package', 'myservice') }}
    - version: {{ cfg.get('version', 'latest') }}

myservice_config:
  file.managed:
    - name: /etc/myservice/myservice.conf
    - source: salt://myservice/files/myservice.conf.j2
    - template: jinja
    - user: root
    - group: myservice
    - mode: '0640'
    - context:
        env: {{ env }}
        cfg: {{ cfg | tojson }}
    - require:
      - pkg: myservice_package

myservice_service:
  service.running:
    - name: myservice
    - enable: True
    - watch:
      - file: myservice_config
```

## Pillar Structure

```yaml
# pillar/myservice/init.sls
myservice:
  package: myservice
  version: "2.1.0"
  port: 8080
  log_level: info
  settings:
    max_connections: 100
    timeout: 30
```

Rules:
- Always use `pillar.get` with a safe default — never hardcode values in states
- One pillar file per service: `pillar/<service>/init.sls`
- Secrets live in pillars only, never in state files

## Jinja Template Pattern

```jinja
{# states/myservice/files/myservice.conf.j2 #}
{% set port = salt['pillar.get']('myservice:port') %}
{% if not port %}{{ raise('Pillar myservice:port is required') }}{% endif %}

{% set env = salt['grains.get']('environment', 'dev') %}
log_level = {% if env == 'prod' %}warn{% else %}debug{% endif %}

{% for peer in salt['pillar.get']('myservice:peers', []) %}
peer = {{ peer }}
{% endfor %}
```

## Top File Pattern

```yaml
# top.sls
base:
  '*':
    - base.packages
    - base.users

  'G@role:app':
    - myservice

  'G@role:db':
    - postgresql

  'G@environment:prod':
    - hardening
```

## Requisite Reference

| Requisite | Use when |
|-----------|----------|
| `require` | This must succeed before me |
| `watch` | Re-run me when this changes |
| `onchanges` | Run me only if this changed |
| `unless` | Skip if command exits 0 |
| `onlyif` | Run only if command exits 0 |

```yaml
# Idempotent cmd.run
myservice_db_init:
  cmd.run:
    - name: myservice-cli db migrate
    - unless: myservice-cli db status | grep -q 'up-to-date'
    - require:
      - service: myservice_service
```

## Orchestration

```yaml
# orch/deploy-myservice.sls
deploy_app:
  salt.state:
    - tgt: 'G@role:app'
    - tgt_type: compound
    - sls: myservice
    - concurrent: False

reload_lb:
  salt.state:
    - tgt: 'G@role:loadbalancer'
    - tgt_type: compound
    - sls: haproxy.reload
    - require:
      - salt: deploy_app
```

## CLI — Always test=True First

```bash
# Dry run before applying
salt '*' state.apply myservice test=True

# Targeted apply after review
salt -G 'role:app' state.apply myservice
salt -E 'web-[0-9]+' state.apply nginx
salt -L 'web-01,web-02' state.apply nginx

# Orchestration
salt-run state.orch orch.deploy-myservice
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| State IDs | `service_resource` | `nginx_config`, `app_service` |
| State files | `service/init.sls` | `myservice/init.sls` |
| Pillar keys | `snake_case` | `log_level`, `max_connections` |
| Grain keys | `snake_case` | `role`, `datacenter`, `environment` |

## Anti-patterns — never generate these

```yaml
# ✗ Hardcoded secret in state
db_password: s3cr3t
# ✓
db_password: {{ salt['pillar.get']('myservice:db:password') | yaml_encode }}

# ✗ Broad untested apply
salt '*' state.highstate
# ✓ Test first
salt -G 'role:app' state.highstate test=True

# ✗ Service with no ordering guarantee
myservice_service:
  service.running: []
# ✓
myservice_service:
  service.running:
    - name: myservice
    - require:
      - file: myservice_config

# ✗ cmd.run without idempotency guard
myservice_init:
  cmd.run:
    - name: myservice-cli init
# ✓
    - unless: test -f /var/lib/myservice/.initialized
```
