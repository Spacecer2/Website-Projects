# -*- coding: utf-8 -*-
"""
Main Flask application file for the portfolio website.
"""
print("Executing app.py...")
import sys
try:
    # --- IMPORTS ---
    print("Importing modules...")
    import os
    from dotenv import load_dotenv
    from flask import Flask, jsonify, send_from_directory, request
    from flask_caching import Cache
    from flask_cors import CORS
    from github_api import get_paginated_user_repos, get_repo_details
    print("Modules imported.")

    # --- INITIALIZATION ---
    print("Loading environment variables...")
    load_dotenv()
    print("Environment variables loaded.")

    # --- CONFIGURATION ---
    print("Configuring Flask app...")
    app = Flask(__name__, static_folder='.', static_url_path='')
    CORS(app)
    print("Flask app configured.")

    # Configure Cache
    print("Configuring cache...")
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    cache = Cache(app)
    print("Cache configured.")

    # --- DUMMY DATA ---
    LOCAL_PROJECTS = [
        {
            "id": 1,
            "name": "Local Project 1",
            "title": "Local/Project1",
            "description": "This is a description for local project 1. It showcases some amazing features and is a great example of my work.",
            "github_url": "https://github.com/Local/Project1",
            "live_link": "https://local-project1.com",
            "image": None,
            "stars": 10,
            "language": "Python",
            "readme": "# Local Project 1 README\n\nThis is the **README** for Local Project 1.\n\n## Features\n- Feature A\n- Feature B\n\n## Installation\n```bash\npip install local-project1\n```\n"
        },
        {
            "id": 2,
            "name": "Local Project 2",
            "title": "Local/Project2",
            "description": "Another fantastic local project. This one is built with a different tech stack and solves a unique problem.",
            "github_url": "https://github.com/Local/Project2",
            "live_link": None,
            "image": None,
            "stars": 5,
            "language": "JavaScript",
            "readme": "# Local Project 2 README\n\nWelcome to Local Project 2!\n\nThis project focuses on:\n*   Web development\n*   API integration\n\nStay tuned for updates!\n"
        }
    ]

    # --- ROUTES ---
    @app.route('/')
    def index():
        """Serves the main HTML file."""
        return send_from_directory(os.getcwd(), 'main.html')


    @app.route('/<path:filename>')
    def static_files(filename):
        """Serves static files from the root directory."""
        return send_from_directory(os.getcwd(), filename)


    @app.route('/api/projects', methods=['GET'])
    def get_projects():
        """
        Fetches a list of projects.

        If the 'local' query parameter is set to 'true', it returns a list of local projects.
        Otherwise, it fetches the projects from the GitHub API.
        """
        if request.args.get('local') == 'true':
            return jsonify(LOCAL_PROJECTS)

        github_username = request.args.get('username', 'Spacecer2')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 30, type=int)

        projects = cache.memoize(timeout=300)(get_paginated_user_repos)(github_username, page, per_page)

        if not projects:
            return jsonify({"message": "No projects found for the specified user or an error occurred."}),

        return jsonify(projects)


    @app.route('/api/project/<owner>/<repo_name>', methods=['GET'])
    @cache.cached(timeout=300)
    def get_project_details(owner, repo_name):
        """
        Fetches the details of a specific project.

        If the owner is 'Local', it returns the details of a local project.
        Otherwise, it fetches the project details from the GitHub API.
        """
        if owner == 'Local':
            project = next((p for p in LOCAL_PROJECTS if p['name'].replace(' ', '') == repo_name), None)
            if project:
                return jsonify(project)

        project_details = get_repo_details(owner, repo_name)
        if project_details:
            return jsonify(project_details)

        return jsonify({"message": "Project not found or an error occurred."}), 404


    # --- MAIN ---
    if __name__ == '__main__':
        """
        Runs the Flask application.
        """
        print("Starting Flask application...")
        # Run on 0.0.0.0 so it's reachable from other devices if needed
        app.run(host='127.0.0.1', port=5001, debug=True)
        print("Flask application stopped.")

except Exception as e:
    print(f"An error occurred: {e}", file=sys.stderr)
    sys.exit(1)