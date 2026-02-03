import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PublicLayout } from '@/components/layout';
import { Search, Shield, Users } from 'lucide-react';

/**
 * PROFESSIONALS DIRECTORY PAGE
 * 
 * Public page - queries public_professionals_preview view only.
 * No authentication required.
 * Construction-grade professional styling.
 */
const Professionals = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-concrete bg-texture-concrete py-12">
        <div className="container">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Browse Professionals
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            Discover verified professionals offering premium services across Ibiza.
          </p>
          
          {/* Search */}
          <div className="flex gap-3 max-w-xl mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search professionals..." 
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>All professionals are verified</span>
          </div>
        </div>
      </div>

      {/* Professional Listings */}
      <div className="container py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Empty state for now */}
          <Card className="border-dashed col-span-full card-grounded">
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-sm bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No professionals listed yet. Check back soon!
              </p>
              <Button variant="outline" asChild>
                <Link to="/auth?mode=pro">Join as Professional</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Professionals;
