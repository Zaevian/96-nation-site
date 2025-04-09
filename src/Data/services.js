import React from 'react';
import { 
  Music, 
  VideoIcon, 
  Megaphone, 
  Lightbulb, 
  Radio, 
  Users,
  Calendar,
  Camera,
  Ticket,
  Sliders,
  Palette
} from 'lucide-react';

// Services data for 96 Nation
export const services = [
  {
    title: "Show Services & Event Production",
    price: "399 - 1,000",
    pricingType: "based on package",
    description: "From full-blown punk blowouts to curated release events, 96 Nation provides a turnkey show production experience. We specialize in independent, multimedia-rich events rooted in community and culture.",
    icon: <Calendar size={28} className="text-accent" />,
    features: [
      "Full show logistics & run-of-show planning",
      "Tech coordination (sound, lighting, gear)",
      "Media coverage (photo/video if selected)",
      "Door staffing + POS systems",
      "Event branding (flyers, graphics)",
      "Artist outreach & communication",
      "Optional decor + vibe curation"
    ],
    detailedInfo: {
      pricing: [
        "Full House Show – $1,000",
        "Album Release Package – $399 / $599 / $850"
      ],
      additionalFeatures: [
        "Album release tiers based on media & marketing needs",
        "Venue scouting for non-house shows"
      ],
      notes: [
        "Most shows feature 4-band lineups",
        "Album Release events come with built-in promo push via 96 socials",
        "Backline support optional",
        "Split-based payouts OR flat fee available for custom setups"
      ],
      quote: "From backyard bangers to bar takeovers—we build the vibes AND the infrastructure."
    }
  },
  {
    title: "Door Services & Equipment",
    price: "5 - 40",
    pricingType: "per item",
    description: "Our door team handles all the details so you can focus on the party. Whether you're just renting gear or want us to run the entire front-of-house system, we got the tools and the team.",
    icon: <Ticket size={28} className="text-accent" />,
    features: [
      "Door staff (trained, friendly, efficient)",
      "Cash box & $100 till setup",
      "POS (Square Reader) + Venmo/Cashapp tracking",
      "Signage (wristbands, pricing, policies)",
      "Table/chair setup",
      "Lighting for visibility or vibe"
    ],
    detailedInfo: {
      additionalFeatures: [
        "Online ticketing setup (Eventbrite or custom)",
        "Custom graphics for Eventbrite/socials",
        "Damage/loss accountability baked in"
      ],
      quote: "We handle the math and the mess at the door, so your event starts right at the threshold."
    }
  },
  {
    title: "Tech & Stage Rental",
    price: "100 - 600",
    pricingType: "package range",
    description: "Need sound? We got stacks. Need lights? We'll bring the glow. 96 Nation's in-house tech setup is perfect for house shows, pop-ups, or small venue gigs that need real audio power.",
    icon: <Sliders size={28} className="text-accent" />,
    features: [
      "Stage setup with or without tech support",
      "Sound system rental (PA, mic stands, XLRs, board, etc.)",
      "Drum rug, speaker stands, cables & setup tools",
      "Optional on-site engineer (when needed)",
      "Gemini/Harbinger PA options for various crowd sizes",
      "Damage/loss charges detailed in advance"
    ],
    detailedInfo: {
      additionalFeatures: [
        "Power, lighting, and cable management support"
      ],
      addOns: [
        "Backline setup assistance",
        "Soundcheck scheduling",
        "Run-of-show coordination with tech team"
      ],
      quote: "You bring the bands—we'll bring the boom."
    }
  },
  {
    title: "Media Services",
    price: "50 - 700",
    pricingType: "based on selected professional",
    description: "Professional photography services for events, portraits, and more. We don't just take pictures—we document culture.",
    icon: <Camera size={28} className="text-accent" />,
    features: [
      "Event photography",
      "Portraits",
      "Product photos",
      "Professional editing",
      "Quick turnaround",
      "High-quality deliverables"
    ],
    detailedInfo: {
      professionals: [
        {
          name: "Flashover Photography",
          services: [
            "Local Show Coverage: $100 (up to 4 bands)",
            "Add'l bands: $35 each",
            "Travel Shows: $150 (+ travel)",
            "Festivals: $300+",
            "Portraits: $150–$275",
            "Product Photos: $10/item (plus merch trade)"
          ]
        },
        {
          name: "Zaevi Media",
          services: [
            "Local Shows: $200",
            "Portraits: $175 (solo), $200 (group)",
            "Graduation: $175",
            "Real Estate: $250–$700",
            "Professional Headshots: $50",
            "Product Photos: $10/item",
            "Delivery: 25+ edited images, 1-week turnaround"
          ]
        }
      ],
      quote: "We don't just take pictures—we document culture."
    }
  },
  {
    title: "Graphic Design",
    price: "50 - 150",
    pricingType: "based on selected professional",
    description: "Professional graphic design services for your brand, events, and marketing materials. Flyers don't just sell shows—they build your image. We make you pop.",
    icon: <Palette size={28} className="text-accent" />,
    features: [
      "Full Graphics Package",
      "Individual Graphics",
      "Logo Design",
      "Brand Identity"
    ],
    detailedInfo: {
      pricing: [
        "Full Graphics Package: $150 (square, portrait, banner)",
        "Individual Graphic (any size): $50",
        "Logo Design + B/W Variants: $150",
        "96 Nation Logo Removal Fee: $10"
      ],
      professionals: [
        {
          name: "Cyrus Graphic Design",
          specialty: "Visual design and graphics"
        },
        {
          name: "Michael Dove",
          specialty: "Branding/strategy"
        }
      ],
      styleNotes: [
        "96 Nation visuals must use brand colors and logos unless removal is requested",
        "All designs reviewed by exec team before release"
      ],
      quote: "Flyers don't just sell shows—they build your image. We make you pop."
    }
  },
  {
    title: "Social Media & Promo Services",
    price: "10 - 40",
    pricingType: "rollout support | Full Campaigns: Consultation-based",
    description: "Our social team doesn't just post and ghost—we build momentum, boost reach, and help artists/events get seen by the right eyes.",
    icon: <Megaphone size={28} className="text-accent" />,
    features: [
      "Social media management (1–4 weeks)",
      "IG grid planning & content drops",
      "Event countdowns, Q&As, promo posts",
      "Graphic template reuse for consistency",
      "Street team flyer drops (FSU/FAMU/TCC)",
      "96 repost support + cross-marketing w/ artists"
    ],
    detailedInfo: {
      quote: "Your content deserves context—and we serve it up algorithm-ready."
    }
  },
  {
    title: "Video Production",
    price: "250 - 500",
    pricingType: "based on project type",
    description: "Professional video production services for music videos, commercials, and promotional content.",
    icon: <VideoIcon size={28} className="text-accent" />,
    features: [
      "Concept development",
      "Professional filming",
      "Lighting and equipment",
      "Editing and post-production",
      "Multiple format delivery",
      "Color grading"
    ],
    detailedInfo: {
      categories: [
        {
          name: "Music Video Production",
          pricing: "$250–$350",
          includes: [
            "Concept + creative direction",
            "Multi-cam setup, lighting, editing",
            "Vertical/horizontal format delivery",
            "Color grading & mood board matching",
            "Final delivery via Google Drive"
          ]
        },
        {
          name: "Commercial & Promo Video Services",
          pricing: "$300–$500",
          includes: [
            "Script assistance + visual planning",
            "Cinematic shoots (interviews, brand intros, walkthroughs)",
            "Social cuts for IG, TikTok, YouTube",
            "Voiceover options, B-roll, logo overlay",
            "Commercial usage rights included"
          ]
        }
      ]
    }
  }
];