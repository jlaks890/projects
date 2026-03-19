"""
GitHub integration service for metric governance
"""
import os
import time
import urllib.parse
import json  # Always available in Python standard library
from typing import Dict, List, Tuple, Optional, Any

# Import the metric template function
from modules.utils import create_metric_template

# Try to import yaml, but provide fallback
try:
    import yaml

    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    # We'll use JSON as a fallback

# Try to import PyGithub, but provide fallback
try:
    from github import Github

    GITHUB_AVAILABLE = True
except ImportError:
    GITHUB_AVAILABLE = False

import streamlit as st
from modules.github_user_auth import get_github_client as get_oauth_github_client
# from modules.github_app import get_github_app_token


def get_user_identity():
    """
    Get the user's identity (LDAP or OS username)

    Returns:
        str: User's identity
    """
    # First try to get LDAP from session state (if set in settings)
    if 'user_ldap' in st.session_state and st.session_state.user_ldap:
        return st.session_state.user_ldap

    # Otherwise, use OS username as fallback
    return os.getlogin()


def get_github_client():
    """
    Get GitHub client

    Returns:
        Github client or None if not available
    """
    if not GITHUB_AVAILABLE:
        st.info("PyGithub is not installed. GitHub integration will be in mock mode.")
        return None

    # Authentication priority:
    # 1. OAuth client
    # 2. Mock mode

    # Next, try to get the OAuth client
    oauth_client = get_oauth_github_client()
    if oauth_client:
        return oauth_client

    else:
        st.info("GitHub token not found. Using mock mode for development.")
        token = None
        return token


def initialize_github_session_state():
    """Initialize GitHub-related session state variables"""
    if 'github_branch_name' not in st.session_state:
        # Branch name will be set when first commit is made
        st.session_state.github_branch_name = None

    if 'github_commits' not in st.session_state:
        # Track commits made in the current session
        st.session_state.github_commits = []

    if 'github_metrics_staged' not in st.session_state:
        # Track metrics that have been staged (committed but not PR'd)
        st.session_state.github_metrics_staged = []


