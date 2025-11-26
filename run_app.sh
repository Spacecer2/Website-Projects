#!/bin/bash
echo "Activating virtual environment..."
source .venv/bin/activate
echo "Virtual environment activated."
echo "Installing dependencies..."
pip install -r requirements.txt
echo "Dependencies installed."
echo "Upgrading pip..."
pip install --upgrade pip
echo "Pip upgraded."
echo "Running the app.py script..."
export FLASK_RUN_PORT=5002
python3 app.py
echo "Script finished."