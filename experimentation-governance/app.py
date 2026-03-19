"""
Metric Governance App
Standardizing Square metric definitions and management
"""
import streamlit as st
import pandas as pd
import logging
import os

# Import modularized components
from modules.ui_components import apply_custom_css, render_block_header
from modules.ui_components import add_enhanced_sql_highlighting
from modules.metric_catalog import render_metric_catalog_tab
from modules.metric_form import render_metric_form_tab
from modules.utils import initialize_session_state
from modules.get_metrics import initialize_metrics
from modules.settings import render_settings_tab

logger = logging.getLogger(__name__)

# Get dev mode from environment variable
DEV_MODE = os.environ.get("METRIC_APP_DEV_MODE", "false").lower() == "true"

# Apply SQL editor settings
add_enhanced_sql_highlighting()

# Apply custom styling
apply_custom_css()

# Initialize session state with default values
initialize_session_state(st, dev_mode=DEV_MODE)

# Wait for user to select a source

def main(dev=False):
    """
    Main function to run the Streamlit app

    Args:
        dev: Whether to run in development mode
    """
    # Display environment banner
    if DEV_MODE:
        st.markdown(
            """
            <div style="background-color: #28a745; padding: 5px; border-radius: 5px; margin-bottom: 10px;">
                <h6 style="color: white; margin: 0; text-align: center;">DEVELOPMENT MODE</h6>
            </div>
            """,
            unsafe_allow_html=True
        )

    # Render header
    render_block_header("Square Metric Governance")

    # Initialize the active tab in session state if it doesn't exist
    if 'active_tab' not in st.session_state:
        st.session_state.active_tab = "Metric Catalog"
    
    # Create tabs
    tab1, tab2, tab3 = st.tabs(["📊 Metric Catalog", "➕ Add/Update Metrics", "⚙️ Settings"])
    
    # Render tab content based on active tab
    with tab1:
        render_metric_catalog_tab()
    
    with tab2:
        render_metric_form_tab()
    
    with tab3:
        render_settings_tab()
        
    # Use JavaScript to switch to the correct tab
    if st.session_state.active_tab == "Add/Update Metrics":
        # Use JavaScript to click the second tab
        # Add a timestamp to make the script unique each time
        timestamp = st.session_state.get('last_tab_switch', '')
        js = f"""
        <script>
            // Add timestamp to make script unique: {timestamp}
            function switchTab() {{
                // Wait for the DOM to be fully loaded
                setTimeout(function() {{
                    // Get all tab buttons
                    const tabs = window.parent.document.querySelectorAll('[data-baseweb="tab-list"] [role="tab"]');
                    // Click the second tab (index 1)
                    if (tabs.length > 1) {{
                        tabs[1].click();
                    }}
                }}, 300);
            }}
            switchTab();
        </script>
        """
        # Use the HTML component without a key
        st.components.v1.html(js, height=0)
        
        # Reset the active tab after switching to prevent getting stuck in a tab
        # This will take effect on the next rerun
        st.session_state.active_tab = "Metric Catalog"

# Run the main function when this script is executed
if __name__ == "__main__":
    import argparse

    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Metric Governance App")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")

    args = parser.parse_args()
    # print(f"Command-line args: dev={args.dev}")  # Debug print

    # Run the app with the specified mode
    main(dev=args.dev)
