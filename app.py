from flask import Flask, jsonify
from flask_cors import CORS
from github_api import get_user_projects # Changed import
import requests # Import requests to catch its exceptions

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/api/projects', methods=['GET'])
def get_projects():
    github_username = "Spacecer2" # The GitHub username to fetch repositories from
    # Define a list of specific repository names you want to display
    # This list would typically come from configuration or a database in a real application
    target_repos = ["Small-Projects"] # User specified "Small-Projects"

    try:
        projects = get_user_projects(github_username, target_repos)
        if not projects:
            return jsonify({"message": "No projects found for the specified repositories."}), 404
        return jsonify(projects)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch repositories: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

if __name__ == '__main__':
    # It's recommended to run Flask apps with Gunicorn or a similar WSGI server in production.
    # For development, debug=True is fine.
    app.run(debug=True)
