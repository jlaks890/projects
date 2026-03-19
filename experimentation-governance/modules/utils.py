"""Utility functions and configuration values for the Experimentation Dev app.

This module provides:
- Default configuration values
- Session state initialization
- Helper functions used across the app
"""

import os
import streamlit as st
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Function to load projects from project mapping
def load_projects_from_mapping():
    """
    Load projects from the project ID mapping file if it exists
    
    Returns:
        List of project names
    """
    # Default projects list
    default_projects = ["Growth", "Hardware", "Cash App", "Square Banking", "Public Web", "Other"]
    
    try:
        # Try to import the project mapping from growthbook.metrics
        try:
            from growthbook.metrics import PROJECT_ID_MAPPING
            
            # Get unique project names from the mapping values
            project_names = list(set(PROJECT_ID_MAPPING.values()))
            
            # Make sure default projects are included
            for project in default_projects:
                if project not in project_names:
                    project_names.append(project)
            
            # Sort the list
            project_names.sort()
            
            logger.info(f"Loaded {len(project_names)} projects from mapping")
            return project_names
            
        except ImportError:
            # If import fails, try to load directly from file
            import json
            
            # Get the growthbook directory path
            current_dir = os.path.dirname(os.path.abspath(__file__))
            parent_dir = os.path.dirname(current_dir)
            mapping_file_path = os.path.join(parent_dir, "growthbook", "projects", "project_id_mapping.json")
            
            if os.path.exists(mapping_file_path):
                with open(mapping_file_path, 'r') as f:
                    mapping = json.load(f)
                    
                # Get unique project names from the mapping values
                project_names = list(set(mapping.values()))
                
                # Make sure default projects are included
                for project in default_projects:
                    if project not in project_names:
                        project_names.append(project)
                
                # Sort the list
                project_names.sort()
                
                logger.info(f"Loaded {len(project_names)} projects from file")
                return project_names
            else:
                logger.info("Project mapping file not found, using default projects")
                return default_projects
                
    except Exception as e:
        logger.error(f"Error loading projects from mapping: {str(e)}")
        return default_projects

# List of projects for categorizing metrics
PROJECTS = load_projects_from_mapping()

# List of metric types
METRIC_TYPES = ["binomial", "revenue", "time", "count"]

# List of time window units
TIME_WINDOW_UNITS = ["days", "hours", "minutes", "seconds", "weeks", "months", "years"]

# Mapping from full unit names to short codes
UNIT_SHORT_MAPPING = {
    "days": "d",
    "hours": "h",
    "minutes": "m",
    "seconds": "s",
    "weeks": "w",
    "months": "M",
    "years": "y"
}

# Mapping from short unit codes to full unit names
UNIT_FULL_MAPPING = {
    "d": "days",
    "h": "hours",
    "m": "minutes",
    "s": "seconds",
    "w": "weeks",
    "M": "months",
    "y": "years"
}

# List of archive types
ARCHIVE_TYPES = ["True", "False"]

# List of user ID types
USER_ID_TYPES = ["merchant_token", "avt"]

# Get dev mode from environment variable
dev_mode = os.environ.get("METRIC_APP_DEV_MODE", "false").lower() == "true"

# Default GitHub configuration
def get_github_config(dev_mode=False):
    """
    Get GitHub configuration based on dev mode

    Args:
        dev_mode: Whether to use development configuration

    Returns:
        dict: GitHub configuration
    """
    #Using the same repo for dev mode, consider another location with more development testing needs
    if dev_mode:
        return {
            "repo_owner": "squareup",
            "repo_name": "forge-sq-experimentation",
            "base_branch": "main"
        }
    else:
        return {
            "repo_owner": "squareup",
            "repo_name": "forge-sq-experimentation",
            "base_branch": "main"
        }

