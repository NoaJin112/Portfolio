# Portfolio Website

A modern, responsive portfolio website built with Django and Tailwind CSS. This project showcases your professional work with multiple pages and features.

## Features

- **Home Page**: Introduction and overview
- **Projects Page**: Showcase of your work and projects
- **Roadmap Page**: Display of your development roadmap or future plans
- **Contact Page**: Contact information and messaging
- **Terminal Interface**: Interactive terminal page for engagement
- **Responsive Design**: Built with Tailwind CSS for mobile-first approach
- **Admin Dashboard**: Django admin interface for content management

## Tech Stack

### Backend
- **Django 4.2.3**: Python web framework
- **Python**: Server-side logic
- **SQLite**: Database (development)

### Frontend
- **Tailwind CSS 4.1.18**: Utility-first CSS framework
- **HTML5**: Markup
- **JavaScript**: Client-side interactivity

### Development Tools
- **Node.js**: JavaScript runtime for build tools
- **Tailwind CLI**: CSS compilation

## Project Structure

```
.
├── config/                 # Django project configuration
│   ├── settings.py        # Project settings
│   ├── urls.py            # Main URL routing
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
├── webapp/                # Main application
│   ├── views.py           # View functions
│   ├── urls.py            # App URL routing
│   ├── models.py          # Database models
│   ├── admin.py           # Admin configuration
│   └── migrations/        # Database migrations
├── templates/             # HTML templates
│   ├── base.html          # Base template
│   ├── navbar.html        # Navigation bar
│   ├── footer.html        # Footer component
│   ├── terminal.html      # Terminal page
│   └── pages/             # Page templates
│       ├── home.html
│       ├── projects.html
│       ├── roadmap.html
│       ├── contact.html
│       └── about.html
├── static/                # Static assets (source)
│   ├── css/
│   │   └── terminal.css
│   ├── js/
│   │   └── terminal.js
│   └── src/
│       └── input.css      # Tailwind source CSS
├── manage.py              # Django management script
├── package.json           # Node.js dependencies
├── tailwind.config.cjs    # Tailwind CSS configuration
└── db.sqlite3             # SQLite database
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- pip (Python package manager)
- npm or yarn (Node package manager)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/NoaJin112/Portfolio.git
   cd Portfolio
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  
   ```

3. **Install Python dependencies**
   ```bash
   pip install django
   ```

4. **Install Node dependencies**
   ```bash
   npm install
   ```

5. **Apply database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (for admin access)**
   ```bash
   python manage.py createsuperuser
   ```

## Running the Project

### Development Server

1. **Build Tailwind CSS**
   ```bash
   npm run tailwind:build
   ```
   
   Or watch for changes:
   ```bash
   npm run tailwind:watch
   ```

2. **Start Django development server**
   ```bash
   python manage.py runserver
   ```

The website will be available at `http://localhost:8000`

### Admin Panel

Access the Django admin panel at `http://localhost:8000/admin/` with your superuser credentials.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/projects/` | Projects showcase |
| `/roadmap/` | Development roadmap |
| `/contact/` | Contact page |
| `/terminal/` | Interactive terminal |
| `/admin/` | Django admin interface |

## Configuration

### Environment Variables

Create a `.env` file in the project root to override default settings:

```env
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

### Tailwind CSS

Customize Tailwind styles in `tailwind.config.cjs`. View the Tailwind documentation for available configuration options.

## Development Workflow

1. Make changes to templates or static files
2. If modifying CSS, run `npm run tailwind:watch` to auto-compile
3. Refresh the browser to see changes
4. Test in the Django admin if modifying models

## Building for Production

1. Set environment variables for production:
   ```bash
   DJANGO_DEBUG=False
   ```

2. Collect static files:
   ```bash
   python manage.py collectstatic
   ```
