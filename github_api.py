import requests
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = "https://api.github.com"

def get_repo_details(owner, repo_name):
    headers = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}
    
    try:
        response = requests.get(f"{GITHUB_API_URL}/repos/{owner}/{repo_name}", headers=headers)
        response.raise_for_status() # Raise an exception for HTTP errors
        
        repo = response.json()
        
        # Fetch README content
        readme_url = repo["contents_url"].replace("{+path}", "README.md")
        readme_response = requests.get(readme_url, headers=headers)
        readme_content = ""
        if readme_response.status_code == 200:
            # GitHub API returns base64 encoded content for files
            readme_content = requests.get(readme_response.json()["download_url"]).text
        
        # Extract live link if available from homepage or description
        live_link = repo.get("homepage")
        if not live_link and repo.get("description"):
            # Simple regex to find a URL in description, can be improved
            import re
            match = re.search(r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", repo.get("description"))
            if match:
                live_link = match.group(0)

        return {
            "id": repo["id"],
            "name": repo["name"],
            "title": repo["full_name"], # Using full_name as title
            "description": repo["description"] if repo["description"] else "No description provided.",
            "github_url": repo["html_url"],
            "live_link": live_link,
            "image": f"https://via.placeholder.com/300x200?text={repo['name']}" # Placeholder image
            # You can add more details here like languages, stars, topics etc.
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching repository {owner}/{repo_name}: {e}")
        return None

def get_user_projects(username, repo_names):
    projects_data = []
    for repo_name in repo_names:
        details = get_repo_details(username, repo_name)
        if details:
            projects_data.append(details)
    return projects_data

if __name__ == '__main__':
    # Example usage:
    # Set GITHUB_TOKEN environment variable or create a .env file with GITHUB_TOKEN="YOUR_TOKEN"
    owner_username = "Spacecer2" 
    target_repos = ["Small-Projects"] # Example list of repositories

    try:
        projects = get_user_projects(owner_username, target_repos)
        if projects:
            print(f"Found {len(projects)} projects for {owner_username}:")
            for project in projects:
                print(f"- {project['name']}: {project['github_url']}")
                if project['live_link']:
                    print(f"  Live: {project['live_link']}")
                print(f"  Description: {project['description']}")
                print(f"  Image: {project['image']}")
        else:
            print(f"No projects found for {owner_username} in the specified list.")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching projects: {e}")