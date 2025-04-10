import {
  Card,
  CardHeader,
  Tag,
  TagBlock,
  TextContent,
} from "@crayonai/react-ui";
import {
  ChefHat as ChefHatIcon,
  Timer as TimerIcon,
  Heart as HeartIcon,
  List as ListIcon,
} from "lucide-react";
import {
  TabsTrigger,
  TabsContent,
  Tabs,
  TabsList,
} from "@crayonai/react-ui/Tabs";

interface RecipeTemplateProps {
  title: string;
  cuisine: string;
  cookingTime: number;
  difficulty: string;
  rating: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
}

export const RecipeTemplate: React.FC<RecipeTemplateProps> = ({
  title,
  cuisine,
  cookingTime,
  difficulty,
  rating,
  servings,
  ingredients,
  instructions,
}: RecipeTemplateProps) => {
  return (
    <Card variant="card" width="full">
      <CardHeader
        title={<p>{title}</p>}
        subtitle={
          <p>
            {cuisine} • {cookingTime} mins
          </p>
        }
        icon={<ChefHatIcon size={"1em"} />}
      />
      <TagBlock>
        <Tag
          icon={<TimerIcon size={"1em"} />}
          text={<p>Total Time: {cookingTime} mins</p>}
        />
        <Tag
          icon={<ChefHatIcon size={"1em"} />}
          text={<p>Difficulty: {difficulty}</p>}
        />
        <Tag
          icon={<HeartIcon size={"1em"} />}
          text={<p>{rating}/5 Rating</p>}
        />
      </TagBlock>

      <Tabs defaultValue="sPhK">
        <TabsList>
          <TabsTrigger
            text={<p>Ingredients (Serves {servings})</p>}
            icon={<ListIcon size={"1em"} />}
            value="sPhK"
          />

          <TabsTrigger
            text={<p>Cooking Instructions</p>}
            icon={<ChefHatIcon size={"1em"} />}
            value="6o_o"
          />
        </TabsList>

        <TabsContent value="sPhK">
          <TextContent variant="clear">
            <ul className="list-disc ml-7">
              {ingredients.map((ingredient: string, index: number) => (
                <li key={index}>
                  <p>{ingredient}</p>
                </li>
              ))}
            </ul>
          </TextContent>
        </TabsContent>

        <TabsContent value="6o_o">
          <TextContent variant="clear">
            <ol className="list-decimal ml-7">
              {instructions.map((instruction: string, index: number) => (
                <li key={index}>
                  <p>{instruction}</p>
                </li>
              ))}
            </ol>
          </TextContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
