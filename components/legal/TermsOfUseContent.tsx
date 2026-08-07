/**
 * Default Terms of Use template shown when CMS page body is empty.
 * Owner may replace via Sanity Page slug “terms”. Not legal advice —
 * review with counsel before live charges.
 */

export function TermsOfUseContent() {
  return (
    <div className="prose-legal mt-6 space-y-8 text-sm leading-relaxed text-muted">
      <p className="text-fg">
        <strong>Last updated:</strong> August 7, 2026
      </p>
      <p>
        These Terms of Use (“Terms”) govern your access to and use of
        96nation.net and related ticketing, RSVP, and community services
        operated by <strong className="text-fg">96 Nation</strong> (“we,” “us,”
        or “our”). By using the Services, purchasing tickets, or completing an
        RSVP, you agree to these Terms.
      </p>

      <section aria-labelledby="terms-services">
        <h2 id="terms-services" className="text-lg font-semibold text-fg">
          1. Services
        </h2>
        <p className="mt-2">
          We provide event listings, ticket sales, free RSVPs, content
          (galleries, videos), and community forms (e.g. Genesis). Features may
          change; ticketing may be temporarily disabled for maintenance or
          safety.
        </p>
      </section>

      <section aria-labelledby="terms-eligibility">
        <h2 id="terms-eligibility" className="text-lg font-semibold text-fg">
          2. Eligibility and accounts
        </h2>
        <p className="mt-2">
          You must provide accurate contact information for orders and forms.
          You are responsible for the accuracy of the name, email, and phone
          number you submit. Venue age policies and all-ages rules are set per
          event and may be posted on the event page.
        </p>
      </section>

      <section aria-labelledby="terms-tickets">
        <h2 id="terms-tickets" className="text-lg font-semibold text-fg">
          3. Tickets, RSVPs, and pricing
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Ticket prices are shown in US dollars unless stated otherwise.
            Paid checkouts may include a separate{" "}
            <strong className="text-fg">facility fee</strong> (default $1.00
            unless changed by the organizer) in addition to the ticket price.
          </li>
          <li>
            Free events use RSVP (no card charge). Completing an RSVP may reduce
            remaining capacity.
          </li>
          <li>
            Capacity is limited. We use inventory reservation to reduce
            overselling; availability is not guaranteed until your order is
            confirmed (paid or RSVP completed).
          </li>
          <li>
            Taxes: v1 checkouts do not add separate tax line items unless the
            organizer later enables them.
          </li>
        </ul>
      </section>

      <section aria-labelledby="terms-payment">
        <h2 id="terms-payment" className="text-lg font-semibold text-fg">
          4. Payment (Stripe)
        </h2>
        <p className="mt-2">
          Paid tickets are processed by <strong className="text-fg">Stripe</strong>{" "}
          via Stripe Checkout. Card data is handled by Stripe; we do not store
          full card numbers. Stripe’s terms and privacy policy also apply to
          payment processing. Failed, abandoned, or expired checkout sessions
          may release reserved inventory.
        </p>
      </section>

      <section aria-labelledby="terms-refunds">
        <h2 id="terms-refunds" className="text-lg font-semibold text-fg">
          5. Cancellations, refunds, and event changes
        </h2>
        <p className="mt-2">
          Refund and exchange policies may vary by event and will be described
          on the event page or in confirmation materials when available. If an
          event is cancelled by the organizer, we will communicate options
          (refund, credit, or reschedule) using the contact details on your
          order. Chargebacks and disputes may be handled through Stripe in
          accordance with card network rules.
        </p>
      </section>

      <section aria-labelledby="terms-conduct">
        <h2 id="terms-conduct" className="text-lg font-semibold text-fg">
          6. Acceptable use
        </h2>
        <p className="mt-2">You agree not to:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Abuse, spam, or automate form or checkout endpoints</li>
          <li>Attempt to circumvent inventory, rate limits, or security</li>
          <li>Resell tickets in violation of event or venue rules</li>
          <li>Interfere with other users or the integrity of the Services</li>
          <li>Use the Services for unlawful purposes</li>
        </ul>
      </section>

      <section aria-labelledby="terms-ip">
        <h2 id="terms-ip" className="text-lg font-semibold text-fg">
          7. Content and intellectual property
        </h2>
        <p className="mt-2">
          Site content, branding, and materials are owned by 96 Nation or its
          licensors. You may not copy or redistribute site content except as
          allowed by law or with written permission. User-submitted form content
          must not infringe others’ rights.
        </p>
      </section>

      <section aria-labelledby="terms-disclaimers">
        <h2 id="terms-disclaimers" className="text-lg font-semibold text-fg">
          8. Disclaimers
        </h2>
        <p className="mt-2">
          THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, WE DISCLAIM WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not
          warrant uninterrupted or error-free operation.
        </p>
      </section>

      <section aria-labelledby="terms-liability">
        <h2 id="terms-liability" className="text-lg font-semibold text-fg">
          9. Limitation of liability
        </h2>
        <p className="mt-2">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, 96 NATION AND ITS ORGANIZERS,
          OFFICERS, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS OR
          DATA, ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY FOR
          ANY CLAIM RELATED TO AN ORDER IS LIMITED TO THE AMOUNT YOU PAID FOR
          THAT ORDER (IF ANY).
        </p>
      </section>

      <section aria-labelledby="terms-indemnity">
        <h2 id="terms-indemnity" className="text-lg font-semibold text-fg">
          10. Indemnity
        </h2>
        <p className="mt-2">
          You agree to indemnify and hold harmless 96 Nation from claims arising
          out of your misuse of the Services or violation of these Terms, to the
          extent permitted by law.
        </p>
      </section>

      <section aria-labelledby="terms-privacy">
        <h2 id="terms-privacy" className="text-lg font-semibold text-fg">
          11. Privacy
        </h2>
        <p className="mt-2">
          Our{" "}
          <a
            href="/privacy"
            className="text-accent underline underline-offset-2"
          >
            Privacy Policy
          </a>{" "}
          explains how we handle personal information. By using the Services you
          acknowledge that policy.
        </p>
      </section>

      <section aria-labelledby="terms-law">
        <h2 id="terms-law" className="text-lg font-semibold text-fg">
          12. Governing law
        </h2>
        <p className="mt-2">
          These Terms are governed by the laws of the State of Florida, USA,
          without regard to conflict-of-law rules, unless mandatory consumer
          protections in your jurisdiction require otherwise. Venue for disputes
          shall be in courts located in Florida, subject to applicable law.
        </p>
      </section>

      <section aria-labelledby="terms-changes">
        <h2 id="terms-changes" className="text-lg font-semibold text-fg">
          13. Changes
        </h2>
        <p className="mt-2">
          We may update these Terms. Continued use after changes constitutes
          acceptance of the updated Terms. The “Last updated” date reflects the
          latest revision.
        </p>
      </section>

      <section aria-labelledby="terms-contact">
        <h2 id="terms-contact" className="text-lg font-semibold text-fg">
          14. Contact
        </h2>
        <p className="mt-2">
          Questions:{" "}
          <a
            href="mailto:hello@96nation.net"
            className="text-accent underline underline-offset-2"
          >
            hello@96nation.net
          </a>
          .
        </p>
        <p className="mt-4 text-xs">
          This template supports pre-launch compliance copy. Have counsel review
          before relying on it for live paid events.
        </p>
      </section>
    </div>
  );
}
