---
applyTo: "**/playbooks/**,**/roles/**,**/tasks/**,**/handlers/**,**/inventory/**,**/group_vars/**,**/host_vars/**"
description: "Ansible standards — applied to playbooks, roles, inventory, and related YAML"
---

# Ansible Standards

## Playbook Structure

```yaml
# playbooks/deploy-myservice.yml
---
- name: Deploy myservice to app tier
  hosts: "{{ target | default('app') }}"
  become: true
  gather_facts: true

  vars_files:
    - "vars/common.yml"
    - "vars/{{ env }}.yml"

  pre_tasks:
    - name: Verify required variables are defined
      assert:
        that:
          - myservice_version is defined
          - myservice_port is defined
        fail_msg: "Required vars missing — check vars/{{ env }}.yml"

  roles:
    - role: common
    - role: myservice

  post_tasks:
    - name: Verify service is responding
      uri:
        url: "http://localhost:{{ myservice_port }}/health"
        status_code: 200
      retries: 5
      delay: 3
```

## Role Structure

```
roles/myservice/
├── defaults/main.yml       # safe fallback defaults — always overridable
├── vars/main.yml           # role-private constants — not for users
├── tasks/
│   ├── main.yml            # imports sub-task files only
│   ├── install.yml
│   ├── configure.yml
│   └── service.yml
├── handlers/main.yml
├── templates/myservice.conf.j2
├── files/
└── meta/main.yml
```

`tasks/main.yml` imports only:
```yaml
---
- import_tasks: install.yml
- import_tasks: configure.yml
- import_tasks: service.yml
```

## Variable Precedence (high → low)

```
extra vars (-e)  →  task vars  →  host_vars  →  group_vars  →  role/vars  →  role/defaults
```

- `defaults/main.yml` → safe fallbacks — always overridable
- `vars/main.yml` → role-internal, not for users to override
- Never put secrets in plain var files — use `ansible-vault`

## Task Patterns

```yaml
# Package install
- name: Install myservice package
  package:
    name: "myservice={{ myservice_version }}"
    state: present
  tags: [install, packages]

# Template with validate
- name: Deploy myservice configuration
  template:
    src: myservice.conf.j2
    dest: /etc/myservice/myservice.conf
    owner: root
    group: myservice
    mode: "0640"
    validate: myservice-cli validate-config %s
  notify: Restart myservice
  tags: [configure]

# Idempotent command
- name: Initialise database
  command: myservice-cli db migrate
  args:
    creates: /var/lib/myservice/.db-initialized
  tags: [configure]
```

## Handlers

```yaml
# handlers/main.yml
---
- name: Restart myservice
  service:
    name: myservice
    state: restarted

- name: Reload nginx
  service:
    name: nginx
    state: reloaded
```

Rules:
- Handlers run once at play end — use `flush_handlers` for immediate execution
- Name in title case: `Restart myservice`, `Reload nginx`

## Secrets with Vault

```bash
# Encrypt a value
ansible-vault encrypt_string 's3cr3tpassword' --name 'vault_db_password'
```

```yaml
# group_vars/all/vault.yml  (vault-encrypted file)
vault_db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  ...

# group_vars/all/vars.yml  (plain — references vault var)
db_password: "{{ vault_db_password }}"
```

## Inventory Structure

```ini
# inventory/production/hosts
[app]
web-01.prod.example.com
web-02.prod.example.com

[db]
db-01.prod.example.com

[prod:children]
app
db
```

```yaml
# inventory/production/group_vars/app/myservice.yml
myservice_version: "2.1.0"
myservice_port: 8080
myservice_tls_enabled: true
```

## Running Playbooks

```bash
# Always check first
ansible-playbook playbooks/deploy-myservice.yml \
  -e env=staging --check --diff

# Limit to one host
ansible-playbook playbooks/deploy-myservice.yml \
  -e env=prod --limit web-01.prod.example.com

# Tags only
ansible-playbook playbooks/deploy-myservice.yml \
  -e env=prod --tags configure,service

# With vault
ansible-playbook playbooks/deploy-myservice.yml \
  --vault-password-file ~/.ansible/vault-pass
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Playbooks | `verb-noun.yml` | `deploy-myservice.yml` |
| Roles | `noun` | `myservice`, `nginx` |
| Variables | `<role>_<name>` | `myservice_port` |
| Tags | `lowercase` | `install`, `configure` |
| Handlers | `Verb noun` | `Restart myservice` |

## Anti-patterns — never generate these

```yaml
# ✗ Hardcoded secret
db_password: s3cr3tpassword
# ✓
db_password: "{{ vault_db_password }}"

# ✗ Shell when a module exists
- shell: apt-get install -y nginx
# ✓
- package:
    name: nginx
    state: present

# ✗ Non-idempotent command
- command: myservice-cli init
# ✓
- command: myservice-cli init
  args:
    creates: /var/lib/myservice/.initialized

- command: read-only-check
  changed_when: true
  changed_when: false
```
