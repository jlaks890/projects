"""
Growthbook Metrics Integration

This module provides functions to retrieve and manage metrics from Growthbook,
with fallback to sample data when not connected to the API.
"""

import os
import logging
from typing import Dict, List, Any, Optional, Union
import streamlit as st

from growthbook.api import GrowthbookAPI, initialize_growthbook_api

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample metrics for development and testing
SAMPLE_METRICS = [
    {
        "name": "signup_conversion_7d",
        "description": "Percentage of users who sign up within 7 days of first visit",
        "owner": "growth_team@squareup.com",
        "type": "binomial",
        "time_window": "7d",
        "project": "Growth",
        "sql": """
               SELECT DATE_TRUNC('day', first_visit_date)                                           AS visit_date,
                      COUNT(DISTINCT user_id)                                                       AS visitors,
                      COUNT(DISTINCT CASE
                                         WHEN signup_date IS NOT NULL
                                             AND datediff('day', first_visit_date, signup_date) <= 7
                                             THEN user_id END)                                      AS signups,
                      COUNT(DISTINCT CASE
                                         WHEN signup_date IS NOT NULL
                                             AND datediff('day', first_visit_date, signup_date) <= 7
                                             THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0) AS conversion_rate
               FROM user_events
               GROUP BY 1
               ORDER BY 1 DESC
               """,
        "last_updated": "2023-10-15",
        "archived": False,
        "is_archived": "False",
        "userIdTypes": ["merchant_token"]
    },
    {
        "name": "revenue_per_user_30d",
        "description": "Average revenue per user over a 30-day period",
        "owner": "finance@squareup.com",
        "type": "revenue",
        "time_window": "30d",
        "project": "Square Banking",
        "sql": """
               SELECT date_trunc('day', transaction_date)              AS day,
                      SUM(amount)                                      AS total_revenue,
                      COUNT(DISTINCT user_id)                          AS active_users,
                      SUM(amount) / NULLIF(COUNT(DISTINCT user_id), 0) AS revenue_per_user
               FROM transactions
               WHERE transaction_date >= DATEADD('day', -30, CURRENT_DATE())
               GROUP BY 1
               ORDER BY 1 DESC
               """,
        "last_updated": "2023-11-01",
        "archived": False,
        "is_archived": "False",
        "userIdTypes": ["merchant_token", "cart_id"]
    },
    {
        "name": "archived_metric_example",
        "description": "This is an example of an archived metric",
        "owner": "archive_team@squareup.com",
        "type": "binomial",
        "time_window": "14d",
        "project": "Other",
        "sql": "SELECT 1 as dummy",
        "last_updated": "2023-09-01",
        "archived": True,
        "is_archived": "True",
        "userIdTypes": []
    }
]


def get_sample_metrics() -> List[Dict[str, Any]]:
    """
    Return sample metrics data for demonstration

    Returns:
        List of sample metrics
    """
    return SAMPLE_METRICS


# Load project ID mapping from file if it exists
def load_project_id_mapping():
    """
    Load project ID to name mapping from file
    
    Returns:
        Dict mapping project IDs to names
    """
    import os
    import json
    
    # Default mapping in case file doesn't exist
    default_mapping = {
        # Known project IDs from your Growthbook instance
        "prj_ewvk1hlms1eo64": "Hardware",
        "prj_afv6b232lctbifb4": "Growth",
        "prj_17fo3ula140bo1": "Public Web",
        "prj_k8ch33rlxexcsnf": "Square Banking",
    }
    
    try:
        # Get the current directory (growthbook folder)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Path to project ID mapping file
        mapping_file_path = os.path.join(current_dir, "projects", "project_id_mapping.json")
        
        # Check if file exists
        if os.path.exists(mapping_file_path):
            with open(mapping_file_path, 'r') as f:
                mapping = json.load(f)
                logger.info(f"Loaded project ID mapping from file: {len(mapping)} mappings")
                return mapping
        else:
            logger.info("Project ID mapping file not found, using default mapping")
            return default_mapping
    except Exception as e:
        logger.error(f"Error loading project ID mapping: {str(e)}")
        return default_mapping

# Map of Growthbook project IDs to human-readable names
PROJECT_ID_MAPPING = load_project_id_mapping()

