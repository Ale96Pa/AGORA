from pnml_reader import get_pnml_data
from define_mapping import read_mapping_from_file
from database_filter_variables import get_filter_value
from active_closed_incidents import get_incidents_open_and_closed_over_time
from calculate_averages_db import calculate_column_average
from statistical_analysis import get_statistical_analysis_data
from common_variants_db import get_sorted_variants_from_db
from compliance_metric_per_state import get_average_compliance_per_state
from count_deviations_db import count_frequencies
from time_between_states_and_transitions import get_average_state_times, get_average_transition_times
from process_compliance_distribution import get_compliance_metric_distribution
from critical_incidents import get_critical_incidents
from technical_analysis import get_incident_technical_attributes
from process_timedeltas import get_ordered_time_to_states_last_occurrence
from google import genai
from api_keys import GEMINI_API_KEY
import eel
import sqlite3

def generate_ai_recommendation(control, update=None):
    prompt = f"""You are assessing the incident management compliance for recorded IT security incidents. Based on that background you are provided
    with the role of the user and the control they are assessing. The role description provides more detail on which perspective needs to be assessed.
    In the following you will first be provided with the necessary control, assigned role and control description.
    Then you will be provided with the defined Incident Management reference model and the mapping between the reference model activities and the incident states later provided in the data.
    After that you will be provided with the overall environment variables and restrictions and thresholds to which the later provided data shall be assessed.
    Finally you will be provided with the data to be assessed. Based on all that information you will provide a recommendation, required remediation or an output for insufficient data on how to improve the incident management compliance.
    In the Control description there might be an indication on which views should be considered by your assessment. You will be provided a list of views and data belonging to each view with descriptions on how to interpret the data based on the persona (role) which should assess the provided control.
    The provided security control which shall be assessed:\n{control}."""

    reference_model = get_pnml_data()
    state_mapping = read_mapping_from_file()
    role = control["role"]
    selected_time_period = get_filter_value("filters.overview_metrics.date_range") 
    environment_variables = get_filter_value("filters.thresholds")
    data_incident_development = get_incidents_open_and_closed_over_time()

    data_incident_development_doc = {
        "description": "Data is provided as the output of get_incidents_open_and_closed_over_time(). Docstring of the function providing the data:",
        "get_incidents_open_and_closed_over_time": get_incidents_open_and_closed_over_time.__doc__
    }

    data_statistical_analysis = [
        calculate_column_average("fitness"),
        get_statistical_analysis_data()
    ]

    data_statistical_analysis_doc = {
        "description": "Data is provided as an array data_statistical_analysis = [calculate_column_average(compliance_metric), get_statistical_analysis_data()]. Docstrings of the functions providing the data:",
        "calculate_column_average": calculate_column_average.__doc__,
        "get_statistical_analysis_data": get_statistical_analysis_data.__doc__
    }

    data_reference_model = [
        get_pnml_data(),
        count_frequencies(),
        read_mapping_from_file(),
        get_average_state_times(),
        get_average_transition_times()
    ]

    data_reference_model_doc = {
        "description": "Data is provided as an array data_reference_model = [get_pnml_data(), count_frequencies(), read_mapping_from_file(), get_average_state_times(), get_average_transition_times()]. Docstrings of the functions providing the data:",
        "get_pnml_data": get_pnml_data.__doc__,
        "count_frequencies": count_frequencies.__doc__,
        "read_mapping_from_file": read_mapping_from_file.__doc__,
        "get_average_state_times": get_average_state_times.__doc__,
        "get_average_transition_times": get_average_transition_times.__doc__
    }


    data_common_variants = get_sorted_variants_from_db()

    data_common_variants_doc = {
        "description": "Data is provided as the output of get_sorted_variants_from_db(). Docstring of the function providing the data:",
        "get_sorted_variants_from_db": get_sorted_variants_from_db.__doc__
    }

    data_process_activities_analysis = [
        get_average_compliance_per_state(),
        count_frequencies(),
        get_average_state_times(),
        get_ordered_time_to_states_last_occurrence()
    ]
    data_process_activities_analysis_doc = {
        "description": "Data is provided as an array data_process_activities_analysis = [get_average_compliance_per_state(),count_frequencies(), get_average_state_times(),get_ordered_time_to_states_last_occurrence()]. Docstrings of the functions providing the data:",
        "get_average_compliance_per_state": get_average_compliance_per_state.__doc__,
        "count_frequencies": count_frequencies.__doc__,
        "get_average_state_times": get_average_state_times.__doc__,
        "get_ordered_time_to_states_last_occurrence": get_ordered_time_to_states_last_occurrence.__doc__
    }
    data_compliance_distribution = get_compliance_metric_distribution()

    data_compliance_distribution_doc = {
        "description": "Data is provided as the output of get_compliance_metric_distribution(). Docstring of the function providing the data:",
        "get_compliance_metric_distribution": get_compliance_metric_distribution.__doc__
    }

    data_most_critical_incidents = get_critical_incidents()

    data_most_critical_incidents_doc = {
        "description": "Data is provided as the output of get_critical_incidents(). Docstring of the function providing the data:",
        "get_critical_incidents": get_critical_incidents.__doc__
    }

    data_technical_analysis = get_incident_technical_attributes()

    data_technical_analysis_doc = {
        "description": "Data is provided as the output of get_incident_technical_attributes(). Docstring of the function providing the data:",
        "get_incident_technical_attributes": get_incident_technical_attributes.__doc__
    }

    personas = {
        "Manager": {
            "description": "Responsible for overseeing the incident management process and ensuring compliance with organizational policies and standards. Acts on high-level metrics and KPIs to make strategic decisions and ensure contractual obligations are met. The data provided in the following views shall only be assessed with the background of the Manager in mind.",
            "views": {
                "incident_development": {
                    "description": "Provides a reduced view with 5 tiles (active incidents at start and end of selected time period, closed incidents with low, moderate, high, and critical process severity at the end of selected time period). The full view provides these data in a line chart over time together with a line showing the active incidents over time.",
                    "information": {
                        "data": data_incident_development,
                        "data_structure_and_interpretation": data_incident_development_doc
                    }
                },
                "statistical_analysis": {
                    "description": "Overview of the most important KPIs: average process compliance value, average number of SLA met, and average time to resolve incidents.",
                    "information": {
                        "data": data_statistical_analysis,
                        "data_structure_and_interpretation": data_statistical_analysis_doc
                    }
                },
                "reference_model": {
                    "description": "Provides the IM reference model in a linearized way. Shows average state times and transitions, and non-compliant transitions.",
                    "information": {
                        "data": data_reference_model,
                        "data_structure_and_interpretation": data_reference_model_doc
                    }
                }
            }
        },
        "Monitor": {
            "description": "Responsible for monitoring the incident management process and ensuring compliance with organizational policies and standards. Monitors the real-time status and searches for inconsistencies and emerging issues regarding process compliance. The data provided in the following views shall only be assessed with the background of the Monitor in mind.",
            "views": {
                "reference_model": {
                    "description": "Provides the IM reference model in a linearized way. Shows average state times and transitions, and non-compliant transitions.",
                    "information": {
                        "data": data_reference_model,
                        "database_filter_variables": data_reference_model_doc
                    }
                },
                "common_variants": {
                    "description": "Shows the most common variants of incident process flows recorded in the selected time period. The list is provided as a collection of recorded variants sorted from most frequent to least frequent with percentage and total number of occurrences.",
                    "information": {
                        "data": data_common_variants,
                        "data_structure_and_interpretation": data_common_variants_doc
                    }
                }
            }
        },
        "Responder": {
            "description": "Responsible for responding to IT security incidents and ensuring compliance with organizational policies and standards. Focuses on the detailed process activities and their compliance to the reference model. The data provided in the following views shall only be assessed with the background of the Responder in mind.",
            "views": {
                "process_activities_analysis": {
                    "description": "Provides a detailed analysis opportunity of average compliance value per reference model activity (the sum is the total average compliance value, so in order to assess each individially they are devided by the number of total activites in the reference model), total deviations per reference model activity, and average time spent in each reference model activity. Also shows the temporal development of process compliance in a time chart, total deviations per activity separated into types (missing, repetition, mismatch), and durations of activities in a time chart. The operator can select different compliance metrics. In this analysis part not only the state of art of KPI`s averages is important but also the trend over time.",
                    "information": {
                        "data": data_process_activities_analysis,
                        "data_structure_and_interpretation": data_process_activities_analysis_doc
                    }
                },
                "compliance_distribution": {
                    "description": "Shows the distribution of process compliance values over all incidents in the selected time period.",
                    "information": {
                        "data": data_compliance_distribution,
                        "data_structure_and_interpretation": data_compliance_distribution_doc
                    }
                }
            }
        },
        "Analyst": {
            "description": "Responsible for in-depth and low-level analysis of incidents recorded in the incident management process. Focuses on identifying root causes and detailed process deviations to improve overall compliance. Also concerned about technical and individual analysis of incidents. The data provided in the following views shall only be assessed with the background of the Analyst in mind.",
            "views": {
                "most_critical_incidents": {
                    "description": "Provides a list of the most critical incidents regarding process compliance in the selected time period, sorted from most critical to least critical by process compliance value.",
                    "information": {
                        "data": data_most_critical_incidents,
                        "data_structure_and_interpretation": data_most_critical_incidents_doc
                    }
                },
                "technical_analysis": {
                    "description": "Provides a detailed technical analysis of selected incidents regarding Symptom, Impact, Urgency, Priority, Location, Category in a sort of sankey diagram showing more affected attributes and flows more prominently.",
                    "information": {
                        "data": data_technical_analysis,
                        "data_structure_and_interpretation": data_technical_analysis_doc
                    }
                }
            }
        }
    }

    persona_data = personas.get(role)
    if not persona_data:
        return {
            "error": f"Role '{role}' not found in personas.",
            "available_roles": list(personas.keys())
        }

    prompt += f"\n Overall environment\n Reference Model: {reference_model}\n State Mapping: {state_mapping}\n Selected Time period: {selected_time_period}\n Environment Variables: {environment_variables}\n\n Data to be assessed:\n"
    prompt += f"\n\nCurrent Role: {role}\n\n Role Description, included views and necessary data:\n{persona_data}"
    prompt += f"\n\nThe answer should be as short and concise as possible, but still include all necessary information. Please refrain from making unnecessary assumptions or adding information that is not directly supported by the provided data. Your recommendation should be actionable and tailored to the specific control being assessed."
    
    if update:
        prompt += f"\n\n Update Request: {update}"
    
    print(prompt)

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        )
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        return None

    return response.text

