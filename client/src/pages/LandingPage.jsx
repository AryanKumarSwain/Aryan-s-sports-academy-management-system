import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar, { NavbarActions } from '../components/Navbar';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { adminLogin, PRICING_PLANS, signup } from '../api/client';

const initialSignup = {
  name: '',
  email: '',
  password: '',
  academy_name: '',
  phone_number: '',
  subscription_plan: 'pro'
};

const initialLogin = {
  email: '',
  password: ''
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { isInstallable, installHint, promptInstall } = usePwaInstall();

  const [signupForm, setSignupForm] = useState(initialSignup);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState({ text: '', type: '' });
  const [loginMessage, setLoginMessage] = useState({ text: '', type: '' });

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectPlan = (planId) => {
    setSignupForm((prev) => ({ ...prev, subscription_plan: planId }));
    const el = document.getElementById('signup');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setSignupLoading(true);
    setSignupMessage({ text: '', type: '' });

    try {
      const result = await signup({
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        academy_name: signupForm.academy_name.trim(),
        phone_number: signupForm.phone_number.trim() || undefined,
        subscription_plan: signupForm.subscription_plan
      });
      setSignupMessage({ text: `${result.message} Redirecting…`, type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      setSignupMessage({ text: error.message, type: 'error' });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginMessage({ text: '', type: '' });

    try {
      await adminLogin({
        email: loginForm.email.trim(),
        password: loginForm.password
      });
      setLoginMessage({ text: 'Login successful. Redirecting…', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (error) {
      setLoginMessage({ text: error.message, type: 'error' });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm font-medium text-muted hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted hover:text-foreground">
            Pricing
          </a>
          <a href="#signup" className="text-sm font-medium text-muted hover:text-foreground">
            Get Started
          </a>
          <Link to="/coach/login" className="text-sm font-medium text-muted hover:text-foreground">
            Coach Login
          </Link>
        </nav>
        <NavbarActions>
          {isInstallable && (
            <button type="button" id="pwaInstallBtn" className="btn-success" onClick={promptInstall}>
              Install App
            </button>
          )}
          <Link to="/dashboard" className="btn-secondary">
            Admin Dashboard
          </Link>
        </NavbarActions>
      </Navbar>

      <section className="border-b border-border bg-gradient-to-br from-blue-50/80 via-surface-secondary to-surface px-4 py-16 dark:from-slate-900/50 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-4 inline-block rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
              Multi-Tenant SaaS
            </span>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight lg:text-5xl">
              Run Your Sports Academy at Enterprise Scale
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted">
              Onboard your academy in minutes. Manage coaches, students, batches, payments,
              and real-time parent attendance alerts from one secure platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#signup" className="btn-primary">
                Start Free Trial
              </a>
              {isInstallable && (
                <button type="button" className="btn-success" onClick={promptInstall}>
                  Install App
                </button>
              )}
            </div>
            {installHint && (
              <p className="alert-info mt-4" role="status">
                {installHint}
              </p>
            )}
            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="card text-center py-4">
                <div className="text-2xl font-extrabold text-accent">4</div>
                <div className="text-xs uppercase text-muted">Modules</div>
              </div>
              <div className="card text-center py-4">
                <div className="text-2xl font-extrabold text-accent">100%</div>
                <div className="text-xs uppercase text-muted">Soft Delete</div>
              </div>
              <div className="card text-center py-4">
                <div className="text-2xl font-extrabold text-accent">PWA</div>
                <div className="text-xs uppercase text-muted">Offline</div>
              </div>
            </div>
          </div>
          <div id="features" className="grid gap-4 sm:grid-cols-2">
            {[
              ['Academy Admin', 'Provision coaches, enroll students, and view analytics.'],
              ['Coach Portal', 'Mark attendance with instant parent email alerts.'],
              ['Secure Onboarding', 'Single-transaction academy and admin signup.'],
              ['Install Anywhere', 'Add SAMS to your home screen via Chromium.']
            ].map(([title, desc]) => (
              <article key={title} className="card">
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="m-0 text-sm text-muted">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold">Simple, Transparent Pricing</h2>
            <p className="mt-2 text-muted">Choose the plan that fits your academy size.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`card relative flex flex-col ${plan.featured ? 'border-accent ring-2 ring-accent/20' : ''}`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <p className="text-sm font-bold uppercase tracking-wide text-accent">{plan.name}</p>
                <p className="my-2 text-4xl font-extrabold">
                  ${plan.price}
                  <span className="text-base font-normal text-muted">/mo</span>
                </p>
                <ul className="mb-6 flex-1 space-y-2 border-t border-border pt-4 text-sm text-muted">
                  <li>
                    <strong className="text-foreground">Up to {plan.coaches}</strong> Coaches
                  </li>
                  <li>
                    <strong className="text-foreground">Up to {plan.students}</strong> Students
                  </li>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button type="button" className={plan.featured ? 'btn-primary' : 'btn-secondary'} onClick={() => selectPlan(plan.id)}>
                  Choose {plan.name}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="signup" className="bg-surface-secondary px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold">Create Your Academy Workspace</h2>
            <p className="mt-2 text-muted">Register your academy and admin account in one secure step.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-4 text-xl font-bold">Academy Signup</h3>
              <form onSubmit={handleSignupSubmit} noValidate>
                <div className="mb-4">
                  <label className="label" htmlFor="signupName">Full Name</label>
                  <input className="input-field" id="signupName" name="name" value={signupForm.name} onChange={handleSignupChange} required />
                </div>
                <div className="mb-4">
                  <label className="label" htmlFor="signupEmail">Email</label>
                  <input className="input-field" type="email" id="signupEmail" name="email" value={signupForm.email} onChange={handleSignupChange} required />
                </div>
                <div className="mb-4">
                  <label className="label" htmlFor="signupPassword">Password</label>
                  <input className="input-field" type="password" id="signupPassword" name="password" value={signupForm.password} onChange={handleSignupChange} minLength={6} required />
                </div>
                <div className="mb-4">
                  <label className="label" htmlFor="signupAcademy">Academy Name</label>
                  <input className="input-field" id="signupAcademy" name="academy_name" value={signupForm.academy_name} onChange={handleSignupChange} required />
                </div>
                <div className="mb-4">
                  <label className="label" htmlFor="signupPhone">Phone Number</label>
                  <input className="input-field" type="tel" id="signupPhone" name="phone_number" value={signupForm.phone_number} onChange={handleSignupChange} />
                </div>
                <div className="mb-4">
                  <label className="label" htmlFor="signupPlan">Subscription Plan</label>
                  <select className="input-field" id="signupPlan" name="subscription_plan" value={signupForm.subscription_plan} onChange={handleSignupChange} required>
                    <option value="basic">Basic — 3 Coaches / 50 Students</option>
                    <option value="pro">Pro — 15 Coaches / 300 Students</option>
                    <option value="enterprise">Enterprise — Unlimited</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={signupLoading}>
                  {signupLoading ? 'Creating workspace…' : 'Create Academy Account'}
                </button>
                {signupMessage.text && (
                  <p className={signupMessage.type === 'success' ? 'alert-success' : 'alert-error'} role="alert">
                    {signupMessage.text}
                  </p>
                )}
              </form>
            </div>
            <div className="card">
              <h3 className="mb-2 text-xl font-bold">Admin Sign In</h3>
              <p className="mb-4 text-sm text-muted">Already registered? Sign in to your dashboard.</p>
              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="mb-4">
                  <label className="label" htmlFor="loginEmail">Email</label>
                  <input className="input-field" type="email" id="loginEmail" name="email" value={loginForm.email} onChange={handleLoginChange} required />
                </div>
                <div className="mb-4">
                  <label className="label" htmlFor="loginPassword">Password</label>
                  <input className="input-field" type="password" id="loginPassword" name="password" value={loginForm.password} onChange={handleLoginChange} required />
                </div>
                <button type="submit" className="btn-secondary w-full" disabled={loginLoading}>
                  {loginLoading ? 'Signing in…' : 'Sign In to Dashboard'}
                </button>
                {loginMessage.text && (
                  <p className={loginMessage.type === 'success' ? 'alert-success' : 'alert-error'} role="alert">
                    {loginMessage.text}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        © 2026 SAMS — Sports Academy Management System
      </footer>
    </div>
  );
}
