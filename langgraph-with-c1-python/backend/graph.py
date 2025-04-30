import os
from typing import Annotated, List, TypedDict

# Use AnyMessage for broader compatibility, AIMessage for checking tool calls
from langchain_core.messages import AnyMessage, AIMessage 
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import ToolNode
from dotenv import load_dotenv
from tools import runnable_tools
# Use the built-in add_messages reducer for standard append/update logic
from langgraph.graph.message import add_messages

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[List[AnyMessage], add_messages]
    # Store response_id to potentially assign it to the AIMessage
    response_id: str 

# Initialize model and bind tools in one step
model = ChatOpenAI(
    model="c1-nightly",
    temperature=0,
    base_url="http://localhost:3102/v1/embed",
    api_key=os.getenv("THESYS_API_KEY"),
).bind_tools(runnable_tools)

# Tool execution node
tool_node = ToolNode(runnable_tools)

async def call_model(state: AgentState):
    """Invokes the agent model with the current state messages."""
    messages = state["messages"]
    response = await model.ainvoke(messages)
    # If it's a standard AI response (not a tool call), assign the response_id
    if isinstance(response, AIMessage) and not response.tool_calls:
        response.id = state["response_id"]
    return {"messages": [response]}

def should_continue(state: AgentState):
    """Routes to tools if the last message is an AIMessage with tool_calls."""
    last_message = state["messages"][-1]
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    return END

workflow = StateGraph(AgentState)

workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END,
    },
)

workflow.add_edge("tools", "agent")

memory = MemorySaver()
app = workflow.compile(checkpointer=memory) 