def commit_metric_change(metric_data: Dict[str, Any]) -> Tuple[bool, str, bool]:
    """
    Commit a metric change to the branch without creating a PR

    Args:
        metric_data: Dictionary containing metric definition

    Returns:
        tuple: (success, message, is_mock)
            - success: Boolean indicating if commit was successful
            - message: Message describing the result
            - is_mock: Boolean indicating if this is a mock commit
    """
    # Initialize GitHub session state if needed
    initialize_github_session_state()

    # Get GitHub client
    github_client = get_github_client()

    # If GitHub client is not available, use mock mode
    if not github_client:
        # Mock commit
        time.sleep(0.5)  # Simulate network delay
        commit_id = int(time.time())

        # Create a clean copy of the metric data using the template function
        # First, extract all necessary fields from the incoming metric_data
        name = metric_data.get("name", "")
        description = metric_data.get("description", "")
        owner = metric_data.get("owner", "")
        metric_type = metric_data.get("type", "binary")
        
        # Handle project field (could be string or list in projects field)
        if metric_data.get("projects") and isinstance(metric_data.get("projects"), list):
            project = metric_data.get("projects")[0] if metric_data.get("projects") else "Growth"
        else:
            project = metric_data.get("project", "Growth")
            
        sql = metric_data.get("sql", "")
        
        # Handle window settings
        window_value = 7
        window_unit = "days"
        if metric_data.get("behavior") and metric_data.get("behavior").get("windowSettings"):
            window_settings = metric_data.get("behavior").get("windowSettings")
            window_value = window_settings.get("windowValue", window_value)
            window_unit = window_settings.get("windowUnit", window_unit)
        elif metric_data.get("time_window"):
            # Try to parse old format
            import re
            match = re.match(r"(\d+)([a-zA-Z]+)", metric_data.get("time_window", "7d"))
            if match:
                value, unit = match.groups()
                window_value = int(value)
                from modules.utils import UNIT_FULL_MAPPING
                window_unit = UNIT_FULL_MAPPING.get(unit, "days")
        
        # Get dates
        date_created = metric_data.get("dateCreated", None)
        date_updated = metric_data.get("dateUpdated", None)
        
        # Get archived status
        archived = metric_data.get("archived", False)

        # Get user ID types
        user_id_types = metric_data.get("userIdTypes", [])
        
        # Create clean metric data using the template
        clean_metric_data = create_metric_template(
            name=name,
            description=description,
            owner=owner,
            metric_type=metric_type,
            project=project,
            sql=sql,
            window_value=window_value,
            window_unit=window_unit,
            archived=archived,
            user_id_types=user_id_types,
            date_created=date_created,
            date_updated=date_updated
        )

        # Check if this is explicitly marked as an update
        is_update = False
        if "_is_update" in metric_data and metric_data["_is_update"]:
            is_update = True
        else:
            # Otherwise check if the metric already exists in staged metrics
            is_update = any(m["name"] == clean_metric_data["name"] for m in st.session_state.github_metrics_staged)

        # Store commit info in session state
        st.session_state.github_commits.append({
            "metric_name": clean_metric_data["name"],
            "commit_id": f"mock_{commit_id}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": "update" if is_update else "add"
        })

        # Store or update metric in staged metrics
        existing_index = next((i for i, m in enumerate(st.session_state.github_metrics_staged)
                               if m["name"] == clean_metric_data["name"]), None)
        if existing_index is not None:
            st.session_state.github_metrics_staged[existing_index] = clean_metric_data
        else:
            st.session_state.github_metrics_staged.append(clean_metric_data)

        return (True, f"Mock commit created with ID: {commit_id}", True)

    try:
        # Get repository using settings from session state or defaults
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')
        repo_path = f"{repo_owner}/{repo_name}"

        # Get repository
        repo = github_client.get_repo(repo_path)

        # Get or create branch
        default_branch = st.session_state.get('github_default_branch', 'main')
        user_id = get_user_identity()

        # NEW CODE: Sync branch with base before making changes
        if st.session_state.github_branch_name:  # Only sync if branch already exists
            branch_name = st.session_state.github_branch_name  # Set branch_name here before using it
            sync_result = sync_branch_with_base(repo, branch_name, default_branch)
            if not sync_result:
                st.warning("Could not sync branch with latest changes. Continuing with current branch state.")

        if not st.session_state.github_branch_name:
            # First commit - create a new branch
            timestamp = int(time.time())
            branch_name = f"{user_id}_metric_updates_{timestamp}"
            source = repo.get_branch(default_branch)
            repo.create_git_ref(f"refs/heads/{branch_name}", source.commit.sha)
            st.session_state.github_branch_name = branch_name
        else:
            # Use existing branch
            branch_name = st.session_state.github_branch_name

        # Create a clean copy of the metric data using the template function
        # First, extract all necessary fields from the incoming metric_data
        name = metric_data.get("name", "")
        description = metric_data.get("description", "")
        owner = metric_data.get("owner", "")
        metric_type = metric_data.get("type", "binary")
        
        # Handle project field (could be string or list in projects field)
        if metric_data.get("projects") and isinstance(metric_data.get("projects"), list):
            project = metric_data.get("projects")[0] if metric_data.get("projects") else "Growth"
        else:
            project = metric_data.get("project", "Growth")
            
        sql = metric_data.get("sql", "")
        
        # Handle window settings
        window_value = 7
        window_unit = "days"
        if metric_data.get("behavior") and metric_data.get("behavior").get("windowSettings"):
            window_settings = metric_data.get("behavior").get("windowSettings")
            window_value = window_settings.get("windowValue", window_value)
            window_unit = window_settings.get("windowUnit", window_unit)
        elif metric_data.get("time_window"):
            # Try to parse old format
            import re
            match = re.match(r"(\d+)([a-zA-Z]+)", metric_data.get("time_window", "7d"))
            if match:
                value, unit = match.groups()
                window_value = int(value)
                from modules.utils import UNIT_FULL_MAPPING
                window_unit = UNIT_FULL_MAPPING.get(unit, "days")
        
        # Get dates
        date_created = metric_data.get("dateCreated", None)
        date_updated = metric_data.get("dateUpdated", None)
        
        # Get archived status
        archived = metric_data.get("archived", False)

        # Get user ID types
        user_id_types = metric_data.get("userIdTypes", [])

        # Create clean metric data using the template
        clean_metric_data = create_metric_template(
            name=name,
            description=description,
            owner=owner,
            metric_type=metric_type,
            project=project,
            sql=sql,
            window_value=window_value,
            window_unit=window_unit,
            archived=archived,
            user_id_types=user_id_types,
            date_created=date_created,
            date_updated=date_updated
        )

        # Prepare metric content - use yaml if available, otherwise use json
        if YAML_AVAILABLE:
            content = yaml.dump(clean_metric_data, sort_keys=False)
            file_extension = "yaml"
        else:
            content = json.dumps(clean_metric_data, indent=2)
            file_extension = "json"

        #NO PROJECT FOLDER NEEDED
        # # Determine project folder - get first project from list or use project field
        # if clean_metric_data.get("projects") and isinstance(clean_metric_data.get("projects"), list) and len(clean_metric_data.get("projects")) > 0:
        #     project_folder = clean_metric_data["projects"][0].lower()
        # else:
        #     project_folder = clean_metric_data.get("project", "other").lower()
            
        # File path for the metric
        file_path = f"metrics/{clean_metric_data['name']}.{file_extension}"

        # File path for the SQL file
        sql_file_path = f"metrics/{clean_metric_data['name']}.sql"

        # Extract SQL content from the metric data
        sql_content = clean_metric_data.get("sql", "")

        # Check if directory exists, create if not
        dir_path = os.path.dirname(file_path)
        try:
            repo.get_contents(dir_path, ref=branch_name)
        except:
            repo.create_file(
                f"{dir_path}/.gitkeep",
                f"Create directory for {clean_metric_data['name']}",
                "",
                branch=branch_name
            )

        # Check if this is explicitly marked as an update
        is_update = False
        if "_is_update" in metric_data and metric_data["_is_update"]:
            is_update = True

        # Check if file exists
        try:
            contents = repo.get_contents(file_path, ref=branch_name)
            commit = repo.update_file(
                file_path,
                f"Update metric: {metric_data['name']}",
                content,
                contents.sha,
                branch=branch_name
            )
            action = "update"
        except:
            commit = repo.create_file(
                file_path,
                f"Add new metric: {metric_data['name']}",
                content,
                branch=branch_name
            )
            action = "add"

        # Then, update or create the SQL file
        try:
            sql_contents = repo.get_contents(sql_file_path, ref=branch_name)
            sql_commit = repo.update_file(
                sql_file_path,
                f"{action.capitalize()} metric: {metric_data['name']} (SQL definition)",
                sql_content,
                sql_contents.sha,
                branch=branch_name
            )
        except:
            sql_commit = repo.create_file(
                sql_file_path,
                f"{action.capitalize()} metric: {metric_data['name']} (SQL definition)",
                sql_content,
                branch=branch_name
            )

        # Override action if explicitly marked as update
        if is_update:
            action = "update"

        # Store commit info in session state
        commit_info = {
            "metric_name": clean_metric_data["name"],
            "commit_id": commit["commit"].sha,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": action
        }
        st.session_state.github_commits.append(commit_info)

        # Store or update metric in staged metrics
        existing_index = next((i for i, m in enumerate(st.session_state.github_metrics_staged)
                               if m["name"] == clean_metric_data["name"]), None)
        if existing_index is not None:
            st.session_state.github_metrics_staged[existing_index] = clean_metric_data
        else:
            st.session_state.github_metrics_staged.append(clean_metric_data)

        return (True, f"Successfully committed changes for metric: {clean_metric_data['name']}", False)
    except Exception as e:
        error_msg = f"Error committing changes: {str(e)}"
        st.error(error_msg)

        # Provide specific guidance based on error type
        if "Resource not accessible by integration" in str(e):
            st.error("Organization access issue: You need to authorize this app for the squareup organization.")
            st.info("""
            ### How to Fix Organization Access

            1. Go to [GitHub Settings > Applications](https://github.com/settings/connections/applications/)
            2. Find this OAuth application
            3. Click on it to view details
            4. Under "Organization access", find "squareup"
            5. Click "Grant" to authorize access
            6. Refresh this page
            """)
        elif "Not Found" in str(e) and "squareup" in str(e):
            st.error("Repository access issue: You may not have access to the repository.")
            st.info("""
            Make sure you have access to the repository. If you're using a personal access token,
            ensure it has the 'repo' scope and is authorized for SAML SSO.
            """)

        # Fall back to mock mode
        st.info("Falling back to mock mode for development...")
        time.sleep(0.5)
        commit_id = int(time.time())

        # Create a clean copy of the metric data using the template function
        # First, extract all necessary fields from the incoming metric_data
        name = metric_data.get("name", "")
        description = metric_data.get("description", "")
        owner = metric_data.get("owner", "")
        metric_type = metric_data.get("type", "binary")
        
        # Handle project field (could be string or list in projects field)
        if metric_data.get("projects") and isinstance(metric_data.get("projects"), list):
            project = metric_data.get("projects")[0] if metric_data.get("projects") else "Growth"
        else:
            project = metric_data.get("project", "Growth")
            
        sql = metric_data.get("sql", "")
        
        # Handle window settings
        window_value = 7
        window_unit = "days"
        if metric_data.get("behavior") and metric_data.get("behavior").get("windowSettings"):
            window_settings = metric_data.get("behavior").get("windowSettings")
            window_value = window_settings.get("windowValue", window_value)
            window_unit = window_settings.get("windowUnit", window_unit)
        elif metric_data.get("time_window"):
            # Try to parse old format
            import re
            match = re.match(r"(\d+)([a-zA-Z]+)", metric_data.get("time_window", "7d"))
            if match:
                value, unit = match.groups()
                window_value = int(value)
                from modules.utils import UNIT_FULL_MAPPING
                window_unit = UNIT_FULL_MAPPING.get(unit, "days")
        
        # Get dates
        date_created = metric_data.get("dateCreated", None)
        date_updated = metric_data.get("dateUpdated", None)
        
        # Get archived status
        archived = metric_data.get("archived", False)

        # Get user ID types
        user_id_types = metric_data.get("userIdTypes", [])

        # Create clean metric data using the template
        clean_metric_data = create_metric_template(
            name=name,
            description=description,
            owner=owner,
            metric_type=metric_type,
            project=project,
            sql=sql,
            window_value=window_value,
            window_unit=window_unit,
            archived=archived,
            user_id_types=user_id_types,
            date_created=date_created,
            date_updated=date_updated
        )

        # Check if this is explicitly marked as an update
        is_update = False
        if "_is_update" in metric_data and metric_data["_is_update"]:
            is_update = True
        else:
            # Otherwise check if the metric already exists in staged metrics
            is_update = any(m["name"] == clean_metric_data["name"] for m in st.session_state.github_metrics_staged)

        # Store commit info in session state
        st.session_state.github_commits.append({
            "metric_name": clean_metric_data["name"],
            "commit_id": f"mock_{commit_id}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": "update" if is_update else "add"
        })

        # Store or update metric in staged metrics
        existing_index = next((i for i, m in enumerate(st.session_state.github_metrics_staged)
                               if m["name"] == clean_metric_data["name"]), None)
        if existing_index is not None:
            st.session_state.github_metrics_staged[existing_index] = clean_metric_data
        else:
            st.session_state.github_metrics_staged.append(clean_metric_data)

        return (True, f"Mock commit created with ID: {commit_id} (due to GitHub access issue)", True)


