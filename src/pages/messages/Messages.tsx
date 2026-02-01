import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM } from '@/domain/scope';
import { MessageSquare, ArrowLeft } from 'lucide-react';

/**
 * MESSAGES PAGE - V2 Placeholder
 * 
 * TODO: Implement messaging system with:
 * - Conversation list
 * - Real-time updates
 * - Message threads
 */

const Messages = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
        </div>
      </nav>

      <div className="container py-12">
        <div className="mb-8">
          <Link to="/dashboard/client" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          Messages
        </h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>No messages yet</CardTitle>
                <CardDescription>
                  Messages with professionals will appear here
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              When you post a job and receive quotes from professionals, 
              you'll be able to message them directly from here.
            </p>
            <Button asChild>
              <Link to="/post">Post Your First Job</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
