import {
  Card,
  CardHeader,
  Input,
  Label,
  Buttons,
  Button,
} from "@crayonai/react-ui";
import {
  Mail as MailIcon,
  User as UserIcon,
  AtSign as AtSignIcon,
  Send as SendIcon,
} from "lucide-react";
import { Hint, FormControl } from "@crayonai/react-ui/FormControl";
import { useMessage, useThreadActions } from "@crayonai/react-core";
import { useState, useEffect } from "react";
import { SubscribeToNewsletterType } from "../types/subscribe";

// A very simple exercise here is to accept default props from AI
// such that the form is pre-filled with the user's name and email.
export const SimpleForm = () => {
  const { processMessage } = useThreadActions();
  const { message } = useMessage();

  const [name, setName] = useState(
    (message.context?.[0] as SubscribeToNewsletterType)?.name ?? ""
  );
  const [email, setEmail] = useState(
    (message.context?.[0] as SubscribeToNewsletterType)?.email ?? ""
  );

  // Storing the form data in the message context helps preserve
  // the form data across multiple sessions.
  useEffect(() => {
    message.context = [{ name, email } satisfies SubscribeToNewsletterType];
  }, [message, name, email]);

  return (
    <Card variant="card" width="standard">
      <CardHeader
        title="Subscribe to Our Newsletter"
        subtitle="Get the latest updates and special offers"
        icon={<MailIcon size={"1em"} />}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          processMessage({
            role: "user",
            message: `Name: ${name}, Email: ${email}`,
            type: "prompt",
            isVisuallyHidden: true,
          });
        }}
      >
        <FormControl>
          <Label>Name</Label>
          <Input
            placeholder={"Type here..."}
            value={name}
            type="text"
            required
            onChange={(e) => {
              setName(e.target.value);
            }}
          />

          <Hint>
            <UserIcon size={"1em"} />
            Enter your full name
          </Hint>
        </FormControl>

        <FormControl>
          <Label>Email</Label>
          <Input
            placeholder={"Type here..."}
            value={email}
            type="email"
            required
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />

          <Hint>
            <AtSignIcon size={"1em"} />
            Enter your email address
          </Hint>
        </FormControl>

        <Buttons variant="horizontal">
          <Button
            variant="primary"
            size="medium"
            iconLeft={<SendIcon size={"1em"} />}
            type="submit"
          >
            Subscribe
          </Button>
        </Buttons>
      </form>
    </Card>
  );
};
