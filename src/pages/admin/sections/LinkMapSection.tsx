import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';

type LinkEntry = {
  label: string;
  route: string;
  roles: string[];
  source: string;
  notes?: string;
};

const SECTIONS: { title: string; entries: LinkEntry[] }[] = [
  {
    title: 'Public Navigation',
    entries: [
      { label: 'Home', route: '/', roles: ['All'], source: 'PublicNav' },
      { label: 'Services', route: '/services', roles: ['All'], source: 'PublicNav' },
      { label: 'Jobs Board', route: '/jobs', roles: ['All'], source: 'PublicNav' },
      { label: 'Professionals', route: '/professionals', roles: ['All'], source: 'PublicNav' },
      { label: 'How It Works', route: '/how-it-works', roles: ['All'], source: 'PublicNav' },
      { label: 'Community / Forum', route: '/forum', roles: ['All'], source: 'PublicNav' },
      { label: 'Contact', route: '/contact', roles: ['All'], source: 'PublicFooter' },
    ],
  },
  {
    title: 'Wizard Journey (Client)',
    entries: [
      { label: 'Post a Job (nav)', route: '/post', roles: ['All'], source: 'PublicNav', notes: 'Always visible' },
      { label: 'Start Your Project', route: '/post', roles: ['All'], source: 'HowItWorks', notes: 'CTA on How It Works page' },
      { label: 'Wizard Step → Category', route: '/post?step=category', roles: ['All'], source: 'PostJob' },
      { label: 'Wizard Step → Subcategory', route: '/post?step=subcategory', roles: ['All'], source: 'PostJob' },
      { label: 'Wizard Step → Micro', route: '/post?step=micro', roles: ['All'], source: 'PostJob' },
      { label: 'Wizard Step → Questions', route: '/post?step=questions', roles: ['All'], source: 'PostJob' },
      { label: 'Wizard Step → Extras', route: '/post?step=extras', roles: ['All'], source: 'PostJob' },
      { label: 'Wizard Step → Review', route: '/post?step=review', roles: ['All'], source: 'PostJob' },
    ],
  },
  {
    title: 'Job Board CTAs',
    entries: [
      { label: 'Sign in to respond', route: '/auth', roles: ['Guest'], source: 'JobListingCard', notes: 'Not logged in' },
      { label: 'Complete onboarding to apply', route: '/onboarding/professional', roles: ['Pro (incomplete)'], source: 'JobListingCard', notes: 'Onboarding not finished' },
      { label: 'Add services to apply', route: '/onboarding/professional?step=services', roles: ['Pro (0 services)'], source: 'JobListingCard', notes: 'Onboarding done, no services' },
      { label: 'View & Apply / Message', route: '/jobs/:id (modal)', roles: ['Pro (ready)'], source: 'JobListingCard', notes: 'Pro with services' },
      { label: 'View details', route: '/jobs/:id (modal)', roles: ['Client', 'All'], source: 'JobListingCard' },
    ],
  },
  {
    title: 'Professional Journey',
    entries: [
      { label: 'Join as Professional', route: '/auth?mode=pro', roles: ['Guest'], source: 'HowItWorks' },
      { label: 'Professional Onboarding', route: '/onboarding/professional', roles: ['Pro'], source: 'RouteGuard' },
      { label: 'Service Setup', route: '/professional/service-setup', roles: ['Pro'], source: 'Onboarding' },
      { label: 'Edit Profile', route: '/professional/profile', roles: ['Pro'], source: 'ProDashboard' },
      { label: 'Pro Dashboard', route: '/dashboard/pro', roles: ['Pro'], source: 'PublicNav' },
    ],
  },
  {
    title: 'Client Dashboard',
    entries: [
      { label: 'Client Dashboard', route: '/dashboard/client', roles: ['Client'], source: 'PublicNav' },
      { label: 'Job Ticket Detail', route: '/dashboard/jobs/:jobId', roles: ['Client'], source: 'ClientDashboard' },
      { label: 'Match & Send Invites', route: '/dashboard/jobs/:jobId/invite', roles: ['Client'], source: 'JobTicketDetail' },
    ],
  },
  {
    title: 'Shared / Account',
    entries: [
      { label: 'Messages', route: '/messages', roles: ['Authenticated'], source: 'UserDropdown' },
      { label: 'Settings', route: '/settings', roles: ['Authenticated'], source: 'UserDropdown' },
      { label: 'Sign Out', route: '/ (redirect)', roles: ['Authenticated'], source: 'UserDropdown' },
    ],
  },
  {
    title: 'Admin',
    entries: [
      { label: 'Admin Dashboard', route: '/dashboard/admin', roles: ['Admin'], source: 'Settings', notes: 'Role-gated, redirects non-admin' },
      { label: 'Users Tab', route: '/dashboard/admin#users', roles: ['Admin'], source: 'AdminDashboard' },
      { label: 'Jobs Tab', route: '/dashboard/admin#jobs', roles: ['Admin'], source: 'AdminDashboard' },
      { label: 'Support Inbox', route: '/dashboard/admin#support', roles: ['Admin'], source: 'AdminDashboard' },
    ],
  },
];

const roleBadgeVariant = (role: string) => {
  if (role === 'All' || role === 'Guest') return 'secondary';
  if (role === 'Admin') return 'destructive';
  if (role.startsWith('Pro')) return 'default';
  return 'outline';
};

export function LinkMapSection() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">Link Map</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every CTA, button, and navigation link — where it goes and who sees it.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title} className="card-grounded">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Label</TableHead>
                  <TableHead className="text-xs">Route</TableHead>
                  <TableHead className="text-xs">Visible To</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Source</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.entries.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{entry.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                      <span className="flex items-center gap-1">
                        {entry.route}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-40" />
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={roleBadgeVariant(role) as any}
                            className="text-xs"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {entry.source}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                      {entry.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
