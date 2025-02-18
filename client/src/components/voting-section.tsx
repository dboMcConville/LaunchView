import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Vote, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VotingSection({ coinId }: { coinId: number }) {
  const [showNewVote, setShowNewVote] = useState(false);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [closesIn, setClosesIn] = useState("24");
  const { toast } = useToast();

  const { data: votes } = useQuery({
    queryKey: [`/api/coins/${coinId}/votes`],
  });

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const createVote = async () => {
    try {
      const filteredOptions = options.filter((opt) => opt.trim() !== "");
      const closesAt = new Date(Date.now() + parseInt(closesIn) * 60 * 60 * 1000);

      await apiRequest("POST", "/api/votes", {
        coinId,
        title,
        options: filteredOptions,
        closesAt,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/coins/${coinId}/votes`] });
      setShowNewVote(false);
      setTitle("");
      setOptions(["", ""]);
      setClosesIn("24");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const submitVote = async (voteId: number, optionIndex: number) => {
    try {
      await apiRequest("POST", `/api/votes/${voteId}/respond`, {
        selectedOption: optionIndex,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/coins/${coinId}/votes`] });
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Voting
            </CardTitle>
            <CardDescription>
              Create and participate in community votes
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewVote(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Vote
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showNewVote && (
          <div className="mb-8 space-y-4">
            <Input
              placeholder="Vote title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-2">
              {options.map((option, index) => (
                <Input
                  key={index}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
              ))}
              <Button variant="outline" onClick={addOption}>
                Add Option
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={closesIn}
                onChange={(e) => setClosesIn(e.target.value)}
                min="1"
                max="168"
              />
              <span className="flex items-center">hours</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={createVote}>Create Vote</Button>
              <Button variant="outline" onClick={() => setShowNewVote(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {votes?.map((vote: any) => (
            <Card key={vote.id}>
              <CardHeader>
                <CardTitle className="text-lg">{vote.title}</CardTitle>
                <CardDescription>
                  Closes at: {new Date(vote.closesAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vote.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => submitVote(vote.id, index)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}