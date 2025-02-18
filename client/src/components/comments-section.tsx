import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CommentsSection({ coinId }: { coinId: number }) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data: comments } = useQuery({
    queryKey: [`/api/coins/${coinId}/comments`],
  });

  const submitComment = async () => {
    if (!content.trim()) return;

    try {
      await apiRequest("POST", `/api/coins/${coinId}/comments`, {
        content: content.trim(),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/coins/${coinId}/comments`] });
      setContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>
          Discuss with other community members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
            <Button className="shrink-0" onClick={submitComment}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {comments?.map((comment: any) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">User #{comment.userId}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
