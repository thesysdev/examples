export interface Message {
  id: string;
  role: "user" | "assistant";
  textContent: string;
  artifactContent: string;
}
