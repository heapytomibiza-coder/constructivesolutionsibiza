import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Send, ChevronLeft, Star, MapPin, Clock } from "lucide-react";

interface Match {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  location: string;
  rating: number;
  hourlyRate: number;
  availability: string;
  skills: string[];
  matchScore: number;
}

const MOCK_MATCHES: Match[] = [
  {
    id: "1",
    name: "Alice Johnson",
    role: "Senior React Developer",
    location: "London, UK",
    rating: 4.9,
    hourlyRate: 85,
    availability: "Available now",
    skills: ["React", "TypeScript", "Node.js"],
    matchScore: 98,
  },
  {
    id: "2",
    name: "Bob Smith",
    role: "Full Stack Engineer",
    location: "Manchester, UK",
    rating: 4.7,
    hourlyRate: 75,
    availability: "Available in 1 week",
    skills: ["React", "Python", "AWS"],
    matchScore: 94,
  },
  {
    id: "3",
    name: "Carol White",
    role: "Frontend Developer",
    location: "Birmingham, UK",
    rating: 4.8,
    hourlyRate: 70,
    availability: "Available now",
    skills: ["React", "CSS", "TypeScript"],
    matchScore: 91,
  },
];

export default function MatchAndSend() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = () => {
    if (selected.size === 0) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Invitations Sent!</h2>
          <p className="text-muted-foreground">
            We've notified {selected.size} matched candidate
            {selected.size !== 1 ? "s" : ""} about your opportunity.
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/client")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Your Matches</h1>
          <p className="text-muted-foreground text-sm">
            Select candidates to send your opportunity to
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_MATCHES.map((match) => (
          <Card
            key={match.id}
            className={`cursor-pointer transition-all border-2 ${
              selected.has(match.id)
                ? "border-primary bg-primary/5"
                : "border-transparent"
            }`}
            onClick={() => toggleSelect(match.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selected.has(match.id)}
                  onCheckedChange={() => toggleSelect(match.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={match.avatar} />
                  <AvatarFallback>
                    {match.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{match.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {match.matchScore}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{match.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pl-[calc(1.5rem+1.5rem+1rem)]">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {match.location}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {match.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {match.availability}
                </span>
                <span className="font-medium text-foreground">
                  £{match.hourlyRate}/hr
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {match.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.size} candidate{selected.size !== 1 ? "s" : ""} selected
        </p>
        <Button
          onClick={handleSend}
          disabled={selected.size === 0}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Send Invitations
        </Button>
      </div>
    </div>
  );
}
