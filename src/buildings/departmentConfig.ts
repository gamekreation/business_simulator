// Business Empire V0.6 Skill & Department Configurations
// Small businesses have 5 skills (max level 5). Mines/Quarries have 3 universal + 2 unique skills.
// Corporations (merged) have 4 universal corporate skills + 3 industry skills.

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  effectDescription: string;
}

// 1. SMALL BUSINESS & FACTORY SKILLS (5 per building type)
export const BUSINESS_SKILLS: Record<string, SkillInfo[]> = {
  clothing_shop: [
    { id: "fashion", name: "Fashion Collection", description: "Curate trendy clothes to command higher margins.", effectDescription: "+10% sell price per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Run local campaigns to attract more foot traffic.", effectDescription: "+15% visitor volume per level." },
    { id: "expansion", name: "Store Expansion", description: "Increase store size. Required for Showroom/Dealership upgrades.", effectDescription: "+20 max inventory capacity per level." },
    { id: "sales_team", name: "Sales Team Training", description: "Train associates to close sales faster.", effectDescription: "+15% sell speed per level." },
    { id: "customer_exp", name: "Customer Experience", description: "Provide premium services to keep buyers returning.", effectDescription: "+10% repeat customer loyalty rate." }
  ],
  furniture_shop: [
    { id: "showroom_space", name: "Showroom Space", description: "Expand display floor. Required for Showroom/Dealership upgrades.", effectDescription: "+20 max inventory capacity per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Advertise luxury mockups in magazines.", effectDescription: "+15% visitor volume per level." },
    { id: "sales_team", name: "Sales Training", description: "Train associates to close furniture deals faster.", effectDescription: "+15% sell speed per level." },
    { id: "customer_service", name: "Customer Service", description: "Build relationships to secure premium contracts.", effectDescription: "+10% repeat customer loyalty rate." },
    { id: "display_design", name: "Display & Design", description: "Create eye-catching displays to raise margins.", effectDescription: "+15% furniture selling price per level." }
  ],
  food_shop: [
    { id: "chef_skill", name: "Chef Skill", description: "Hire experienced chefs to create high-quality dishes.", effectDescription: "+10% meal selling price per level." },
    { id: "seating_capacity", name: "Seating Capacity", description: "Add table layouts. Required for Showroom/Dealership upgrades.", effectDescription: "+20 max customer capacity per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Advertise food specials on social media.", effectDescription: "+15% visitor volume per level." },
    { id: "customer_service", name: "Customer Service", description: "Keep table service friendly to earn repeat diners.", effectDescription: "+10% repeat customer rate." },
    { id: "kitchen_efficiency", name: "Kitchen Efficiency", description: "Streamline cooking pipelines to serve meals faster.", effectDescription: "+20% serving speed per level." }
  ],
  grocery_shop: [
    { id: "inventory_management", name: "Inventory Management", description: "Expand shelf space. Required for Showroom/Dealership upgrades.", effectDescription: "+25 max storage capacity per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Advertise fresh produce to locals.", effectDescription: "+15% visitor volume per level." },
    { id: "supply_chain", name: "Supply Chain", description: "Coordinate with logistics for faster restocks.", effectDescription: "+20% restocking speed per level." },
    { id: "pricing_strategy", name: "Pricing Strategy", description: "Optimize pricing to capture higher margins.", effectDescription: "+10% margin rate per level." },
    { id: "customer_satisfaction", name: "Customer Satisfaction", description: "Maintain clean displays to ensure return visits.", effectDescription: "+10% repeat customer rate." }
  ],
  medical_shop: [
    { id: "medicine_inventory", name: "Medicine Inventory", description: "Secure storage units. Required for Showroom/Dealership upgrades.", effectDescription: "+20 max inventory capacity per level." },
    { id: "pharmacist_skill", name: "Pharmacist Skill", description: "Employ certified experts to advise on health.", effectDescription: "+15% pharma selling price per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Advertise healthcare services.", effectDescription: "+15% visitor volume per level." },
    { id: "compliance", name: "Regulatory Compliance", description: "Ensure safety checks to reduce structural decay.", effectDescription: "-15% integrity decay rate per level." },
    { id: "patient_service", name: "Patient Service", description: "Deliver exceptional care to build return visits.", effectDescription: "+10% patient loyalty rate." }
  ],
  electronics_shop: [
    { id: "tech_knowledge", name: "Technical Knowledge", description: "Educate associates to pitch premium gadgets.", effectDescription: "+15% device selling price per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Advertise high-tech hardware launches.", effectDescription: "+15% visitor volume per level." },
    { id: "inventory", name: "Inventory Space", description: "Expand store backroom space.", effectDescription: "+15 max stock capacity per level." },
    { id: "premium_support", name: "Premium Support", description: "Provide setup support to earn repeat buyers.", effectDescription: "+10% customer loyalty rate." },
    { id: "expansion", name: "Store Expansion", description: "Enlarge sales floor. Required for Showroom/Dealership upgrades.", effectDescription: "+20 max inventory capacity per level." }
  ],
  gas_station: [
    { id: "fuel_tanks", name: "Fuel Tanks", description: "Install larger storage tanks. Required for Showroom/Dealership upgrades.", effectDescription: "+30 max fuel capacity per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Place visible price signs to attract drivers.", effectDescription: "+15% vehicle volume per level." },
    { id: "dispenser_speed", name: "Dispenser Speed", description: "Upgrade pumps to dispense fuel faster.", effectDescription: "+20% pumping speed per level." },
    { id: "safety_inspections", name: "Safety Inspections", description: "Maintain pump nozzles to minimize wear.", effectDescription: "-15% integrity decay rate per level." },
    { id: "premium_fuel", name: "Premium Fuel", description: "Offer high-octane fuel for higher margins.", effectDescription: "+10% selling price per level." }
  ],
  interior_design_studio: [
    { id: "design_creativity", name: "Design Creativity", description: "Develop creative blueprints to charge premium design fees.", effectDescription: "+15% project billing per level." },
    { id: "project_mgmt", name: "Project Management", description: "Coordinate contractor tasks to finish projects faster.", effectDescription: "+15% project velocity per level." },
    { id: "client_relations", name: "Client Relations", description: "Maintain contacts to win recurring design accounts.", effectDescription: "+10% repeat project rate." },
    { id: "marketing", name: "Branding & Marketing", description: "Showcase design mockups in portfolios.", effectDescription: "+15% project leads per level." },
    { id: "expansion", name: "Office Expansion", description: "Add workstation desks. Required for Firm/Corporate upgrades.", effectDescription: "+15 max active design projects per level." }
  ],
  architecture_firm: [
    { id: "design_quality", name: "Design Quality", description: "Build architectural blueprints to claim higher planning fees.", effectDescription: "+20% blueprint billing per level." },
    { id: "planning_efficiency", name: "Planning Efficiency", description: "Speed up document submission cycles.", effectDescription: "+15% planning velocity per level." },
    { id: "engineering", name: "Structural Engineering", description: "Coordinate blueprints to attract major builders.", effectDescription: "+10% blueprint project volume." },
    { id: "marketing", name: "Branding & Marketing", description: "Pitch projects in city bidding tenders.", effectDescription: "+15% client leads per level." },
    { id: "office_space", name: "Office Space", description: "Add plotter rooms. Required for Firm/Corporate upgrades.", effectDescription: "+15 max project files per level." }
  ],
  consulting_firm: [
    { id: "strategy", name: "Business Strategy", description: "Provide advisory services for corporate billing.", effectDescription: "+20% consulting fees per level." },
    { id: "networking", name: "Networking", description: "Speed up advisory turnaround cycles.", effectDescription: "+15% project velocity per level." },
    { id: "reputation", name: "Brand Reputation", description: "Advertise corporate consultation cases.", effectDescription: "+15% client demand per level." },
    { id: "research", name: "Market Research", description: "Leverage datasets to deliver high-quality counsel.", effectDescription: "+10% client retention rate." },
    { id: "expansion", name: "Office Expansion", description: "Add consultant offices. Required for Firm/Corporate upgrades.", effectDescription: "+15 max client accounts per level." }
  ],
  garage: [
    { id: "mechanic_skill", name: "Mechanic Skill", description: "Employ diagnostic experts to handle complex repairs.", effectDescription: "+15% repair fees per level." },
    { id: "repair_speed", name: "Repair Speed", description: "Install pneumatic lifts to finish repairs faster.", effectDescription: "+15% vehicle turnaround speed." },
    { id: "equipment", name: "Advanced Equipment", description: "Purchase OBD tools to attract premium auto tuning.", effectDescription: "+15% repair demand per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Mail discounts to regional drivers.", effectDescription: "+10% customer leads per level." },
    { id: "workshop_space", name: "Workshop Space", description: "Add service bays. Required for Firm/Corporate upgrades.", effectDescription: "+15 max active vehicles per level." }
  ],
  hotel: [
    { id: "hospitality", name: "Hospitality Services", description: "Provide custom room options to raise lodging fees.", effectDescription: "+15% room billings per level." },
    { id: "tourism_partnerships", name: "Tourism Partnerships", description: "Speed up guest checkouts and tours.", effectDescription: "+15% checkout velocity per level." },
    { id: "luxury_services", name: "Luxury Services", description: "Build guest amenities to expand bookings.", effectDescription: "+15% guest demand per level." },
    { id: "marketing", name: "Branding & Marketing", description: "Advertise vacation listings.", effectDescription: "+15% guest bookings per level." },
    { id: "resort_expansion", name: "Resort Expansion", description: "Construct hotel rooms. Required for Firm/Corporate upgrades.", effectDescription: "+20 max guest capacity per level." }
  ],
  
  // Generic Factory skills (Used by Small, Medium, Large Factories)
  factory: [
    { id: "production_efficiency", name: "Production Efficiency", description: "Optimize conveyor speeds to increase output yield.", effectDescription: "+15% manufacturing output yield per level." },
    { id: "workforce_training", name: "Workforce Training", description: "Train assembly operators to complete recipes faster.", effectDescription: "-10% production duration time." },
    { id: "machine_maintenance", name: "Machine Maintenance", description: "Deploy strict servicing checks to minimize plant decay.", effectDescription: "-15% integrity decay wear per level." },
    { id: "internal_storage", name: "Internal Storage", description: "Expand factory internal input/output holding silos.", effectDescription: "+40 local silo storage capacity." },
    { id: "process_optimization", name: "Process Optimization", description: "Reduce material scrap waste to lower raw input costs.", effectDescription: "-5% raw inputs consumed per level (cap -25%)." }
  ]
};

