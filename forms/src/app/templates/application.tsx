import {
  Card,
  CardHeader,
  Input,
  Label,
  Buttons,
  Button,
} from "@crayonai/react-ui";
import {
  UserPlus as UserPlusIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  ArrowRight as ArrowRightIcon,
  Building2 as Building2Icon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
  Scroll as ScrollIcon,
} from "lucide-react";
import { Hint, FormControl } from "@crayonai/react-ui/FormControl";
import { useThreadActions } from "@crayonai/react-core";

// There are a couple of more things that can be done here.
// 1. We can let AI pre-fill the form with the user's information in which case
// it would be necessary to accept the prefilled values as props and then use them.
// 2. When productionizing this, we should also store the form data in the message context
// so that it can be used across multiple sessions.
export const PersonalInformationForm = () => {
  const { processMessage } = useThreadActions();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    processMessage({
      role: "user",
      message: `Personal Information - Name: ${formData.get(
        "fullName"
      )}, Email: ${formData.get("email")}`,
      type: "prompt",
      isVisuallyHidden: true,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="card" width="standard">
        <CardHeader
          title={<p>Personal Information</p>}
          icon={<UserPlusIcon size={"1em"} />}
        />

        <FormControl>
          <Label>
            <p>Full Name</p>
          </Label>
          <Input
            name="fullName"
            placeholder={"Type here..."}
            required
            pattern="[A-Za-z\s]+"
            title="Name should only contain letters and spaces"
          />
          <Hint>
            <InfoIcon size={"1em"} />
            <p>
              Please enter your full name as it appears on official documents
            </p>
          </Hint>
        </FormControl>

        <FormControl>
          <Label>
            <p>Email Address</p>
          </Label>
          <Input
            name="email"
            type="email"
            placeholder={"Type here..."}
            required
          />
          <Hint>
            <MailIcon size={"1em"} />
            <p>Enter your active email address for communication</p>
          </Hint>
        </FormControl>

        <Buttons variant="horizontal">
          <Button
            type="submit"
            variant="primary"
            size="medium"
            iconRight={<ArrowRightIcon size={"1em"} />}
          >
            Next
          </Button>
        </Buttons>
      </Card>
    </form>
  );
};

export const ProfessionalDetailsForm = () => {
  const { processMessage } = useThreadActions();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    processMessage({
      role: "user",
      message: `Professional Details - Company: ${formData.get(
        "company"
      )}, Job Title: ${formData.get("jobTitle")}`,
      type: "prompt",
      isVisuallyHidden: true,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="card" width="standard">
        <FormControl>
          <Label>
            <p>Current Company</p>
          </Label>
          <Input name="company" placeholder={"Type here..."} required />
          <Hint>
            <Building2Icon size={"1em"} />
            <p>Enter the name of your current employer</p>
          </Hint>
        </FormControl>

        <FormControl>
          <Label>
            <p>Job Title</p>
          </Label>
          <Input name="jobTitle" placeholder={"Type here..."} required />
          <Hint>
            <BriefcaseIcon size={"1em"} />
            <p>Enter your current job title</p>
          </Hint>
        </FormControl>

        <Buttons variant="horizontal">
          <Button
            type="submit"
            variant="primary"
            size="medium"
            iconRight={<ArrowRightIcon size={"1em"} />}
          >
            Next
          </Button>
        </Buttons>
      </Card>
    </form>
  );
};

export const EducationForm = () => {
  const { processMessage } = useThreadActions();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    processMessage({
      role: "user",
      message: `Education Details - School: ${formData.get(
        "school"
      )}, Degree: ${formData.get("degree")}`,
      type: "prompt",
      isVisuallyHidden: true,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="card" width="standard">
        <FormControl>
          <Label>
            <p>School Name</p>
          </Label>
          <Input name="school" placeholder={"Type here..."} required />
          <Hint>
            <GraduationCapIcon size={"1em"} />
            <p>Enter the name of your educational institution</p>
          </Hint>
        </FormControl>

        <FormControl>
          <Label>
            <p>Degree</p>
          </Label>
          <Input name="degree" placeholder={"Type here..."} required />
          <Hint>
            <ScrollIcon size={"1em"} />
            <p>Enter your degree or certification</p>
          </Hint>
        </FormControl>

        <Buttons variant="horizontal">
          <Button
            type="submit"
            variant="primary"
            size="medium"
            iconRight={<ArrowRightIcon size={"1em"} />}
          >
            Next
          </Button>
        </Buttons>
      </Card>
    </form>
  );
};