def create_pr_from_commits() -> Tuple[Optional[str], bool]:
    """
    Create a pull request from the commits made in the current session

    Returns:
        tuple: (pr_url, is_mock_pr)
            - pr_url: URL of the created PR or None if failed
            - is_mock_pr: Boolean indicating if this is a mock PR (True) or real PR (False)
    """
    # Check if there are any commits to create a PR from
    if not st.session_state.get('github_commits', []):
        st.warning("No commits to create a PR from. Please commit changes first.")
        return (None, False)

    # Get GitHub client
    github_client = get_github_client()

    # If GitHub client is not available, use mock mode
    if not github_client:
        # Mock PR URL for testing
        time.sleep(1)  # Simulate network delay
        mock_pr_id = int(time.time())

        # Get repository info from session state or use defaults
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')

        mock_pr_url = f"https://github.com/{repo_owner}/{repo_name}/pull/{mock_pr_id}"
        st.success(f"Mock PR created with ID: {mock_pr_id}")

        # Clear session state for next batch of commits
        st.session_state.github_branch_name = None
        st.session_state.github_commits = []
        st.session_state.github_metrics_staged = []

        return (mock_pr_url, True)

    try:
        # Get repository using settings from session state or defaults
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')
        repo_path = f"{repo_owner}/{repo_name}"

        # Get repository
        repo = github_client.get_repo(repo_path)

        # Get branch name
        branch_name = st.session_state.github_branch_name
        if not branch_name:
            st.error("No branch found. Please commit changes first.")
            return (None, False)

        # Get user identity
        user_id = get_user_identity()

        # Create PR title and body
        metric_names = [commit["metric_name"] for commit in st.session_state.github_commits]
        unique_metrics = list(set(metric_names))

        if len(unique_metrics) == 1:
            pr_title = f"Metric change"
        else:
            pr_title = f"Metrics change"
            # if len(unique_metrics) > 3:
            #     pr_title += f" and {len(unique_metrics) - 3} more"

        # Generate PR body with list of metrics
        pr_body = f"""
## Metric Updates

**Submitted By**: {user_id}

### Metrics Modified:
"""

        for metric in st.session_state.github_metrics_staged:
            if metric.get("_deleted", False):
                # Get project - could be in 'project' or 'projects'
                project_display = ""
                if metric.get("projects") and isinstance(metric.get("projects"), list):
                    project_display = ", ".join(metric["projects"])
                else:
                    project_display = metric.get("project", "N/A")
                
                pr_body += f"""
- **{metric['name']}** (DELETED)
  - Project: {project_display}
  - Owner: {metric['owner']}
"""
            else:
                # Get project - could be in 'project' or 'projects'
                project_display = ""
                if metric.get("projects") and isinstance(metric.get("projects"), list):
                    project_display = ", ".join(metric["projects"])
                else:
                    project_display = metric.get("project", "N/A")
                
                pr_body += f"""
- **{metric['name']}**
  - Project: {project_display}
  - Owner: {metric['owner']}
  - Type: {metric['type']}
  - Description: {metric['description'][:100]}{'...' if len(metric['description']) > 100 else ''}
"""

        # Add reviewers section
        pr_body += """
### Reviewers
- Project DRI

Please review these metric definitions.
"""

        # URL encode the PR title and body
        encoded_title = urllib.parse.quote(pr_title)
        encoded_body = urllib.parse.quote(pr_body)

        # Get default branch
        default_branch = st.session_state.get('github_default_branch', 'main')

        # Generate the PR creation URL
        pr_creation_url = (
            f"https://github.com/{repo_owner}/{repo_name}/compare/{default_branch}...{branch_name}"
            f"?expand=1&title={encoded_title}&body={encoded_body}"
        )

        # Clear session state for next batch of commits
        # st.session_state.github_branch_name = None
        st.session_state.github_commits = []
        st.session_state.github_metrics_staged = []

        return(pr_creation_url, False)

    except Exception as e:
        error_msg = f"Error creating PR: {str(e)}"
        st.error(error_msg)
        return (None, False)


