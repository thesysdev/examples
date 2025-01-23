import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <div>Travel Assistant</div>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/travel"
      emoji="🤖"
      placeholder="Ask me about travel suggestions"
      emptyStateComponent={InfoCard}
    />
  );
}