def update_project_mapping(project_id, project_name, save_to_file=True):
    """
    Update the project ID mapping with a new mapping and optionally save to file
    
    Args:
        project_id: The Growthbook project ID
        project_name: The human-readable project name
        save_to_file: Whether to save the updated mapping to file
        
    Returns:
        None
    """
    global PROJECT_ID_MAPPING
    if project_id and project_name and project_id not in PROJECT_ID_MAPPING:
        PROJECT_ID_MAPPING[project_id] = project_name
        logger.info(f"Added new project mapping: {project_id} -> {project_name}")
        
        # Save to file if requested
        if save_to_file:
            try:
                import os
                import json
                
                # Get the current directory (growthbook folder)
                current_dir = os.path.dirname(os.path.abspath(__file__))
                
                # Create projects directory if it doesn't exist
                projects_dir = os.path.join(current_dir, "projects")
                os.makedirs(projects_dir, exist_ok=True)
                
                # Path to project ID mapping file
                mapping_file_path = os.path.join(projects_dir, "project_id_mapping.json")
                
                # Save the mapping to file
                with open(mapping_file_path, 'w') as f:
                    json.dump(PROJECT_ID_MAPPING, f, indent=2)
                    
                logger.info(f"Saved updated project ID mapping to {mapping_file_path}")
            except Exception as e:
                logger.error(f"Failed to save project ID mapping to file: {str(e)}")

# Import the predefined projects list from utils
try:
    from modules.utils import PROJECTS
except ImportError:
    # Fallback if import fails
    PROJECTS = ["Growth", "Hardware", "Cash App", "Square Banking", "Public Web", "Other"]

