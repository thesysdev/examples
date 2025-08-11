import { useThreadListState } from "@crayonai/react-core";
import { ResponseFooter } from "@thesysai/genui-sdk";

export const Footer = () => {
  const selectedThreadId = useThreadListState().selectedThreadId;

  return (
    <ResponseFooter.Container>
      <ResponseFooter.ShareButton
        generateShareLink={async (message) => {
          const messageId = message.id;
          const baseUrl = window.location.origin;
          return `${baseUrl}/shared/${selectedThreadId}/${messageId}`;
        }}
      />
    </ResponseFooter.Container>
  );
};
