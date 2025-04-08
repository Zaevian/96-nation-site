import React from 'react';
import { 
  Music, 
  VideoIcon, 
  Megaphone, 
  Lightbulb, 
  Radio, 
  Users,
  Calendar,
  Camera
} from 'lucide-react';

// Sample services data for 96 Nation
export const services = [
  {
    title: "Event Production",
    price: "1,500",
    pricingType: "starting at",
    description: "Full-service event production including sound, lighting, staging, and logistics management for concerts and festivals of any size.",
    icon: <Calendar size={28} className="text-accent" />,
    features: [
      "Professional sound and lighting equipment",
      "Experienced sound engineers and technicians",
      "Stage design and setup",
      "Event logistics coordination",
      "Venue booking assistance",
      "Day-of event management"
    ]
  },
  {
    title: "Artist Development",
    price: "750",
    pricingType: "per month",
    description: "Comprehensive artist development program to help emerging musicians refine their sound, build their brand, and grow their audience.",
    icon: <Music size={28} className="text-accent" />,
    features: [
      "Sound and style consultation",
      "Brand identity development",
      "Press kit creation",
      "Recording studio time",
      "Performance coaching",
      "Industry networking opportunities"
    ]
  },
  {
    title: "Venue Consulting",
    price: "2,000",
    pricingType: "per project",
    description: "Expert consulting for venues looking to optimize their space, improve sound quality, and enhance the overall experience for performers and attendees.",
    icon: <Lightbulb size={28} className="text-accent" />,
    features: [
      "Acoustic analysis and recommendations",
      "Sound system design",
      "Lighting design",
      "Stage layout optimization",
      "Capacity and flow analysis",
      "Bar and service area efficiency"
    ]
  },
  {
    title: "Media Production",
    price: "500",
    pricingType: "starting at",
    description: "Professional photo and video production services for music videos, live performances, promotional content, and social media assets.",
    icon: <Camera size={28} className="text-accent" />,
    features: [
      "Music video production",
      "Live performance recording",
      "Multi-camera event coverage",
      "Promotional photoshoots",
      "Live event photography",
      "Editing and post-production"
    ]
  },
  {
    title: "Marketing & Promotion",
    price: "350",
    pricingType: "per month",
    description: "Strategic marketing and promotion services to help artists and venues reach their target audience and fill seats at events.",
    icon: <Megaphone size={28} className="text-accent" />,
    features: [
      "Social media management",
      "Content creation",
      "Email marketing campaigns",
      "Press release distribution",
      "Media outreach",
      "Ticket sales strategies"
    ]
  },
  {
    title: "Talent Booking",
    price: "10%",
    pricingType: "of artist fee",
    description: "Connect with the right artists for your venue or event. We have relationships with local, regional, and national acts across genres.",
    icon: <Users size={28} className="text-accent" />,
    features: [
      "Artist sourcing and curation",
      "Contract negotiation",
      "Rider fulfillment",
      "Travel and accommodation coordination",
      "Payment processing",
      "Day-of artist management"
    ]
  },
  {
    title: "Audio Recording",
    price: "75",
    pricingType: "per hour",
    description: "Professional audio recording services in our state-of-the-art studio. Includes access to our gear and an experienced sound engineer.",
    icon: <Radio size={28} className="text-accent" />,
    features: [
      "Professional recording equipment",
      "Experienced audio engineers",
      "Mixing and mastering",
      "Multiple studio rooms",
      "Instrument and amp selection",
      "Post-production consultations"
    ]
  },
  {
    title: "Video Content",
    price: "1,200",
    pricingType: "starting at",
    description: "Professional video production services for music videos, live performances, interviews, and other promotional content.",
    icon: <VideoIcon size={28} className="text-accent" />,
    features: [
      "Concept development",
      "Professional videography",
      "Lighting and set design",
      "Editing and post-production",
      "Color grading",
      "Distribution consultation"
    ]
  }
];