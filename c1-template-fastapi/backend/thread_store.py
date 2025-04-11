from openai.types.chat import ChatCompletionMessageParam
from typing import Dict, List, Optional, TypeAlias, TypedDict


# Message structure: holds an OpenAI message object and an optional ID
class Message(TypedDict):
    openai_message: ChatCompletionMessageParam
    id: Optional[str]


ThreadId: TypeAlias = str


class ThreadStore:
    """
    Manages storage and retrieval of chat messages associated with thread IDs.
    Messages are stored internally as the Message TypedDict structure.
    """

    def __init__(self):
        """Initializes an empty store for threads."""
        # Store now holds the new Message structure
        self._thread_store: Dict[ThreadId, List[Message]] = {}

    def get_messages(self, thread_id: ThreadId) -> List[ChatCompletionMessageParam]:
        """
        Retrieves all messages for a given thread ID, extracting the base OpenAI
        message object required for the API call.

        Args:
            thread_id: The ID of the thread to retrieve messages for.

        Returns:
            A list of messages compatible with ChatCompletionMessageParam.
        """
        stored_messages = self._thread_store.get(thread_id, [])
        # Extract the 'openai_message' part for the OpenAI API
        return [msg['openai_message'] for msg in stored_messages]

    def append_message(self, thread_id: ThreadId, message: Message):
        """
        Appends a single message (in the new Message structure) to the specified thread.
        If the thread doesn't exist, it's created.

        Args:
            thread_id: The ID of the thread to append the message to.
            message: The message object (conforming to the Message TypedDict) to append.
        """
        if thread_id not in self._thread_store:
            self._thread_store[thread_id] = []
        self._thread_store[thread_id].append(message)

    def append_messages(self, thread_id: ThreadId, messages: List[Message]):
        """
        Appends multiple messages (in the new Message structure) to the specified thread.
        If the thread doesn't exist, it's created.

        Args:
            thread_id: The ID of the thread to append messages to.
            messages: A list of message objects (conforming to the Message TypedDict) to append.
        """
        if thread_id not in self._thread_store:
            self._thread_store[thread_id] = []
        self._thread_store[thread_id].extend(messages)


thread_store = ThreadStore()