// 2. RESOURCE EXTRACTOR SKILLS (Mines & Quarries - 3 Universal + 2 Unique)
export const UNIVERSAL_EXTRACTOR_SKILLS: SkillInfo[] = [
  { id: "extraction_tech", name: "Extraction Technology", description: "Equip rigs with drillheads to harvest more raw ore.", effectDescription: "+15% raw resource output per cycle." },
  { id: "heavy_machinery", name: "Heavy Machinery", description: "Install pneumatic diggers to accelerate cycle times.", effectDescription: "-10% extraction cycle duration." },
  { id: "storage_infra", name: "Storage Infrastructure", description: "Construct larger local silos to buffer harvested ore.", effectDescription: "+30 units local silo capacity." }
];

export const UNIQUE_EXTRACTOR_SKILLS: Record<string, SkillInfo[]> = {
  iron_mine: [
    { id: "high_grade", name: "High Grade Ore", description: "Separate pure iron ore to boost steel refinery yields.", effectDescription: "+15% steel output conversion bonus." },
    { id: "deep_mining", name: "Deep Mining", description: "Access deep deposits to increase extraction speeds.", effectDescription: "-10% cycle duration in deep veins." }
  ],
  coal_extractor: [
    { id: "high_carbon", name: "High Carbon Coal", description: "Extract clean carbon coal to heat furnaces hotter.", effectDescription: "+15% steel & cement processing speeds." },
    { id: "seam_opt", name: "Seam Optimization", description: "Follow seam patterns to boost extraction yield.", effectDescription: "+15% raw coal yield per cycle." }
  ],
  stone_quarry: [
    { id: "construction_grade", name: "Construction Grade Stone", description: "Harvest solid stones to lower building wear.", effectDescription: "+15% durability bonus on new structures." },
    { id: "precision_blasting", name: "Precision Blasting", description: "Use optimized charges to shatter rock layers.", effectDescription: "+20% stone extraction yield." }
  ],
  quarry: [ // Limestone quarry
    { id: "cement_grade", name: "Cement Grade Limestone", description: "Isolate lime compounds to accelerate cement mixing.", effectDescription: "+15% cement manufacturing output." },
    { id: "mineral_purity", name: "Mineral Purity", description: "Refine mineral inputs to reduce coal fuel requirements.", effectDescription: "-10% coal input in cement mills." }
  ],
  copper_mine: [
    { id: "conductivity_grade", name: "Conductivity Grade", description: "Extract highly conductive copper for better electronics.", effectDescription: "+15% electronics market value." },
    { id: "ore_purity", name: "Ore Purity", description: "Wash ore to separate rock, increasing copper yield.", effectDescription: "+15% copper ore yield per cycle." }
  ],
  silicon_mine: [
    { id: "semiconductor_grade", name: "Semiconductor Grade", description: "Isolate silicon compounds for processor manufacturing.", effectDescription: "+15% electronics output speed." },
    { id: "silicon_purity", name: "Silicon Purity", description: "Refine silicon crystals to reduce manufacturing defects.", effectDescription: "-10% raw inputs in chip factories." }
  ],
  uranium_mine: [
    { id: "radiation_safety", name: "Radiation Safety", description: "Deploy shielding suites to minimize plant accidents.", effectDescription: "-20% uranium mine integrity decay rate." },
    { id: "nuclear_grade", name: "Nuclear Grade Ore", description: "Isolate isotopes to boost fission conversion yields.", effectDescription: "+15% fuel assembly output." }
  ],
  oil_rig: [
    { id: "reservoir_eng", name: "Reservoir Engineering", description: "Employ pressure systems to pump heavy crude faster.", effectDescription: "+15% crude oil pump speeds." },
    { id: "crude_quality", name: "Crude Quality", description: "Re-inject gas lines to separate sulfur contaminants.", effectDescription: "+15% refinery fuel output yield." }
  ],
  agricultural_farm: [
    { id: "crop_science", name: "Crop Science", description: "Apply bio-fertilizers to accelerate growth cycles.", effectDescription: "-15% growth cycle duration." },
    { id: "irrigation", name: "Irrigation Systems", description: "Install drip water grids to yield larger crop volumes.", effectDescription: "+20% crops/cotton yield per harvest." }
  ],
  lumber_mill: [
    { id: "sustainable", name: "Sustainable Forestry", description: "Deploy replanting grids to minimize forestry wear.", effectDescription: "-15% lumber mill integrity decay." },
    { id: "wood_quality", name: "Wood Quality", description: "Harvest thick timber logs for premium furniture.", effectDescription: "+15% furniture selling price." }
  ]
};

