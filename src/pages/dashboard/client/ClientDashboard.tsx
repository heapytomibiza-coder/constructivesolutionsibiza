import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { useClientStats } from './hooks/useClientStats';
import { RoleSwitcher } from '@/shared/components/layout/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Briefcase,
  MessageSquare,
  MessageCircle,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react';
import { QuickActionTile } from '@/pages/dashboard/shared/components/QuickActionTile';

/**
 * CLIENT DASHBOARD
 * 
 * Clean navigation hub — action tiles only, no stats or job lists.
 */
const ClientDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { user, roles } = useSession();
  const { stats } = useClientStats();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t('auth.signedOut'));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground hidden xs:inline truncate">
              CS Ibiza
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {roles.length > 1 && (
              <RoleSwitcher className="w-[160px]" />
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-2xl">
        {/* Unread Messages Banner */}
        {stats.unreadMessages > 0 && (
          <Link
            to="/messages"
            className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors group"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {stats.unreadMessages === 1
                  ? t('client.unreadBannerSingle', 'A professional has replied to your job — tap to view')
                  : t('client.unreadBannerPlural', 'You have {{count}} unread messages from professionals', { count: stats.unreadMessages })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('client.unreadBannerHint', 'Reply to keep the conversation going')}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {t('client.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm truncate">
            {t('client.welcomeBack', { email: user?.email || '' })}
          </p>
        </div>

        {/* YOUR JOBS */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('client.sectionJobs', 'Your Jobs')}
          </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <QuickActionTile
              to="/post"
              icon={Plus}
              label={t('client.postJob')}
              hint={t('client.postJobHint', 'Describe what you need done')}
            />
            <QuickActionTile
              to="/dashboard/client/jobs"
              icon={Briefcase}
              label={t('client.yourJobs')}
              hint={t('client.yourJobsHint', 'Track progress and quotes')}
            />
          </div>
        </div>

        {/* COMMUNICATION */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('client.sectionComms', 'Communication')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickActionTile
              to="/messages"
              icon={MessageSquare}
              label={t('stats.messages')}
              hint={t('client.messagesHint', 'Chat with Taskers')}
              badge={stats.unreadMessages}
            />
            <QuickActionTile
              to="/forum"
              icon={MessageCircle}
              label={t('client.communityForum', 'Community Forum')}
              hint={t('client.communityForumHint', 'Ask questions, get recommendations')}
            />
          </div>
        </div>

        {/* ACCOUNT */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('client.sectionAccount', 'Account')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickActionTile
              to="/settings"
              icon={Settings}
              label={t('common.settings', 'Settings')}
              hint={t('client.settingsHint', 'Account and preferences')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
