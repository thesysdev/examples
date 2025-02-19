import { ResponseTemplate } from "@crayonai/react-core";
import { Breakdown2DViz } from "./breakdown-2d";
import { BreakdownExpenses } from "./breakdown-expenses";
import { TrendsExpenses } from "./trends";
import { UserConsent } from "./user-consent";
import Markdown from "react-markdown";

export const templates = [
  {
    name: "breakdown_2d",
    Component: Breakdown2DViz,
  },
  {
    name: "breakdown_expenses",
    Component: BreakdownExpenses,
  },
  {
    name: "trends",
    Component: TrendsExpenses,
  },
  {
    name: "user_consent",
    Component: UserConsent,
  },
  {
    name: "text",
    Component: Markdown,
  },
] as ResponseTemplate[];
