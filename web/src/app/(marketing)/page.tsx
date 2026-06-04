'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  { title: 'Sports Management', desc: 'Cricket, football, swimming — fees, plans, and batches in one place.' },
  { title: 'Accounts & Fees', desc: 'Receipts, due tracking, revenue summaries, and PDF exports.' },
  { title: 'Attendance', desc: 'GPS-verified coach check-in and batch-wise student attendance.' },
  { title: 'Performance', desc: 'Custom attributes, 1–10 scoring, and progress reports.' },
  { title: 'Reports', desc: 'Export PDF, Excel, and CSV across sports, batches, and coaches.' },
  { title: 'SaaS Plans', desc: 'Free, Pro, and Plus tiers with automatic limit enforcement.' }
];

const pricing = [
  { tier: 'Free', price: '₹0', coaches: 3, students: 30 },
  { tier: 'Pro', price: '₹2,999', coaches: 6, students: 80, featured: true },
  { tier: 'Plus', price: '₹7,999', coaches: 'Unlimited', students: 'Unlimited' }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-extrabold text-blue-600">SAMS</span>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#register">Register</a>
          </nav>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <a href="#register">
              <Button size="sm">Get Started</Button>
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Badge className="mb-4">Multi-tenant SaaS</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Run your sports academy at{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              enterprise scale
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Students, coaches, plans, accounts, attendance, performance, and reports — one platform for
            academy owners.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#register">
              <Button size="lg">Start free trial</Button>
            </a>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Admin login
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">Everything you need</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">{f.desc}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-slate-100/80 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">Pricing</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {pricing.map((p) => (
              <Card
                key={p.tier}
                className={p.featured ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
              >
                <CardHeader>
                  <CardTitle>{p.tier}</CardTitle>
                  <p className="text-3xl font-bold">{p.price}<span className="text-sm font-normal">/mo</span></p>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <p>Up to {p.coaches} coaches</p>
                  <p>Up to {p.students} students</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="register" className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Register your academy</CardTitle>
            <p className="text-sm text-slate-500">Admin credentials will be emailed after signup.</p>
          </CardHeader>
          <CardContent>
            <Link href="/register">
              <Button className="w-full" size="lg">
                Continue to registration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SAMS — Sports Academy Management System
      </footer>
    </div>
  );
}
