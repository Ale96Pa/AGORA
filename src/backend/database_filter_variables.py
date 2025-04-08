# This file contains all the globval database variables for
import eel
import json


assessment_filters = {
    "filters": {
        "compliance_metric": "fitness",
        "cost_function": {
            "missing": {"N":0.25,"A":0.25, "W":0, "R":0.25,"C":0.25},
            "repetition": {"N":0.25,"A":0.25,"W":0.2,"R":0.2,"C":0.1},
            "mismatch": {"N":0.35,"A":0.35,"W":0.1,"R":0.1,"C":0.1},
            "cost": {"missing":0.33,"repetition":0.34,"mismatch":0.33},
        }, 
        "thresholds": {
            "compliance_metric_severity_levels": {
                "low": ">= 0.85 AND <= 1",
                "moderate": ">= 0.65 AND < 0.85",
                "high": ">= 0.5 AND < 0.65",
                "critical": ">= 0 AND <= 0.5"
            },
            "detection": {
                "acceptableTime": "<= 480",
                "nonAcceptableTime": ">= 720",
                "deviations": {
                    "acceptableMissing": "<=20",
                    "acceptableRepetition": "<=50",
                    "acceptableMismatch": "<=5"
                },
            },
            "activation": {
                "acceptableTime": "<= 1080",
                "nonAcceptableTime": ">= 1440",
                "deviations": {
                    "acceptableMissing": "<=20",
                    "acceptableRepetition": "<=50",
                    "acceptableMismatch": "<=5"
                },
            },
            "awaiting": {
                "acceptableTime": "<= 100",
                "nonAcceptableTime": ">= 2880",
                "deviations": {
                    "acceptableMissing": "<=100",
                    "acceptableRepetition": "<=50",
                    "acceptableMismatch": "<=5"
                },
            },
            "resolution": {
                "acceptableTime": "<= 100",
                "nonAcceptableTime": ">= 4000",
                "deviations": {
                    "acceptableMissing": "<=100",
                    "acceptableRepetition": "<=50",
                    "acceptableMismatch": "<=5"
                },
            },
            "closure": {
                "acceptableTime": "<= 100",
                "nonAcceptableTime": ">= 5760",
                "deviations": {
                    "acceptableMissing": "<=100",
                    "acceptableRepetition": "<=50",
                    "acceptableMismatch": "<=5"
                },
            },
        },
        "overview_metrics": {
            "date_range": {
                "min_date": "2017-01-09",
                "max_date": "2023-02-18",
                "closed_incidents_in_time_period": False
            },
            "compliance_bar": {
                "low": False,
                "moderate": False,
                "high": False,
                "critical": False
            }
        },
        "reference_model": {
            "selected_states": False,
        },
        "common_variants": None,
        "statistical_analysis": {
            "perc_sla_met": None,
            "avg_time_to_resolve": None,
            "perc_assigned_to_resolved_by": None,
            "perc_false_positives": None,
        },
        "deviations_distribution": {
            "missing": False,
            "repetition": False,
            "mismatch": False,
        },
        "most_critical_incidents": False,
        "technical_analysis": {
            "symptom": [],
            "impact_level": [],
            "urgency_level": [],
            "priority_level": [],
            "location": [],
            "category": [],
            "subcategory": [],
        },
        "graph_x-axis-sliders": {
            "min_date": False,
            "max_date": False
        },
        "tabular_incident_selection": False,
        "whatIf_Analyis": []
    }
}

@eel.expose
def get_filter_value(path=None):
    """
    Retrieves the value from the assessment_filters dictionary using the dot-separated path.
    If no path is provided, returns the entire assessment_filters dictionary.

    Args:
        path (str, optional): Dot-separated path to the value, e.g., "filters.overview_metrics.date_range.min_date".
                              If not provided, the entire assessment_filters object is returned.

    Returns:
        The value at the specified path, or the entire assessment_filters if no path is provided,
        or None if the path is invalid.
    """
    # If no path is provided, return the entire assessment_filters object
    if not path:
        return assessment_filters

    # Otherwise, retrieve the value using the provided path
    keys = path.split('.')
    value = assessment_filters
    try:
        for key in keys:
            value = value[key]
        return value
    except KeyError:
        return None


@eel.expose
def set_filter_value(path, new_value):
    """
    Sets a new value in the assessment_filters dictionary using the dot-separated path.

    Args:
        path (str): Dot-separated path to the value, e.g., "filters.overview_metrics.date_range.min_date".
        new_value: The new value to set at the specified path.

    Returns:
        bool: True if the value was successfully set, False if the path is invalid.
    """
    keys = path.split('.')
    value = assessment_filters
    try:
        for key in keys[:-1]:
            value = value[key]
        value[keys[-1]] = new_value

        # Print the newly set filter value
        print("database_filter_variables.py")
        print(f"Filter updated: {path} = {new_value}")

        return True
    except KeyError:
        print("database_filter_variables.py")
        print(f"Failed to set filter: {path} is an invalid path.")
        return False


def apply_whatif_analysis_filter():
    """
    Retrieves the 'whatif_analysis' filter and crafts a SQL condition to exclude the specified incident IDs.
    
    Args:
        filters (dict): The filters dictionary returned from get_filter_value().

    Returns:
        str: A SQL fragment to exclude specific incident IDs.
    """

    whatif_analysis_ids = get_filter_value("filters.whatIf_analysis")
    
    if whatif_analysis_ids:
        # Format the incident IDs to exclude for SQL query
        formatted_ids = ', '.join(f"'{incident_id}'" for incident_id in whatif_analysis_ids)
        return f"incident_id NOT IN ({formatted_ids})"
    
    return ""


#incident_ids_from_time_period = ['INC0121064']
incident_ids_from_time_period = ['INC0121064']
incident_compliance_metric = 'fitness'
compliance_metric_thresholds = {
    "critical": [0, 0.25],
    "moderate": [0.25, 0.5],
    "high": [0.5, 0.75],
    "low": [0.75, 1]
}

filter_compliance_metric_thresholds = {}

incident_selection_from_tabular_analysis = []

@eel.expose
def get_incident_ids_selection():
    return incident_ids_from_time_period


def set_incident_ids_selection(incident_ids):
    global incident_ids_from_time_period 
    incident_ids_from_time_period = incident_ids
    return

@eel.expose
def get_incident_compliance_metric():
    return incident_compliance_metric

@eel.expose
def set_incident_compliance_metric(selected_metric):
    global incident_compliance_metric
    incident_compliance_metric = selected_metric
    return

@eel.expose
def get_compliance_metric_thresholds():
    return json.dumps(compliance_metric_thresholds)

@eel.expose
def set_compliance_metric_thresholds(thresholds):
    global compliance_metric_thresholds
    compliance_metric_thresholds = json.loads(thresholds)
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
        print("database_filter_variables.py")
        print(f"Removed filter: {filter_key}")
    else:
        # Otherwise, add the filter to the global variable
        filter_compliance_metric_thresholds[filter_key] = (metric_name, range_start, range_end)
        print("database_filter_variables.py")
        print(f"Added filter: {filter_key}")

    # For debugging, print the current filters
    print("database_filter_variables.py")
    print("Current filters:", filter_compliance_metric_thresholds)

    # Optionally, return the current filters as a string or any format you need
    return filter_compliance_metric_thresholds


@eel.expose
def get_incident_ids_from_tabular_selection():
    return incident_selection_from_tabular_analysis

@eel.expose
def set_incident_ids_from_tabular_selection(incident_ids):
    global incident_selection_from_tabular_analysis
    incident_selection_from_tabular_analysis = incident_ids
    return