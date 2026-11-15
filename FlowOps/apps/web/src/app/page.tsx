'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Play,
  Globe,
  Database,
  Lock,
  ChevronDown,
  Check,
  ExternalLink,
  MessageSquare,
  CreditCard,
  HardDrive,
  Workflow,
  Radio,
  ArrowUpRight,
} from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export default function MarketingLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      {/* ====================================================
          1. NAVIGATION
      ==================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                <Workflow className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[17px] tracking-tight text-[var(--ink)]">
                  Flow<span className="text-[var(--accent)]">Ops</span>
                </span>
                <span className="text-[9.5px] font-mono text-[var(--muted)] -mt-1 tracking-wider uppercase">
                  Cloud Orchestration
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-semibold text-[var(--muted)]">
              <a href="#features" className="hover:text-[var(--ink)] transition-colors">
                Features
              </a>
              <a href="#builder" className="hover:text-[var(--ink)] transition-colors">
                Studio
              </a>
              <a href="#integrations" className="hover:text-[var(--ink)] transition-colors">
                Integrations
              </a>
              <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">
                Pricing
              </a>
              <a href="#faq" className="hover:text-[var(--ink)] transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <AnimatedThemeToggler className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)]" />
            <Link
              href="/login"
              className="text-[13px] font-bold text-[var(--ink)] hover:text-[var(--accent)] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <ShimmerButton
                shimmerColor="#ffffff"
                shimmerDuration="3s"
                borderRadius="12px"
                background="var(--accent)"
                className="h-9 px-4 text-[12.5px] font-bold text-white shadow-sm flex items-center gap-1.5"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </header>

      {/* ====================================================
          2. HERO SECTION
      ==================================================== */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* Subtle radial gradient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--accent)]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card)] border border-[var(--line-strong)] text-[12px] font-semibold text-[var(--accent)] shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen AWS-Native Workflow Automation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--ink)] leading-[1.08]">
            Build workflows. <br />
            <span className="bg-gradient-to-r from-[var(--accent)] via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Automate everything.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            Design powerful workflows, connect your favorite services, and orchestrate intelligent automation on an AWS-native cloud execution engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup">
              <ShimmerButton
                shimmerColor="#ffffff"
                shimmerDuration="3s"
                borderRadius="14px"
                background="var(--accent)"
                className="h-12 px-7 text-[14px] font-bold text-white shadow-md flex items-center gap-2"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>

            <Link
              href="/workflows"
              className="h-12 px-6 rounded-2xl bg-[var(--card)] hover:bg-[var(--card-2)] border border-[var(--line-strong)] text-[13.5px] font-bold text-[var(--ink)] flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Explore Dashboard</span>
              <ArrowUpRight className="w-4 h-4 text-[var(--muted)]" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-[12px] text-[var(--muted)] pt-4">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[var(--good)]" /> Free tier: 2 workflows
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[var(--good)]" /> Zero credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[var(--good)]" /> 100% AWS Serverless
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================
          3. PRODUCT DEMO PREVIEW (REAL WORKFLOW CANVAS)
      ==================================================== */}
      <section className="px-6 py-6 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl border border-[var(--line-strong)] bg-[var(--card)] shadow-2xl p-3 sm:p-4 overflow-hidden">
          {/* Mock Window Topbar */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-[var(--line)] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-[var(--muted)] ml-2">flowops-studio // Order-Fulfillment-v3</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold">
              ● AWS Step Functions Standard: ACTIVE
            </span>
          </div>

          {/* Interactive Flow Diagram Mockup */}
          <div className="bg-[var(--card-2)] rounded-2xl p-6 sm:p-10 border border-[var(--line)] flex flex-wrap items-center justify-center gap-4 relative overflow-hidden">
            {/* Step 1: Webhook Trigger */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-emerald-500/40 shadow-sm w-[210px]">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase mb-1">
                <Globe className="w-4 h-4" /> Webhook Trigger
              </div>
              <div className="text-sm font-bold text-[var(--ink)]">Stripe Payment</div>
              <div className="text-[11px] text-[var(--muted)]">POST /orders/v1</div>
            </div>

            <ArrowRight className="w-5 h-5 text-[var(--muted)] hidden sm:block" />

            {/* Step 2: HTTP Verify */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-sky-500/40 shadow-sm w-[210px]">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase mb-1">
                <Cpu className="w-4 h-4" /> HTTP Request
              </div>
              <div className="text-sm font-bold text-[var(--ink)]">Verify Fraud Risk</div>
              <div className="text-[11px] text-[var(--muted)]">POST api.fraud.io/score</div>
            </div>

            <ArrowRight className="w-5 h-5 text-[var(--muted)] hidden sm:block" />

            {/* Step 3: Condition */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-indigo-500/40 shadow-sm w-[210px]">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase mb-1">
                <GitBranch className="w-4 h-4" /> IF Condition
              </div>
              <div className="text-sm font-bold text-[var(--ink)]">Risk Score &gt; 80?</div>
              <div className="text-[11px] text-[var(--muted)]">Branch on boolean</div>
            </div>

            <ArrowRight className="w-5 h-5 text-[var(--muted)] hidden sm:block" />

            {/* Step 4: Human Approval */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-amber-500/40 shadow-sm w-[210px]">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase mb-1">
                <Lock className="w-4 h-4" /> Approval Gate
              </div>
              <div className="text-sm font-bold text-[var(--ink)]">Manager Sign-off</div>
              <div className="text-[11px] text-[var(--muted)]">.waitForTaskToken</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          4. TRUSTED CLOUD TECHNOLOGY
      ==================================================== */}
      <section className="py-12 px-6 border-y border-[var(--line)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <span className="text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-wider block">
            Engineered natively on enterprise cloud primitives
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-bold text-[var(--ink)]">
            <span className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[var(--accent)]" /> AWS Step Functions
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Lambda ARM64 Graviton
            </span>
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-500" /> DynamoDB Single-Table
            </span>
            <span className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-500" /> Amazon S3 Storage
            </span>
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-500" /> Amazon EventBridge
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================
          5. WORKFLOW BUILDER SHOWCASE
      ==================================================== */}
      <section id="builder" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            Industrial Visual Canvas
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
            Designed for engineers. Built for scale.
          </h2>
          <p className="text-sm text-[var(--muted)]">
            FlowOps blends n8n's intuitive node-based interaction with enterprise Gustra visual aesthetics and AWS execution reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--ink)]">Kahn DAG Cycle Detection</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Real-time $O(V+E)$ topological graph validation prevents recursion, flags orphan states, and compiles clean Amazon States Language.
            </p>
          </div>

          <div className="card p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--ink)]">60+ Node Ecosystem</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Comprehensive catalog across Triggers, Actions, Logic, Data Transformations, AWS Services, AI Agents, and Third-Party Connectors.
            </p>
          </div>

          <div className="card p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--ink)]">AI Workflow Copilot</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Convert natural language prompts into verified multi-step graph proposals. Complete with security audit and human-in-the-loop review.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================
          6. AUTOMATION FEATURES & SECURITY
      ==================================================== */}
      <section id="features" className="py-16 px-6 bg-[var(--card)] border-y border-[var(--line)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
              Zero-Trust Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              Enterprise security baked into every execution.
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center text-[var(--good)] flex-none mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">Strict SSRF Protection</h4>
                  <p className="text-xs text-[var(--muted)]">
                    DNS-level validation blocks cloud metadata IP 169.254.169.254 and RFC 1918 private network addresses before HTTP dispatch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center text-[var(--good)] flex-none mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">Unguessable Secret Sharing Tokens</h4>
                  <p className="text-xs text-[var(--muted)]">
                    Public share links use 256-bit entropy tokens stored strictly as SHA-256 hashes, with instant revocation and credential redaction.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center text-[var(--good)] flex-none mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">Human-in-the-Loop Approval Gates</h4>
                  <p className="text-xs text-[var(--muted)]">
                    Step Functions pauses on callback tokens until an authorized reviewer approves or rejects via the secure dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--card-2)] border border-[var(--line)] space-y-4">
            <span className="text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider block">
              ASL Compiler Target: Amazon States Language
            </span>
            <pre className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink)] overflow-x-auto leading-relaxed">
{`{
  "Comment": "Production Step Functions Pipeline",
  "StartAt": "WebhookTrigger",
  "States": {
    "WebhookTrigger": {
      "Type": "Pass",
      "Next": "VerifyPayment"
    },
    "VerifyPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-southeast-1:...:httpExecutor",
      "Retry": [{
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      }],
      "Next": "CheckRisk"
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ====================================================
          7. PRICING SECTION
      ==================================================== */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
            Start free. Scale with your organization.
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Individual accounts start completely free with 2 workflows. Upgrade to team plans when you need projects and collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Free Personal */}
          <div className="card p-6 flex flex-col justify-between border-[var(--line)] space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] text-[var(--muted)]">
                Personal Free
              </span>
              <div>
                <span className="text-3xl font-extrabold text-[var(--ink)]">$0</span>
                <span className="text-xs text-[var(--muted)]"> / month</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Ideal for individual developers experimenting with visual cloud automation.
              </p>
              <ul className="space-y-2 text-xs text-[var(--ink)] pt-2 border-t border-[var(--line)]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> <strong>Max 2 Workflows</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> 500 Executions / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> Core Nodes & Triggers
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> 7-Day Execution Retention
                </li>
              </ul>
            </div>

            <Link href="/signup">
              <button className="w-full ibtn ibtn--secondary text-xs py-2.5 font-bold">
                Get Started Free
              </button>
            </Link>
          </div>

          {/* Plan 2: Org Starter (Popular) */}
          <div className="card p-6 flex flex-col justify-between border-[var(--accent)] ring-2 ring-[var(--accent)]/30 space-y-6 relative">
            <span className="absolute -top-3 right-6 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white shadow-sm">
              MOST POPULAR
            </span>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]">
                Organization Starter
              </span>
              <div>
                <span className="text-3xl font-extrabold text-[var(--ink)]">$49</span>
                <span className="text-xs text-[var(--muted)]"> / month</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                For growing engineering teams requiring collaboration and shared projects.
              </p>
              <ul className="space-y-2 text-xs text-[var(--ink)] pt-2 border-t border-[var(--line)]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--accent)]" /> <strong>25 Workflows</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--accent)]" /> 5 Team Members & Shared Projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--accent)]" /> 10,000 Executions / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--accent)]" /> AI Copilot Enabled
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--accent)]" /> 30-Day Execution Retention
                </li>
              </ul>
            </div>

            <Link href="/signup">
              <ShimmerButton
                shimmerColor="#ffffff"
                shimmerDuration="3s"
                borderRadius="12px"
                background="var(--accent)"
                className="w-full h-10 text-xs font-bold text-white shadow-sm flex items-center justify-center"
              >
                Start Organization Trial
              </ShimmerButton>
            </Link>
          </div>

          {/* Plan 3: Org Pro */}
          <div className="card p-6 flex flex-col justify-between border-[var(--line)] space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] text-[var(--muted)]">
                Organization Pro
              </span>
              <div>
                <span className="text-3xl font-extrabold text-[var(--ink)]">$199</span>
                <span className="text-xs text-[var(--muted)]"> / month</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                High-volume production workloads with custom SLAs and AI agents.
              </p>
              <ul className="space-y-2 text-xs text-[var(--ink)] pt-2 border-t border-[var(--line)]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> <strong>250 Workflows</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> 50 Team Members & Projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> 250,000 Executions / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> Dedicated Priority SLA
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--good)]" /> 90-Day Execution Retention
                </li>
              </ul>
            </div>

            <Link href="/signup">
              <button className="w-full ibtn ibtn--secondary text-xs py-2.5 font-bold">
                Contact Enterprise Sales
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================
          8. FAQ ACCORDION
      ==================================================== */}
      <section id="faq" className="py-16 px-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does FlowOps differ from self-hosted n8n?',
              a: 'FlowOps does not run a custom monolithic NodeJS engine. Instead, it compiles visual workflow graphs directly into native Amazon States Language (ASL) and executes them on AWS Step Functions Standard and Lambda Graviton, providing true serverless scale and high availability.',
            },
            {
              q: 'Can I test and run FlowOps locally without an AWS account?',
              a: 'Yes. FlowOps provides first-class support for LocalStack and local in-memory fallback. You can run all triggers, actions, and compiler tests offline without incurring AWS charges.',
            },
            {
              q: 'What is the workflow limit on the Free plan?',
              a: 'The Free Individual Plan allows you to design, publish, and run a maximum of 2 workflows. When you create your 3rd workflow, you will be prompted to upgrade to an Organization plan.',
            },
            {
              q: 'Are my secrets and credentials exposed when I share a workflow?',
              a: 'Never. FlowOps strictly redacts Bearer tokens, API keys, and IAM credentials before sharing or exporting any workflow. Public shares and collaborator views never reveal the underlying secrets.',
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-[var(--ink)] hover:bg-[var(--card-2)] transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--muted)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-1 text-xs text-[var(--muted)] leading-relaxed border-t border-[var(--line)]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================
          9. FINAL CTA BANNER
      ==================================================== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 text-white p-10 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden border border-neutral-800">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to orchestrate your cloud workflows?
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            Join engineering teams worldwide using FlowOps to automate complex business logic on AWS Step Functions.
          </p>
          <div className="flex justify-center pt-2">
            <Link href="/signup">
              <ShimmerButton
                shimmerColor="#ffffff"
                shimmerDuration="3s"
                borderRadius="14px"
                background="#f59e0b"
                className="h-12 px-8 text-sm font-bold text-[#1f1500] shadow-md flex items-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================
          10. ENTERPRISE FOOTER
      ==================================================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--card)] py-12 px-6 text-xs text-[var(--muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-bold text-[var(--ink)]">FlowOps Platform</span>
            <span>• © 2026 FlowOps Core Architecture Team. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/dashboard" className="hover:text-[var(--ink)]">
              Dashboard
            </Link>
            <Link href="/workflows" className="hover:text-[var(--ink)]">
              Workflows
            </Link>
            <Link href="/diix" className="hover:text-[var(--ink)]">
              Admin Portal
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)]">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