def create_metric_template(name="", description="", owner="", metric_type="binary", 
                     project="Growth", sql="", window_value=7, window_unit="days", 
                     archived=False, date_created=None, date_updated=None, user_id_types=None):
    """
    Create a metric object with the structure matching the YAML template
    
    Args:
        name: Name of the metric
        description: Description of the metric
        owner: Owner LDAP of the metric
        metric_type: Type of metric (binomial, revenue, time, count)
        project: Project the metric belongs to
        sql: SQL query defining the metric
        window_value: Numeric value for the time window
        window_unit: Unit for the time window (days, hours, minutes, etc.)
        archived: Whether the metric is archived
        date_created: Date the metric was created (defaults to current date)
        date_updated: Date the metric was last updated (defaults to current date)
        user_id_types: List of user ID types for this metric (e.g., ["merchant_token", "avt"])
        
    Returns:
        Dictionary representing the metric with the structure matching the YAML template
    """
    import time
    
    # Use current date for created/updated if not provided
    current_date = time.strftime("%Y-%m-%d")
    if date_created is None:
        date_created = current_date
    if date_updated is None:
        date_updated = current_date
    
    # Ensure archived is a boolean
    if not isinstance(archived, bool):
        if isinstance(archived, str):
            archived = archived.lower() == "true"
        else:
            archived = bool(archived)
    
    # Set default user ID types if not provided
    if user_id_types is None:
        user_id_types = []
    
    # Create the metric object with the structure matching the YAML template
    metric_data = {
        "name": name,
        "description": description,
        "owner": owner,
        "type": metric_type,
        "projects": [project] if isinstance(project, str) else project,  # Handle both string and list
        "sql": sql,
        "dateCreated": date_created,
        "dateUpdated": date_updated,
        "archived": archived,
        # "is_archived": "True" if archived else "False",  # Add is_archived as string for filtering
        "tags": [],  # Empty list as per YAML template
        "userIdTypes": user_id_types,  # Add userIdTypes field
        "behavior": {
            "goal": "increase",  # Default goal
            "windowSettings": {
                "type": "none",  # Default type
                "windowValue": window_value,
                "windowUnit": window_unit,
                "delayValue": 0,
                "delayUnit": "hours"
            }
        }
    }
    
    return metric_data

def initialize_session_state(st, dev_mode = False):
    """Initialize session state variables if they don't exist."""
    # Initialize projects list
    if 'projects' not in st.session_state:
        st.session_state.projects = PROJECTS
    
    # Check if we need to refresh projects list (e.g., after fetching projects from API)
    if 'refresh_projects' in st.session_state and st.session_state.refresh_projects:
        st.session_state.projects = load_projects_from_mapping()
        st.session_state.refresh_projects = False
        
    # Initialize metric types
    if 'metric_types' not in st.session_state:
        st.session_state.metric_types = METRIC_TYPES

    # Initialize metric types
    if 'archive_types' not in st.session_state:
        st.session_state.archive_types = ARCHIVE_TYPES
        
    # Initialize time window units
    if 'time_window_units' not in st.session_state:
        st.session_state.time_window_units = TIME_WINDOW_UNITS
        
    # Initialize user ID types
    if 'user_id_types' not in st.session_state:
        st.session_state.user_id_types = USER_ID_TYPES
        
    # Initialize metrics source to None (no source selected)
    if "metrics_source" not in st.session_state:
        st.session_state.metrics_source = None

    # Set GitHub config based on dev mode
    github_config = get_github_config(dev_mode=dev_mode)
    st.session_state.github_repo_owner = github_config["repo_owner"]
    st.session_state.github_repo_name = github_config["repo_name"]
    st.session_state.github_default_branch = github_config["base_branch"]
    
    # GitHub authentication state
    if "github_authenticated" not in st.session_state:
        st.session_state.github_authenticated = False
    if "github_user_token" not in st.session_state:
        st.session_state.github_user_token = None
    if "github_user_info" not in st.session_state:
        st.session_state.github_user_info = None
    if "github_auth_state" not in st.session_state:
        st.session_state.github_auth_state = None
    if "has_org_access" not in st.session_state:
        st.session_state.has_org_access = False
    
    # Metrics state
    if "metrics" not in st.session_state:
        st.session_state.metrics = []
    if "staged_commits" not in st.session_state:
        st.session_state.staged_commits = {}
    
    # Form state
    if "form_submitted" not in st.session_state:
        st.session_state.form_submitted = False
    if "original_metric_name" not in st.session_state:
        st.session_state.original_metric_name = None
