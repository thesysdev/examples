import {
  Card,
  CardHeader,
  TextContent,
  ListItem,
  ListBlock,
} from "@crayonai/react-ui";
import {
  CarouselItem,
  Carousel,
  CarouselContent,
  CarouselPrevious,
  CarouselNext,
} from "@crayonai/react-ui/Carousel";
import {
  ArrowRight as ArrowRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { PersonProps } from "@/types/person";
import { useThreadActions } from "@crayonai/react-core";

export const Person = ({
  name,
  title,
  biography,
  birth,
  death,
  familyMembers,
  relatedPeople,
}: PersonProps) => {
  const { processMessage } = useThreadActions();
  return (
    <Card variant="card" width="full">
      <CardHeader title={<p>{name}</p>} subtitle={<p>{title}</p>} />
      <TextContent variant="sunk">
        <p>{biography}</p>
      </TextContent>
      <TextContent variant="clear">
        {birth && (
          <p>
            <strong>Birth:</strong> {birth.date}{" "}
            {birth.place && `in ${birth.place}`}
          </p>
        )}
        {death && (
          <p>
            <strong>Death:</strong> {death.date}{" "}
            {death.age && `(aged ${death.age})`}{" "}
            {death.place && `in ${death.place}`}
          </p>
        )}
      </TextContent>

      {familyMembers.length > 0 && (
        <>
          <TextContent variant="clear">
            <p>
              <strong>Notable Family members</strong>
            </p>
          </TextContent>

          <Carousel>
            <CarouselContent>
              {familyMembers.map((member, index) => (
                <CarouselItem
                  key={index}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    processMessage({
                      role: "user",
                      message: `Tell me more about ${member.name}`,
                      type: "prompt",
                    });
                  }}
                >
                  <CardHeader
                    title={<p>{member.name}</p>}
                    subtitle={<p className="capitalize">{member.relation}</p>}
                  />
                  {member.description && (
                    <TextContent variant="clear">
                      <p>{member.description}</p>
                    </TextContent>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious icon={<ChevronLeftIcon size={"1em"} />} />
            <CarouselNext icon={<ChevronRightIcon size={"1em"} />} />
          </Carousel>
        </>
      )}

      {relatedPeople.length > 0 && (
        <>
          <TextContent variant="clear">
            <p>
              <strong>People also search for</strong>
            </p>
          </TextContent>

          <ListBlock>
            {relatedPeople.map((person, index) => (
              <ListItem
                className="hover:bg-gray-100"
                onClick={() => {
                  processMessage({
                    role: "user",
                    message: `Tell me more about ${person.name}`,
                    type: "prompt",
                  });
                }}
                key={index}
                title={<p>{person.name}</p>}
                subtitle={<p>{person.description}</p>}
                actionIcon={<ArrowRightIcon size={"1em"} />}
              />
            ))}
          </ListBlock>
        </>
      )}
    </Card>
  );
};