def update_ai_recommendation(control, operator_response):

    ai_recommendation = control["comments"]

    prompt = f"""Now you are required to formulate/generate an update to your previous recommendation: {ai_recommendation}
    According to the updated requirements in the feedback: {operator_response}"""

    response = generate_ai_recommendation(control, update=prompt)
    
    return response

@eel.expose
def generate_assessment_security_control(control_id, operator_response=None):
    """
    Fetches the security control's title, description, and operator_id based on the provided control_id.
    Returns a dictionary with these fields, or None if not found.
    """
    try:
        database = "../data/security_controls.db"
        conn = sqlite3.connect(database)
        cursor = conn.cursor()

        sql_fetch_control = """
            SELECT title, description, operator_id, comments
            FROM security_controls
            WHERE id = ?
        """
        cursor.execute(sql_fetch_control, (control_id,))
        row = cursor.fetchone()

        if row:
            control = {
                "title": row[0],
                "description": row[1],
                "role": row[2],
                "comments": row[3]
            }
        else:
            print("database_sec_controls.py")
            print(f"No security control found with ID: {control_id}")
            return None
        
        if operator_response:
            recommendation = update_ai_recommendation(control, operator_response)
        else:
            recommendation = generate_ai_recommendation(control)

        sql_update_comments = """
            UPDATE security_controls
            SET comments = ?
            WHERE id = ?
        """
        cursor.execute(sql_update_comments, (recommendation, control_id))
        conn.commit()
        conn.close()

        return recommendation

    except sqlite3.Error as e:
        print("database_sec_controls.py")
        print(f"An error occurred: {e}")
        return None
    
