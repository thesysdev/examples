"use client";

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider, C1Component } from "@thesysai/genui-sdk";
import { makeApiCall, StateContext, useUIState } from "./uiState";
import { Loader } from "./Loader";

export const HomePage = () => {
  const { state, dispatch } = useUIState();

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex gap-4 items-center">
            <input
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-500 dark:placeholder-gray-400"
              value={state.query}
              placeholder="Enter company name/domain..."
              onChange={({ target: { value } }) => {
                dispatch({
                  type: "setQuery",
                  payload: value,
                });
              }}
            />
            <button
              onClick={async () => {
                makeApiCall(state.query, dispatch);
              }}
              disabled={state.query.length === 0 || state.isSearching}
              className="enabled:cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {state.isSearching ? <Loader /> : "Submit"}
            </button>
          </div>

          <div className="max-w-[750px] mx-auto">
            <ThemeProvider mode="dark">
              <C1Component
                c1Response={state.c1Response}
                isStreaming={state.isSearching}
                updateMessage={(message) => {
                  dispatch({
                    type: "setC1Response",
                    payload: message,
                  });
                }}
                onAction={({ userPromptMessage }) => {
                  if (!state.isSearching) {
                    makeApiCall(userPromptMessage, dispatch);
                  }
                }}
              />
            </ThemeProvider>
          </div>
        </div>
      </div>
    </StateContext.Provider>
  );
};
