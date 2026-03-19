#!/bin/bash

# This script runs the Streamlit app using the virtual environment with Python 3.10

# Activate the virtual environment
echo "Activating Python 3.11 virtual environment..."
source venv/bin/activate

# Run Streamlit using Python from the virtual environment with a specific port
# Check if we should run in dev mode
if [ "$1" == "--dev" ]; then
  echo "Starting app in DEVELOPMENT mode on port 8503 with Python 3.11..."
  export METRIC_APP_DEV_MODE=true
  # Load environment variables from .env file in dev mode
  if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
  fi
  python -m streamlit run app.py --server.port=8503
else
  echo "Starting app in PRODUCTION mode on port 8503 with Python 3.11..."
  export METRIC_APP_DEV_MODE=false
  python -m streamlit run app.py --server.port=8503
fi

# Deactivate the virtual environment when done
# (This will only execute if the user manually exits with Ctrl+C)
echo "Deactivating virtual environment..."
deactivate
