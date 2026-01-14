import os
from typing import Annotated, TypedDict, Literal
from langchain_core.messages import AnyMessage, AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import ToolNode
from dotenv import load_dotenv
from tools import runnable_tools
from langgraph.graph.message import add_messages

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    response_id: str

# Initialize model with TheSys endpoint
model = ChatOpenAI(
    model="c1/anthropic/claude-sonnet-4/v-20251130",
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY"),
).bind_tools(runnable_tools)

# Use prebuilt ToolNode (handles tool execution automatically)
tool_node = ToolNode(runnable_tools)

async def call_model(state: AgentState) -> dict:
    """Call the model and assign response_id to final AI responses."""
    messages = state["messages"]
    response = await model.ainvoke(messages)
    
    # Assign response_id to final responses (no tool calls)
    if isinstance(response, AIMessage) and not response.tool_calls:
        response.id = state["response_id"]
    
    return {"messages": [response]}

def should_continue(state: AgentState) -> Literal["tools", END]:
    """Route to tools if last message has tool calls."""
    last_message = state["messages"][-1]
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    return END

# Build the graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")

# Compile the graph
app = workflow.compile()
