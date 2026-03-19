"""GitHub App User Authentication Module.

This module handles GitHub App user authentication using OAuth flow.
It provides functions for:
- Generating the authorization URL
- Exchanging the code for a token
- Handling the OAuth callback
- Getting a GitHub client with the user token
- Rendering the GitHub login UI
"""

import os
import json
import time
import urllib.parse
import requests
import streamlit as st
from github import Github
from typing import Optional, Dict, Any, Tuple

def init_github_oauth():
    """
    Initialize GitHub OAuth configuration for GitHub App
    
    Returns:
        dict: OAuth configuration
    """
    # Try to load from secrets
    try:
        client_id = os.environ.get("GITHUB_CLIENT_ID")
        client_secret = os.environ.get("GITHUB_CLIENT_SECRET")
        redirect_uri = os.environ.get("GITHUB_REDIRECT_URI", "http://localhost:8503/")

    except Exception as e:
        st.warning(f"Could not load GitHub App OAuth credentials from secrets: {str(e)}")
        st.info("Please configure GitHub App in .streamlit/secrets.toml")
        client_id = "YOUR_GITHUB_APP_CLIENT_ID"
        client_secret = "YOUR_GITHUB_APP_CLIENT_SECRET" 
        redirect_uri = "http://localhost:8501/"
    
    # Return OAuth configuration
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "authorize_endpoint": "https://github.com/login/oauth/authorize",
        "access_token_endpoint": "https://github.com/login/oauth/access_token"
    }

def exchange_code_for_token(code, oauth_config):
    """Exchange the authorization code for an access token.
    
    Args:
        code: The authorization code from GitHub
        oauth_config: OAuth configuration dictionary
        
    Returns:
        The access token or None if the exchange failed
    """
    # GitHub OAuth token endpoint
    token_url = oauth_config["access_token_endpoint"]
    
    # Prepare request data
    data = {
        "client_id": oauth_config["client_id"],
        "client_secret": oauth_config["client_secret"],
        "code": code,
        "redirect_uri": oauth_config["redirect_uri"]
    }
    
    # Make the request
    headers = {"Accept": "application/json"}
    response = requests.post(token_url, data=data, headers=headers)
    
    if response.status_code == 200:
        try:
            token_data = response.json()
            if "access_token" in token_data:
                return token_data["access_token"]
            else:
                st.error(f"GitHub token exchange failed: {token_data.get('error_description', 'Unknown error')}")
        except Exception as e:
            st.error(f"Failed to parse GitHub token response: {str(e)}")
    else:
        st.error(f"GitHub token exchange failed with status code {response.status_code}")
    
    return None

def get_github_client():
    """Get a GitHub client using the user's access token.
    
    Returns:
        A PyGithub client instance or None if not authenticated
    """
    if st.session_state.get("github_authenticated") and st.session_state.get("github_access_token"):
        return Github(st.session_state.github_access_token)
    return None

