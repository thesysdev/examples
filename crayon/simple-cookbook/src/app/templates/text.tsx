import React from "react";
import Markdown from "react-markdown";

// Template for text response
export const TextTemplate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <Markdown>{children as string}</Markdown>;
};