def transform_growthbook_metrics(gb_metrics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transform metrics from Growthbook API format to our application format

    Args:
        gb_metrics: List of metrics from Growthbook API

    Returns:
        List of transformed metrics
    """
    transformed_metrics = []
    
    for metric in gb_metrics:
        # Extract project from either projects or tags and map to human-readable name
        project = "Other"  # Default to "Other" if no mapping found
        
        # Try to get project from projects array
        if metric.get("projects") and len(metric["projects"]) > 0:
            project_id = metric["projects"][0]
            # Map project ID to human-readable name if available
            if project_id in PROJECT_ID_MAPPING:
                project = PROJECT_ID_MAPPING[project_id]
                #REMOVE LOGGING
                # logger.info(f"Mapped project ID {project_id} to {project}")
            # If no mapping but the ID looks like a human-readable name, use it
            elif not project_id.startswith("prj_"):
                project = project_id
                logger.info(f"Using project ID as name: {project_id}")
            else:
                # Log unknown project IDs to help build the mapping
                #NOT NEEDED FOR NOW
                # logger.warning(f"Unknown project ID: {project_id} - using default project: {project}")
                
                # Try to find a matching project name from tags
                if metric.get("tags") and len(metric["tags"]) > 0:
                    for tag in metric["tags"]:
                        if tag in PROJECTS:
                            # Add this mapping for future use
                            update_project_mapping(project_id, tag)
                            project = tag
                            # logger.info(f"Created new mapping from tag: {project_id} -> {tag}")
                            break
        
        # If no project found, try tags
        elif metric.get("tags") and len(metric["tags"]) > 0:
            tag = metric["tags"][0]
            # Check if the tag matches any of our predefined projects
            if tag in PROJECTS:
                project = tag
            
        # Extract time window from behavior.windowSettings if available
        time_window = ""
        if metric.get("behavior") and metric["behavior"].get("windowSettings"):
            window_settings = metric["behavior"]["windowSettings"]
            window_value = window_settings.get("windowValue", "")
            window_unit = window_settings.get("windowUnit", "")
            if window_value and window_unit:
                # Format as "30d" for 30 days, etc.
                time_window = f"{window_value}{window_unit[0]}"
        
        # Extract SQL from the sql field
        sql_content = ""
        if metric.get("sql"):
            sql_data = metric["sql"]
            
            # If conversionSQL exists, use that as the main SQL content
            if sql_data.get("conversionSQL"):
                sql_content = sql_data["conversionSQL"]

        # Convert archived boolean to string "True" or "False"
        # First ensure we have a boolean value, then convert to string
        archived_value = metric.get("archived", False)
        if not isinstance(archived_value, bool):
            # Try to convert to boolean if it's a string
            if isinstance(archived_value, str):
                archived_value = archived_value.lower() == "true"
            else:
                # Default to False for any other type
                archived_value = False
        
        is_archived = "True" if archived_value else "False"
                
        # Map Growthbook metric fields to our application's format
        transformed_metric = {
            # Use name if available, fall back to id
            "name": metric.get("name", metric.get("id", "")),
            "description": metric.get("description", ""),
            "owner": metric.get("owner", ""),
            "type": metric.get("type", ""),
            "project": project,
            "sql": sql_content,
            "last_updated": metric.get("dateUpdated", ""),
            "time_window": time_window,
            # Add additional fields that might be useful
            "id": metric.get("id", ""),
            "archived": metric.get("archived", False),
            "date_created": metric.get("dateCreated", ""),
            "is_archived": is_archived,
            "userIdTypes": metric.get("userIdTypes", []),
        }

        transformed_metrics.append(transformed_metric)
        
        # Log the transformation for debugging
        # logger.info(f"Transformed metric: {metric.get('name', metric.get('id', 'unknown'))} -> {transformed_metric['name']} (project: {transformed_metric['project']}, type: {transformed_metric['type']})")

    return transformed_metrics


def get_metrics(use_api: bool = True) -> List[Dict[str, Any]]:
    """
    Get metrics data from Growthbook API or sample data

    Args:
        use_api: Whether to attempt to use the Growthbook API

    Returns:
        List of metrics
    """
    if not use_api:
        logger.info("Using sample metrics data (API disabled)")
        return get_sample_metrics()

    # Check if we have API credentials in session state, secrets, or environment
    api_key = st.session_state.get("growthbook_api_key",
                                   os.environ.get("GROWTHBOOK_API_KEY", ""))

    api_host = st.session_state.get("growthbook_api_host",
                                    os.environ.get("GROWTHBOOK_API_HOST", ""))

    pat = st.session_state.get("growthbook_pat",
                               os.environ.get("GROWTHBOOK_PAT", ""))

    # Check if we have either API key or PAT, and API host
    if not (api_key or pat) or not api_host:
        logger.warning("Missing Growthbook API credentials, using sample data")
        return get_sample_metrics()

    try:
        # Initialize Growthbook API client
        gb_api = initialize_growthbook_api(api_host=api_host, api_key=api_key, pat=pat)

        # Get metrics from Growthbook API with pagination
        # The get_metrics method now handles pagination automatically with get_all=True
        gb_metrics = gb_api.get_metrics(limit=100, get_all=True)

        # If we got an empty list, fall back to sample data
        if not gb_metrics:
            logger.info("Received empty metrics list from API, using sample data instead")
            return get_sample_metrics()

        # Transform metrics to our application's format
        transformed_metrics = transform_growthbook_metrics(gb_metrics)

        logger.info(f"Successfully retrieved {len(transformed_metrics)} metrics from Growthbook API")
        return transformed_metrics

    except Exception as e:
        logger.error(f"Failed to retrieve metrics from Growthbook API: {e}")
        logger.info("Falling back to sample metrics data")
        return get_sample_metrics()


def create_metric(metric_data: Dict[str, Any], use_api: bool = True) -> Dict[str, Any]:
    """
    Create a new metric in Growthbook

    Args:
        metric_data: Dictionary containing metric definition
        use_api: Whether to attempt to use the Growthbook API

    Returns:
        Created metric details or None if using sample data
    """
    if not use_api:
        logger.info("Mock metric creation (API disabled)")
        return metric_data

    # Check if we have API credentials in session state, secrets, or environment
    api_key = st.session_state.get("growthbook_api_key",
                                   os.environ.get("GROWTHBOOK_API_KEY", ""))

    api_host = st.session_state.get("growthbook_api_host",
                                    os.environ.get("GROWTHBOOK_API_HOST", ""))

    pat = st.session_state.get("growthbook_pat",
                               os.environ.get("GROWTHBOOK_PAT", ""))

    # Check if we have either API key or PAT, and API host
    if not (api_key or pat) or not api_host:
        logger.warning("Missing Growthbook API credentials, using mock creation")
        return metric_data

    try:
        # Initialize Growthbook API client
        gb_api = initialize_growthbook_api(api_host=api_host, api_key=api_key, pat=pat)

        # Transform our metric format to Growthbook's format
        gb_metric = {
            "id": metric_data["name"],
            "name": metric_data["name"],
            "description": metric_data["description"],
            "owner": metric_data["owner"],
            "type": metric_data["type"],
            "tags": [metric_data["project"]],
            "sql": metric_data["sql"],
            "userIdTypes": metric_data.get("userIdTypes", [])
        }

        # Add time window settings if available
        if "time_window" in metric_data:
            time_value = ''.join(filter(str.isdigit, metric_data["time_window"]))
            time_unit = ''.join(filter(str.isalpha, metric_data["time_window"]))

            if time_value and time_unit:
                gb_metric["windowSettings"] = {
                    "windowValue": int(time_value),
                    "windowUnit": time_unit
                }

        # Create metric in Growthbook
        response = gb_api.create_metric(gb_metric)

        logger.info(f"Successfully created metric {metric_data['name']} in Growthbook")
        return metric_data

    except Exception as e:
        logger.error(f"Failed to create metric in Growthbook API: {e}")
        logger.info("Returning mock creation result")
        return metric_data


def update_metric(metric_data: Dict[str, Any], use_api: bool = True) -> Dict[str, Any]:
    """
    Update an existing metric in Growthbook

    Args:
        metric_data: Dictionary containing updated metric definition
        use_api: Whether to attempt to use the Growthbook API

    Returns:
        Updated metric details or None if using sample data
    """
    if not use_api:
        logger.info("Mock metric update (API disabled)")
        return metric_data

    # Check if we have API credentials in session state, secrets, or environment
    api_key = st.session_state.get("growthbook_api_key",
                                   os.environ.get("GROWTHBOOK_API_KEY", ""))

    api_host = st.session_state.get("growthbook_api_host",
                                    os.environ.get("GROWTHBOOK_API_HOST", ""))

    pat = st.session_state.get("growthbook_pat",
                               os.environ.get("GROWTHBOOK_PAT", ""))

    # Check if we have either API key or PAT, and API host
    if not (api_key or pat) or not api_host:
        logger.warning("Missing Growthbook API credentials, using mock update")
        return metric_data

    try:
        # Initialize Growthbook API client
        gb_api = initialize_growthbook_api(api_host=api_host, api_key=api_key, pat=pat)

        # Transform our metric format to Growthbook's format
        gb_metric = {
            "id": metric_data["name"],
            "name": metric_data["name"],
            "description": metric_data["description"],
            "owner": metric_data["owner"],
            "type": metric_data["type"],
            "tags": [metric_data["project"]],
            "sql": metric_data["sql"],
            "userIdTypes": metric_data.get("userIdTypes", [])
        }

        # Add time window settings if available
        if "time_window" in metric_data:
            time_value = ''.join(filter(str.isdigit, metric_data["time_window"]))
            time_unit = ''.join(filter(str.isalpha, metric_data["time_window"]))

            if time_value and time_unit:
                gb_metric["windowSettings"] = {
                    "windowValue": int(time_value),
                    "windowUnit": time_unit
                }

        # Update metric in Growthbook
        response = gb_api.update_metric(metric_data["name"], gb_metric)

        logger.info(f"Successfully updated metric {metric_data['name']} in Growthbook")
        return metric_data

    except Exception as e:
        logger.error(f"Failed to update metric in Growthbook API: {e}")
        logger.info("Returning mock update result")
        return metric_data


def initialize_metrics(st_session) -> None:
    """
    Initialize metrics in session state

    Args:
        st_session: Streamlit session state
    """
    # Check if metrics already exist in session state
    if 'metrics' not in st_session:
        # Check if we should use the API based on session state
        use_api = st_session.get("use_growthbook_api", True)

        # Get metrics and store in session state
        st_session.metrics = get_metrics(use_api=use_api)

        logger.info(f"Initialized {len(st_session.metrics)} metrics in session state")
