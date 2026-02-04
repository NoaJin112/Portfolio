from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie


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