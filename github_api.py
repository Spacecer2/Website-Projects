# -*- coding: utf-8 -*-
"""
This module provides functions to interact with the GitHub API.
"""

# --- IMPORTS ---
import os
import re
import base64
import requests
from dotenv import load_dotenv

# --- INITIALIZATION ---
load_dotenv()  # Load environment variables from .env file

# --- CONSTANTS ---
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = "https://api.github.com"

# --- HELPER FUNCTIONS ---
def _default_headers():
    """
    Returns the default headers for the GitHub API requests.
    """
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


def _get_readme_content(owner, repo_name):
    """
    Fetches and decodes the README content for a given repository.
    """
    headers = _default_headers()
    try:
        readme_resp = requests.get(f"{GITHUB_API_URL}/repos/{owner}/{repo_name}/readme", headers=headers)
        if readme_resp.status_code == 200:
            rd = readme_resp.json()
            content = rd.get("content")
            encoding = rd.get("encoding")
            if content and encoding == "base64":
                return base64.b64decode(content).decode("utf-8", errors="replace")
    except requests.exceptions.RequestException:
        pass
    return ""


def _get_repo_languages(owner, repo_name):
    """
    Fetches language statistics for a given repository.
    Returns a dictionary of {language_name: bytes_of_code}.
    """
    headers = _default_headers()
    try:
        response = requests.get(f"{GITHUB_API_URL}/repos/{owner}/{repo_name}/languages", headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching languages for {owner}/{repo_name}: {e}")
        return {}


def _extract_live_link(repo):
    """
    Extracts the live link from the repository's homepage or description.
    """
    live_link = repo.get("homepage")
    if not live_link and repo.get("description"):
        match = re.search(
            r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+",
            repo.get("description"),
        )
        if match:
            live_link = match.group(0)
    return live_link


# --- API FUNCTIONS ---
def get_repo_details(owner, repo_name):
    """
    Fetches the details of a specific repository.
    """
    headers = _default_headers()
    try:
        response = requests.get(f"{GITHUB_API_URL}/repos/{owner}/{repo_name}", headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors

        repo = response.json()
        readme_content = _get_readme_content(owner, repo_name)
        live_link = _extract_live_link(repo)

        return {
            "id": repo.get("id"),
            "name": repo.get("name"),
            "title": repo.get("full_name"),
            "description": repo.get("description") or "No description provided.",
            "github_url": repo.get("html_url"),
            "live_link": live_link,
            "image": f"https://via.placeholder.com/300x200?text={repo.get('name')}",  # Placeholder image
            "readme": readme_content,
            "stars": repo.get("stargazers_count", 0),
            "language": repo.get("language"),
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching repository {owner}/{repo_name}: {e}")
        return None


def get_user_projects(username, repo_names):
    """
    Fetches the details of a list of repositories for a given user.
    """
    projects_data = []
    for repo_name in repo_names:
        details = get_repo_details(username, repo_name)
        if details:
            projects_data.append(details)
    return projects_data


def get_paginated_user_repos(username, page=1, per_page=30):
    """
    Fetches a paginated list of repositories for a given user.
    """
    headers = _default_headers()
    params = {'page': page, 'per_page': per_page, 'type': 'owner'}
    try:
        response = requests.get(f"{GITHUB_API_URL}/users/{username}/repos", headers=headers, params=params)
        response.raise_for_status()
        repos = response.json()

        projects = []
        for r in repos:
            owner = r.get('owner', {}).get('login')
            repo_name = r.get('name')
            
            languages = {}
            if owner and repo_name:
                languages = _get_repo_languages(owner, repo_name)

            projects.append(
                {
                    "id": r.get('id'),
                    "name": r.get('name'),
                    "title": r.get('full_name'),
                    "description": r.get('description') or 'No description provided.',
                    "github_url": r.get('html_url'),
                    "live_link": r.get('homepage'),
                    "image": f"https://via.placeholder.com/300x200?text={r.get('name')}",
                    "stars": r.get('stargazers_count', 0),
                    "language": r.get('language'), # Primary language
                    "languages": languages, # Detailed language breakdown
                }
            )
        return projects
    except requests.exceptions.RequestException as e:
        print(f"Error fetching paginated repos for {username}: {e}")
        return []


# --- MAIN ---
if __name__ == '__main__':
    """
    Example usage and quick verification of the GitHub API functions.
    """
    owner_username = "Spacecer2"
    target_repos = ["Small-Projects"]

    print(f"GITHUB_TOKEN present: {'Yes' if GITHUB_TOKEN else 'No'}")

    try:
        headers = _default_headers()
        rate_limit_resp = requests.get(f"{GITHUB_API_URL}/rate_limit", headers=headers)
        if rate_limit_resp.ok:
            rate_limit = rate_limit_resp.json().get("resources", {}).get("core", {})
            remaining = rate_limit.get("remaining")
            limit = rate_limit.get("limit")
            reset = rate_limit.get("reset")
            print(f"Rate limit: {remaining}/{limit} remaining. Reset timestamp: {reset}")
        else:
            print("Could not fetch rate limit (unauthenticated or API error).")
    except requests.exceptions.RequestException as e:
        print(f"Error checking rate limit: {e}")

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
                print(f"  Stars: {project.get('stars')}")
        else:
            print(f"No projects found for {owner_username} in the specified list.")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching projects: {e}")
