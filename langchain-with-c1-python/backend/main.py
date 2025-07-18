#!/usr/bin/env python
import os
import sqlite3
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_core.runnables import RunnableLambda
from langchain.agents import create_openai_tools_agent, AgentExecutor
from fastapi import FastAPI
from langserve import add_routes
from pydantic import BaseModel


# Input model
class ChainInput(BaseModel):
    c1Response: str = ""  # Can be empty
    query: str


# 1. Create model
model = ChatOpenAI(
    base_url="https://api.thesys.dev/v1/embed",
    model="c1/anthropic/claude-3.5-sonnet/v-20250617", # available models: https://docs.thesys.dev/guides/models-pricing#model-table
    api_key=os.environ.get("THESYS_API_KEY")
)

# 2. Create SQL tool
@tool
def execute_sql_query(query: str) -> str:
    """Execute a SQL query on the Chinook database and return the results.

    Args:
        query: The SQL query to execute

    Returns:
        The query results as a formatted string
    """
    try:
        conn = sqlite3.connect('db/Chinook.db')
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        # Get column names
        column_names = [description[0] for description in cursor.description]

        # Format results
        if not results:
            return "No results found."

        # Create a formatted table
        formatted_results = []
        formatted_results.append(" | ".join(column_names))
        formatted_results.append("-" * len(" | ".join(column_names)))

        for row in results:
            formatted_results.append(" | ".join(str(value) for value in row))

        conn.close()
        return "\n".join(formatted_results)

    except Exception as e:
        return f"Error executing SQL query: {str(e)}"

# 3. Create parser
parser = StrOutputParser()

# 4. Create agent prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant that can answer questions about the Chinook digital media store database.

You have access to a SQL tool that can execute queries on the database. The database contains information about:
- Artists, Albums, and Tracks
- Customers and their purchase history
- Employees and sales data
- Playlists and media types

When users ask questions about the music store data, use the SQL tool to query the database and provide accurate information.

Context from previous conversation:
{context}"""),
    ("human", "{query}"),
    ("placeholder", "{agent_scratchpad}")
])

# 5. Create agent and chain
tools = [execute_sql_query]
agent = create_openai_tools_agent(model, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

def format_inputs(inputs: ChainInput):
    """Transform ChainInput to prompt variables and execute agent"""
    context = inputs.get("c1Response", "No previous context")
    # Execute the agent
    result = agent_executor.invoke({
        "context": context,
        "query": inputs["query"]
    })

    return result["output"]

# Create a proper runnable chain
chain = RunnableLambda(format_inputs)

# 6. App definition
app = FastAPI(
  title="LangChain + OpenAI Server",
  version="1.0",
  description="A simple API server using LangChain's Runnable interfaces powered by Thesys C1",
)

# 7. Adding chain route
add_routes(
    app,
    chain.with_types(input_type=ChainInput),
    path="/chain",
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=4001)