def render_github_login() -> Tuple[bool, Dict[str, Any], Optional[str]]:
    """
    Render the GitHub login UI and handle the OAuth flow
    
    Returns:
        tuple: (is_authenticated, user_info, access_token)
    """
    # Initialize session state variables if they don't exist
    if 'github_authenticated' not in st.session_state:
        st.session_state.github_authenticated = False
    if 'github_user_info' not in st.session_state:
        st.session_state.github_user_info = None
    if 'github_access_token' not in st.session_state:
        st.session_state.github_access_token = None
    
    # Initialize OAuth
    oauth_config = init_github_oauth()
    
    # Check if we're in the callback
    is_callback = st.query_params.get("code", None)
    
    # If we're in the callback, process the code
    if is_callback and not st.session_state.github_authenticated:
        try:
            # Exchange code for token
            access_token = exchange_code_for_token(st.query_params["code"], oauth_config)
            
            if access_token:
                # Store token in session state
                st.session_state.github_access_token = access_token
                st.session_state.github_token = access_token  # Also store in the format used by github_service
                
                # Get user info
                github_client = Github(access_token)
                user = github_client.get_user()
                
                user_info = {
                    "login": user.login,
                    "name": user.name,
                    "email": user.email,
                    "avatar_url": user.avatar_url
                }
                
                # Verify organization access
                st.session_state.has_org_access = False
                try:
                    # Try to access the target repo to verify permissions
                    repo = github_client.get_repo(f"{st.session_state.github_repo_owner}/{st.session_state.github_repo_name}")
                    # If we get here, we have access
                    st.session_state.has_org_access = True
                except Exception as e:
                    st.warning("⚠️ Limited GitHub access: You may not have full access to the organization.")
                    st.info("If you encounter permission errors, please authorize this app for the organization.")
                    st.session_state.org_access_error = str(e)

                # Store user info in session state
                st.session_state.github_authenticated = True
                st.session_state.github_user_info = user_info
                st.session_state.user_ldap = user.login  # Set user_ldap to GitHub username
                
                # Clear query parameters and rerun to update UI
                st.query_params.clear()
                st.rerun()
        except Exception as e:
            st.error(f"Error during GitHub authentication: {str(e)}")
    
    # Display login status and button
    col1, col2 = st.columns([3, 1])
    
    with col1:
        if st.session_state.github_authenticated:
            user_info = st.session_state.github_user_info
            st.success(f"Logged in as {user_info['name'] or user_info['login']}")
            
            # Show organization access status
            if st.session_state.get('has_org_access', False):
                st.success(f"✅ You have access to the {st.session_state.get('github_repo_owner', 'jlaks-block')}/{st.session_state.get('github_repo_name', 'metric-governance-dev')} repository")
            else:
                st.warning("⚠️ Limited GitHub access: You may not have full access to the organization")
        else:
            st.info("Please log in with GitHub to create PRs")
    
    with col2:
        if st.session_state.github_authenticated:
            if st.button("Logout from GitHub"):
                # Clear session state
                st.session_state.github_authenticated = False
                st.session_state.github_user_info = None
                st.session_state.github_access_token = None
                st.session_state.github_token = None
                st.rerun()
        else:
            # Generate authorization URL
            state = f"st{int(time.time())}"
            try:
                # Use a hardcoded GitHub OAuth URL format
                # Include admin:org scope to request organization access
                scopes = ["user:email", "read:user", "repo", "admin:org"]
                scope_str = " ".join(scopes)
                
                github_auth_url = (
                    f"{oauth_config['authorize_endpoint']}"
                    f"?client_id={oauth_config['client_id']}"
                    f"&redirect_uri={urllib.parse.quote(oauth_config['redirect_uri'])}"
                    f"&scope={urllib.parse.quote(scope_str)}"
                    f"&state={state}"
                    f"&organization=jlaks-block"  # Specify the organization to streamline SSO
                )
                
                # Use a styled button for login
                st.markdown(f'''
                <a href="{github_auth_url}" target="_self">
                    <button style="
                        background-color: #2ea44f;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        text-decoration: none;
                        width: 100%;
                    ">
                        Login with GitHub
                    </button>
                </a>
                ''', unsafe_allow_html=True)
            except Exception as e:
                st.error(f"Error generating authorization URL: {str(e)}")
                st.info("Please check your GitHub App configuration in .streamlit/secrets.toml")
    
    # Help text in expander
    if not st.session_state.github_authenticated:
        st.expander("Having trouble logging in?").markdown("""
        **Common issues:**
        
        1. **SAML SSO Required**: If you're a member of an organization that uses SAML SSO (like Block), 
           you need to enable SSO for your personal access tokens or OAuth authorizations.
           
        2. **Organization Access**: Make sure your GitHub account is a member of the organization.
        
        3. **Browser Cookies**: Ensure your browser accepts cookies from GitHub and this app.
        
        4. **Redirect Issues**: If you're having trouble with redirects, try using http://localhost:8501/ as the redirect URI.
        """)
    
    return (
        st.session_state.github_authenticated,
        st.session_state.github_user_info or {},
        st.session_state.github_access_token
    )
