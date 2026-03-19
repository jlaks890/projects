##TO DO ADD A SNOWFLAKE CONNECTION FOR QUERY TESTING

import os
import snowflake.connector

def get_snowflake_connection():
    """
    Establish a connection to Snowflake using a service account with broad read access.
    Uses environment variables or secrets for credentials.

    Returns:
        snowflake.connector.connection.SnowflakeConnection: Active Snowflake connection
    """

    # Get credentials from environment variables or secrets
    # For Databricks deployment, these could be stored in Databricks secrets
    snowflake_user = os.environ.get("SNOWFLAKE_ROBO_USER")
    snowflake_password = os.environ.get("SNOWFLAKE_ROBO_PASSWORD")
    snowflake_account = os.environ.get("SNOWFLAKE_ACCOUNT")
    snowflake_warehouse = os.environ.get("SNOWFLAKE_WAREHOUSE", "ADHOC__SMALL")

    # Create connection
    conn = snowflake.connector.connect(
        user=snowflake_user,
        password=snowflake_password,
        account=snowflake_account,
        warehouse=snowflake_warehouse,
        role="METRIC_VALIDATION_ROLE"  # Use a specific role with broad read access
    )

    return conn


def test_sql_query(sql_query, limit=5, timeout=30):
    """
    Test a SQL query by executing it with a LIMIT clause and timeout.

    Args:
        sql_query (str): The SQL query to test
        limit (int): Maximum number of rows to return
        timeout (int): Maximum execution time in seconds

    Returns:
        dict: Dictionary containing:
            - success (bool): Whether the query executed successfully
            - message (str): Success message or error details
            - data (list): Sample data if successful (up to 'limit' rows)
            - columns (list): Column names if successful
            - execution_time (float): Query execution time in seconds
    """
    import time
    import re

    # Add LIMIT clause if not present
    # This regex pattern looks for existing LIMIT clauses
    if not re.search(r'\bLIMIT\s+\d+\b', sql_query, re.IGNORECASE):
        # Check if query ends with semicolon and remove it
        if sql_query.strip().endswith(';'):
            sql_query = sql_query.strip()[:-1]

        # Add LIMIT clause
        sql_query = f"{sql_query} LIMIT {limit}"

    try:
        # Get connection
        conn = get_snowflake_connection()

        # Create cursor with timeout
        cursor = conn.cursor()
        cursor.execute(f"ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = {timeout}")

        # Execute query and measure time
        start_time = time.time()
        cursor.execute(sql_query)
        execution_time = time.time() - start_time

        # Fetch results
        results = cursor.fetchall()
        columns = [col[0] for col in cursor.description]

        # Close cursor and connection
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": f"Query executed successfully in {execution_time:.2f} seconds",
            "data": results,
            "columns": columns,
            "execution_time": execution_time
        }

    except Exception as e:
        # Handle specific error types
        error_message = str(e)

        if "timeout" in error_message.lower():
            message = f"Query timed out after {timeout} seconds. Consider optimizing your query."
        elif "syntax error" in error_message.lower():
            message = f"SQL syntax error: {error_message}"
        elif "object does not exist" in error_message.lower():
            message = f"Object not found: {error_message}"
        elif "insufficient privileges" in error_message.lower():
            message = f"Permission error: {error_message}. Note: Even the service account may not have access to all tables."
        else:
            message = f"Error executing query: {error_message}"

        return {
            "success": False,
            "message": message,
            "data": [],
            "columns": [],
            "execution_time": time.time() - start_time if 'start_time' in locals() else 0
        }


def preprocess_query(sql_query):
    """
    Preprocess a SQL query to make it suitable for validation:
    - Remove comments
    - Add LIMIT if not present
    - Handle common syntax issues

    Args:
        sql_query (str): The original SQL query

    Returns:
        str: Preprocessed query
    """
    import re

    # Remove single-line comments
    sql_query = re.sub(r'--.*$', '', sql_query, flags=re.MULTILINE)

    # Remove multi-line comments
    sql_query = re.sub(r'/\*[\s\S]*?\*/', '', sql_query)

    # Ensure the query has a SELECT statement
    if not re.search(r'\bSELECT\b', sql_query, re.IGNORECASE):
        raise ValueError("Query must contain a SELECT statement")

    # Remove trailing semicolon if present
    sql_query = sql_query.strip()
    if sql_query.endswith(';'):
        sql_query = sql_query[:-1]

    return sql_query