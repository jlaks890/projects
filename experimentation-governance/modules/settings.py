"""Settings tab functionality for configuring the app.

This module provides functions for rendering the settings tab and
handling configuration of GitHub and Growthbook integrations.
"""

import os
import streamlit as st
from modules.ui_components import apply_form_button_styling, wrap_form_with_validation, close_validation_wrapper
from modules.github_user_auth import render_github_login
from modules.github_service import get_github_client, get_user_identity

try:
    from growthbook.settings import render_growthbook_settings
    GROWTHBOOK_AVAILABLE = True
except ImportError:
    GROWTHBOOK_AVAILABLE = False

def render_settings_tab():
    """Render the settings tab with GitHub and Growthbook configuration options."""
    st.title("Settings")
    
    # Create tabs for different settings sections
    github_tab, growthbook_tab = st.tabs(["GitHub", "Growthbook"])
    
    with github_tab:
        render_github_settings()
    
    with growthbook_tab:
        render_growthbook_tab()

def render_github_settings():
    """Render GitHub settings section."""
    st.header("GitHub Integration")
    
    # GitHub App user authentication (OAuth)
    st.write("### GitHub App Authentication (Recommended)")
    st.info("GitHub Apps are Square's recommended approach for GitHub integration.")
    render_github_login()
    
    # GitHub repository configuration
    st.subheader("Repository Configuration")
    
    # Repository settings form
    with st.form("github_settings"):
        # Repository owner
        repo_owner = st.text_input(
            "Repository Owner",
            value=st.session_state.get('github_repo_owner', 'jlaks-block'),
            help="GitHub username or organization that owns the repository"
        )
        
        # Repository name
        repo_name = st.text_input(
            "Repository Name",
            value=st.session_state.get('github_repo_name', 'metric-governance-dev'),
            help="Name of the repository where metrics will be stored"
        )
        
        # Base branch
        base_branch = st.text_input(
            "Base Branch",
            value=st.session_state.get('github_default_branch', 'main'),
            help="The branch that PRs will be created against"
        )
        
        # Form validation
        is_valid = True
        validation_message = ""
        
        # Apply custom styling to form buttons
        apply_form_button_styling()
        
        # Add validation wrapper if needed
        close_div_later = wrap_form_with_validation(is_valid)
        
        # Submit button text based on validation
        submit_text = "Save Settings" if is_valid else "Please check your settings"
        
        # Submit button
        submitted = st.form_submit_button(submit_text)
        
        if submitted:
            if not is_valid:
                st.error(validation_message)
            else:
                # Update session state with form values
                st.session_state.github_repo_owner = repo_owner
                st.session_state.github_repo_name = repo_name
                st.session_state.github_default_branch = base_branch
                
                # Show success message
                st.success("Repository settings saved successfully!")
        
        # Close the validation wrapper if needed
        close_validation_wrapper(close_div_later)
    
    # # Display current configuration
    # st.subheader("Current Configuration")
    # st.json({
    #     "repo_owner": st.session_state.get('github_repo_owner', 'jlaks-block'),
    #     "repo_name": st.session_state.get('github_repo_name', 'metric-governance-dev'),
    #     "default_branch": st.session_state.get('github_default_branch', 'main')
    # })
    
    # Branch management section
    st.subheader("Branch Management")
    
    # Add an expander for branch cleanup
    with st.expander("Clean Up GitHub Branches"):
        st.write("""
        This will delete all branches you've created for metrics that start with your user ID.
        Use this to clean up old branches after PRs have been merged or if you want to start fresh.
        """)

        show_branches = st.button("Clean Up My Branches", key="cleanup_branches")
        if show_branches:
            try:
                # Get GitHub client
                github_client = get_github_client()
                
                if not github_client:
                    st.error("GitHub client not available. Please log in first.")
                else:
                    # Get repository
                    repo_owner = st.session_state.get('github_repo_owner', 'jlaks-block')
                    repo_name = st.session_state.get('github_repo_name', 'metric-governance-dev')
                    repo_path = f"{repo_owner}/{repo_name}"
                    
                    # Get repository
                    repo = github_client.get_repo(repo_path)
                    
                    # Get user identity
                    user_id = get_user_identity()
                    
                    # Get all branches
                    with st.spinner("Fetching branches..."):
                        branches = list(repo.get_branches())
                    
                    # Filter branches that match the pattern
                    user_branches = [b for b in branches if b.name.startswith(f"{user_id}_metric_updates")]
                    
                    if not user_branches:
                        st.info("No branches to clean up.")
                    else:
                        st.write(f"Found {len(user_branches)} branches to clean up:")
                        
                        # Create a dataframe to display branches
                        import pandas as pd
                        branch_data = []
                        for branch in user_branches:
                            branch_data.append({
                                "Branch Name": branch.name,
                                "Last Commit": branch.commit.sha[:7]  # Short SHA
                            })
                        
                        st.dataframe(pd.DataFrame(branch_data))
                        
                        # Confirm deletion
                        if st.button("Confirm Deletion", key="confirm_deletion"):
                            deleted_count = 0
                            with st.spinner("Deleting branches..."):
                                for branch in user_branches:
                                    try:
                                        ref = f"heads/{branch.name}"
                                        repo.get_git_ref(ref).delete()
                                        deleted_count += 1
                                    except Exception as e:
                                        st.error(f"Failed to delete branch {branch.name}: {str(e)}")
                            
                            # Show success message
                            st.success(f"Successfully deleted {deleted_count} branches.")
                            
                            # Clear session state
                            st.session_state.github_branch_name = None
                            st.session_state.github_commits = []
                            st.session_state.github_metrics_staged = []
                            
                            # Suggest rerunning the app
                            st.info("Session state cleared. You can now start fresh.")
                            if st.button("Refresh App"):
                                st.rerun()
            except Exception as e:
                st.error(f"Error cleaning up branches: {str(e)}")
                st.info("If you're seeing a 'Not Found' error, make sure you're logged in and have access to the repository.")
    
    # # App appearance settings
    # st.subheader("App Appearance")
    #
    # with st.form("appearance_settings"):
    #     # Theme selection
    #     theme = st.selectbox(
    #         "Theme",
    #         ["Light", "Dark"],
    #         index=0 if st.session_state.get('theme', 'Light') == 'Light' else 1,
    #         help="Select the app theme (not fully implemented yet)"
    #     )
        
        # # Page size for tables
        # page_size = st.number_input(
        #     "Table Page Size",
        #     min_value=5,
        #     max_value=100,
        #     value=st.session_state.get('page_size', 10),
        #     step=5,
        #     help="Number of rows to display per page in tables"
        # )
        
        # # Submit button
        # submitted = st.form_submit_button("Save Appearance Settings")
        #
        # if submitted:
        #     # Save appearance settings to session state
        #     st.session_state.theme = theme
        #     st.session_state.page_size = page_size
        #
        #     # Show success message
        #     st.success("Appearance settings saved successfully!")

