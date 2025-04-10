import { JobApplicationType } from "../../types/application";
import { SubscribeToNewsletterType } from "../../types/subscribe";

export const subscribeToNewsletter = ({
  name,
  email,
}: SubscribeToNewsletterType) => {
  console.log(`${email} - ${name} successfully subscribed to the newsletter`);
};

export const applyToJob = ({
  personalInformation,
  professionalDetails,
  education,
}: JobApplicationType) => {
  console.log(
    `${personalInformation.email} - ${personalInformation.name} successfully applied to the job`
  );
  if (professionalDetails) {
    console.log(
      `Professional Details: ${professionalDetails.company} - ${professionalDetails.title}`
    );
  } else {
    console.log("Professional Details: Not provided");
  }
  console.log(`Education: ${education.school} - ${education.degree}`);
};
