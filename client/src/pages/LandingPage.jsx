import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar, { NavbarActions } from '../components/Navbar';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { PRICING_PLANS, publicPost, signup } from '../api/client';

const initialSignup = {
  name: '',
  email: '',
  password: '',
  academy_name: '',
  phone_number: '',
  subscription_plan: 'free'
};

const SPORTS = ['Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Swimming'];
const FACILITIES = [
  'Professional turf & nets',
  'Fitness & recovery zone',
  'Locker rooms & hydration stations',
  'Parent viewing gallery'
];
const TESTIMONIALS = [
  ['Rajesh K.', 'Parent', 'Attendance alerts give us peace of mind every training day.'],
  ['Coach Meera', 'Head Coach', 'Batch scheduling and fee tracking saved hours every week.'],
  ['Elite Sports Club', 'Academy Admin', 'We scaled from one branch to three without spreadsheets.']
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isInstallable, installHint, promptInstall } = usePwaInstall();

  const [signupForm, setSignupForm] = useState(initialSignup);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState({ text: '', type: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMessage, setContactMessage] = useState({ text: '', type: '' });

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
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
      setTimeout(() => navigate('/admin/coaches'), 1000);
    } catch (error) {
      setSignupMessage({ text: error.message, type: 'error' });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactLoading(true);
    setContactMessage({ text: '', type: '' });
    try {
      const result = await publicPost('/public/contact', {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim() || undefined,
        message: contactForm.message.trim()
      });
      setContactMessage({ text: result.message, type: 'success' });
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setContactMessage({ text: error.message, type: 'error' });
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar>
        <nav className="hidden items-center gap-5 md:flex">
          <a href="#about" className="text-sm font-medium text-muted hover:text-foreground">About</a>
          <a href="#sports" className="text-sm font-medium text-muted hover:text-foreground">Sports</a>
          <a href="#facilities" className="text-sm font-medium text-muted hover:text-foreground">Facilities</a>
          <a href="#testimonials" className="text-sm font-medium text-muted hover:text-foreground">Testimonials</a>
          <a href="#contact" className="text-sm font-medium text-muted hover:text-foreground">Contact</a>
          <Link to="/login/admin" className="text-sm font-medium text-muted hover:text-foreground">
            Admin Login
          </Link>
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
          <Link to="/login/admin" className="btn-secondary">
            Admin Login
          </Link>
          <a href="#signup" className="btn-primary">
            Admin Signup
          </a>
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

      <section id="about" className="border-t border-border bg-surface-secondary px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold">About Our Academy Platform</h2>
          <p className="mt-4 text-lg text-muted">
            SAMS helps sports academies run operations end-to-end — from coach onboarding and batch scheduling
            to fee collection, parent communication, and performance insights. Built for multi-branch academies
            that need reliability, security, and a professional parent experience.
          </p>
        </div>
      </section>

      <section id="sports" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-extrabold">Sports Offered</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {SPORTS.map((sport) => (
              <article key={sport} className="card text-center font-semibold">
                {sport}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="facilities" className="bg-surface-secondary px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-extrabold">World-Class Facilities</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {FACILITIES.map((item) => (
              <li key={item} className="card flex items-center gap-3 text-muted">
                <span className="text-accent" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="testimonials" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-extrabold">Testimonials</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(([name, role, quote]) => (
              <blockquote key={name} className="card">
                <p className="text-muted">&ldquo;{quote}&rdquo;</p>
                <footer className="mt-4 font-bold">
                  {name}
                  <span className="block text-sm font-normal text-muted">{role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-border bg-surface-secondary px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold">Contact Us</h2>
            <p className="mt-2 text-muted">Questions about onboarding your academy? Send us a message.</p>
          </div>
          <form className="card space-y-4" onSubmit={handleContactSubmit}>
            <input className="input-field" name="name" placeholder="Your name" value={contactForm.name} onChange={handleContactChange} required />
            <input className="input-field" type="email" name="email" placeholder="Email" value={contactForm.email} onChange={handleContactChange} required />
            <input className="input-field" type="tel" name="phone" placeholder="Phone (optional)" value={contactForm.phone} onChange={handleContactChange} />
            <textarea className="input-field min-h-[120px]" name="message" placeholder="Message" value={contactForm.message} onChange={handleContactChange} required />
            <button type="submit" className="btn-primary w-full" disabled={contactLoading}>
              {contactLoading ? 'Sending…' : 'Send Message'}
            </button>
            {contactMessage.text && (
              <p className={contactMessage.type === 'success' ? 'alert-success' : 'alert-error'}>{contactMessage.text}</p>
            )}
          </form>
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
          <div className="mx-auto max-w-xl">
            <div className="card">
              <h3 className="mb-4 text-xl font-bold">Academy Signup</h3>
              <p className="mb-4 text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login/admin" className="font-semibold text-accent">
                  Admin Login
                </Link>
              </p>
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
                    <option value="free">Free — 3 Coaches / 30 Students</option>
                    <option value="pro">Pro — 6 Coaches / 80 Students</option>
                    <option value="plus">Plus — Unlimited</option>
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
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        © 2026 SAMS — Sports Academy Management System
      </footer>
    </div>
  );
}
