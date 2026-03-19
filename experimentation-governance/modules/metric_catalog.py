"""
Metric catalog tab functionality
"""
import streamlit as st
import pandas as pd
import os
import time
from modules.get_metrics import initialize_metrics
from streamlit_ace import st_ace

dev_mode = os.environ.get("METRIC_APP_DEV_MODE", "false").lower() == "true"

def render_metric_catalog_tab():
    """Render the metric catalog tab"""
    # Create a simple header
    st.header("Metric Catalog")
    
    # Check if metrics need to be refreshed
    if st.session_state.get('metrics_need_refresh', False):
        initialize_metrics(st, dev_mode=dev_mode)

    # Add a source selector with buttons
    st.write("**Select Metrics Source:**")
    col1, col2 = st.columns([1, 1])
    
    # Display the currently selected source if one is selected
    if st.session_state.metrics_source:
        source_name = "Growthbook API" if st.session_state.metrics_source == "growthbook" else "GitHub Repository"
        st.info(f"Currently using: {source_name}")
    else:
        st.info("No data source selected. Please choose a source above.")

    # Add buttons for each source - clicking either button will load/refresh metrics
    with col1:
        st.button("Load from Growthbook API", 
                 key="btn_growthbook", 
                 on_click=select_growthbook,
                 help="Load metrics from Growthbook API")
    
    with col2:
        st.button("Load from GitHub Repository", 
                 key="btn_github", 
                 on_click=select_github,
                 help="Load metrics from GitHub Repository")

    # Filter options
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        search_text = st.text_input("Search by name", key="metric_search")

    with col2:
        project_filter = st.selectbox(
            "Filter by project",
            ["All"] + st.session_state.projects,
            key="project_filter"
        )

    with col3:
        type_filter = st.selectbox(
            "Filter by type",
            ["All"] + st.session_state.metric_types,
            key="type_filter"
        )

    with col4:
        # Add a checkbox to show archived metrics (default to not showing archived)
        show_archived = st.checkbox("Show archived metrics", value=False, key="show_archived")
        
        # Set the archive filter based on the checkbox
        archive_filter = "All" if show_archived else "False"

    # Apply filters
    filtered_metrics = st.session_state.metrics.copy()

    if search_text:
        filtered_metrics = [
            m for m in filtered_metrics
            if search_text.lower() in m["name"].lower() or
               search_text.lower() in m.get("description", "").lower()
        ]

    if project_filter != "All":
        filtered_metrics = [
            m for m in filtered_metrics 
            if (
                # Check in projects list if it exists
                (isinstance(m.get("projects"), list) and project_filter in m.get("projects")) or
                # Fall back to project string if projects list doesn't exist
                (not isinstance(m.get("projects"), list) and m.get("project") == project_filter)
            )
        ]

    if type_filter != "All":
        filtered_metrics = [m for m in filtered_metrics if m["type"] == type_filter]

    if archive_filter != "All":
        # Ensure all metrics have an is_archived field
        for metric in filtered_metrics:
            if "is_archived" not in metric:
                # If archived exists as a boolean, convert it to a string
                if "archived" in metric:
                    metric["is_archived"] = "True" if metric["archived"] else "False"
                else:
                    # Default to not archived
                    metric["is_archived"] = "False"
                    metric["archived"] = False
                    
        # Now filter with the is_archived field guaranteed to exist
        filtered_metrics = [m for m in filtered_metrics if m["is_archived"] == archive_filter]

    # Display metrics table
    if filtered_metrics:
        # Convert to DataFrame for display
        metrics_df = pd.DataFrame([
            {
                "Name": m["name"],
                "Type": m["type"],
                "Project": (
                    # If projects is a list, join with commas
                    ", ".join(m["projects"]) if isinstance(m.get("projects"), list) 
                    # Otherwise use project if it exists, or "N/A"
                    else m.get("project", "N/A")
                ),
                "Time Window": m.get("time_window", ""),
                "Owner": m.get("owner", ""),
                # "User ID Types": ", ".join(m.get("userIdTypes", [])) if m.get("userIdTypes") else "",
                "Last Updated": m.get("dateUpdated", m.get("last_updated", "")),
                "Archived": "True" if m.get("archived", False) else "False"
            }
            for m in filtered_metrics
        ])

        # Use st.dataframe with use_container_width=True instead of width='stretch'
        st.dataframe(metrics_df, use_container_width=True)

        # Metric details expander
        st.subheader("Metric Details")
        selected_metric_name = st.selectbox(
            "Select a metric to view details",
            [m["name"] for m in filtered_metrics]
        )

        # Find the selected metric
        selected_metric = next((m for m in filtered_metrics if m["name"] == selected_metric_name), None)

        if selected_metric:
            with st.expander("Metric Details", expanded=True):
                col1, col2 = st.columns(2)

                with col1:
                    st.write(f"**Name:** {selected_metric['name']}")
                    st.write(f"**Type:** {selected_metric['type']}")
                    
                    # Handle projects field (list or string)
                    if isinstance(selected_metric.get("projects"), list):
                        st.write(f"**Projects:** {', '.join(selected_metric['projects'])}")
                    else:
                        st.write(f"**Project:** {selected_metric.get('project', 'N/A')}")

                    # Display User ID Types if available
                    if "userIdTypes" in selected_metric and selected_metric["userIdTypes"]:
                        st.write(f"**User ID Types:** {', '.join(selected_metric['userIdTypes'])}")
                    else:
                        st.write("**User ID Types:** None")

                with col2:
                    # Handle time window from behavior.windowSettings if available
                    if "behavior" in selected_metric and "windowSettings" in selected_metric["behavior"]:
                        window_settings = selected_metric["behavior"]["windowSettings"]
                        window_value = window_settings.get("windowValue", "")
                        window_unit = window_settings.get("windowUnit", "")
                        if window_value and window_unit:
                            st.write(f"**Time Window:** {window_value} {window_unit}")
                        else:
                            st.write(f"**Time Window:** {selected_metric.get('time_window', 'N/A')}")
                    else:
                        st.write(f"**Time Window:** {selected_metric.get('time_window', 'N/A')}")
                    
                    st.write(f"**Owner:** {selected_metric.get('owner', 'N/A')}")
                    st.write(f"**Last Updated:** {selected_metric.get('dateUpdated', selected_metric.get('last_updated', 'N/A'))}")
                    
                    # Show archived status with color
                    is_archived = selected_metric.get("archived", False)
                    if is_archived:
                        st.markdown(f"**Archived:** <span style='color:red;'>Yes</span>", unsafe_allow_html=True)
                    else:
                        st.markdown(f"**Archived:** <span style='color:green;'>No</span>", unsafe_allow_html=True)


                st.write("**Description:**")
                st.write(selected_metric.get("description", "No description available"))

                st.write("**SQL Definition:**")
                # Use st_ace for SQL display with syntax highlighting
                st_ace(
                    value=selected_metric.get("sql", "-- No SQL definition available"),
                    language="sql",
                    theme="tomorrow_night_eighties",  # Fixed to PyCharm-like dark theme
                    keybinding="vscode",  # Using VSCode keybindings which are available and similar to PyCharm
                    readonly=True,
                    min_lines=5,
                    max_lines=15,
                    font_size=14,
                    show_gutter=True,
                    wrap=True,
                    key=f"catalog_view_sql_{selected_metric['name']}"  # Unique key with catalog prefix
                )

                # Create columns for buttons
                col1, col2 = st.columns(2)

                # Function to handle edit button click
                def edit_metric_callback():
                    # Reset any delete confirmation state
                    if 'delete_metric_confirmation' in st.session_state:
                        st.session_state.delete_metric_confirmation = False
                    if 'metric_to_delete' in st.session_state:
                        del st.session_state.metric_to_delete

                    # Reset original_metric_name to ensure it's set fresh for this metric
                    if 'original_metric_name' in st.session_state:
                        del st.session_state.original_metric_name

                    # Update the form key timestamp to force form fields to refresh
                    st.session_state.form_key_timestamp = int(time.time())

                    # Set the metric to edit
                    st.session_state.edit_metric = selected_metric.copy()  # Use a copy to avoid reference issues

                    # Add timestamp to force state change detection
                    st.session_state.last_tab_switch = time.time()
                    st.session_state.active_tab = "Add/Update Metrics"

                # Edit button with callback
                with col1:
                    st.button("Edit Metric",
                             key=f"edit_{selected_metric['name']}",
                             on_click=edit_metric_callback)

                # Add New Metric button with callback
                with col2:
                    st.button("Add New Metric",
                             key=f"add_new_{selected_metric['name']}",
                             on_click=add_new_metric_callback)
    else:
        st.info("No metrics found matching the filters.")

    # If no metrics are displayed, show an Add New Metric button
    if not filtered_metrics:
        # Add New Metric button when no metrics are displayed
        st.button("Add New Metric",
                key="add_new_metric_empty",
                on_click=add_new_metric_empty_callback)

