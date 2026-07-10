// Business Empire V0.4 Department Configurations & Success Factors

export interface Department {
  id: string;
  name: string;
  description: string;
  realWorldConcept: string;
  effectDescription: string;
}

export const DEPARTMENTS_BY_CATEGORY: Record<string, Department[]> = {
  extractor: [
    {
      id: "efficiency",
      name: "Extraction Efficiency",
      description: "Applies advanced digging machinery to harvest raw materials faster.",
      realWorldConcept: "Resource Yield Optimization",
      effectDescription: "+15% production rate per level."
    },
    {
      id: "capacity",
      name: "Silo Capacity",
      description: "Builds secondary silos to store extracted output.",
      realWorldConcept: "Inventory Buffer Management",
      effectDescription: "+30 units local storage capacity per level."
    },
    {
      id: "maintenance",
      name: "Safety & Maintenance",
      description: "Implements strict wear checks to reduce engine fatigue.",
      realWorldConcept: "Preventative Maintenance",
      effectDescription: "-12% integrity decay rate per level."
    }
  ],
  factory: [
    {
      id: "automation",
      name: "Automation & Robotics",
      description: "Installs pneumatic arms to speed up factory crafting cycles.",
      realWorldConcept: "Industrial Automation",
      effectDescription: "+15% processing speed multiplier per level."
    },
    {
      id: "efficiency",
      name: "Material Science",
      description: "Optimizes cutting patterns to reduce raw material inputs.",
      realWorldConcept: "Lean Manufacturing",
      effectDescription: "-5% inputs consumed per level (cap -25%)."
    },
    {
      id: "silo",
      name: "Storage Logistics",
      description: "Expands factory output holding buffer.",
      realWorldConcept: "Supply Chain Buffering",
      effectDescription: "+25% local warehouse holding space per level."
    }
  ],
  retail: [
    {
      id: "display",
      name: "Retail Display Layout",
      description: "Arranges premium goods at eye-level to speed up conversion.",
      realWorldConcept: "Visual Merchandising",
      effectDescription: "+20% sales volume velocity per level."
    },
    {
      id: "branding",
      name: "Branding & Premium Placement",
      description: "Invests in seasonal campaigns to command premium retail price margins.",
      realWorldConcept: "Brand Equity Pricing",
      effectDescription: "+10% sell price multiplier per level."
    },
    {
      id: "expansion",
      name: "Store Floor Expansion",
      description: "Adds floor space to accommodate larger inventory volumes.",
      realWorldConcept: "Retail Capacity Planning",
      effectDescription: "+20 max inventory capacity per level."
    }
  ],
  service: [
    {
      id: "expertise",
      name: "Executive Expertise",
      description: "Hires certified specialists to charge higher service fees.",
      realWorldConcept: "Professional Specialization",
      effectDescription: "+15% service revenue billings per level."
    },
    {
      id: "relations",
      name: "Client Relations",
      description: "Develops communication pipelines to speed up billing turnaround.",
      realWorldConcept: "Client Lifecycle Value",
      effectDescription: "+15% client billing cycle velocity per level."
    },
    {
      id: "operations",
      name: "Cost Accounting",
      description: "Reduces office wear through digital operational pipelines.",
      realWorldConcept: "Operational Cost Reduction",
      effectDescription: "-12% office integrity decay per level."
    }
  ]
};
