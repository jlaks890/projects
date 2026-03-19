"""
Growthbook API Integration Module

This module provides functions to interact with the Growthbook API for retrieving
metrics, feature flags, and other experiment-related data.

API Documentation: https://docs.growthbook.io/api/
"""

import os
import requests
import json
import logging
from typing import Dict, List, Any, Optional, Union

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GrowthbookAPI:
    """
    Client for interacting with the Growthbook API
    
    This class provides methods to interact with various Growthbook API endpoints
    for retrieving metrics, feature flags, and experiment data.
    """
    
    def __init__(
        self, 
        api_host: str = None, 
        api_key: str = None,
        # client_key: str = None,
        pat: str = None  # New parameter for Personal Access Token
    ):
        """
        Initialize the Growthbook API client
        
        Args:
            api_host: The Growthbook API host URL (e.g., https://api.growthbook.io)
            api_key: The Growthbook API key for authenticated requests
            client_key: The Growthbook SDK client key for feature flag requests
            pat: Personal Access Token (alternative to API key)
        """
        # Try to get values from parameters, session state, secrets, or environment variables
        try:
            import streamlit as st
            # Use parameters, or try session state, secrets, and finally environment variables
            self.api_host = (api_host or
                             st.session_state.get("growthbook_api_host",
                                                  os.environ.get("GROWTHBOOK_API_HOST",
                                                                 "https://growthbook.sqprod.co")))

            self.api_key = (api_key or
                            st.session_state.get("growthbook_api_key",
                                                 os.environ.get("GROWTHBOOK_API_KEY", "")))

            self.pat = (pat or
                        st.session_state.get("growthbook_pat",
                                             os.environ.get("GROWTHBOOK_PAT", "")))
        except:
            # Fallback if streamlit is not available
            self.api_host = api_host or os.environ.get("GROWTHBOOK_API_HOST", "https://growthbook.sqprod.co")
            self.api_key = api_key or os.environ.get("GROWTHBOOK_API_KEY", "")
            self.pat = pat or os.environ.get("GROWTHBOOK_PAT", "")
        
        # Remove trailing slashes from API host
        if self.api_host.endswith("/"):
            self.api_host = self.api_host[:-1]
            
        # Set default headers for API requests
        self.headers = {
            "Content-Type": "application/json"
        }
        
        # Add authentication - prefer PAT if available, otherwise use API key
        if self.pat:
            self.headers["Authorization"] = f"Bearer {self.pat}"
        elif self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Dict = None, 
        data: Dict = None
    ) -> Dict:
        """
        Make an HTTP request to the Growthbook API
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            params: Query parameters
            data: Request body for POST/PUT requests
            
        Returns:
            API response as dictionary
        """
        # Construct full URL - ensure endpoint starts with /
        if not endpoint.startswith('/'):
            endpoint = f"/{endpoint}"
        url = f"{self.api_host}{endpoint}"
        
        # Use API authentication headers
        headers = self.headers.copy()
        
        try:
            # Try to use beyondclient if available, otherwise use requests
            try:
                import beyondclient
                reqlib = beyondclient.session()
                logger.info(f"Using beyondclient version {beyondclient.__version__} for API request")
            except (ImportError, ModuleNotFoundError) as e:
                # beyondclient is an internal Square package and may not be available externally
                import requests
                reqlib = requests
                logger.info(f"Using requests version {requests.__version__} for API request (beyondclient not available: {str(e)})")
            
            # Log request details for debugging
            logger.info(f"Making API request: {method} {url}")
            logger.info(f"Headers: {headers}")
            if params:
                logger.info(f"Params: {params}")
            if data:
                logger.info(f"Data: {data}")
            
            # Make the request
            if method.upper() == 'GET':
                response = reqlib.get(url, headers=headers, params=params)
            elif method.upper() == 'POST':
                response = reqlib.post(url, headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = reqlib.put(url, headers=headers, json=data)
            elif method.upper() == 'DELETE':
                response = reqlib.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            # Log response status
            logger.info(f"Response status: {response.status_code}")
            
            # Raise exception for error status codes
            response.raise_for_status()
            
            # Log response content for debugging
            if response.content:
                content_type = response.headers.get('Content-Type', 'unknown')
                logger.info(f"Response content type: {content_type}")
                # logger.info(f"Response content (first 500 chars): {response.content[:500]}")
                
                # Try to parse as JSON, but handle parsing errors
                try:
                    return response.json()
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse response as JSON: {e}")
                    logger.error(f"Response content type: {content_type}")
                    raise ValueError(f"Response is not valid JSON: {e}")
            return {}
            
        except Exception as e:
            logger.error(f"API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
                
                # Add more detailed debugging for auth errors
                if e.response.status_code == 401:
                    logger.error("Authentication error. Check your PAT or API key.")
                    logger.error(f"Auth header: {headers.get('Authorization', 'Not set')}")
                    
            raise
    
    def get_features(self) -> Dict[str, Any]:
        """
        Get all feature flags for the configured SDK connection
        
        Returns:
            Dictionary of feature flags
        """
        # Since we're only using API authentication, this method is simplified
        # and doesn't support feature flag SDK endpoints
        logger.warning("Feature flag SDK endpoints are not supported in simplified API mode")
        return {}

    def get_projects(self, limit: int = 100, offset: int = 0, get_all: bool = True) -> List[Dict[str, Any]]:
        """
        Get projects defined in Growthbook

        Args:
            limit: The number of items to return per request (default: 100)
            offset: How many items to skip (use in conjunction with limit for pagination)
            get_all: If True, automatically handles pagination to retrieve all projects (default: True)

        Returns:
            List of projects
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for fetching projects")

        # Use the correct API endpoint
        endpoint = "/api/v1/projects"
        logger.info(f"Using endpoint: {endpoint}")
        
        # Ensure limit is within reasonable constraints
        if limit < 1:
            logger.warning(f"Limit {limit} is below minimum allowed (1). Setting to 1.")
            limit = 1
        
        # Initialize projects list
        all_projects = []
        current_offset = offset
        has_more = True
        
        try:
            while has_more:
                # Build query parameters
                params = {}
                if limit is not None:
                    params['limit'] = limit
                if current_offset is not None:
                    params['offset'] = current_offset
                    
                logger.info(f"Using query parameters: {params}")
    
                # Make the request to the projects endpoint with query parameters
                response = self._make_request(
                    method="GET",
                    endpoint=endpoint,
                    params=params
                )
    
                # Log the structure of the response for debugging
                logger.info(f"API response keys: {list(response.keys())}")
    
                # Check if we have projects in the response
                if "projects" in response:
                    batch_projects = response["projects"]
                    logger.info(f"Retrieved {len(batch_projects)} projects (offset: {current_offset})")
                    
                    # Add this batch to our collection
                    all_projects.extend(batch_projects)
                    
                    # Check if hasMore flag is in the response
                    if "hasMore" in response:
                        if get_all and response["hasMore"]:
                            # API explicitly indicates there are more results
                            if "nextOffset" in response:
                                # Use the provided nextOffset if available
                                current_offset = response["nextOffset"]
                            else:
                                # Otherwise increment by the limit
                                current_offset += limit
                                
                            total_str = f"/{response['total']}" if "total" in response else ""
                            logger.info(f"hasMore=true. Fetching next page. Progress: {len(all_projects)}{total_str}")
                        else:
                            # API explicitly indicates no more results
                            has_more = False
                            if "total" in response:
                                logger.info(f"Retrieved all {response['total']} projects (hasMore=false)")
                            else:
                                logger.info(f"Retrieved {len(all_projects)} projects (hasMore=false)")
                    else:
                        # No hasMore flag, use simple fallback: if we got a full batch, try next page
                        if get_all and len(batch_projects) == limit:
                            current_offset += limit
                            logger.info(f"No hasMore flag. Got full batch, trying next page at offset {current_offset}")
                        else:
                            # We got fewer items than the limit, so we're done
                            has_more = False
                            logger.info(f"Retrieved {len(all_projects)} projects (incomplete batch)")
                    
                    # If we're not getting all projects, exit after first batch
                    if not get_all:
                        has_more = False
                        logger.info("Not retrieving all projects (get_all=False). Stopping after first batch.")
                else:
                    logger.warning(f"No projects found in API response. Available keys: {list(response.keys())}")
                    has_more = False
            
            # Log some metadata about the projects
            if all_projects:
                project_keys = list(all_projects[0].keys()) if all_projects else []
                logger.info(f"Project object keys: {project_keys}")
                logger.info(f"Successfully retrieved a total of {len(all_projects)} projects from Growthbook API")
            
            return all_projects

        except Exception as e:
            logger.error(f"Failed to get projects: {str(e)}")
            # Return what we've collected so far, or empty list if nothing
            return all_projects if all_projects else []
    
    def get_metrics(self, limit: int = 100, offset: int = 0, project_id: str = None, datasource_id: str = None, get_all: bool = True) -> List[Dict[str, Any]]:
        """
        Get metrics defined in Growthbook

        Args:
            limit: The number of items to return per request (default: 100, max allowed by API)
            offset: How many items to skip (use in conjunction with limit for pagination)
            project_id: Filter by project id
            datasource_id: Filter by Data Source
            get_all: If True, automatically handles pagination to retrieve all metrics (default: True)

        Returns:
            List of metrics
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for fetching metrics")

        # Use the correct API endpoint
        endpoint = "/api/v1/metrics"
        logger.info(f"Using endpoint: {endpoint}")
        
        # Ensure limit is within API constraints (1-100)
        if limit > 100:
            logger.warning(f"Limit {limit} exceeds maximum allowed (100). Setting to 100.")
            limit = 100
        elif limit < 1:
            logger.warning(f"Limit {limit} is below minimum allowed (1). Setting to 1.")
            limit = 1
        
        # Initialize metrics list
        all_metrics = []
        current_offset = offset
        has_more = True
        
        try:
            while has_more:
                # Build query parameters
                params = {}
                if limit is not None:
                    params['limit'] = limit
                if current_offset is not None:
                    params['offset'] = current_offset
                if project_id is not None:
                    params['projectId'] = project_id
                if datasource_id is not None:
                    params['datasourceId'] = datasource_id
                    
                logger.info(f"Using query parameters: {params}")
    
                # Make the request to the metrics endpoint with query parameters
                response = self._make_request(
                    method="GET",
                    endpoint=endpoint,
                    params=params
                )
    
                # Log the structure of the response for debugging
                logger.info(f"API response keys: {list(response.keys())}")
    
                # Check if we have metrics in the response
                if "metrics" in response:
                    batch_metrics = response["metrics"]
                    logger.info(f"Retrieved {len(batch_metrics)} metrics (offset: {current_offset})")
                    
                    # Add this batch to our collection
                    all_metrics.extend(batch_metrics)
                    
                    # Check if hasMore flag is in the response
                    if "hasMore" in response:
                        if get_all and response["hasMore"]:
                            # API explicitly indicates there are more results
                            if "nextOffset" in response:
                                # Use the provided nextOffset if available
                                current_offset = response["nextOffset"]
                            else:
                                # Otherwise increment by the limit
                                current_offset += limit
                                
                            total_str = f"/{response['total']}" if "total" in response else ""
                            logger.info(f"hasMore=true. Fetching next page. Progress: {len(all_metrics)}{total_str}")
                        else:
                            # API explicitly indicates no more results
                            has_more = False
                            if "total" in response:
                                logger.info(f"Retrieved all {response['total']} metrics (hasMore=false)")
                            else:
                                logger.info(f"Retrieved {len(all_metrics)} metrics (hasMore=false)")
                    else:
                        # No hasMore flag, use simple fallback: if we got a full batch, try next page
                        if get_all and len(batch_metrics) == limit:
                            current_offset += limit
                            logger.info(f"No hasMore flag. Got full batch, trying next page at offset {current_offset}")
                        else:
                            # We got fewer items than the limit, so we're done
                            has_more = False
                            logger.info(f"Retrieved {len(all_metrics)} metrics (incomplete batch)")
                    
                    # If we're not getting all metrics, exit after first batch
                    if not get_all:
                        has_more = False
                        logger.info("Not retrieving all metrics (get_all=False). Stopping after first batch.")
                else:
                    logger.warning(f"No metrics found in API response. Available keys: {list(response.keys())}")
                    has_more = False
            
            # Log some metadata about the metrics
            # if all_metrics:
                metric_keys = list(all_metrics[0].keys()) if all_metrics else []
                # logger.info(f"Metric object keys: {metric_keys}")
                # logger.info(f"Sample metric: {all_metrics[0] if all_metrics else 'No metrics'}")
                # logger.info(f"Successfully retrieved a total of {len(all_metrics)} metrics from Growthbook API")
            
            return all_metrics

        except Exception as e:
            logger.error(f"Failed to get metrics: {str(e)}")
            # Return what we've collected so far, or empty list if nothing
            return all_metrics if all_metrics else []
    
    def get_metric_by_id(self, metric_id: str) -> Dict[str, Any]:
        """
        Get a specific metric by ID
        
        Args:
            metric_id: The ID of the metric to retrieve
            
        Returns:
            Metric details
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for fetching metrics")
        
        # Use the same endpoint pattern that worked for get_metrics
        endpoint = f"/metrics/{metric_id}"
        logger.info(f"Using endpoint: {endpoint}")
        
        try:
            # Make the request
            response = self._make_request(
                method="GET",
                endpoint=endpoint
            )
            
            # Similar to get_metrics, we'll fall back to empty dict
            logger.info(f"Received response from {endpoint}")
            logger.info("Using empty dict as fallback until API integration is complete")
            
            # Return empty dict
            return {}
                
        except Exception as e:
            logger.error(f"Failed to get metric by ID: {str(e)}")
            # Return empty dict
            return {}
    
    def get_experiments(self) -> List[Dict[str, Any]]:
        """
        Get all experiments defined in Growthbook
        
        Returns:
            List of experiments
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for fetching experiments")
        
        # Use the /experiments endpoint similar to /metrics
        endpoint = "/experiments"
        logger.info(f"Using endpoint: {endpoint}")
        
        try:
            # Make the request to the /experiments endpoint
            response = self._make_request(
                method="GET",
                endpoint=endpoint
            )
            
            # Similar to metrics, we'll fall back to empty list
            logger.info("Received response from /experiments endpoint")
            logger.info("Using empty list as fallback until API integration is complete")
            
            # Return empty list
            return []
                
        except Exception as e:
            logger.error(f"Failed to get experiments: {str(e)}")
            # Return empty list
            return []
    
    def get_experiment_by_id(self, experiment_id: str) -> Dict[str, Any]:
        """
        Get a specific experiment by ID
        
        Args:
            experiment_id: The ID of the experiment to retrieve
            
        Returns:
            Experiment details
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for fetching experiments")
        
        # Use the same endpoint pattern that worked for metrics
        endpoint = f"/experiments/{experiment_id}"
        logger.info(f"Using endpoint: {endpoint}")
        
        try:
            # Make the request
            response = self._make_request(
                method="GET",
                endpoint=endpoint
            )
            
            # Similar to get_metrics, we'll fall back to empty dict
            logger.info(f"Received response from {endpoint}")
            logger.info("Using empty dict as fallback until API integration is complete")
            
            # Return empty dict
            return {}
                
        except Exception as e:
            logger.error(f"Failed to get experiment by ID: {str(e)}")
            # Return empty dict
            return {}
    
    def create_metric(self, metric_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new metric
        
        Args:
            metric_data: Dictionary containing metric definition
            
        Returns:
            Created metric details
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for creating metrics")
        
        # Use the same endpoint pattern that worked for metrics
        endpoint = "/metrics"
        logger.info(f"Using endpoint: {endpoint}")
        
        try:
            # Make the request
            response = self._make_request(
                method="POST",
                endpoint=endpoint,
                data=metric_data
            )
            
            # Similar to get_metrics, we'll fall back to empty dict
            logger.info(f"Received response from {endpoint}")
            logger.info("Using provided metric data as fallback until API integration is complete")
            
            # Return the input data as a fallback
            return metric_data
                
        except Exception as e:
            logger.error(f"Failed to create metric: {str(e)}")
            # Return the input data as a fallback
            return metric_data
    
    def update_metric(self, metric_id: str, metric_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing metric
        
        Args:
            metric_id: ID of the metric to update
            metric_data: Dictionary containing updated metric definition
            
        Returns:
            Updated metric details
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for updating metrics")
        
        # Use the same endpoint pattern that worked for metrics
        endpoint = f"/metrics/{metric_id}"
        logger.info(f"Using endpoint: {endpoint}")
        
        try:
            # Make the request
            response = self._make_request(
                method="PUT",
                endpoint=endpoint,
                data=metric_data
            )
            
            # Similar to create_metric, we'll fall back to the input data
            logger.info(f"Received response from {endpoint}")
            logger.info("Using provided metric data as fallback until API integration is complete")
            
            # Return the input data as a fallback
            return metric_data
                
        except Exception as e:
            logger.error(f"Failed to update metric: {str(e)}")
            # Return the input data as a fallback
            return metric_data
    
    def delete_metric(self, metric_id: str) -> Dict[str, Any]:
        """
        Delete a metric
        
        Args:
            metric_id: ID of the metric to delete
            
        Returns:
            Response indicating success/failure
        """
        if not self.api_key and not self.pat:
            raise ValueError("API key or Personal Access Token is required for deleting metrics")
        
        # Use the same endpoint pattern that worked for metrics
        endpoint = f"/metrics/{metric_id}"
        logger.info(f"Using endpoint: {endpoint}")
        
        try:
            # Make the request
            response = self._make_request(
                method="DELETE",
                endpoint=endpoint
            )
            
            # Return a simple success response
            logger.info(f"Received response from {endpoint}")
            logger.info("Using simple success response until API integration is complete")
            
            # Return a simple success response
            return {"success": True, "message": f"Metric {metric_id} deleted successfully"}
                
        except Exception as e:
            logger.error(f"Failed to delete metric: {str(e)}")
            # Return a simple error response
            return {"success": False, "message": f"Failed to delete metric: {str(e)}"}

    # End of class methods


def initialize_growthbook_api(
    api_host: str = None,
    api_key: str = None,
    # client_key: str = None,  # Kept for backward compatibility
    pat: str = None
) -> GrowthbookAPI:
    """
    Initialize the Growthbook API client with configuration
    
    Args:
        api_host: The Growthbook API host URL
        api_key: The Growthbook API key for authenticated requests
        # client_key: The Growthbook SDK client key (not used in simplified mode)
        pat: Personal Access Token (alternative to API key)
        
    Returns:
        Configured GrowthbookAPI instance
    """
    return GrowthbookAPI(
        api_host=api_host,
        api_key=api_key,
        # client_key=client_key,  # Pass it through for backward compatibility
        pat=pat
    )


def save_metrics_to_file(metrics: List[Dict[str, Any]], file_path: str) -> bool:
    """
    Save metrics to a local JSON file and process them into individual files
    
    Args:
        metrics: List of metrics to save
        file_path: Path to save the metrics file
        
    Returns:
        Boolean indicating success/failure
    """
    import json
    import os
    
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save metrics to file
        with open(file_path, 'w') as f:
            json.dump({"metrics": metrics}, f, indent=2)
            
        logger.info(f"Successfully saved {len(metrics)} metrics to {file_path}")
        
        # Get the metrics directory
        metrics_dir = os.path.dirname(file_path)
        
        # Save each metric as an individual file with structured format
        save_individual_metrics(metrics, metrics_dir)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to save metrics to file: {str(e)}")
        return False


def save_individual_metrics(metrics: List[Dict[str, Any]], base_dir: str) -> None:
    """
    Save each metric as a separate JSON file and process it into a structured format
    with YAML and SQL files in their own folders
    
    Args:
        metrics: List of metrics to save
        base_dir: Base directory to save individual metric files
        
    Returns:
        None
    """
    import json
    import os
    import re
    import yaml
    
    try:
        # Create a subdirectory for individual metrics
        individual_dir = os.path.join(base_dir, "individual")
        os.makedirs(individual_dir, exist_ok=True)
        
        # Function to create a safe filename/directory name
        def safe_name(name):
            return re.sub(r'[^\w\-\.]', '_', name)
        
        # Counter for successfully processed metrics
        processed_count = 0
        
        # Process each metric
        for i, metric in enumerate(metrics):
            try:
                # Get metric ID and name
                metric_id = metric.get("id", f"metric_{i}")
                metric_name = metric.get("name", f"Metric {i}")
                
                # Create a safe name but ensure uniqueness by including the ID
                safe_metric_name = safe_name(metric_name)
                
                # Check if we should add the ID to ensure uniqueness
                # If the ID is already part of the name, don't add it again
                if metric_id and metric_id not in metric_name:
                    safe_metric_name = f"{safe_metric_name}___{safe_name(metric_id)}"
                
                # Create a directory for this metric
                metric_dir = os.path.join(individual_dir, safe_metric_name)
                os.makedirs(metric_dir, exist_ok=True)
                
                # Save the full JSON file
                json_path = os.path.join(metric_dir, f"{safe_name(metric_id)}.json")
                with open(json_path, 'w') as f:
                    json.dump(metric, f, indent=2)
                
                # Create a YAML file with important metadata
                yaml_data = {
                    "id": metric.get("id", ""),
                    "name": metric.get("name", ""),
                    "description": metric.get("description", ""),
                    "owner": metric.get("owner", ""),
                    "type": metric.get("type", ""),
                    "archived": metric.get("archived", False),
                    "dateCreated": metric.get("dateCreated", ""),
                    "dateUpdated": metric.get("dateUpdated", ""),
                    "projects": metric.get("projects", []),
                    "tags": metric.get("tags", []),
                    "behavior": {
                        "goal": metric.get("behavior", {}).get("goal", ""),
                        "windowSettings": metric.get("behavior", {}).get("windowSettings", {})
                    }
                }
                
                yaml_path = os.path.join(metric_dir, f"{safe_name(metric_id)}.yaml")
                with open(yaml_path, 'w') as f:
                    yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
                
                # Extract SQL and save as .sql file if available
                sql_data = metric.get("sql", {})
                if sql_data:
                    sql_content = ""
                    
                    # Add comments with identifier types
                    identifier_types = sql_data.get("identifierTypes", [])
                    if identifier_types:
                        sql_content += f"-- Identifier Types: {', '.join(identifier_types)}\n"
                    
                    # Add conversion SQL
                    conversion_sql = sql_data.get("conversionSQL", "")
                    if conversion_sql:
                        sql_content += "\n-- Conversion SQL\n" + conversion_sql + "\n"
                    
                    # Add user aggregation SQL
                    user_agg_sql = sql_data.get("userAggregationSQL", "")
                    if user_agg_sql:
                        sql_content += "\n-- User Aggregation SQL\n" + user_agg_sql + "\n"
                    
                    # Add denominator metric ID if available
                    denominator_metric_id = sql_data.get("denominatorMetricId", "")
                    if denominator_metric_id:
                        sql_content += f"\n-- Denominator Metric ID: {denominator_metric_id}\n"
                    
                    # Save SQL file
                    if sql_content.strip():
                        sql_path = os.path.join(metric_dir, f"{safe_name(metric_id)}.sql")
                        with open(sql_path, 'w') as f:
                            f.write(sql_content)
                
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing metric {metric.get('id', '')}: {str(e)}")
                continue
                
        logger.info(f"Successfully processed {processed_count} metrics into structured format at {individual_dir}")
        
    except Exception as e:
        logger.error(f"Failed to save individual metric files: {str(e)}")





def fetch_and_save_projects(
    api_host: str, 
    api_key: str = None, 
    pat: str = None,
    file_path: str = None,
    limit: int = 100  # Default limit per page
) -> Dict[str, Any]:
    """
    Fetch projects from Growthbook API and save them to a local file
    
    Args:
        api_host: The Growthbook API host URL
        api_key: The Growthbook API key
        pat: Personal Access Token
        file_path: Optional path to save projects file (if not provided, uses default)
        limit: Maximum number of projects to retrieve per page (default: 100)
        
    Returns:
        Dictionary containing result information
    """
    import os
    import json
    
    try:
        # Initialize a GrowthbookAPI instance
        gb_api = GrowthbookAPI(api_host=api_host, api_key=api_key, pat=pat)
        
        # Use the get_projects method which handles pagination automatically
        projects = gb_api.get_projects(limit=limit, get_all=True)
        
        if not projects:
            logger.error("No projects found in API response")
            return {
                "success": False,
                "error": "No projects found in API response",
                "count": 0,
                "sample": None
            }
            
        logger.info(f"Successfully retrieved {len(projects)} total projects from Growthbook API")
        
        # Define the file path if not provided
        if not file_path:
            # Get the current directory (growthbook folder)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Create a projects directory inside the growthbook folder
            projects_dir = os.path.join(current_dir, "projects")
            os.makedirs(projects_dir, exist_ok=True)
            file_path = os.path.join(projects_dir, "projects_data.json")
            
            logger.info(f"Saving projects to: {file_path}")
        
        # Save projects to file
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # Save projects to file
            with open(file_path, 'w') as f:
                json.dump({"projects": projects}, f, indent=2)
                
            logger.info(f"Successfully saved {len(projects)} projects to {file_path}")
            save_success = True
        except Exception as e:
            logger.error(f"Failed to save projects to file: {str(e)}")
            save_success = False
        
        if not save_success:
            return {
                "success": False,
                "error": "Failed to save projects to file",
                "count": len(projects),
                "sample": projects[:3] if projects else None
            }
        
        # Create a project ID to name mapping
        project_mapping = {}
        for project in projects:
            if "id" in project and "name" in project:
                project_mapping[project["id"]] = project["name"]
        
        # Save the mapping to a separate file for easy lookup
        mapping_file_path = os.path.join(os.path.dirname(file_path), "project_id_mapping.json")
        try:
            with open(mapping_file_path, 'w') as f:
                json.dump(project_mapping, f, indent=2)
            logger.info(f"Successfully saved project ID mapping to {mapping_file_path}")
        except Exception as e:
            logger.error(f"Failed to save project ID mapping: {str(e)}")
        
        return {
            "success": True,
            "count": len(projects),
            "file_path": file_path,
            "mapping_file_path": mapping_file_path,
            "sample": projects[:3] if projects else None,
            "mapping": project_mapping
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch and save projects: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
        return {
            "success": False,
            "error": str(e),
            "count": 0,
            "sample": None
        }

def fetch_and_save_metrics(
    api_host: str, 
    api_key: str = None, 
    pat: str = None,
    file_path: str = None,
    limit: int = 100  # Default limit per page (max allowed by API)
) -> Dict[str, Any]:
    """
    Fetch metrics from Growthbook API and save them to a local file
    
    Args:
        api_host: The Growthbook API host URL
        api_key: The Growthbook API key
        pat: Personal Access Token
        file_path: Optional path to save metrics file (if not provided, uses default)
        limit: Maximum number of metrics to retrieve per page (default: 100, max allowed by API)
        
    Returns:
        Dictionary containing result information
    """
    import os
    
    try:
        # Initialize a GrowthbookAPI instance
        gb_api = GrowthbookAPI(api_host=api_host, api_key=api_key, pat=pat)
        
        # Use the get_metrics method which now handles pagination automatically
        metrics = gb_api.get_metrics(limit=limit, get_all=True)
        
        if not metrics:
            logger.error("No metrics found in API response")
            return {
                "success": False,
                "error": "No metrics found in API response",
                "count": 0,
                "sample": None
            }
            
        logger.info(f"Successfully retrieved {len(metrics)} total metrics from Growthbook API")
        
        # Define the file path if not provided
        if not file_path:
            # Get the current directory (growthbook folder)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Create a metrics directory inside the growthbook folder
            metrics_dir = os.path.join(current_dir, "metrics")
            os.makedirs(metrics_dir, exist_ok=True)
            file_path = os.path.join(metrics_dir, "metrics_data.json")
            
            logger.info(f"Saving metrics to: {file_path}")
        
        # Save metrics to file
        save_success = save_metrics_to_file(metrics, file_path)
        
        if not save_success:
            return {
                "success": False,
                "error": "Failed to save metrics to file",
                "count": len(metrics),
                "sample": metrics[:3] if metrics else None
            }
        
        return {
            "success": True,
            "count": len(metrics),
            "file_path": file_path,
            "sample": metrics[:3] if metrics else None
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch and save metrics: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
        return {
            "success": False,
            "error": str(e),
            "count": 0,
            "sample": None
        }
