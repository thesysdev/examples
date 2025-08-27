import "./globals.css";
import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/chat">{children}</CopilotKit>
      </body>
    </html>
  );
}
