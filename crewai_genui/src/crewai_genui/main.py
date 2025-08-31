#!/usr/bin/env python
import sys
import warnings
import streamlit as st
import streamlit_thesys as thesys
from datetime import datetime
from crewai_genui.crew import CrewaiGenui

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")


def run():
    """
    Run the crew.
    """
    inputs = {
        'topic': 'AI LLMs',
        'current_year': str(datetime.now().year)
    }

    try:
        CrewaiGenui().crew().kickoff(inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "topic": "AI LLMs",
        'current_year': str(datetime.now().year)
    }
    try:
        CrewaiGenui().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        CrewaiGenui().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        "topic": "AI LLMs",
        "current_year": str(datetime.now().year)
    }

    try:
        CrewaiGenui().crew().test(n_iterations=int(sys.argv[1]), eval_llm=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")

def streamlit_app():
    # Streamlit app
    st.title("CrewAI Research & Reporting")
    topic = st.text_input("Enter topic:", value="AI LLMs")

    if st.button("Run Analysis"):
        inputs = {
            'topic': topic,
            'current_year': str(datetime.now().year)
        }

        with st.spinner("Running analysis..."):
            try:
                result = CrewaiGenui().crew().kickoff(inputs=inputs)
                thesys.render_response(result.raw if hasattr(result, 'raw') else str(result))
            except Exception as e:
                st.error(f"Error: {e}")

if __name__ == "__main__":
    streamlit_app()
