#!/usr/bin/env python3
"""
Script to consolidate individual GitHub metric YAML files into a single JSON file
similar to the Growthbook metrics_data.json format
"""
import os
import json
import yaml
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_sql_content(yaml_path: str) -> str:
    """
    Load SQL content from corresponding .sql file if it exists
    """
    sql_path = yaml_path.rsplit('.', 1)[0] + '.sql'
    if os.path.exists(sql_path):
        try:
            with open(sql_path, 'r') as f:
                return f.read()
        except Exception as e:
            logger.warning(f"Could not load SQL from {sql_path}: {str(e)}")
    return None

def consolidate_github_metrics():
    """
    Consolidate individual GitHub metric YAML files into a single JSON file
    """
    # Define paths
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    metrics_dir = os.path.join(current_dir, "metrics")
    output_dir = os.path.join(current_dir, "metrics")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize list to store all metrics
    all_metrics = []
    
    # Get all YAML files
    yaml_files = [f for f in os.listdir(metrics_dir) 
                 if f.endswith('.yaml') or f.endswith('.yml')]
    
    logger.info(f"Found {len(yaml_files)} YAML files in {metrics_dir}")
    
    # Process each YAML file
    for yaml_file in yaml_files:
        yaml_path = os.path.join(metrics_dir, yaml_file)
        try:
            # Load YAML content
            with open(yaml_path, 'r') as f:
                metric_data = yaml.safe_load(f)
            
            # Load SQL content from separate file if it exists
            sql_content = load_sql_content(yaml_path)
            if sql_content:
                metric_data['sql'] = sql_content
            
            # Ensure required fields exist
            metric_data.setdefault('tags', [])
            metric_data.setdefault('userIdTypes', [])
            metric_data.setdefault('archived', False)
            metric_data.setdefault('behavior', {})
            
            # Convert projects to list if it's not already
            if 'projects' in metric_data and not isinstance(metric_data['projects'], list):
                metric_data['projects'] = [metric_data['projects']]
            elif 'projects' not in metric_data:
                metric_data['projects'] = []
            
            # Add metric to list
            all_metrics.append(metric_data)
            logger.info(f"Processed metric: {metric_data.get('name', yaml_file)}")
            
        except Exception as e:
            logger.error(f"Error processing {yaml_file}: {str(e)}")
    
    if not all_metrics:
        logger.error("No metrics were processed successfully")
        return
    
    # Create output in Growthbook format
    output_data = {
        "metrics": all_metrics
    }
    
    # Write consolidated metrics to file
    output_file = os.path.join(output_dir, "github_metrics_data.json")
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    logger.info(f"Successfully consolidated {len(all_metrics)} metrics to {output_file}")
    
    # Print summary of metrics
    logger.info("\nMetrics Summary:")
    logger.info(f"Total metrics: {len(all_metrics)}")
    projects = set()
    types = set()
    for metric in all_metrics:
        if 'projects' in metric:
            projects.update(metric['projects'])
        if 'type' in metric:
            types.add(metric['type'])
    
    logger.info(f"Projects found: {sorted(list(projects))}")
    logger.info(f"Metric types found: {sorted(list(types))}")

if __name__ == "__main__":
    consolidate_github_metrics()