def render_growthbook_tab():
    """Render Growthbook settings section."""
    st.header("Growthbook Integration")
    
    if GROWTHBOOK_AVAILABLE:
        render_growthbook_settings()
    else:
        st.warning("Growthbook module not available. Please check your installation.")
        st.info("To enable Growthbook integration, make sure the growthbook package is installed and properly configured.")
        
        # Mock Growthbook settings for demonstration
        st.subheader("Growthbook API Configuration")
        with st.form("growthbook_settings"):
            api_host = st.text_input(
                "API Host",
                value=st.session_state.get('growthbook_api_host', 'https://growthbook-app.sqprod.co'),
                help="Growthbook API host URL"
            )
            
            api_key = st.text_input(
                "API Key",
                value=st.session_state.get('growthbook_api_key', ''),
                type="password",
                help="Growthbook API key for authentication"
            )
            
            client_key = st.text_input(
                "Client Key",
                value=st.session_state.get('growthbook_client_key', ''),
                type="password",
                help="Growthbook client key for SDK initialization"
            )
            
            pat = st.text_input(
                "Personal Access Token (PAT)",
                value=st.session_state.get('growthbook_pat', ''),
                type="password",
                help="Growthbook Personal Access Token for development"
            )
            
            submitted = st.form_submit_button("Save Growthbook Settings")
            
            if submitted:
                st.session_state.growthbook_api_host = api_host
                st.session_state.growthbook_api_key = api_key
                st.session_state.growthbook_client_key = client_key
                st.session_state.growthbook_pat = pat
                
                st.success("Growthbook settings saved successfully!")
                
        # Test connection button
        if st.button("Test Connection"):
            if not st.session_state.get('growthbook_api_key') and not st.session_state.get('growthbook_pat'):
                st.error("API key or PAT is required for testing connection")
            else:
                with st.spinner("Testing connection to Growthbook..."):
                    # Mock connection test
                    import time
                    time.sleep(1)
                    st.warning("Growthbook module not available. This is a mock test.")
                    st.info("To enable real Growthbook integration, install the growthbook package.")