def check_imported_functions():
    """
    Checks if all imported functions can be called and return data (not None).
    Returns a dict with function names, their status/result, and the actual returned value.
    """
    results = {}
    try:
        value = get_pnml_data()
        results['get_pnml_data'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_pnml_data'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = read_mapping_from_file()
        results['read_mapping_from_file'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['read_mapping_from_file'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_filter_value()
        results['get_filter_value'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_filter_value'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_incidents_open_and_closed_over_time()
        results['get_incidents_open_and_closed_over_time'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_incidents_open_and_closed_over_time'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = calculate_column_average("fitness")
        results['calculate_column_average'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['calculate_column_average'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_statistical_analysis_data()
        results['get_statistical_analysis_data'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_statistical_analysis_data'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_sorted_variants_from_db()
        results['get_sorted_variants_from_db'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_sorted_variants_from_db'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_average_compliance_per_state()
        results['get_average_compliance_per_state'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_average_compliance_per_state'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = count_frequencies()
        results['count_frequencies'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['count_frequencies'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_average_state_times()
        results['get_average_state_times'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_average_state_times'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_average_transition_times()
        results['get_average_transition_times'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_average_transition_times'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_compliance_metric_distribution()
        results['get_compliance_metric_distribution'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_compliance_metric_distribution'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_critical_incidents()
        results['get_critical_incidents'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_critical_incidents'] = {"status": False, "value": f"Error: {e}"}
    try:
        value = get_incident_technical_attributes()
        results['get_incident_technical_attributes'] = {"status": value is not None, "value": value}
    except Exception as e:
        results['get_incident_technical_attributes'] = {"status": False, "value": f"Error: {e}"}
    return results

# Example usage
if __name__ == "__main__":

    result = generate_assessment_security_control(149)

    print(result)