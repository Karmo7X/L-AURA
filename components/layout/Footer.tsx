"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import { SHOP_NAV } from "@/lib/shop";
import { CupLogo, FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/ui/icons";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon },
];

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      return;
    }
    // Hook this up to your email provider.
    setStatus("done");
    setEmail("");
  };

  return (
    <form onSubmit={submit} noValidate className="mt-4">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.05] p-1.5 focus-within:border-peach/60">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="you@example.com"
          aria-invalid={status === "error"}
          aria-describedby="newsletter-status"
          className="min-w-0 flex-1 bg-transparent px-4 text-sm text-linen placeholder:text-latte/50 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-paper transition duration-300 ease-soft hover:scale-[1.03] hover:bg-[#9c4d22]"
        >
          Subscribe
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div id="newsletter-status" aria-live="polite" className="mt-2 min-h-5 pl-4 text-[13px]">
        <AnimatePresence mode="wait">
          {status === "error" && (
            <motion.p key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-peach">
              Please enter a valid email address.
            </motion.p>
          )}
          {status === "done" && (
            <motion.p
              key="done"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-[#b9d8a8]"
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> You’re on the list. See you at the next cupping.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

export function Footer() {
  return (
    <footer id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-espresso-850 text-latte">
      <div aria-hidden className="absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-terracotta/10 blur-[120px]" />
      <div className="container-page relative pt-20 pb-10 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <a href="#home" className="inline-flex items-center gap-2.5 text-linen">
              <CupLogo className="h-9 w-9 text-terracotta" />
              <span className="flex flex-col leading-none">
                <span className="font-serif text-2xl font-semibold">L’AURA</span>
                <span className="label-caps mt-1 text-[9px] text-latte/70">Café &amp; Roastery</span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-[15px] leading-6 text-latte/85">
              A neighborhood roastery devoted to micro-lot coffee, gentle extraction, and the small ritual of slowing
              down.
            </p>
            <ul className="mt-6 flex gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-latte transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-terracotta hover:bg-terracotta hover:text-paper"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4">
            <div>
              <h2 id="contact-title" className="label-caps text-peach">
                Contact
              </h2>
              <ul className="mt-4 space-y-3 text-[15px]">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-terracotta" aria-hidden />
                  <span>
                    742 Palmetto Street
                    <br />
                    Arts District, Los Angeles
                  </span>
                </li>
                <li>
                  <a href="tel:+12135550142" className="flex gap-3 transition-colors hover:text-linen">
                    <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-terracotta" aria-hidden />
                    (213) 555-0142
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@lauracafe.com" className="flex gap-3 transition-colors hover:text-linen">
                    <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-terracotta" aria-hidden />
                    hello@lauracafe.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="label-caps text-peach">Hours</h2>
              <ul className="mt-4 space-y-3 text-[15px]">
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-terracotta" aria-hidden />
                  <span>
                    Mon – Fri
                    <br />
                    <span className="text-linen">07:00 – 16:00</span>
                  </span>
                </li>
                <li className="flex gap-3 pl-7.5">
                  <span>
                    Sat – Sun
                    <br />
                    <span className="text-linen">08:00 – 17:00</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h2 className="label-caps text-peach">The Morning Dispatch</h2>
            <p className="mt-4 max-w-sm text-[15px] leading-6 text-latte/85">
              New roasts, seasonal menus and invitations to weekend cuppings. One letter a month.
            </p>
            <Newsletter />
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[13px] text-latte/60 sm:flex-row">
          <p>© {new Date().getFullYear()} L’AURA Café &amp; Roastery. All rights reserved.</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {SHOP_NAV.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-linen">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
