export type NavItem = {
  href: string;
  label: string;
};

/** Primary navigation — mobile + desktop */
export const primaryNav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/genesis", label: "Genesis" },
  { href: "/contact", label: "Contact" },
];

export const footerNav: NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];
