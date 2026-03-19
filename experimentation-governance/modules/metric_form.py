"""
Metric form tab functionality for adding and updating metrics
"""
import streamlit as st
import time
import os
import json
import re
from streamlit_ace import st_ace
from modules.github_service import commit_metric_change, create_pr_from_commits
from modules.ui_components import apply_form_button_styling, wrap_form_with_validation, close_validation_wrapper
from modules.utils import (
    UNIT_FULL_MAPPING, 
    UNIT_SHORT_MAPPING, 
    TIME_WINDOW_UNITS,
    USER_ID_TYPES,
    create_metric_template
)

def render_metric_form_tab():
    """Render the metric form tab for adding/updating metrics"""
    st.header("Add/Update Metrics")
    
    # Initialize GitHub session state if not already done
    if 'github_metrics_staged' not in st.session_state:
        st.session_state.github_metrics_staged = []
    if 'github_commits' not in st.session_state:
        st.session_state.github_commits = []
    
    # Check if we're editing an existing metric
    editing = False
    if 'edit_metric' in st.session_state:
        editing = True
        metric = st.session_state.edit_metric
        # Store the original name for reference when updating
        if 'original_metric_name' not in st.session_state:
            st.session_state.original_metric_name = metric.get("name", "")
        
        # Metric is being edited - no debug needed
    else:
        # Initialize a new metric using the template function
        metric = create_metric_template()
        
    # Only initialize delete confirmation flag if it doesn't exist
    # Don't reset it on every render as that can cause issues with the confirmation dialog
    if 'delete_metric_confirmation' not in st.session_state:
        st.session_state.delete_metric_confirmation = False
    
    with st.form("metric_form"):
        # Basic metric information
        col1, col2 = st.columns(2)
        
        # Generate a unique key suffix based on the metric being edited
        # This ensures form fields refresh when switching between metrics
        # We use the metric name only (not timestamp) to keep fields stable during editing
        key_suffix = f"_{metric.get('name', 'new')}" if editing else "_new"
        
        # If we need to force a refresh, we can use a session state variable
        if 'form_key_timestamp' not in st.session_state:
            st.session_state.form_key_timestamp = int(time.time())
        
        with col1:
            # When editing, allow changing the name
            if editing:
                name = st.text_input("Metric Name", value=metric.get("name", ""), key=f"metric_name_edit{key_suffix}")
            else:
                name = st.text_input("Metric Name", value="", key="metric_name_editable")
            
            owner = st.text_input(
                "Owner LDAP",
                value=metric.get("owner", ""),
                help="LDAP of the person responsible for this metric",
                key=f"owner{key_suffix}"
            )
            
            # Handle project selection - get first project from list or default to "Growth"
            default_project = "Growth"
            if metric.get("projects") and isinstance(metric.get("projects"), list) and len(metric.get("projects")) > 0:
                default_project = metric.get("projects")[0]
            elif metric.get("project"):  # For backward compatibility
                default_project = metric.get("project")
                
            project = st.selectbox(
                "Project",
                st.session_state.projects,
                index=st.session_state.projects.index(default_project) if default_project in st.session_state.projects else 0,
                key=f"project{key_suffix}"
            )
        
        with col2:
            metric_type = st.selectbox(
                "Metric Type",
                st.session_state.metric_types,
                index=st.session_state.metric_types.index(metric.get("type", "binary"))
                if metric.get("type", "binary") in st.session_state.metric_types else 0,
                key=f"metric_type{key_suffix}"
            )
            
            # Initialize window settings with defaults
            window_value = 7  # Default value
            window_unit = "days"  # Default unit
            
            # Extract window value and unit from behavior.windowSettings if it exists
            if metric.get("behavior") and metric.get("behavior").get("windowSettings"):
                window_settings = metric.get("behavior").get("windowSettings")
                window_value = window_settings.get("windowValue", window_value)
                window_unit = window_settings.get("windowUnit", window_unit)
            # For backward compatibility with old format
            elif metric.get("time_window"):
                import re
                # Try to parse the time window format (e.g., "7d", "30d")
                match = re.match(r"(\d+)([a-zA-Z]+)", metric.get("time_window", "7d"))
                if match:
                    value, unit = match.groups()
                    window_value = int(value)
                    # Map short unit to full unit name using imported mapping
                    window_unit = UNIT_FULL_MAPPING.get(unit, "days")
            
            # Create two side-by-side inputs for window value and unit
            tw_col1, tw_col2 = st.columns([1, 1])
            
            with tw_col1:
                window_value = st.number_input(
                    "Time Window Value",
                    min_value=1,
                    value=window_value,
                    step=1,
                    help="Numeric value for the time window",
                    key=f"window_value{key_suffix}"
                )
            
            with tw_col2:
                window_unit = st.selectbox(
                    "Time Window Unit",
                    TIME_WINDOW_UNITS,
                    index=TIME_WINDOW_UNITS.index(window_unit),
                    help="Unit for the time window",
                    key=f"window_unit{key_suffix}"
                )

            # Get the current archived status as a string
            # Convert boolean to string if needed
            if "archived" in metric:
                current_archived = "True" if metric["archived"] else "False"
            else:
                current_archived = "False"  # Default to False if not present

            # Find the index of the current value in the archive_types list
            try:
                default_archive_index = st.session_state.archive_types.index(current_archived)
            except ValueError:
                default_archive_index = st.session_state.archive_types.index("False")  # Default to False if not found

            # Use selectbox with proper default value
            archived_str = st.selectbox(
                "Archived",
                st.session_state.archive_types,
                index=default_archive_index,
                help="Select whether this metric should be archived",
                key=f"archive_box{key_suffix}"
            )
            archived_bool = archived_str == "True"
        
        # Description
        description = st.text_area(
            "Description", 
            value=metric.get("description", ""),
            height=100,
            help="Detailed description of what this metric measures and how it should be used",
            key=f"description{key_suffix}"
        )
        
        # User ID Types multiselect
        # Get current user ID types or default to empty list
        current_user_id_types = metric.get("userIdTypes", [])
        
        user_id_types = st.multiselect(
            "User ID Types",
            options=st.session_state.user_id_types,
            default=current_user_id_types,
            help="Select the user ID types that apply to this metric",
            key=f"user_id_types{key_suffix}"
        )
        
        # SQL query with enhanced code editor
        st.subheader("SQL Definition")
        
        # SQL editor with PyCharm-like dark theme
        st.markdown("Write the SQL query that defines this metric:")
        
        # Get SQL value from metric
        sql_value = metric.get("sql", "")
        
        # Generate a unique key for the editor based on the metric name only
        # This ensures the editor doesn't reuse cached state from previous metrics
        # but stays stable during editing of a single metric
        editor_key = f"sql_editor_{metric.get('name', 'new')}" if editing else "sql_editor_new"
        
        sql_query = st_ace(
            value=sql_value,
            language="sql",
            theme="tomorrow_night_eighties",  # Fixed to PyCharm-like dark theme
            keybinding="vscode",  # Using VSCode keybindings which are available and similar to PyCharm
            min_lines=10,
            max_lines=20,
            font_size=14,
            tab_size=2,
            wrap=True,
            show_gutter=True,
            show_print_margin=True,
            auto_update=True,
            readonly=False,
            key=editor_key
        )
        
        # Form validation
        is_valid = True
        validation_message = ""
        
        # Check required fields
        if not name:
            is_valid = False
            validation_message = "Metric name is required"
        elif not sql_query:
            is_valid = False
            validation_message = "SQL query is required"
        elif not owner:
            is_valid = False
            validation_message = "Owner LDAP is required"
        elif len(user_id_types) == 0:
            is_valid = False
            validation_message = "User ID types is required"
        elif not description:
            is_valid = False
            validation_message = "Description is required"
        
        # Define button text based on validation state
        if is_valid:
            submit_text = "Update Metric" if editing else "Create Metric"
        else:
            submit_text = "Please fill out all forms correctly"
            
        # Apply custom styling to form buttons
        apply_form_button_styling()
        
        # Add validation wrapper if needed
        close_div_later = wrap_form_with_validation(is_valid)
        
        # Create the submit button
        submitted = st.form_submit_button(submit_text)

        if submitted:
            # Create metric object using the template function
            date_created = metric.get("dateCreated") if editing else None
            new_metric = create_metric_template(
                name=name,
                description=description,
                owner=owner,
                metric_type=metric_type,
                project=project,
                sql=sql_query,
                window_value=window_value,
                window_unit=window_unit,
                archived=archived_bool,
                date_created=date_created,  # Use existing date if editing
                date_updated=None,  # Use current date (default)
                user_id_types=user_id_types  # Include selected user ID types
            )

            # Additional validation (in case the form state changed after button was rendered)
            if not name or not sql_query or not owner or not description or len(user_id_types) == 0:
                st.error(validation_message or "Please fill out all required fields")
            else:
                # Commit the metric change (without creating a PR)
                # Pass information about whether this is an edit to help with commit message
                with st.spinner(f"{'Updating' if editing else 'Creating'} metric..."):
                    try:
                        # If we're editing, make sure the metric is properly marked as an update
                        if editing:
                            # Add the original name to the metric data to help identify it as an update
                            new_metric["_is_update"] = True
                            new_metric["_original_name"] = st.session_state.original_metric_name

                        success, message, is_mock = commit_metric_change(new_metric)
                    except Exception as e:
                        st.error(f"Error committing changes: {str(e)}")
                        success = False
                        message = str(e)
                        is_mock = False

                if success:
                    # Update the local session state
                    if editing:
                        # Find and update existing metric using the original name
                        original_name = st.session_state.original_metric_name
                        for i, m in enumerate(st.session_state.metrics):
                            if m["name"] == original_name:
                                st.session_state.metrics[i] = new_metric
                                break
                        # Clean up the original name reference
                        if 'original_metric_name' in st.session_state:
                            del st.session_state.original_metric_name
                    else:
                        # Add new metric
                        st.session_state.metrics.append(new_metric)

                    # Clear edit state if editing
                    if 'edit_metric' in st.session_state:
                        del st.session_state.edit_metric

                    st.success(f"Metric {'updated' if editing else 'created'} successfully!")
                    st.success(message)

                    # Show information about the commit
                    if is_mock:
                        st.info("Changes were committed in mock mode.")
                    else:
                        st.info("Changes were committed to your branch. You can continue adding/updating metrics.")

                    # Show the number of staged metrics
                    num_staged = len(st.session_state.github_metrics_staged)
                    st.info(f"You have {num_staged} metric{'s' if num_staged != 1 else ''} staged for PR creation.")
                else:
                    st.error(f"Failed to commit changes. {message}")

        # Close the validation wrapper if needed
        close_validation_wrapper(close_div_later)

    # Add a delete button if we're editing an existing metric
    if editing:
        st.markdown("---")
        st.subheader("Danger Zone")

        with st.container():
            # Handle delete metric confirmation dialog
            if 'delete_metric_confirmation' in st.session_state and st.session_state.delete_metric_confirmation:
                from modules.github_service import delete_metric_from_repo

                # Always use the current metric being edited to ensure we're deleting the right one
                metric_to_delete = metric.copy()
                st.session_state.metric_to_delete = metric_to_delete

                st.warning(f"⚠️ Are you sure you want to delete the metric '{metric_to_delete['name']}'?")
                st.info("This will remove the metric file from the GitHub repository. This action cannot be undone.")

                # Create two columns for the confirmation buttons
                col1, col2 = st.columns(2)

                # Cancel button
                with col1:
                    if st.button("Cancel", key="cancel_delete"):
                        # Reset the confirmation state
                        st.session_state.delete_metric_confirmation = False
                        if 'metric_to_delete' in st.session_state:
                            del st.session_state.metric_to_delete
                        st.rerun()

                # Confirm button
                with col2:
                    if st.button("Yes, Delete Metric", key="confirm_delete", type="primary"):
                        # Call the delete function
                        with st.spinner("Deleting metric..."):
                            success, message, is_mock = delete_metric_from_repo(metric_to_delete)

                        if success:
                            # Remove the metric from the session state
                            st.session_state.metrics = [m for m in st.session_state.metrics if m['name'] != metric_to_delete['name']]
                            st.success(f"Metric '{metric_to_delete['name']}' has been deleted.")

                            # Show additional info based on whether it was a mock delete or real
                            if is_mock:
                                st.info("This was a mock deletion (GitHub integration in mock mode).")
                            else:
                                st.info("The metric file has been deleted from the repository.")

                            # Clean up edit state
                            if 'edit_metric' in st.session_state:
                                del st.session_state.edit_metric
                            if 'original_metric_name' in st.session_state:
                                del st.session_state.original_metric_name

                            # Switch back to the metric catalog tab
                            st.session_state.active_tab = "Metric Catalog"
                        else:
                            st.error(f"Failed to delete metric: {message}")

                        # Reset the confirmation state
                        st.session_state.delete_metric_confirmation = False
                        if 'metric_to_delete' in st.session_state:
                            del st.session_state.metric_to_delete

                        # Rerun the app to refresh the metrics list
                        st.rerun()
            else:
                # Show the initial warning and delete button
                st.warning("⚠️ Deleting a metric will remove it from the repository. This action cannot be undone.")

                # Delete button - directly set the metric_to_delete and confirmation flag
                if st.button("Delete Metric", key=f"delete_{metric['name']}", type="primary"):
                    # Set delete confirmation flag
                    st.session_state.delete_metric_confirmation = True

                    # Create a fresh deep copy of the current metric to avoid reference issues
                    st.session_state.metric_to_delete = metric.copy()

                    # Force a rerun to show the confirmation dialog
                    st.rerun()

    # Display staged metrics and PR creation section
    if st.session_state.github_metrics_staged:
        st.markdown("---")
        st.subheader("Staged Metrics")
        st.info("""
        You have metrics ready to be submitted as a Pull Request. 
        Review the metrics below and click "Create Pull Request" when ready.
        """)

        # Display staged metrics in an expandable section
        with st.expander(f"View Staged Metrics ({len(st.session_state.github_metrics_staged)})", expanded=False):
            for i, metric in enumerate(st.session_state.github_metrics_staged):
                if metric.get("_deleted", False):
                    st.markdown(f"### {i+1}. {metric['name']} (DELETED)")
                    
                    # Display project - handle both old and new format
                    if metric.get("projects") and isinstance(metric.get("projects"), list):
                        project_display = ", ".join(metric["projects"])
                    else:
                        project_display = metric.get("project", "N/A")
                    st.markdown(f"**Project:** {project_display}")
                    
                    st.markdown(f"**Owner:** {metric['owner']}")
                    st.markdown("**Status:** 🗑️ This metric will be deleted")
                else:
                    st.markdown(f"### {i+1}. {metric['name']}")
                    
                    # Display project - handle both old and new format
                    if metric.get("projects") and isinstance(metric.get("projects"), list):
                        project_display = ", ".join(metric["projects"])
                    else:
                        project_display = metric.get("project", "N/A")
                    st.markdown(f"**Project:** {project_display}")
                    
                    st.markdown(f"**Owner:** {metric['owner']}")
                    st.markdown(f"**Type:** {metric['type']}")
                    
                    # Display window settings if available
                    if metric.get("behavior") and metric.get("behavior").get("windowSettings"):
                        window_settings = metric["behavior"]["windowSettings"]
                        window_value = window_settings.get("windowValue", "")
                        window_unit = window_settings.get("windowUnit", "")
                        st.markdown(f"**Time Window:** {window_value} {window_unit}")
                    elif metric.get("time_window"):
                        st.markdown(f"**Time Window:** {metric.get('time_window')}")
                        
                    # Display archived status if available
                    if "archived" in metric:
                        archived_status = "Yes" if metric["archived"] else "No"
                        st.markdown(f"**Archived:** {archived_status}")
                    
                    # Display User ID Types if available
                    if "userIdTypes" in metric and metric["userIdTypes"]:
                        user_id_types_display = ", ".join(metric["userIdTypes"])
                        st.markdown(f"**User ID Types:** {user_id_types_display}")
                        
                    st.markdown(f"**Description:** {metric['description'][:100]}{'...' if len(metric['description']) > 100 else ''}")

                    # Display SQL in code editor (read-only)
                    if metric.get('sql'):
                        st.markdown("**SQL Definition:**")
                        st_ace(
                            value=metric.get('sql', ''),
                            language="sql",
                            theme="tomorrow_night_eighties",  # Fixed to PyCharm-like dark theme
                            keybinding="vscode",  # Using VSCode keybindings
                            readonly=True,
                            min_lines=5,
                            max_lines=10,
                            font_size=12,
                            key=f"view_sql_{metric['name']}_{i}"
                        )
                if i < len(st.session_state.github_metrics_staged) - 1:
                    st.markdown("---")

        # Display commit history
        if st.session_state.github_commits:
            with st.expander("View Commit History", expanded=False):
                for i, commit in enumerate(st.session_state.github_commits):
                    st.markdown(f"**{i+1}.** {commit['action'].capitalize()} metric: **{commit['metric_name']}**")
                    st.markdown(f"Commit ID: `{commit['commit_id']}`")
                    st.markdown(f"Timestamp: {commit['timestamp']}")
                    if i < len(st.session_state.github_commits) - 1:
                        st.markdown("---")

        # PR creation button
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            if st.button("Create Pull Request", key="create_pr_button", type="primary"):
                with st.spinner("Creating Pull Request..."):
                    pr_url, is_mock = create_pr_from_commits()

                if pr_url:
                    st.success("Pull Request created successfully!")

                    # Display PR link
                    st.markdown(f"### [View Pull Request on GitHub]({pr_url})")

                    if is_mock:
                        st.info("This is a mock PR. In production, you would need to go to GitHub to review and merge it.")
                    else:
                        st.info("""
                        **Next Steps**:
                        1. Click the link above to review your PR on GitHub
                        2. Make any necessary changes directly on GitHub
                        3. When ready, merge the PR on GitHub (or ask a reviewer to do so)
                        4. After merging, the metrics will be officially added to the catalog
                        """)
                else:
                    st.error("Failed to create Pull Request. Please try again or check your GitHub settings.")

    # If no metrics are staged, show a message
    elif 'github_branch_name' in st.session_state and st.session_state.github_branch_name:
        st.info("You have a branch created but no metrics staged. Add or update metrics using the form above.")
    else:
        st.info("No metrics staged yet. Use the form above to add or update metrics.")
