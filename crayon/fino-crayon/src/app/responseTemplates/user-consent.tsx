"use client";
import { Card, CardHeader, Button } from "@crayonai/react-ui";
import { useThreadActions } from "@crayonai/react-core";
import { UserConsentProps } from "@/types/responseTemplates/user-consent";

export const UserConsent: React.FC<UserConsentProps> = ({ explanation }) => {
  const threadActions = useThreadActions();

  return (
    <Card>
      <CardHeader title="User Consent" subtitle={explanation} />
      <div className="flex flex-col gap-2">
        <Button
          onClick={() =>
            threadActions.processMessage({
              role: "user",
              message: "I accept",
            })
          }
        >
          Accept
        </Button>
        <Button
          onClick={() =>
            threadActions.processMessage({
              role: "user",
              message: "I decline",
            })
          }
        >
          Decline
        </Button>
      </div>
    </Card>
  );
};
