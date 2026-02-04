from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('projects/', views.projects, name='projects'),
    path('roadmap/', views.roadmap, name='roadmap'),
    path('contact/', views.contact, name='contact'),
    path('terminal/', views.terminal, name='terminal'),
]
