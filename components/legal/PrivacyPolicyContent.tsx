/**
 * Default Privacy Policy template shown when CMS page body is empty.
 * Owner may replace via Sanity Page slug “privacy”. Not legal advice —
 * review with counsel before live charges.
 */

export function PrivacyPolicyContent() {
  return (
    <div className="prose-legal mt-6 space-y-8 text-sm leading-relaxed text-muted">
      <p className="text-fg">
        <strong>Last updated:</strong> August 7, 2026
      </p>
      <p>
        This Privacy Policy describes how <strong className="text-fg">96 Nation</strong>{" "}
        (“we,” “us,” or “our”) collects, uses, and shares personal information
        when you use 96nation.net and related ticketing, RSVP, and community
        services (the “Services”).
      </p>

      <section aria-labelledby="privacy-who">
        <h2 id="privacy-who" className="text-lg font-semibold text-fg">
          1. Who we are
        </h2>
        <p className="mt-2">
          96 Nation operates an all-ages music and community hub in the
          Tallahassee area. Contact:{" "}
          <a
            href="mailto:hello@96nation.net"
            className="text-accent underline underline-offset-2"
          >
            hello@96nation.net
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="privacy-collect">
        <h2 id="privacy-collect" className="text-lg font-semibold text-fg">
          2. Information we collect
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-fg">Identity & contact:</strong> name, email
            address, and phone number (stored in E.164 format) when you buy
            tickets, RSVP, or submit a form.
          </li>
          <li>
            <strong className="text-fg">Order details:</strong> event, ticket
            type, quantity, amounts (including facility fee when applicable),
            order status, and timestamps.
          </li>
          <li>
            <strong className="text-fg">Marketing preference:</strong> whether
            you opted in to event updates (opt-in only; never pre-checked as
            required).
          </li>
          <li>
            <strong className="text-fg">Technical data:</strong> standard server
            and security logs (IP, user agent) processed by our hosting and
            security providers. We aim to redact phone and email from error
            monitoring where feasible.
          </li>
          <li>
            <strong className="text-fg">Payment data:</strong> card numbers and
            full payment credentials are collected and processed only by{" "}
            <strong className="text-fg">Stripe</strong>. We do not store full
            card numbers on our servers.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy-use">
        <h2 id="privacy-use" className="text-lg font-semibold text-fg">
          3. How we use information
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Process ticket purchases, free RSVPs, and refunds</li>
          <li>Send transactional confirmation and operational emails</li>
          <li>Prevent fraud, overselling, and abuse (rate limits, inventory)</li>
          <li>Respond to Genesis / contact form submissions</li>
          <li>
            Send marketing messages only if you explicitly opt in (you may
            unsubscribe)
          </li>
          <li>Comply with law and enforce our Terms</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-share">
        <h2 id="privacy-share" className="text-lg font-semibold text-fg">
          4. Sharing and processors
        </h2>
        <p className="mt-2">
          We share personal information with service providers who process data
          on our behalf under contractual obligations:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-fg">Stripe</strong> — payment processor /
            sub-processor for paid Checkout. Stripe may receive your email and
            name as part of checkout. Card data is handled under Stripe’s
            privacy and PCI practices (SAQ A for our integration).
          </li>
          <li>
            <strong className="text-fg">Supabase</strong> — database hosting for
            orders, inventory, and form submissions
          </li>
          <li>
            <strong className="text-fg">Resend</strong> — transactional email
            delivery
          </li>
          <li>
            <strong className="text-fg">Vercel</strong> — application hosting and
            logs
          </li>
          <li>
            <strong className="text-fg">Sentry</strong> — error monitoring
            (configured to limit PII in breadcrumbs where possible)
          </li>
          <li>
            <strong className="text-fg">Sanity</strong> — content management
            (public marketing content; not your order PII)
          </li>
          <li>
            <strong className="text-fg">Upstash</strong> — rate limiting
            infrastructure
          </li>
        </ul>
        <p className="mt-2">
          We do not sell your personal information. We may disclose information
          if required by law or to protect rights, safety, and the integrity of
          the Services.
        </p>
      </section>

      <section aria-labelledby="privacy-retention">
        <h2 id="privacy-retention" className="text-lg font-semibold text-fg">
          5. Retention
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-fg">Orders:</strong> retained for
            approximately <strong className="text-fg">24 months</strong> after
            the related event (default), unless a longer period is required for
            legal, tax, or dispute reasons.
          </li>
          <li>
            <strong className="text-fg">Expired pending orders:</strong> purged
            after about <strong className="text-fg">30 days</strong>.
          </li>
          <li>
            <strong className="text-fg">Form submissions:</strong> retained as
            needed to respond and operate Genesis / contact workflows, then
            deleted or anonymized on request where feasible.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy-rights">
        <h2 id="privacy-rights" className="text-lg font-semibold text-fg">
          6. Your choices and rights
        </h2>
        <p className="mt-2">
          Depending on your location, you may have rights to access, correct,
          export, or delete personal information we hold. To make a request,
          email{" "}
          <a
            href="mailto:hello@96nation.net"
            className="text-accent underline underline-offset-2"
          >
            hello@96nation.net
          </a>{" "}
          with the email address used at checkout or on the form. We may need to
          verify your identity before fulfilling a request. Marketing is opt-in;
          you can opt out of marketing emails at any time.
        </p>
      </section>

      <section aria-labelledby="privacy-security">
        <h2 id="privacy-security" className="text-lg font-semibold text-fg">
          7. Security
        </h2>
        <p className="mt-2">
          We use industry-standard measures including HTTPS, server-side access
          controls, and least-privilege database access. No method of
          transmission or storage is 100% secure.
        </p>
      </section>

      <section aria-labelledby="privacy-children">
        <h2 id="privacy-children" className="text-lg font-semibold text-fg">
          8. Children
        </h2>
        <p className="mt-2">
          Our events are often all-ages, but the Services are not directed at
          children under 13 without a parent or guardian. Do not submit personal
          information for children under 13 except as permitted by applicable
          law and with appropriate consent.
        </p>
      </section>

      <section aria-labelledby="privacy-changes">
        <h2 id="privacy-changes" className="text-lg font-semibold text-fg">
          9. Changes
        </h2>
        <p className="mt-2">
          We may update this policy from time to time. The “Last updated” date
          at the top will change when we do. Material changes may also be
          highlighted on the site or at checkout.
        </p>
      </section>

      <section aria-labelledby="privacy-contact">
        <h2 id="privacy-contact" className="text-lg font-semibold text-fg">
          10. Contact
        </h2>
        <p className="mt-2">
          Questions about privacy:{" "}
          <a
            href="mailto:hello@96nation.net"
            className="text-accent underline underline-offset-2"
          >
            hello@96nation.net
          </a>
          .
        </p>
        <p className="mt-4 text-xs">
          This template is provided so the site can go live with transparent
          disclosures. It is not a substitute for jurisdiction-specific legal
          review.
        </p>
      </section>
    </div>
  );
}