# Function to handle Growthbook button click
def select_growthbook():
    st.session_state.metrics_source = "growthbook"
    st.session_state.metrics_need_refresh = True

# Function to handle GitHub button click
def select_github():
    st.session_state.metrics_source = "github"
    st.session_state.metrics_need_refresh = True


# Function to handle add new metric button click
def add_new_metric_callback():
    # Clear any existing edit metric in session state
    if 'edit_metric' in st.session_state:
        del st.session_state.edit_metric

    # Reset any delete confirmation state
    if 'delete_metric_confirmation' in st.session_state:
        st.session_state.delete_metric_confirmation = False
    if 'metric_to_delete' in st.session_state:
        del st.session_state.metric_to_delete

    # Update the form key timestamp to force form fields to refresh
    import time
    st.session_state.form_key_timestamp = int(time.time())

    # Add timestamp to force state change detection
    st.session_state.last_tab_switch = time.time()
    st.session_state.active_tab = "Add/Update Metrics"

# Function to handle add new metric button click
def add_new_metric_empty_callback():
    # Clear any existing edit metric in session state
    if 'edit_metric' in st.session_state:
        del st.session_state.edit_metric

    # Reset any delete confirmation state
    if 'delete_metric_confirmation' in st.session_state:
        st.session_state.delete_metric_confirmation = False
    if 'metric_to_delete' in st.session_state:
        del st.session_state.metric_to_delete

    # Update the form key timestamp to force form fields to refresh

    st.session_state.form_key_timestamp = int(time.time())

    # Add timestamp to force state change detection
    st.session_state.last_tab_switch = time.time()
    st.session_state.active_tab = "Add/Update Metrics"