// 3. CORPORATE SKILLS (Merged Companies - 4 Universal + 3 Industry-Specific)
export const UNIVERSAL_CORPORATE_SKILLS: SkillInfo[] = [
  { id: "corp_finance", name: "Corporate Finance", description: "Optimize capital allocation and financial pipelines.", effectDescription: "+15% profit margins, -10% maintenance leaks." },
  { id: "brand_mgmt", name: "Brand Management", description: "Launch global brand campaigns to command massive demand.", effectDescription: "+15% consumer demand and retail sales speeds." },
  { id: "supply_chain", name: "Supply Chain Management", description: "Coordinate transit fleets to speed up resource hauling.", effectDescription: "+15% transport vehicle speed and capacity multipliers." },
  { id: "biz_expansion", name: "Business Expansion", description: "Scale corporate operations across regional markets.", effectDescription: "+15% global corporate efficiency and scaling metrics." }
];

export const UNIQUE_CORPORATE_SKILLS: Record<string, SkillInfo[]> = {
  clothing_company: [
    { id: "fashion_innovation", name: "Fashion Innovation", description: "Lead runway designs to raise apparel price premiums.", effectDescription: "+15% clothes price margins." },
    { id: "textile_mfg", name: "Textile Manufacturing", description: "Automate weaving looms to speed up apparel assembly.", effectDescription: "+15% clothing factory speed." },
    { id: "retail_network", name: "Retail Network Expansion", description: "Set up flagship stores to increase client sales.", effectDescription: "+15% clothing retail volume." }
  ],
  car_company: [
    { id: "vehicle_rd", name: "Vehicle R&D", description: "Design aerodynamic frames to sell sports vehicles.", effectDescription: "+15% vehicle price margins." },
    { id: "production_eng", name: "Production Engineering", description: "Build robotics weld loops to assemble cars faster.", effectDescription: "+15% vehicle assembly speed." },
    { id: "dealer_network", name: "Dealer Network", description: "Establish regional dealership hubs to boost sales.", effectDescription: "+15% vehicle client sales." }
  ],
  furniture_company: [
    { id: "product_design", name: "Product Design", description: "Design premium wood catalogs to command top margins.", effectDescription: "+15% furniture price margins." },
    { id: "material_opt", name: "Material Optimization", description: "Deploy precision saw cuts to minimize timber waste.", effectDescription: "-10% wood raw inputs in furniture mills." },
    { id: "showroom_excellence", name: "Showroom Excellence", description: "Build mockup layouts to boost furniture conversion.", effectDescription: "+15% furniture retail sales." }
  ],
  construction_company: [
    { id: "engineering_excellence", name: "Engineering Excellence", description: "Draft plans to secure high-value commercial tenders.", effectDescription: "+15% design project billings." },
    { id: "project_mgmt", name: "Project Management", description: "Implement schedule charts to construct buildings faster.", effectDescription: "+15% construction speed." },
    { id: "material_opt", name: "Material Optimization", description: "Reduce materials scrap waste during projects.", effectDescription: "-10% building placement and upgrade costs." }
  ],
  petroleum_company: [
    { id: "extraction_tech", name: "Extraction Technology", description: "Install pump jacks to pump crude reservoirs faster.", effectDescription: "+15% oil rig pump speed." },
    { id: "refining_eff", name: "Refining Efficiency", description: "Install catalytic crackers to refine more fuel.", effectDescription: "+15% refinery fuel output yield." },
    { id: "fuel_dist", name: "Fuel Distribution", description: "Deploy pipelines to speed up gas station deliveries.", effectDescription: "+15% gas station pump velocity." }
  ],
  electricity_company: [
    { id: "power_generation", name: "Power Generation", description: "Deploy high-temperature furnaces to yield more power.", effectDescription: "+15% electricity output." },
    { id: "grid_opt", name: "Grid Optimization", description: "Deploy high-voltage step-up lines to reduce leaks.", effectDescription: "-10% electric transmission loss." },
    { id: "energy_innovation", name: "Energy Innovation", description: "Leverage turbine analytics to lower plant upkeep.", effectDescription: "+15% plant efficiency metrics." }
  ],
  pharma_company: [
    { id: "drug_research", name: "Drug Research", description: "Isolate molecular compounds to develop medicine.", effectDescription: "+15% pharmaceutical price margins." },
    { id: "healthcare_partners", name: "Healthcare Partnerships", description: "Secure medical networks to expand medicine sales.", effectDescription: "+15% medicine client sales." },
    { id: "compliance", name: "Regulatory Compliance", description: "Maintain cleanrooms to reduce structural breakdowns.", effectDescription: "-15% pharmaceutical plant decay." }
  ],
  hotel_company: [
    { id: "hospitality_stars", name: "Hospitality Stars", description: "Secure ratings to command room price premiums.", effectDescription: "+15% resort room billings." },
    { id: "tourism_partners", name: "Tourism Partnerships", description: "Build booking pipelines to attract tourists.", effectDescription: "+15% guest check-in volume." },
    { id: "luxury_services", name: "Luxury Services", description: "Build guest golf courses to raise booking values.", effectDescription: "+15% guest demand metrics." }
  ]
};
