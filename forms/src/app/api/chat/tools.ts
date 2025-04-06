import { SubscribeToNewsletterType } from "../../types/subscribe";

export const subscribeToNewsletter = ({
  name,
  email,
}: SubscribeToNewsletterType) => {
  console.log(`${email} - ${name} successfully subscribed to the newsletter`);
};
