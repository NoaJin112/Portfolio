import json
import os
import shlex
import getpass

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

@ensure_csrf_cookie
def home(request):
    return render(request, 'pages/home.html')

def projects(request):
    return render(request, 'pages/projects.html')

def roadmap(request):
    return render(request, 'pages/roadmap.html')

def contact(request):
    return render(request, 'pages/contact.html')

def terminal(request):
    return render(request, 'terminal.html')


def _safe_join(base_dir, *paths):
    base_dir = os.path.abspath(base_dir)
    candidate = os.path.abspath(os.path.join(base_dir, *paths))
    if os.path.commonpath([base_dir, candidate]) != base_dir:
        return None
    return candidate


def _format_path(base_dir, target_path):
    base_dir = os.path.abspath(base_dir)
    target_path = os.path.abspath(target_path)
    if os.path.commonpath([base_dir, target_path]) != base_dir:
        return "~"
    rel = os.path.relpath(target_path, base_dir)
    if rel in (".", ""):
        return "~"
    return "~/" + rel.replace(os.sep, "/")


def _list_dir(path):
    try:
        entries = os.listdir(path)
    except OSError:
        return ""

    dirs = []
    files = []
    for name in entries:
        full_path = os.path.join(path, name)
        if os.path.isdir(full_path):
            dirs.append(name + "/")
        else:
            files.append(name)
    return "  ".join(sorted(dirs) + sorted(files))


@require_POST
def terminal_command(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        payload = {}

    command_line = (payload.get("command") or "").strip()
    base_dir = settings.BASE_DIR
    cwd_rel = request.session.get("terminal_cwd", "")
    cwd = _safe_join(base_dir, cwd_rel) or base_dir

    output = ""
    error = ""

    if not command_line:
        return JsonResponse(
            {
                "output": output,
                "error": error,
                "cwd": _format_path(base_dir, cwd),
            }
        )

    try:
        tokens = shlex.split(command_line, posix=True)
    except ValueError:
        tokens = []

    if not tokens:
        return JsonResponse(
            {
                "output": output,
                "error": "Invalid command",
                "cwd": _format_path(base_dir, cwd),
            },
            status=400,
        )

    command = tokens[0]
    args = tokens[1:]

    if command == "pwd":
        output = _format_path(base_dir, cwd)
    elif command == "whoami":
        output = getpass.getuser()
    elif command == "ls":
        target = cwd
        if args:
            target_candidate = _safe_join(cwd, args[0])
            if target_candidate and os.path.isdir(target_candidate):
                target = target_candidate
            else:
                error = f"ls: cannot access '{args[0]}': No such file or directory"
        if not error:
            output = _list_dir(target)
    elif command == "cd":
        target_arg = args[0] if args else ""
        if not target_arg or target_arg == "~":
            cwd = base_dir
        else:
            target_candidate = _safe_join(cwd, target_arg)
            if target_candidate and os.path.isdir(target_candidate):
                cwd = target_candidate
            else:
                error = f"cd: {target_arg}: No such file or directory"

        if not error:
            cwd_rel = os.path.relpath(cwd, base_dir)
            if cwd_rel == ".":
                cwd_rel = ""
            request.session["terminal_cwd"] = cwd_rel
    else:
        error = f"{command}: command not found"

    return JsonResponse(
        {
            "output": output,
            "error": error,
            "cwd": _format_path(base_dir, cwd),
        }
    )