##NO LONGER USED
def create_metric_pr(metric_data):
    """
    Create a pull request for a new or updated metric

    Args:
        metric_data: Dictionary containing metric definition

    Returns:
        tuple: (pr_url, is_mock_pr)
            - pr_url: URL of the created PR or None if failed
            - is_mock_pr: Boolean indicating if this is a mock PR (True) or real PR (False)
    """
    # Get GitHub client
    github_client = get_github_client()

    # If GitHub client is not available, use mock mode
    if not github_client:
        # Mock PR URL for testing
        time.sleep(1)  # Simulate network delay
        mock_pr_id = int(time.time())

        # Get repository info from session state or use defaults
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')

        mock_pr_url = f"https://github.com/{repo_owner}/{repo_name}/pull/{mock_pr_id}"
        st.success(f"Mock PR created with ID: {mock_pr_id}")
        return (mock_pr_url, True)  # Return URL and flag indicating this is a mock PR

    try:
        # Get repository using settings from session state or defaults
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')
        repo_path = f"{repo_owner}/{repo_name}"

        # Get repository
        repo = github_client.get_repo(repo_path)

        # Create a new branch using user's identity
        default_branch = st.session_state.get('github_default_branch', 'main')
        source = repo.get_branch(default_branch)

        # Get user identity for branch name
        user_id = get_user_identity()

        # Create a clean copy of the metric data without temporary fields
        clean_metric_data = {k: v for k, v in metric_data.items() if not k.startswith('_')}

        # Create branch name with user identity
        timestamp = int(time.time())
        branch_name = f"{user_id}_metric_update_{timestamp}"

        # Create the branch
        repo.create_git_ref(f"refs/heads/{branch_name}", source.commit.sha)

        # Prepare metric content - use yaml if available, otherwise use json
        if YAML_AVAILABLE:
            content = yaml.dump(clean_metric_data, sort_keys=False)
            file_extension = "yaml"
        else:
            content = json.dumps(clean_metric_data, indent=2)
            file_extension = "json"
            st.info("Using JSON format instead of YAML (PyYAML not available)")

        # File path for the metric - use Dev/sq-experimentation-dev/metrics directory
        file_path = f"metrics/{clean_metric_data['project'].lower()}/{clean_metric_data['name']}.{file_extension}"

        # Check if directory exists, create if not
        dir_path = os.path.dirname(file_path)
        try:
            repo.get_contents(dir_path)
        except:
            repo.create_file(
                f"{dir_path}/.gitkeep",
                f"Create directory for {clean_metric_data['project']} metrics",
                "",
                branch=branch_name
            )

        # Check if file exists
        try:
            contents = repo.get_contents(file_path)
            repo.update_file(
                file_path,
                f"Update metric: {clean_metric_data['name']}",
                content,
                contents.sha,
                branch=branch_name
            )
        except:
            repo.create_file(
                file_path,
                f"Add new metric: {clean_metric_data['name']}",
                content,
                branch=branch_name
            )

        # Create a pull request
        pr = repo.create_pull(
            title=f"Metric: {clean_metric_data['name']}",
            body=f"""
## Metric Update: {clean_metric_data['name']}

**Project**: {clean_metric_data['project']}
**Owner**: {clean_metric_data['owner']}
**Type**: {clean_metric_data['type']}
**Submitted By**: {user_id}

{clean_metric_data['description']}

### Reviewers
- {clean_metric_data.get('reviewer', 'TBD')}
- Project DRI

Please review this metric definition.
            """,
            head=branch_name,
            base=default_branch
        )

        # Add reviewers if specified
        if clean_metric_data.get('reviewer'):
            try:
                pr.add_to_reviewers([clean_metric_data['reviewer']])
            except:
                pass  # Skip if reviewer doesn't exist

        return (pr.html_url, False)  # Return URL and flag indicating this is a real PR
    except Exception as e:
        st.error(f"Error creating PR: {str(e)}")
        return (None, False)


