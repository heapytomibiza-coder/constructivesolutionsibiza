import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertTriangle, Rocket, Shield, Smartphone, MessageSquare, Users, Briefcase, Globe, KeyRound, Paintbrush } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CheckItem {
  id: string;
  label: string;
}

interface CheckSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: CheckItem[];
}

const SECTIONS: CheckSection[] = [
  {
    id: 'public',
    title: 'Phase 1 — Public Site',
    icon: <Globe className="h-5 w-5" />,
    color: 'text-blue-500',
    items: [
      { id: 'p1', label: 'Homepage loads in <3s' },
      { id: 'p2', label: 'No console errors on load' },
      { id: 'p3', label: 'Logo visible and clickable' },
      { id: 'p4', label: 'Primary CTA obvious' },
      { id: 'p5', label: 'No placeholder text' },
      { id: 'p6', label: 'No broken images' },
      { id: 'p7', label: 'Footer links all work' },
      { id: 'p8', label: '/ loads correctly' },
      { id: 'p9', label: '/services loads correctly' },
      { id: 'p10', label: '/jobs loads correctly' },
      { id: 'p11', label: '/professionals loads correctly' },
      { id: 'p12', label: '/how-it-works loads correctly' },
      { id: 'p13', label: '/contact loads correctly' },
      { id: 'p14', label: '/privacy loads correctly' },
      { id: 'p15', label: '/terms loads correctly' },
      { id: 'p16', label: '404 page shows for invalid routes' },
      { id: 'p17', label: '404 page has working navigation' },
    ],
  },
  {
    id: 'auth',
    title: 'Phase 2 — Auth Flows',
    icon: <KeyRound className="h-5 w-5" />,
    color: 'text-red-500',
    items: [
      { id: 'a1', label: 'Client signup works (fresh email)' },
      { id: 'a2', label: 'Confirmation email arrives' },
      { id: 'a3', label: 'Confirm link domain = constructivesolutionsibiza.com' },
      { id: 'a4', label: 'Redirect after confirm is correct' },
      { id: 'a5', label: 'Login works after confirmation' },
      { id: 'a6', label: 'Incorrect password shows friendly error' },
      { id: 'a7', label: 'Logout works' },
      { id: 'a8', label: 'Session persists on refresh' },
      { id: 'a9', label: 'Forgot password email sends' },
      { id: 'a10', label: 'Reset link domain = constructivesolutionsibiza.com' },
      { id: 'a11', label: 'Password reset flow completes' },
      { id: 'a12', label: 'Login with new password works' },
      { id: 'a13', label: 'Settings page loads' },
      { id: 'a14', label: 'Change Password from settings works' },
      { id: 'a15', label: 'Password rules enforced' },
      { id: 'a16', label: 'Success + error toasts show correctly' },
    ],
  },
  {
    id: 'wizard',
    title: 'Phase 3 — Job Wizard',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'text-amber-500',
    items: [
      { id: 'w1', label: 'Wizard entry works' },
      { id: 'w2', label: 'Category → Subcategory → Service flow works' },
      { id: 'w3', label: 'Questions render correctly' },
      { id: 'w4', label: 'Conditional questions behave correctly' },
      { id: 'w5', label: 'Budget labels formatted (no underscores, € at end)' },
      { id: 'w6', label: 'Location selection works' },
      { id: 'w7', label: 'Job submits successfully' },
      { id: 'w8', label: 'Confirmation page makes sense' },
      { id: 'w9', label: 'Skip required question → blocked' },
      { id: 'w10', label: 'Back/forward navigation stable' },
      { id: 'w11', label: 'Mobile keyboard doesn\'t hide inputs' },
    ],
  },
  {
    id: 'pro',
    title: 'Phase 4 — Professional Flow',
    icon: <Users className="h-5 w-5" />,
    color: 'text-green-500',
    items: [
      { id: 'pr1', label: 'Pro signup works' },
      { id: 'pr2', label: 'Onboarding loads correctly' },
      { id: 'pr3', label: 'Categories/services selectable' },
      { id: 'pr4', label: 'Zones save correctly' },
      { id: 'pr5', label: 'Dashboard loads after completion' },
      { id: 'pr6', label: 'Edit Profile → change service + zone → Save' },
      { id: 'pr7', label: 'Refresh → saved values persist' },
      { id: 'pr8', label: 'Role switching (pro ↔ client) works' },
    ],
  },
  {
    id: 'matching',
    title: 'Phase 5 — Matching & Visibility',
    icon: <Users className="h-5 w-5" />,
    color: 'text-purple-500',
    items: [
      { id: 'm1', label: 'Job visible to matched pro' },
      { id: 'm2', label: 'Wrong categories do NOT see job' },
      { id: 'm3', label: 'Location matching correct' },
      { id: 'm4', label: 'No duplicate job cards' },
      { id: 'm5', label: 'Budget + location + timing show correctly' },
    ],
  },
  {
    id: 'messaging',
    title: 'Phase 6 — Messaging',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'text-cyan-500',
    items: [
      { id: 'msg1', label: 'Inbox loads' },
      { id: 'msg2', label: 'Conversation opens' },
      { id: 'msg3', label: 'Messages send instantly' },
      { id: 'msg4', label: 'Unread count updates' },
      { id: 'msg5', label: 'Mobile messaging works' },
      { id: 'msg6', label: 'No duplicate threads' },
    ],
  },
  {
    id: 'security',
    title: 'Phase 7 — Security & Stability',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-orange-500',
    items: [
      { id: 's1', label: 'Logged-out user can\'t access protected routes' },
      { id: 's2', label: 'Logged-in user can\'t access admin routes' },
      { id: 's3', label: 'Role switching works' },
      { id: 's4', label: 'No redirect loops' },
      { id: 's5', label: 'Broken API request doesn\'t crash app' },
      { id: 's6', label: 'User sees friendly error messages' },
      { id: 's7', label: 'App recovers on refresh' },
    ],
  },
  {
    id: 'mobile',
    title: 'Phase 8 — Mobile Pass',
    icon: <Smartphone className="h-5 w-5" />,
    color: 'text-pink-500',
    items: [
      { id: 'mb1', label: 'Navigation usable' },
      { id: 'mb2', label: 'Wizard usable one-handed' },
      { id: 'mb3', label: 'Buttons reachable' },
      { id: 'mb4', label: 'No horizontal scrolling' },
      { id: 'mb5', label: 'Modals scroll properly' },
      { id: 'mb6', label: 'Messaging usable' },
    ],
  },
  {
    id: 'assets',
    title: 'Launch Blockers — Assets & Config',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-600',
    items: [
      { id: 'lb1', label: 'public/og-image.png uploaded (1200×630)' },
      { id: 'lb2', label: 'public/favicon.ico uploaded' },
      { id: 'lb3', label: 'SITE_URL = https://constructivesolutionsibiza.com set' },
      { id: 'lb4', label: 'OG share preview tested (paste link in WhatsApp)' },
    ],
  },
];

const STORAGE_KEY = 'launch-checklist-state';

export default function LaunchChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalItems = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((totalChecked / totalItems) * 100);

  const isGo =
    totalChecked === totalItems;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Rocket className="h-7 w-7" /> Launch Checklist
        </h1>
        <p className="text-muted-foreground text-sm">
          {totalChecked} / {totalItems} complete — {pct}%
        </p>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        {isGo && (
          <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-600 font-semibold text-lg">
            ✅ GO — You are ready to launch!
          </div>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionDone = section.items.every((i) => checked[i.id]);
        return (
          <Card key={section.id} className={sectionDone ? 'border-green-500/40' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className={section.color}>{section.icon}</span>
                {section.title}
                {sectionDone && (
                  <span className="ml-auto text-green-500 text-sm font-medium">✅ Done</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  {checked[item.id] ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={
                      checked[item.id]
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-center text-xs text-muted-foreground pt-4">
        Progress saved in your browser. Clear localStorage to reset.
      </p>
    </div>
  );
}
