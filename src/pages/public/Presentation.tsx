import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquareWarning, Search, ArrowRight, ArrowLeft,
  ClipboardList, Users, MessageCircle, FileCheck, Star,
  Shield, Zap, Eye, Maximize, Minimize, ChevronRight,
  Hammer, AlertTriangle, Clock, Phone, HelpCircle,
  CheckCircle2, XCircle, Building2
} from "lucide-react";

/* ───────── types ───────── */
interface Slide {
  id: string;
  render: (active: boolean) => React.ReactNode;
}

/* ───────── constants ───────── */
const SLIDE_W = 1920;
const SLIDE_H = 1080;

/* ───────── Presentation ───────── */
export default function Presentation() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const touchStart = useRef<number | null>(null);

  /* scale calculation */
  const recalc = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    setScale(Math.min(w / SLIDE_W, h / SLIDE_H));
  }, []);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  /* fullscreen */
  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* navigation */
  const slides = buildSlides(navigate);
  const total = slides.length;
  const go = useCallback((dir: 1 | -1) => {
    setCurrent(c => Math.max(0, Math.min(total - 1, c + dir)));
  }, [total]);

  /* keyboard */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "Escape" && isFullscreen) document.exitFullscreen?.();
      if (e.key === "f" || e.key === "F") toggleFs();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go, isFullscreen, toggleFs]);

  /* touch swipe */
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
    touchStart.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-slate-950 select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* scaled slide */}
      <div
        className="absolute"
        style={{
          width: SLIDE_W, height: SLIDE_H,
          left: "50%", top: "50%",
          marginLeft: -SLIDE_W / 2, marginTop: -SLIDE_H / 2,
          transform: `scale(${scale})`, transformOrigin: "center center",
        }}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-all duration-500 ease-out"
            style={{
              opacity: i === current ? 1 : 0,
              transform: `translateX(${(i - current) * 100}px)`,
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            {s.render(i === current)}
          </div>
        ))}
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        {/* dots */}
        <div className="flex gap-1.5 sm:gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 sm:w-8 h-2 sm:h-2.5 bg-amber-400"
                  : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* nav + fs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-white/40 text-xs sm:text-sm font-mono mr-1 sm:mr-2">
            {current + 1}/{total}
          </span>
          <NavBtn onClick={() => go(-1)} disabled={current === 0}><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></NavBtn>
          <NavBtn onClick={() => go(1)} disabled={current === total - 1}><ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /></NavBtn>
          <NavBtn onClick={toggleFs} className="hidden sm:flex">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </NavBtn>
        </div>
      </div>

      {/* progress */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white/5 z-30">
        <div
          className="h-full bg-amber-400/60 transition-all duration-500"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ───────── nav button ───────── */
function NavBtn({ onClick, disabled, children, className = "" }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 text-white
        hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition ${className}`}
    >
      {children}
    </button>
  );
}

/* ───────── slide definitions ───────── */
function buildSlides(navigate: ReturnType<typeof useNavigate>): Slide[] {
  return [
    /* 1 — TITLE */
    {
      id: "title",
      render: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-12">
          <div className="w-20 h-20 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-10">
            <Building2 className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-7xl font-bold text-white tracking-tight text-center leading-tight">
            Constructive Solutions
          </h1>
          <p className="text-4xl font-light text-amber-400 mt-4 tracking-wide">IBIZA</p>
          <div className="w-24 h-0.5 bg-amber-400/40 my-10" />
          <p className="text-2xl text-slate-400 max-w-2xl text-center leading-relaxed">
            Infrastructure for a broken industry
          </p>
          <p className="text-lg text-slate-500 mt-6">
            The platform that brings structure, trust, and transparency to construction
          </p>
        </div>
      ),
    },

    /* 2 — PROBLEM */
    {
      id: "problem",
      render: () => (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-20 py-16">
          <SectionTag>The Problem</SectionTag>
          <h2 className="text-5xl font-bold text-white mt-6 mb-4">
            Construction runs on chaos
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl">
            Across Ibiza, projects worth thousands rely on WhatsApp threads, verbal promises, and hope.
          </p>
          <div className="grid grid-cols-2 gap-8 flex-1">
            <ProblemCard icon={Phone} title="WhatsApp chaos" desc="Quotes, photos, contracts — all buried in endless chat threads nobody can search" />
            <ProblemCard icon={AlertTriangle} title="No accountability" desc="No structured records means he-said-she-said when things go wrong" />
            <ProblemCard icon={Clock} title="Time wasted" desc="Professionals spend hours quoting vague jobs that never materialise" />
            <ProblemCard icon={HelpCircle} title="Trust gaps" desc="Clients can't verify quality. Professionals can't verify intent. Nobody wins." />
          </div>
        </div>
      ),
    },

    /* 3 — SOLUTION */
    {
      id: "solution",
      render: () => (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-20 py-16">
          <SectionTag>The Solution</SectionTag>
          <h2 className="text-5xl font-bold text-white mt-6 mb-12">
            A structured workflow for every project
          </h2>
          <div className="flex items-center justify-between flex-1 px-8">
            {[
              { icon: ClipboardList, label: "Post", sub: "Define scope clearly" },
              { icon: Search, label: "Match", sub: "Right pro, right job" },
              { icon: MessageCircle, label: "Communicate", sub: "Structured messaging" },
              { icon: FileCheck, label: "Complete", sub: "Protected payments" },
              { icon: Star, label: "Review", sub: "Build reputation" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-5">
                    <step.icon className="w-12 h-12 text-amber-400" />
                  </div>
                  <p className="text-xl font-semibold text-white">{step.label}</p>
                  <p className="text-sm text-slate-400 mt-1 text-center max-w-[140px]">{step.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className="w-8 h-8 text-amber-400/30 mx-6 -mt-10 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* 4 — FOR CLIENTS */
    {
      id: "clients",
      render: () => (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-20 py-16">
          <SectionTag>For Clients</SectionTag>
          <h2 className="text-5xl font-bold text-white mt-6 mb-12">
            Your project, clearly defined and protected
          </h2>
          <div className="grid grid-cols-2 gap-8 flex-1 items-start">
            <FeatureCard icon={ClipboardList} title="Guided job posting" desc="A step-by-step wizard ensures every requirement is captured — scope, budget, timeline, materials — so professionals understand exactly what's needed." />
            <FeatureCard icon={Users} title="Intelligent matching" desc="Your job is matched to the right professionals based on trade, experience, location, and project type. No more guesswork." />
            <FeatureCard icon={FileCheck} title="Structured quotes" desc="Receive comparable quotes with clear breakdowns. Side-by-side comparison makes choosing simple and transparent." />
            <FeatureCard icon={Shield} title="Payment protection" desc="Funds are held in a secure holding system until milestones are met. Both sides are protected throughout." />
          </div>
        </div>
      ),
    },

    /* 5 — FOR PROFESSIONALS */
    {
      id: "pros",
      render: () => (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-20 py-16">
          <SectionTag>For Professionals</SectionTag>
          <h2 className="text-5xl font-bold text-white mt-6 mb-12">
            Serious clients. Clear briefs. Fair outcomes.
          </h2>
          <div className="grid grid-cols-2 gap-8 flex-1 items-start">
            <FeatureCard icon={Eye} title="Verified job briefs" desc="Every job comes with clear scope, budget expectations, and structured requirements. No more vague enquiries." />
            <FeatureCard icon={Zap} title="Skill-based matching" desc="Get matched to jobs that fit your trade, experience, and preferences. Spend less time quoting, more time working." />
            <FeatureCard icon={Star} title="Reputation building" desc="Completed work builds your verified track record. Quality professionals rise to the top naturally." />
            <FeatureCard icon={Shield} title="Protected payments" desc="Secure holding ensures you get paid for completed work. Clear milestones, clear expectations." />
          </div>
        </div>
      ),
    },

    /* 6 — CORE SYSTEMS */
    {
      id: "systems",
      render: () => (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-20 py-16">
          <SectionTag>Core Systems</SectionTag>
          <h2 className="text-5xl font-bold text-white mt-6 mb-12">
            Five pillars powering every project
          </h2>
          <div className="flex gap-6 flex-1 items-stretch">
            {[
              { icon: ClipboardList, name: "Job Wizard", desc: "Structured project definition that removes ambiguity" },
              { icon: Users, name: "Matching", desc: "Intelligent pairing of projects and professionals" },
              { icon: MessageCircle, name: "Messaging", desc: "Organised communication with full audit trail" },
              { icon: FileCheck, name: "Quotes", desc: "Comparable, transparent pricing breakdowns" },
              { icon: Star, name: "Reviews", desc: "Two-way verified reputation system" },
            ].map((p) => (
              <div key={p.name} className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl bg-amber-400/10 flex items-center justify-center mb-6">
                  <p.icon className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-xl font-semibold text-white mb-3">{p.name}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* 7 — COMPARISON */
    {
      id: "compare",
      render: () => (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-20 py-16">
          <SectionTag>What Makes Us Different</SectionTag>
          <h2 className="text-5xl font-bold text-white mt-6 mb-12">
            Traditional vs Constructive Solutions
          </h2>
          <div className="grid grid-cols-2 gap-10 flex-1">
            {/* Traditional */}
            <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-10">
              <p className="text-2xl font-semibold text-red-400 mb-8">Traditional Approach</p>
              <div className="space-y-5">
                {[
                  "Quotes via WhatsApp voice notes",
                  "No written scope of work",
                  "Cash payments, no records",
                  "Disputes become arguments",
                  "Reputation is word-of-mouth",
                  "No project structure",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400/60 mt-0.5 shrink-0" />
                    <p className="text-lg text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* CS */}
            <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-2xl p-10">
              <p className="text-2xl font-semibold text-emerald-400 mb-8">Constructive Solutions</p>
              <div className="space-y-5">
                {[
                  "Structured, comparable quotes",
                  "Clear scope with every job brief",
                  "Secure holding protects both sides",
                  "28-day structured resolution system",
                  "Verified reviews and track record",
                  "End-to-end project workflow",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400/60 mt-0.5 shrink-0" />
                    <p className="text-lg text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    /* 8 — CTA */
    {
      id: "cta",
      render: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-12">
          <h2 className="text-6xl font-bold text-white text-center mb-4">
            Ready to build better?
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl text-center mb-14">
            Whether you're planning a renovation or looking for your next project, 
            Constructive Solutions brings structure to every step.
          </p>
          <div className="flex gap-6">
            <button
              onClick={() => navigate("/post")}
              className="px-10 py-4 rounded-xl bg-amber-400 text-slate-900 text-lg font-semibold
                hover:bg-amber-300 transition-colors"
            >
              Post a Job
            </button>
            <button
              onClick={() => navigate("/for-professionals")}
              className="px-10 py-4 rounded-xl border-2 border-white/20 text-white text-lg font-semibold
                hover:bg-white/5 transition-colors"
            >
              Join as Professional
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-16">constructivesolutionsibiza.com</p>
        </div>
      ),
    },
  ];
}

/* ───────── shared components ───────── */
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-400/10 text-amber-400 text-sm font-medium tracking-wide uppercase w-fit">
      {children}
    </span>
  );
}

function ProblemCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="bg-red-500/[0.03] border border-red-500/[0.08] rounded-2xl p-8 flex gap-6">
      <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <p className="text-xl font-semibold text-white mb-2">{title}</p>
        <p className="text-base text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 flex gap-6">
      <div className="w-14 h-14 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
        <Icon className="w-7 h-7 text-amber-400" />
      </div>
      <div>
        <p className="text-xl font-semibold text-white mb-2">{title}</p>
        <p className="text-base text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