def delete_metric_from_repo(metric_data: Dict[str, Any]) -> Tuple[bool, str, bool]:
    """
    Delete a metric file from the repository
    
    Args:
        metric_data: Dictionary containing metric definition
        
    Returns:
        tuple: (success, message, is_mock)
            - success: Boolean indicating if deletion was successful
            - message: Message describing the result
            - is_mock: Boolean indicating if this is a mock deletion
    """
    # Initialize GitHub session state if needed
    initialize_github_session_state()
    
    # Get GitHub client
    github_client = get_github_client()
    
    # If GitHub client is not available, use mock mode
    if not github_client:
        # Mock deletion
        time.sleep(0.5)  # Simulate network delay
        
        # Store delete action in session state
        st.session_state.github_commits.append({
            "metric_name": metric_data["name"],
            "commit_id": f"mock_{int(time.time())}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": "delete"
        })
        
        # Find the metric in staged metrics if it exists
        existing_index = next((i for i, m in enumerate(st.session_state.github_metrics_staged)
                              if m["name"] == metric_data["name"]), None)
        if existing_index is not None:
            # Mark the metric as deleted instead of removing it
            st.session_state.github_metrics_staged[existing_index]["_deleted"] = True
        else:
            # If the metric isn't in staged metrics yet, add it with the deleted flag
            metric_copy = metric_data.copy()
            metric_copy["_deleted"] = True
            st.session_state.github_metrics_staged.append(metric_copy)
        
        return (True, f"Mock deletion of metric: {metric_data['name']}", True)
    
    try:
        # Get repository using settings from session state or defaults
        repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
        repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')
        repo_path = f"{repo_owner}/{repo_name}"
        
        # Get repository
        repo = github_client.get_repo(repo_path)
        
        # Get or create branch
        default_branch = st.session_state.get('github_default_branch', 'main')
        user_id = get_user_identity()
        
        # Check if we have an existing branch
        if not st.session_state.github_branch_name:
            # First action - create a new branch
            timestamp = int(time.time())
            branch_name = f"{user_id}_metric_updates_{timestamp}"
            source = repo.get_branch(default_branch)
            repo.create_git_ref(f"refs/heads/{branch_name}", source.commit.sha)
            st.session_state.github_branch_name = branch_name
        else:
            # Use existing branch
            branch_name = st.session_state.github_branch_name
            
            # Sync branch with base
            sync_result = sync_branch_with_base(repo, branch_name, default_branch)
            if not sync_result:
                st.warning("Could not sync branch with latest changes. Continuing with current branch state.")
        
        # Try to find the metric file in both yaml and json formats
        file_extensions = ["yaml", "yml", "json"]
        file_found = False
        file_path = None
        file_sha = None

        # Also track SQL file
        sql_file_found = False
        sql_file_path = None
        sql_file_sha = None
        
        # Check all possible project folders (in case the project was renamed)
        # Start with the current project
        #NO PROJECT FOLDER NEEDED
        # project_folders = [metric_data['project'].lower()]
        #
        # # Add all other project folders
        # for project in st.session_state.projects:
        #     project_folder = project.lower()
        #     if project_folder not in project_folders:
        #         project_folders.append(project_folder)
        
        # Try to find the file in any project folder with any extension
        # for project_folder in project_folders:
        for ext in file_extensions:
            try:
                path = f"metrics/{metric_data['name']}.{ext}"
                contents = repo.get_contents(path, ref=branch_name)
                file_found = True
                file_path = path
                file_sha = contents.sha
                break
            except:
                continue

        if file_found:
            try:
                sql_path = f"metrics/{metric_data['name']}.sql"
                sql_contents = repo.get_contents(sql_path, ref=branch_name)
                sql_file_found = True
                sql_file_path = sql_path
                sql_file_sha = sql_contents.sha
            except:
                # SQL file might not exist, which is fine
                pass
        # break
        
        if not file_found:
            return (False, f"Metric file for '{metric_data['name']}' not found in repository", False)
        
        # Delete the file
        commit = repo.delete_file(
            file_path,
            f"Delete metric: {metric_data['name']}",
            file_sha,
            branch=branch_name
        )

        # Delete the SQL file if it was found
        sql_commit = repo.delete_file(
            sql_file_path,
            f"Delete metric: {metric_data['name']} (SQL definition)",
            sql_file_sha,
            branch=branch_name
        )
        
        # Store commit info in session state
        commit_info = {
            "metric_name": metric_data["name"],
            "commit_id": commit["commit"].sha,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": "delete"
        }
        st.session_state.github_commits.append(commit_info)
        
        # Find the metric in staged metrics if it exists
        existing_index = next((i for i, m in enumerate(st.session_state.github_metrics_staged)
                              if m["name"] == metric_data["name"]), None)
        if existing_index is not None:
            # Mark the metric as deleted instead of removing it
            st.session_state.github_metrics_staged[existing_index]["_deleted"] = True
        else:
            # If the metric isn't in staged metrics yet, add it with the deleted flag
            metric_copy = metric_data.copy()
            metric_copy["_deleted"] = True
            st.session_state.github_metrics_staged.append(metric_copy)
        
        return (True, f"Successfully deleted metric: {metric_data['name']}", False)
        
    except Exception as e:
        error_msg = f"Error deleting metric: {str(e)}"
        st.error(error_msg)
        
        # Fall back to mock mode
        st.info("Falling back to mock mode for development...")
        time.sleep(0.5)
        
        # Store delete action in session state
        st.session_state.github_commits.append({
            "metric_name": metric_data["name"],
            "commit_id": f"mock_{int(time.time())}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": "delete"
        })
        
        # Find the metric in staged metrics if it exists
        existing_index = next((i for i, m in enumerate(st.session_state.github_metrics_staged)
                              if m["name"] == metric_data["name"]), None)
        if existing_index is not None:
            # Mark the metric as deleted instead of removing it
            st.session_state.github_metrics_staged[existing_index]["_deleted"] = True
        else:
            # If the metric isn't in staged metrics yet, add it with the deleted flag
            metric_copy = metric_data.copy()
            metric_copy["_deleted"] = True
            st.session_state.github_metrics_staged.append(metric_copy)
        
        return (True, f"Mock deletion of metric: {metric_data['name']} (due to GitHub access issue)", True)


def sync_branch_with_base(repo, branch_name, base_branch):
    """
    Sync a branch with the base branch to ensure it has the latest changes

    Args:
        repo: GitHub repository object
        branch_name: Name of the branch to sync
        base_branch: Name of the base branch to sync with

    Returns:
        bool: True if sync was successful, False otherwise
    """
    try:
        # Get the latest commit from the base branch
        base_ref = repo.get_branch(base_branch)
        base_sha = base_ref.commit.sha

        # Get the current branch reference
        branch_ref = repo.get_branch(branch_name)
        branch_sha = branch_ref.commit.sha

        # If the branch is already up to date, no need to do anything
        if branch_sha == base_sha:
            return True

        # Create a merge commit to sync the branch
        merge_result = repo.merge(
            branch_name,
            base_sha,
            f"Sync branch '{branch_name}' with latest changes from '{base_branch}'"
        )

        return True
    except Exception as e:
        st.warning(f"Could not sync branch with base: {str(e)}")
        return False
