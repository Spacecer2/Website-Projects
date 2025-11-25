#!/bin/bash
echo "Activating virtual environment..."
source .venv/bin/activate
echo "Virtual environment activated."
pip install -r requirements.txt
echo "Dependencies installed."
echo "Upgrading pip..."
pip install --upgrade pip
echo "Pip upgraded."
echo "Running the app.py script..."
python app.py
echo "Script finished."