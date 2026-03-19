"""
Growthbook Settings Module

This module provides a Streamlit UI for configuring Growthbook API settings.
"""

import os
import streamlit as st
from typing import Dict, Any, Tuple

from growthbook.api import initialize_growthbook_api, fetch_and_save_metrics, fetch_and_save_projects

def render_growthbook_settings() -> None:
    """
    Render the Growthbook settings UI in Streamlit
    
    This function displays a form for configuring Growthbook API settings
    and tests the connection when requested.
    """
    st.header("Growthbook API Settings")
    
    # Initialize session state variables if they don't exist
    if 'growthbook_api_host' not in st.session_state:
        st.session_state.growthbook_api_host = os.environ.get("GROWTHBOOK_API_HOST", "https://growthbook.sqprod.co")

    if 'growthbook_api_key' not in st.session_state:
        st.session_state.growthbook_api_key = os.environ.get("GROWTHBOOK_API_KEY", "")

    if 'growthbook_client_key' not in st.session_state:
        st.session_state.growthbook_client_key = os.environ.get("GROWTHBOOK_CLIENT_KEY", "")

    if 'growthbook_pat' not in st.session_state:
        st.session_state.growthbook_pat = os.environ.get("GROWTHBOOK_PAT", "")
    
    if 'use_growthbook_api' not in st.session_state:
        st.session_state.use_growthbook_api = True
    
    # Create a form for the settings
    with st.form("growthbook_settings_form"):
        # API Host
        api_host = st.text_input(
            "Growthbook API Host",
            value=st.session_state.growthbook_api_host,
            help="The URL of your Growthbook API (e.g., https://growthbook.sqprod.co)"
        )
        
        # Authentication section
        st.subheader("Authentication")
        auth_tab1, auth_tab2 = st.tabs(["Personal Access Token (Recommended)", "API Key"])
        
        with auth_tab1:
            pat = st.text_input(
                "Personal Access Token",
                value=st.session_state.growthbook_pat,
                type="password",
                help="Your Growthbook Personal Access Token (easier for development)"
            )
            st.info("Personal Access Tokens are easier to create and manage for development testing.")
            
        with auth_tab2:
            # API Key
            api_key = st.text_input(
                "Growthbook API Key",
                value=st.session_state.growthbook_api_key,
                type="password",
                help="Your Growthbook API key for authenticated requests"
            )
            
            # # Client Key
            # client_key = st.text_input(
            #     "Growthbook Client Key",
            #     value=st.session_state.growthbook_client_key,
            #     help="Your Growthbook SDK client key for feature flag requests"
            # )
        
        # Use API toggle
        use_api = st.checkbox(
            "Use Growthbook API",
            value=st.session_state.use_growthbook_api,
            help="When disabled, sample data will be used instead of making API calls"
        )
        
        # Submit button
        submitted = st.form_submit_button("Save Settings")
        
        if submitted:
            # Update session state with form values
            st.session_state.growthbook_api_host = api_host
            st.session_state.growthbook_api_key = api_key
            st.session_state.growthbook_pat = pat
            st.session_state.use_growthbook_api = use_api
            
            # Show success message
            st.success("Growthbook API settings saved!")
    
    # Action buttons (outside the form)
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("Test Connection"):
            test_result, message = test_growthbook_connection(
                api_host=st.session_state.growthbook_api_host,
                api_key=st.session_state.growthbook_api_key,
                client_key=st.session_state.growthbook_client_key,
                pat=st.session_state.growthbook_pat
            )

            if test_result:
                st.success(message)
            else:
                st.error(message)

    # Add a button to fetch and save metrics
    with col2:
        if st.button("Get Metrics from API"):
            with st.spinner("Fetching metrics from Growthbook API..."):
                metrics_result = fetch_and_save_metrics(
                    api_host=st.session_state.growthbook_api_host,
                    api_key=st.session_state.growthbook_api_key,
                    pat=st.session_state.growthbook_pat
                )

                if metrics_result["success"]:
                    st.success(f"Successfully retrieved and saved {metrics_result['count']} metrics!")

                    # Show a sample of the metrics
                    if metrics_result["count"] > 0:
                        with st.expander("View Sample Metrics"):
                            st.json(metrics_result["sample"])
                else:
                    st.error(f"Failed to retrieve metrics: {metrics_result['error']}")
    
    # Add a button to fetch projects
    with col3:
        if st.button("Get Projects from API"):
            with st.spinner("Fetching projects from Growthbook API..."):
                projects_result = fetch_and_save_projects(
                    api_host=st.session_state.growthbook_api_host,
                    api_key=st.session_state.growthbook_api_key,
                    pat=st.session_state.growthbook_pat
                )

            if projects_result["success"]:
                st.success(f"Successfully retrieved and saved {projects_result['count']} projects!")
                
                # Set flag to refresh projects list
                st.session_state.refresh_projects = True
                
                # Show project ID to name mapping
                if "mapping" in projects_result and projects_result["mapping"]:
                    with st.expander("View Project ID to Name Mapping"):
                        st.json(projects_result["mapping"])
                
                # Show a sample of the projects
                if projects_result["count"] > 0:
                    with st.expander("View Sample Projects"):
                        st.json(projects_result["sample"])
                
                # Inform the user about the project list update
                st.info("Project list has been updated with the latest projects from Growthbook. These will be available in the metric form dropdown.")
            else:
                st.error(f"Failed to retrieve projects: {projects_result['error']}")

def test_growthbook_connection(
    api_host: str,
    api_key: str = None,
    client_key: str = None,
    pat: str = None
) -> Tuple[bool, str]:
    """
    Test the connection to the Growthbook API
    
    Args:
        api_host: The Growthbook API host URL
        api_key: The Growthbook API key
        client_key: The Growthbook SDK client key
        pat: Personal Access Token
        
    Returns:
        Tuple containing:
        - Boolean indicating success/failure
        - Message describing the result
    """
    if not api_host or (not api_key and not pat):
        return False, "API host and either API key or Personal Access Token are required for testing the connection"
    
    try:
        # Initialize the API client
        gb_api = initialize_growthbook_api(
            api_host=api_host,
            api_key=api_key,
            client_key=client_key,
            pat=pat
        )
        
        # Try to get metrics as a test
        metrics = gb_api.get_metrics()
        
        return True, f"Connection successful! Retrieved {len(metrics)} metrics from Growthbook."
        
    except Exception as e:
        return False, f"Connection failed: {str(e)}"
