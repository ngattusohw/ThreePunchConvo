import { useState } from "react";
import { ThreadReply } from "@/lib/types";

export function useReplyState() {
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Handle quoting a reply
  const handleQuoteReply = (reply: ThreadReply) => {
    setReplyingTo({
      id: reply.id.toString(),
      username: reply.user.username,
    });
  };

  return {
    replyContent,
    setReplyContent,
    replyingTo,
    setReplyingTo,
    showUpgradeModal,
    setShowUpgradeModal,
    handleQuoteReply,
  };
}
