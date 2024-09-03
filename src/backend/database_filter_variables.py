# This file contains all the globval database variables for
import eel

incident_ids_from_time_period = []
incident_complinance_metric = 'fitness'
filter_compliance_metric_thresholds = {}

@eel.expose
def get_incident_ids_selection():
    return incident_ids_from_time_period


def set_incident_ids_selection(incident_ids):
    global incident_ids_from_time_period 
    incident_ids_from_time_period = incident_ids
    return

@eel.expose
def get_incident_compliance_metric():
    return incident_complinance_metric

@eel.expose
def set_incident_complinace_metric(selected_metric):
    global incident_complinance_metric
    incident_complinance_metric = selected_metric
    return

@eel.expose
def get_filter_compliance_metric_thresholds():
    return filter_compliance_metric_thresholds


@eel.expose
def set_filter_compliance_metric_thresholds(metric_name, range_start, range_end):
    global filter_compliance_metric_thresholds
    
    # Create a unique key for the range filter
    filter_key = f"{metric_name}_{range_start}_{range_end}"

    # Check if the filter is already applied (if it exists in the global variable)
    if filter_key in filter_compliance_metric_thresholds:
        # If the filter exists, remove it (this means the user unclicked the severity level)
        del filter_compliance_metric_thresholds[filter_key]
        print(f"Removed filter: {filter_key}")
    else:
        # Otherwise, add the filter to the global variable
        filter_compliance_metric_thresholds[filter_key] = (metric_name, range_start, range_end)
        print(f"Added filter: {filter_key}")

    # For debugging, print the current filters
    print("Current filters:", filter_compliance_metric_thresholds)

    # Optionally, return the current filters as a string or any format you need
    return filter_compliance_metric_thresholds


def build_filter_query():
    """
    Build the SQL WHERE clause based on the current filters.
    
    Returns:
        str: The SQL WHERE clause.
    """
    global filter_compliance_metric_thresholds

    if not filter_compliance_metric_thresholds:
        return ""  # No filters applied

    conditions = []
    for metric_name, range_start, range_end in filter_compliance_metric_thresholds.values():
        condition = f"{metric_name} BETWEEN {range_start} AND {range_end}"
        conditions.append(condition)

    # Combine all conditions with AND (you can change this to OR if needed)
    where_clause = " OR ".join(conditions)
    return f"{where_clause}"