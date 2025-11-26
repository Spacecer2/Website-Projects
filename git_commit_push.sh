#!/bin/bash

# Function to display messages in green
print_info() {
    echo -e "\e[32m$1\e[0m"
}

# Function to display warnings in yellow
print_warning() {
    echo -e "\e[33m$1\e[0m"
}

# Function to display errors in red
print_error() {
    echo -e "\e[31m$1\e[0m"
}

# --- Check for Git repository ---
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "Error: Not inside a Git repository."
    exit 1
fi

print_info "--- Git Status ---"
git status

# --- Check if there are changes to commit ---
if git diff --quiet --exit-code && git diff --cached --quiet --exit-code; then
    print_warning "No changes detected. Nothing to commit."
    exit 0
fi

# --- Stage all changes ---
print_info "Staging all changes..."
git add .
if [ $? -ne 0 ]; then
    print_error "Failed to stage changes."
    exit 1
fi
print_info "All changes staged."

# --- Show staged changes ---
print_info "--- Staged Changes ---"
git diff --cached
print_info "--------------------"

# --- Prompt for commit message ---
COMMIT_MESSAGE=""
while [ -z "$COMMIT_MESSAGE" ]; do
    read -p "$(print_info 'Enter commit message: ')" COMMIT_MESSAGE
    if [ -z "$COMMIT_MESSAGE" ]; then
        print_warning "Commit message cannot be empty. Please enter a message."
    fi
done

# --- Confirm commit ---
read -p "$(print_info 'Confirm commit? (y/N): ')" CONFIRM_COMMIT
if [[ ! "$CONFIRM_COMMIT" =~ ^[Yy]$ ]]; then
    print_warning "Commit aborted."
    exit 0
fi

# --- Perform commit ---
print_info "Committing changes..."
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
    print_error "Failed to commit changes."
    exit 1
fi
print_info "Changes committed successfully."

# --- Check remote status ---
git remote -v > /dev/null 2>&1
if [ $? -ne 0 ]; then
    print_warning "No remote repository configured. Skipping push."
    exit 0
fi

# --- Prompt for push ---
read -p "$(print_info 'Do you want to push to remote? (y/N): ')" CONFIRM_PUSH
if [[ ! "$CONFIRM_PUSH" =~ ^[Yy]$ ]]; then
    print_warning "Push aborted."
    exit 0
fi

# --- Perform push ---
print_info "Pushing changes to remote..."
git push
if [ $? -ne 0 ]; then
    print_error "Failed to push changes."
    exit 1
fi
print_info "Changes pushed successfully."

print_info "Script finished."
