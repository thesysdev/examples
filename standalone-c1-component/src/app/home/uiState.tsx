import { ActionDispatch, createContext, useContext, useReducer } from "react";

export type UIState = {
  query: string;
  abortController?: AbortController;
  c1Response: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formState: undefined | Record<string, any>;
  isSearching: boolean;
};

export type Action =
  | {
      type: "setQuery";
      payload: string;
    }
  | {
      type: "setC1Response";
      payload: string;
    }
  | {
      type: "search";
      payload: AbortController;
    }
  | {
      type: "search-end";
    }
  | {
      type: "abort";
    };

export type StateDispatch = ActionDispatch<[action: Action]>;

const reducer = (state: UIState, action: Action) => {
  switch (action.type) {
    case "setQuery": {
      return { ...state, query: action.payload };
    }
    case "setC1Response": {
      return { ...state, c1Response: action.payload };
    }
    case "search": {
      return {
        ...state,
        abortController: action.payload,
        isSearching: true,
        formState: undefined,
      };
    }
    case "search-end": {
      return { ...state, abortController: undefined, isSearching: false };
    }
    case "abort": {
      state.abortController?.abort();
      return { ...state, abortController: undefined, isSearching: false };
    }
  }
};

const defaultState = {
  query: "",
  c1Response: "",
  formState: undefined,
  isSearching: false,
};

export const useUIState = () => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  return { state, dispatch };
};

export const StateContext = createContext<{
  state: UIState;
  dispatch: StateDispatch;
} | null>(null);

export const useStateContext = () => {
  const value = useContext(StateContext);
  if (!value) {
    throw new Error("useStateContext is called outside of provider");
  }
  return value;
};

export const makeApiCallInternal = async (
  query: string,
  dispatch: StateDispatch,
  previousC1Response?: string
) => {
  const abortController = new AbortController();

  dispatch({
    type: "search",
    payload: abortController,
  });

  const response = await fetch("/api/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: query,
      previousC1Response,
    }),
    signal: abortController.signal,
  });

  const decoder = new TextDecoder();

  const stream = response.body?.getReader();

  if (!stream) {
    throw new Error("response.body not found");
  }

  let c1Response = "";

  while (true) {
    const { done, value } = await stream.read();
    const chunk = decoder.decode(value, { stream: !done });

    try {
      c1Response += chunk;
      dispatch({
        type: "setC1Response",
        payload: c1Response,
      });
    } catch {
      break;
    }

    if (done) {
      break;
    }
  }
};

export const makeApiCall = async (
  query: string,
  dispatch: StateDispatch,
  previousC1Response?: string
) => {
  try {
    await makeApiCallInternal(query, dispatch, previousC1Response);
  } catch (error) {
    console.error("Error in makeApiCall:", error);
  } finally {
    dispatch({
      type: "search-end",
    });
  }
};
