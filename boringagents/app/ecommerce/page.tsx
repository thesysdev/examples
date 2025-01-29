import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function EcommercePage() {
  const InfoCard = (
    <GuideInfoBox>
      <div>E-Commerce Assistant</div>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/ecommerce"
      emoji="🤖"
      placeholder="What do you want to buy?"
      emptyStateComponent={InfoCard}
    />
  );
}
