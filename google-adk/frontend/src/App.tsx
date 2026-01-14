import { C1Chat } from "@thesysai/genui-sdk";

function App() {
  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api/chat";

  return <C1Chat apiUrl={apiUrl} />;
}

export default App;
