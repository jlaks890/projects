"""
Functions for retrieving metrics data
This module integrates with the Growthbook API
"""
import concurrent.futures
import time
import os
import yaml
import json
import logging
import traceback
from modules.github_user_auth import get_github_client
from growthbook.metrics import (
    get_metrics as get_sample_metrics,
    get_sample_metrics as gb_get_sample_metrics,
    initialize_metrics as gb_initialize_metrics,
    transform_growthbook_metrics
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine if dev mode
dev_mode = os.environ.get("METRIC_APP_DEV_MODE", "false").lower() == "true"

def normalize_metric_data(metric_data):
    """
    Normalize metric data to ensure consistent structure and field types

    Args:
        metric_data: Raw metric data from file

    Returns:
        Normalized metric data dictionary
    """
    # Ensure the archived field is properly formatted
    if "archived" in metric_data:
        # Make sure archived is a boolean
        if not isinstance(metric_data["archived"], bool):
            if isinstance(metric_data["archived"], str):
                metric_data["archived"] = metric_data["archived"].lower() == "true"
            else:
                metric_data["archived"] = bool(metric_data["archived"])
    else:
        # Default to not archived
        metric_data["archived"] = False

    # Always set is_archived as a string for filtering
    # metric_data["is_archived"] = "True" if metric_data["archived"] else "False"

    # Handle project/projects field
    if "projects" in metric_data and isinstance(metric_data["projects"], list):
        # If projects exists as a list, make sure project also exists for backward compatibility
        if len(metric_data["projects"]) > 0:
            metric_data["project"] = metric_data["projects"][0]
    elif "project" in metric_data and isinstance(metric_data["project"], str):
        # If only project exists as a string, create projects list
        metric_data["projects"] = [metric_data["project"]]
    else:
        # Default to Growth if neither exists
        metric_data["project"] = "Growth"
        metric_data["projects"] = ["Growth"]

    # Convert the time window settings
    metric_data["time_window"] = ""
    if metric_data.get("behavior") and metric_data["behavior"].get("windowSettings"):
        window_settings = metric_data["behavior"]["windowSettings"]
        window_value = window_settings.get("windowValue", "")
        window_unit = window_settings.get("windowUnit", "")
        if window_value and window_unit:
            # Format as "30d" for 30 days, etc.
            metric_data["time_window"] = f"{window_value}{window_unit[0]}"
            
    # Ensure userIdTypes field exists
    if "userIdTypes" not in metric_data:
        metric_data["userIdTypes"] = []
    elif not isinstance(metric_data["userIdTypes"], list):
        # Convert to list if it's not already
        if isinstance(metric_data["userIdTypes"], str):
            metric_data["userIdTypes"] = [metric_data["userIdTypes"]]
        else:
            metric_data["userIdTypes"] = []

    return metric_data


def process_metric_file(file_content, cache=None):
    """
    Process a single metric file from GitHub

    Args:
        file_content: GitHub ContentFile object
        cache: Optional dictionary to use for caching

    Returns:
        Processed metric data or None if processing failed
    """
    try:
        # Check if file has changed since last fetch
        if cache is not None:
            file_sha = file_content.sha
            cache_key = f"{file_content.path}:{file_sha}"

            # Use cached data if available and unchanged
            if cache_key in cache:
                return cache[cache_key]

        # File changed or not in cache, process it
        raw_content = file_content.decoded_content.decode('utf-8')

        # Parse content based on file type
        if file_content.path.endswith(('.yaml', '.yml')):
            metric_data = yaml.safe_load(raw_content)
        else:
            metric_data = json.loads(raw_content)

        # Process the metric data (normalized fields)
        processed_metric = normalize_metric_data(metric_data)

        # Cache the processed metric if cache is provided
        if cache is not None:
            cache[cache_key] = processed_metric

        return processed_metric

    except Exception as e:
        logging.warning(f"Could not process file {file_content.path}: {str(e)}")
        return None


def get_all_metric_files(repo, metrics_path, default_branch):
    """
    Get all metric files from the repository recursively

    Args:
        repo: GitHub repository object
        metrics_path: Path to metrics directory
        default_branch: Branch to use

    Returns:
        List of ContentFile objects for metric files
    """
    try:
        # First, get the entire repository tree in a single API call
        branch = repo.get_branch(default_branch)
        commit = repo.get_commit(branch.commit.sha)
        tree = repo.get_git_tree(commit.commit.tree.sha, recursive=True)

        logging.info(f"Got repository tree with {len(tree.tree)} items")

        # Filter for metric files
        all_paths = []
        for item in tree.tree:
            if (item.type == "blob" and
                    item.path.startswith(metrics_path + "/") and
                    (item.path.endswith(".yaml") or
                     item.path.endswith(".yml") or
                     item.path.endswith(".json"))):
                all_paths.append(item.path)

        logging.info(f"Found {len(all_paths)} metric file paths")

        # Now get the actual file contents in batches
        all_files = []
        batch_size = 20  # Adjust this based on your needs

        for i in range(0, len(all_paths), batch_size):
            batch_paths = all_paths[i:i + batch_size]
            logging.info(
                f"Processing batch {i // batch_size + 1}/{len(all_paths) // batch_size + 1} ({len(batch_paths)} files)")

            for path in batch_paths:
                try:
                    file_content = repo.get_contents(path, ref=default_branch)
                    all_files.append(file_content)

                    # Add a small delay to avoid overwhelming the connection pool
                    import time
                    time.sleep(0.1)
                except Exception as e:
                    logging.warning(f"Could not get content for {path}: {str(e)}")

        return all_files
    except Exception as e:
        logging.error(f"Error getting metric files: {str(e)}")
        return []

def refresh_metrics_from_repository(st):
    """
    Refresh the metrics list from the GitHub repository with optimizations for 1000+ metrics

    Args:
        st: Streamlit session state

    Returns:
        bool: True if refresh was successful, False otherwise
    """
    start_time = time.time()

    # Track if we're using cached data
    using_cached_data = False

    try:
        # Get repository using settings from session state
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')
        repo_path = f"{repo_owner}/{repo_name}"

        logging.info(f"Attempting to refresh metrics from GitHub repository: {repo_path}")

        # Get GitHub client
        github_client = get_github_client()
        if not github_client:
            logging.warning("GitHub client not available.")
            st.session_state.metrics = []  # Empty list instead of sample data
            st.error("GitHub authentication is required. Please go to the Settings tab and authenticate with GitHub.")
            # Return False but don't try Growthbook as fallback
            return False

        # Get repository
        try:
            repo = github_client.get_repo(repo_path)
            logging.info(f"Successfully connected to repository: {repo_path}")
        except Exception as e:
            logging.error(f"Could not access repository {repo_path}: {str(e)}")
            st.session_state.metrics = []  # Empty list, don't use sample data
            st.error(f"Could not access repository {repo_path}. Error: {str(e)}")
            return False

        # Get default branch
        default_branch = st.session_state.get('github_default_branch', 'main')
        logging.info(f"Using default branch: {default_branch}")

        # Check if repository has changed since last fetch
        current_commit_sha = repo.get_branch(default_branch).commit.sha

        # Initialize cache-related session state variables if they don't exist
        if 'metrics_file_cache' not in st.session_state:
            st.session_state.metrics_file_cache = {}
        if 'last_commit_sha' not in st.session_state:
            st.session_state.last_commit_sha = None
        if 'cached_processed_metrics' not in st.session_state:
            st.session_state.cached_processed_metrics = None
        if 'config_yml_modified' not in st.session_state:
            st.session_state.config_yml_modified = False

        # Check if repository has changed or if this is the first load
        repository_changed = st.session_state.last_commit_sha != current_commit_sha

        #IGNORE CONFIG.YML FILE FOR NOW, TOO LARGE OF FILE
        # Get the latest config.yml file if needed
        # if repository_changed or not st.session_state.get("config_yml_contents"):
        #     try:
        #         config_file_path = "growthbook/config.yml"
        #         config_file_contents = repo.get_contents(config_file_path, ref=default_branch)
        #         import base64
        #         # GitHub API returns base64 encoded content
        #         raw_content = base64.b64decode(config_file_contents.content)
        #         logger.info(f"Decoded base64 content, length: {len(raw_content)}")
        #
        #         # st.session_state.config_yml_sha = config_file_contents.sha
        #         # Don't reset config_yml_modified here - it should only be reset after a commit
        #         logger.info("Successfully loaded config.yml from repository")
        #     except Exception as e:
        #         logger.warning(f"Could not load config.yml from repository: {str(e)}")
        #         st.session_state.config_yml_contents = None
        #         st.session_state.config_yml_sha = None

        # Check if repository has changed
        if st.session_state.last_commit_sha == current_commit_sha and st.session_state.cached_processed_metrics:
            logging.info("Repository unchanged since last fetch, using cached metrics")
            st.session_state.metrics = st.session_state.cached_processed_metrics
            using_cached_data = True
            elapsed_time = time.time() - start_time
            logging.info(f"Used cached metrics in {elapsed_time:.2f} seconds")
            return True

        # Update the last commit SHA
        st.session_state.last_commit_sha = current_commit_sha



        # Get all metric files in the repository
        metrics_path = "metrics"
        try:
            # Get all files recursively
            all_files = get_all_metric_files(repo, metrics_path, default_branch)

            if not all_files:
                logging.warning("No metric files found in repository")
                st.session_state.metrics = []  # Empty list, don't use sample data
                st.error("No metric files found in the repository.")
                return False

            # logging.info(f"Found {len(all_files)} metric files in repository")

            # Process files in parallel using ThreadPoolExecutor
            metrics = []
            max_workers = min(32, len(all_files))  # Limit number of threads

            # Use ThreadPoolExecutor for I/O bound operations
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all file processing tasks
                future_to_file = {
                    executor.submit(
                        process_metric_file,
                        file,
                        st.session_state.metrics_file_cache
                    ): file for file in all_files
                }

                # Process results as they complete
                for future in concurrent.futures.as_completed(future_to_file):
                    file = future_to_file[future]
                    try:
                        metric_data = future.result()
                        if metric_data:
                            metrics.append(metric_data)
                    except Exception as e:
                        logging.error(f"Error processing {file.path}: {str(e)}")

            # Update session state with the latest metrics
            if metrics:
                st.session_state.metrics = metrics
                # Cache the processed metrics
                st.session_state.cached_processed_metrics = metrics.copy()
                elapsed_time = time.time() - start_time
                logging.info(
                    f"Successfully refreshed {len(metrics)} metrics from repository in {elapsed_time:.2f} seconds")
                return True
            else:
                logging.warning("No metrics found in repository.")
                st.session_state.metrics = []  # Empty list, don't use sample data
                st.error("No metrics could be processed from the repository files.")
                return False

        except Exception as e:
            logging.error(f"Could not refresh metrics from repository: {str(e)}")
            st.session_state.metrics = []  # Empty list, don't use sample data
            st.error(f"Error processing repository files: {str(e)}")
            return False

    except Exception as e:
        logging.error(f"Error refreshing from repository: {str(e)}")
        st.session_state.metrics = []  # Empty list, don't use sample data
        st.error(f"Error refreshing from repository: {str(e)}")
        return False


def load_metrics_from_growthbook_api(st):
    """
    Load metrics directly from the Growthbook API

    Args:
        st: Streamlit session state

    Returns:
        bool: True if metrics were loaded successfully, False otherwise
    """
    try:
        from growthbook.api import GrowthbookAPI, initialize_growthbook_api

        # Check if we have API credentials in session state, secrets, or environment
        api_key = st.session_state.get("growthbook_api_key",
                                       os.environ.get("GROWTHBOOK_API_KEY", ""))

        api_host = st.session_state.get("growthbook_api_host",
                                        os.environ.get("GROWTHBOOK_API_HOST", ""))

        pat = st.session_state.get("growthbook_pat",
                                   os.environ.get("GROWTHBOOK_PAT", ""))

        # Check if we have either API key or PAT, and API host
        if not (api_key or pat) or not api_host:
            logging.warning("Missing Growthbook API credentials")
            st.error("Missing Growthbook API credentials. Please check your settings.")
            st.session_state.metrics = []  # Empty list, don't use sample data
            return False

        # Initialize Growthbook API client
        gb_api = initialize_growthbook_api(api_host=api_host, api_key=api_key, pat=pat)

        # Check if we have cached metrics
        if 'cached_growthbook_metrics' not in st.session_state:
            # Get metrics from Growthbook API with pagination
            logging.info("Fetching metrics from Growthbook API (not cached)")
            gb_metrics = gb_api.get_metrics(limit=100, get_all=True)

            # Cache the metrics to prevent multiple API calls
            st.session_state.cached_growthbook_metrics = gb_metrics
            logging.info(f"Cached {len(gb_metrics)} metrics from Growthbook API")
        else:
            # Use cached metrics
            logging.info("Using cached metrics from Growthbook API")
            gb_metrics = st.session_state.cached_growthbook_metrics

        # If we got an empty list, return False
        if not gb_metrics:
            logging.warning("Received empty metrics list from Growthbook API")
            st.error("Received empty metrics list from Growthbook API.")
            st.session_state.metrics = []  # Empty list, don't use sample data
            return False

        # Transform metrics to our application's format
        from growthbook.metrics import transform_growthbook_metrics
        transformed_metrics = transform_growthbook_metrics(gb_metrics)

        # Update session state with the transformed metrics
        st.session_state.metrics = transformed_metrics
        logging.info(f"Successfully loaded and transformed {len(transformed_metrics)} metrics from Growthbook API")

        return True

    except Exception as e:
        logging.error(f"Error loading metrics from Growthbook API: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        st.error(f"Error loading metrics from Growthbook API: {str(e)}")
        st.session_state.metrics = []  # Empty list, don't use sample data
        return False

def load_metrics_from_growthbook_directory(st):
    """
    Load metrics from the metrics_data.json file
    
    Args:
        st: Streamlit session state
        
    Returns:
        bool: True if metrics were loaded successfully, False otherwise
    """
    try:
        # Define paths
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(current_dir)
        metrics_file = os.path.join(project_dir, "growthbook", "metrics", "metrics_data.json")
        
        # Check if the file exists
        if not os.path.exists(metrics_file):
            logging.warning(f"Metrics data file not found: {metrics_file}")
            return False
            
        # Load metrics from the file
        try:
            with open(metrics_file, 'r') as f:
                data = json.load(f)
                raw_metrics = data.get("metrics", [])
                
            if not raw_metrics:
                logging.warning("No metrics found in metrics_data.json")
                return False
                
            # Transform the metrics to the expected format
            transformed_metrics = transform_growthbook_metrics(raw_metrics)
            st.session_state.metrics = transformed_metrics
            logging.info(f"Successfully loaded {len(transformed_metrics)} metrics from metrics_data.json")
            
            return True
            
        except Exception as e:
            logging.error(f"Error loading metrics from metrics_data.json: {str(e)}")
            return False
            
    except Exception as e:
        logging.error(f"Error in load_metrics_from_growthbook_directory: {str(e)}")
        logging.error(traceback.format_exc())
        return False


def process_local_github_metric(metric_data):
    """
    Process a single metric from the local GitHub metrics file

    Args:
        metric_data: Dictionary containing the raw metric data

    Returns:
        Processed metric data or None if processing failed
    """
    try:
        # Process the metric data (normalized fields)
        processed_metric = normalize_metric_data(metric_data)

        # Ensure required fields exist
        processed_metric.setdefault('tags', [])
        processed_metric.setdefault('userIdTypes', [])
        processed_metric.setdefault('archived', False)
        processed_metric.setdefault('behavior', {})

        # Convert projects to list if it's not already
        if 'projects' in processed_metric and not isinstance(processed_metric['projects'], list):
            processed_metric['projects'] = [processed_metric['projects']]
        elif 'projects' not in processed_metric:
            processed_metric['projects'] = []

        return processed_metric

    except Exception as e:
        logging.warning(f"Could not process metric {metric_data.get('name', 'unknown')}: {str(e)}")
        return None


def load_metrics_from_github_local(st):
    """
    Load metrics from the local github_metrics_data.json file

    Args:
        st: Streamlit session state

    Returns:
        bool: True if metrics were loaded successfully, False otherwise
    """
    try:
        # Define paths
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(current_dir)
        metrics_file = os.path.join(project_dir, "metrics", "github_metrics_data.json")

        # Check if the file exists
        if not os.path.exists(metrics_file):
            logging.warning(f"GitHub metrics data file not found: {metrics_file}")
            return False

        # Load metrics from the file
        try:
            with open(metrics_file, 'r') as f:
                data = json.load(f)
                raw_metrics = data.get("metrics", [])

            if not raw_metrics:
                logging.warning("No metrics found in github_metrics_data.json")
                return False

            # Process each metric individually
            processed_metrics = []
            for raw_metric in raw_metrics:
                processed_metric = process_local_github_metric(raw_metric)
                if processed_metric:
                    processed_metrics.append(processed_metric)

            if not processed_metrics:
                logging.warning("No metrics were successfully processed")
                return False

            # Update session state with processed metrics
            st.session_state.metrics = processed_metrics
            logging.info(f"Successfully loaded {len(processed_metrics)} metrics from github_metrics_data.json")

            return True

        except Exception as e:
            logging.error(f"Error loading metrics from github_metrics_data.json: {str(e)}")
            return False

    except Exception as e:
        logging.error(f"Error in load_metrics_from_github_local: {str(e)}")
        logging.error(traceback.format_exc())

def initialize_metrics(st, dev_mode=False):
    """
    Initialize metrics in session state

    Args:
        st: Streamlit session state
        dev_mode: Whether to run in development mode
    """
    # Initialize the refresh flag if it doesn't exist
    if 'metrics_need_refresh' not in st.session_state:
        st.session_state.metrics_need_refresh = True
        
    # Initialize metrics source if not set
    if st.session_state.metrics_source is None:
        # In dev mode, default to loading from local files
        if dev_mode:
            # st.session_state.metrics_source = "growthbook"  # Default to Growthbook in dev mode
            logging.info("DEV MODE: Initializing with empty metrics until user selects a source")
            if 'metrics' not in st.session_state:
                st.session_state.metrics = []  # Empty array, no sample data
            return  # Exit early, wait for user to select a source
        else:
            # In production, initialize with empty metrics array until user makes a selection
            logging.info("PRODUCTION MODE: Initializing with empty metrics until user selects a source")
            if 'metrics' not in st.session_state:
                st.session_state.metrics = []  # Empty array, no sample data
            return  # Exit early, wait for user to select a source
        
    # Only refresh if needed and a source is selected
    if st.session_state.metrics_need_refresh and st.session_state.metrics_source:
        success = False
        
        # Use a simple if/elif structure to ensure only one source is tried
        if st.session_state.metrics_source == "growthbook":
            # Growthbook source selected

            if dev_mode:
                logging.info("DEV MODE: Attempting to load metrics from growthbook/metrics/individual directory")
                success = load_metrics_from_growthbook_directory(st)

                if success:
                    logging.info(f"Successfully loaded {len(st.session_state.metrics)} metrics from growthbook/metrics/individual")
            else:
                # If local files fail, try API in dev mode
                logging.info("PROD MODE: Attempting to load metrics via API")
                success = load_metrics_from_growthbook_api(st)
                #if no connection, fallback to local
                if not success:
                    success = load_metrics_from_growthbook_directory(st)

                
        elif st.session_state.metrics_source == "github":
            # GitHub source selected
            logging.info("Attempting to load metrics from GitHub repository")
            if dev_mode:
                logging.info("DEV MODE: Attempting to load metrics from GitHub repository")
                success = load_metrics_from_github_local(st)
                if success:
                    logging.info(f"Successfully loaded {len(st.session_state.metrics)} metrics from local github metrics directory")
            else:
                logging.info("PROD MODE: Attempting to load metrics via Github Client connection")
                success = refresh_metrics_from_repository(st)

                if success:
                    logging.info(f"Successfully loaded {len(st.session_state.metrics)} metrics from GitHub repository")
                else:
                    logging.warning("Failed to load metrics from GitHub repository")
                    #Fallnack to local github data
                    success = load_metrics_from_github_local(st)
        
        # If the selected source failed, show an error but don't fall back to sample data
        if not success:
            logging.info(f"Failed to load metrics from {st.session_state.metrics_source}")
            # Don't set sample data - keep the empty list from the error handlers
            if 'metrics' not in st.session_state:
                st.session_state.metrics = []
            
        # Reset the refresh flag
        st.session_state.metrics_need_refresh = False
