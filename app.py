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
    app.config['CACHE_DEFAULT_TIMEOUT'] = 600
    cache = Cache(app)
    print("Cache configured.")



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


        github_username = request.args.get('username', 'Spacecer2')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 30, type=int)

        projects = cache.memoize(timeout=300)(get_paginated_user_repos)(github_username, page, per_page)

        if not projects:
            return jsonify({"message": "No projects found for the specified user or an error occurred."}), 404

        # Aggregate language data
        aggregated_languages = {}
        for project in projects:
            for lang, bytes_count in project.get('languages', {}).items():
                aggregated_languages[lang] = aggregated_languages.get(lang, 0) + bytes_count
        
        return jsonify({"projects": projects, "aggregated_languages": aggregated_languages})


    @app.route('/api/project/<owner>/<repo_name>', methods=['GET'])
    @cache.cached(timeout=300)
    def get_project_details(owner, repo_name):
        """
        Fetches the details of a specific project.

        If the owner is 'Local', it returns the details of a local project.
        Otherwise, it fetches the project details from the GitHub API.
        """


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
        app.run(host='0.0.0.0', port=5001, debug=False)
        print("Flask application stopped.")

except Exception as e:
    print(f"An error occurred: {e}", file=sys.stderr)
    sys.exit(1)