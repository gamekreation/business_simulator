// Business Empire V0.2 & V0.3 Centralized Data Configurations

export interface ResourceConfig {
  id: string;
  name: string;
  category: "natural" | "processed";
  volume: number; // Volume units occupied in warehouse
  basePrice: number; // Selling price
}

export const RESOURCES_CONFIG: Record<string, ResourceConfig> = {
  iron_ore: { id: "iron_ore", name: "Iron Ore", category: "natural", volume: 2, basePrice: 12 },
  coal: { id: "coal", name: "Coal", category: "natural", volume: 2, basePrice: 10 },
  oil: { id: "oil", name: "Oil", category: "natural", volume: 3, basePrice: 20 },
  limestone: { id: "limestone", name: "Limestone", category: "natural", volume: 2.5, basePrice: 8 },
  fertile_land_crop: { id: "fertile_land_crop", name: "Crops", category: "natural", volume: 2, basePrice: 6 },
  wood: { id: "wood", name: "Wood", category: "natural", volume: 1.5, basePrice: 5 }, // V0.3 Forest Node raw wood
  cotton: { id: "cotton", name: "Cotton", category: "natural", volume: 1.2, basePrice: 4 }, // V0.3 Agriculture choice raw material
  
  steel: { id: "steel", name: "Steel", category: "processed", volume: 4, basePrice: 65 },
  fuel: { id: "fuel", name: "Fuel", category: "processed", volume: 3, basePrice: 50 },
  mortar: { id: "mortar", name: "Mortar", category: "processed", volume: 3, basePrice: 35 }, // Mortar used as building currency
  cement: { id: "cement", name: "Cement", category: "processed", volume: 5, basePrice: 40 },
  fabric: { id: "fabric", name: "Fabric", category: "processed", volume: 2, basePrice: 25 },
  food: { id: "food", name: "Processed Food", category: "processed", volume: 3, basePrice: 35 },
  electronics: { id: "electronics", name: "Electronics Parts", category: "processed", volume: 3, basePrice: 110 },
  furniture: { id: "furniture", name: "Luxury Furniture", category: "processed", volume: 8, basePrice: 150 },
  vehicles: { id: "vehicles", name: "Assembled Vehicles", category: "processed", volume: 15, basePrice: 450 },
  medicine: { id: "medicine", name: "Pharmaceuticals", category: "processed", volume: 2, basePrice: 180 },
  electricity: { id: "electricity", name: "Electricity", category: "processed", volume: 0, basePrice: 30 },
};

export interface FactoryRecipe {
  id: string;
  name: string;
  inputs: Array<{ resource: string; amount: number }>;
  outputs: Array<{ resource: string; amount: number }>;
}

export const FACTORY_RECIPES: Record<string, FactoryRecipe> = {
  mortar_mixing: {
    id: "mortar_mixing",
    name: "Mortar Mixing",
    inputs: [{ resource: "limestone", amount: 2 }],
    outputs: [{ resource: "mortar", amount: 1 }]
  },
  food_processing: {
    id: "food_processing",
    name: "Food Processing",
    inputs: [{ resource: "fertile_land_crop", amount: 3 }],
    outputs: [{ resource: "food", amount: 1 }]
  },
  fabric_weaving: {
    id: "fabric_weaving",
    name: "Fabric Weaving",
    inputs: [{ resource: "cotton", amount: 2 }], // V0.3 Cotton -> Fabric
    outputs: [{ resource: "fabric", amount: 1 }]
  },
  steel_smelting: {
    id: "steel_smelting",
    name: "Steel Smelting",
    inputs: [{ resource: "iron_ore", amount: 2 }, { resource: "coal", amount: 1 }],
    outputs: [{ resource: "steel", amount: 1 }]
  },
  oil_refining: {
    id: "oil_refining",
    name: "Oil Refining",
    inputs: [{ resource: "oil", amount: 2 }],
    outputs: [{ resource: "fuel", amount: 1 }]
  },
  cement_mixing: {
    id: "cement_mixing",
    name: "Cement Mixing",
    inputs: [{ resource: "limestone", amount: 3 }],
    outputs: [{ resource: "cement", amount: 1 }]
  },
  electronics_assembly: {
    id: "electronics_assembly",
    name: "Electronics Assembly",
    inputs: [{ resource: "steel", amount: 1 }, { resource: "fuel", amount: 1 }],
    outputs: [{ resource: "electronics", amount: 1 }]
  },
  furniture_making: {
    id: "furniture_making",
    name: "Furniture Crafting",
    inputs: [{ resource: "wood", amount: 2 }], // V0.3 Wood -> Furniture
    outputs: [{ resource: "furniture", amount: 1 }]
  },
  vehicle_assembly: {
    id: "vehicle_assembly",
    name: "Vehicle Assembly",
    inputs: [{ resource: "steel", amount: 3 }, { resource: "electronics", amount: 1 }, { resource: "fuel", amount: 1 }],
    outputs: [{ resource: "vehicles", amount: 1 }]
  },
  medicine_synthesis: {
    id: "medicine_synthesis",
    name: "Medicine Synthesis",
    inputs: [{ resource: "fertile_land_crop", amount: 2 }, { resource: "oil", amount: 1 }],
    outputs: [{ resource: "medicine", amount: 1 }]
  },
  power_generation: {
    id: "power_generation",
    name: "Coal Power Generation",
    inputs: [{ resource: "coal", amount: 2 }],
    outputs: [{ resource: "electricity", amount: 5 }]
  }
};

export interface BuildingConfig {
  id: string;
  name: string;
  category: "extractor" | "factory" | "retail" | "service" | "warehouse" | "logistics" | "bank" | "tourism" | "hq";
  width: number;
  height: number;
  baseCost: number; // Money cost
  baseIronCost: number; // Iron Ore resource cost
  baseLimestoneCost: number; // Limestone resource cost
  baseMortarCost: number; // Mortar resource cost
  baseWoodCost: number; // Wood resource cost (V0.3 core construction currency)
  baseMaintenance: number;
  description: string;
  color: string;
  // Specific attributes:
  requiredDepositNode?: string; // e.g., 'iron_deposit' for iron_mine
  producesResource?: string;
  baseProductionRate?: number;
  baseCapacity?: number;
}

export const BUILDING_CONFIGS: Record<string, BuildingConfig> = {
  // Extractors (on Natural Resource Nodes)
  iron_mine: {
    id: "iron_mine",
    name: "Iron Mine",
    category: "extractor",
    width: 2,
    height: 2,
    baseCost: 500,
    baseIronCost: 0,
    baseLimestoneCost: 10,
    baseMortarCost: 0,
    baseWoodCost: 15,
    baseMaintenance: 5,
    description: "Extracts Iron Ore. Requires 10 Lime, 15 Wood. Must be built on Iron Deposit.",
    color: "bg-slate-650 border border-slate-400",
    requiredDepositNode: "iron_deposit",
    producesResource: "iron_ore",
    baseProductionRate: 3,
  },
  quarry: {
    id: "quarry",
    name: "Limestone Quarry",
    category: "extractor",
    width: 2,
    height: 2,
    baseCost: 400,
    baseIronCost: 10,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 15,
    baseMaintenance: 4,
    description: "Extracts Limestone. Requires 10 Iron Ore, 15 Wood. Must be built on Limestone Deposit.",
    color: "bg-stone-500 border border-stone-300",
    requiredDepositNode: "limestone_deposit",
    producesResource: "limestone",
    baseProductionRate: 4,
  },
  oil_rig: {
    id: "oil_rig",
    name: "Oil Rig",
    category: "extractor",
    width: 2,
    height: 2,
    baseCost: 1500,
    baseIronCost: 40,
    baseLimestoneCost: 20,
    baseMortarCost: 15,
    baseWoodCost: 50,
    baseMaintenance: 15,
    description: "Pumps crude Oil. Requires 40 Iron, 20 Lime, 15 Mortar, 50 Wood. Cover Oil Field.",
    color: "bg-zinc-850 border border-yellow-600",
    requiredDepositNode: "oil_field",
    producesResource: "oil",
    baseProductionRate: 2,
  },
  coal_extractor: {
    id: "coal_extractor",
    name: "Coal Shaft Mine",
    category: "extractor",
    width: 2,
    height: 2,
    baseCost: 600,
    baseIronCost: 15,
    baseLimestoneCost: 10,
    baseMortarCost: 5,
    baseWoodCost: 25,
    baseMaintenance: 4,
    description: "Mines Coal. Requires 15 Iron, 10 Lime, 5 Mortar, 25 Wood. Cover Coal Deposit.",
    color: "bg-neutral-800 border border-neutral-600",
    requiredDepositNode: "coal_deposit",
    producesResource: "coal",
    baseProductionRate: 3.5,
  },
  agricultural_farm: {
    id: "agricultural_farm",
    name: "Agricultural Farm",
    category: "extractor",
    width: 2,
    height: 2,
    baseCost: 350,
    baseIronCost: 5,
    baseLimestoneCost: 15,
    baseMortarCost: 0,
    baseWoodCost: 30,
    baseMaintenance: 2,
    description: "Produces Crops/Cotton. Requires 5 Iron, 15 Lime, 30 Wood. Cover Fertile Land.",
    color: "bg-emerald-800 border border-emerald-400",
    requiredDepositNode: "fertile_land",
    producesResource: "fertile_land_crop",
    baseProductionRate: 5,
  },
  lumber_mill: {
    id: "lumber_mill",
    name: "Lumber Mill",
    category: "extractor",
    width: 2,
    height: 2,
    baseCost: 350,
    baseIronCost: 5,
    baseLimestoneCost: 10,
    baseMortarCost: 0,
    baseWoodCost: 0, // Starts at 0 so player can Bootstrap timber extraction
    baseMaintenance: 3,
    description: "Harvests Wood. Requires 5 Iron, 10 Lime. Must cover Forest Node.",
    color: "bg-amber-900 border border-green-800",
    requiredDepositNode: "forest",
    producesResource: "wood",
    baseProductionRate: 4,
  },

  // Factories (Manufacturing)
  small_factory: {
    id: "small_factory",
    name: "Small Factory",
    category: "factory",
    width: 3,
    height: 3,
    baseCost: 1500,
    baseIronCost: 30,
    baseLimestoneCost: 20,
    baseMortarCost: 10,
    baseWoodCost: 35,
    baseMaintenance: 10,
    description: "Basic conversion facility. Requires 30 Iron, 20 Lime, 10 Mortar, 35 Wood.",
    color: "bg-orange-700",
    baseCapacity: 100,
    baseProductionRate: 1,
  },
  medium_factory: {
    id: "medium_factory",
    name: "Medium Factory",
    category: "factory",
    width: 3,
    height: 3,
    baseCost: 3500,
    baseIronCost: 60,
    baseLimestoneCost: 40,
    baseMortarCost: 25,
    baseWoodCost: 70,
    baseMaintenance: 22,
    description: "Standard industrial plant. Requires 60 Iron, 40 Lime, 25 Mortar, 70 Wood.",
    color: "bg-orange-650 border border-yellow-500",
    baseCapacity: 250,
    baseProductionRate: 2.2,
  },
  large_factory: {
    id: "large_factory",
    name: "Large Factory",
    category: "factory",
    width: 3,
    height: 3,
    baseCost: 7500,
    baseIronCost: 120,
    baseLimestoneCost: 80,
    baseMortarCost: 55,
    baseWoodCost: 140,
    baseMaintenance: 45,
    description: "Mass production facility. Requires 120 Iron, 80 Lime, 55 Mortar, 140 Wood.",
    color: "bg-orange-600 border-2 border-yellow-400",
    baseCapacity: 600,
    baseProductionRate: 5,
  },

  // Retail Shops
  clothing_shop: {
    id: "clothing_shop",
    name: "Clothing Shop",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 400,
    baseIronCost: 10,
    baseLimestoneCost: 15,
    baseMortarCost: 5,
    baseWoodCost: 20,
    baseMaintenance: 5,
    description: "Sells clothing items. Requires 10 Iron, 15 Lime, 5 Mortar, 20 Wood.",
    color: "bg-rose-600",
    baseCapacity: 30,
  },
  furniture_shop: {
    id: "furniture_shop",
    name: "Furniture Shop",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 500,
    baseIronCost: 15,
    baseLimestoneCost: 15,
    baseMortarCost: 8,
    baseWoodCost: 20,
    baseMaintenance: 6,
    description: "Sells Luxury Furniture. Requires 15 Iron, 15 Lime, 8 Mortar, 20 Wood.",
    color: "bg-amber-600",
    baseCapacity: 20,
  },
  food_shop: {
    id: "food_shop",
    name: "Food Shop",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 350,
    baseIronCost: 8,
    baseLimestoneCost: 12,
    baseMortarCost: 4,
    baseWoodCost: 20,
    baseMaintenance: 4,
    description: "Quick-serve food store. Requires 8 Iron, 12 Lime, 4 Mortar, 20 Wood.",
    color: "bg-red-500",
    baseCapacity: 50,
  },
  grocery_shop: {
    id: "grocery_shop",
    name: "Grocery Shop",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 300,
    baseIronCost: 5,
    baseLimestoneCost: 10,
    baseMortarCost: 3,
    baseWoodCost: 20,
    baseMaintenance: 3,
    description: "Sells foods. Requires 5 Iron, 10 Lime, 3 Mortar, 20 Wood.",
    color: "bg-green-600",
    baseCapacity: 100,
  },
  medical_shop: {
    id: "medical_shop",
    name: "Medical Shop",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 600,
    baseIronCost: 20,
    baseLimestoneCost: 15,
    baseMortarCost: 10,
    baseWoodCost: 20,
    baseMaintenance: 8,
    description: "Sells pharmaceuticals. Requires 20 Iron, 15 Lime, 10 Mortar, 20 Wood.",
    color: "bg-sky-500",
    baseCapacity: 40,
  },
  electronics_shop: {
    id: "electronics_shop",
    name: "Electronics Shop",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 1000,
    baseIronCost: 25,
    baseLimestoneCost: 20,
    baseMortarCost: 15,
    baseWoodCost: 20,
    baseMaintenance: 12,
    description: "High-margin gadgets. Requires 25 Iron, 20 Lime, 15 Mortar, 20 Wood.",
    color: "bg-teal-500",
    baseCapacity: 25,
  },
  gas_station: {
    id: "gas_station",
    name: "Gas Station",
    category: "retail",
    width: 1,
    height: 1,
    baseCost: 450,
    baseIronCost: 15,
    baseLimestoneCost: 10,
    baseMortarCost: 5,
    baseWoodCost: 25,
    baseMaintenance: 6,
    description: "Sells refined Fuel to vehicles. Requires 15 Iron, 10 Lime, 5 Mortar, 25 Wood.",
    color: "bg-cyan-600 border border-yellow-500",
    baseCapacity: 40,
  },

  // Service Businesses
  interior_design_studio: {
    id: "interior_design_studio",
    name: "Interior Design Studio",
    category: "service",
    width: 2,
    height: 2,
    baseCost: 800,
    baseIronCost: 15,
    baseLimestoneCost: 25,
    baseMortarCost: 10,
    baseWoodCost: 25,
    baseMaintenance: 6,
    description: "Design office. Requires 15 Iron, 25 Lime, 10 Mortar, 25 Wood.",
    color: "bg-fuchsia-600",
  },
  architecture_firm: {
    id: "architecture_firm",
    name: "Architecture Firm",
    category: "service",
    width: 2,
    height: 2,
    baseCost: 1500,
    baseIronCost: 35,
    baseLimestoneCost: 35,
    baseMortarCost: 20,
    baseWoodCost: 25,
    baseMaintenance: 14,
    description: "Planning firm. Requires 35 Iron, 35 Lime, 20 Mortar, 25 Wood.",
    color: "bg-blue-600",
  },
  consulting_firm: {
    id: "consulting_firm",
    name: "Consulting Firm",
    category: "service",
    width: 2,
    height: 2,
    baseCost: 1800,
    baseIronCost: 25,
    baseLimestoneCost: 25,
    baseMortarCost: 15,
    baseWoodCost: 25,
    baseMaintenance: 16,
    description: "Corporate strategies. Requires 25 Iron, 25 Lime, 15 Mortar, 25 Wood.",
    color: "bg-indigo-700",
  },
  garage: {
    id: "garage",
    name: "Auto Service Garage",
    category: "service",
    width: 2,
    height: 2,
    baseCost: 900,
    baseIronCost: 30,
    baseLimestoneCost: 15,
    baseMortarCost: 10,
    baseWoodCost: 25,
    baseMaintenance: 8,
    description: "Repairs vehicles. Requires 30 Iron, 15 Lime, 10 Mortar, 25 Wood.",
    color: "bg-cyan-700",
  },
  hotel: {
    id: "hotel",
    name: "Luxury Hotel Resort",
    category: "service",
    width: 3,
    height: 3,
    baseCost: 3000,
    baseIronCost: 80,
    baseLimestoneCost: 60,
    baseMortarCost: 40,
    baseWoodCost: 100,
    baseMaintenance: 30,
    description: "Luxury lodgings. Requires 80 Iron, 60 Lime, 40 Mortar, 100 Wood.",
    color: "bg-yellow-600 border border-neutral-100",
  },

  // Infrastructure & Utilities
  warehouse: {
    id: "warehouse",
    name: "Warehouse",
    category: "warehouse",
    width: 2,
    height: 2,
    baseCost: 800,
    baseIronCost: 25,
    baseLimestoneCost: 30,
    baseMortarCost: 10,
    baseWoodCost: 40,
    baseMaintenance: 2,
    description: "Global volume storage. Requires 25 Iron, 30 Lime, 10 Mortar, 40 Wood.",
    color: "bg-amber-800 border border-amber-600",
    baseCapacity: 1000,
  },
  logistics_company: {
    id: "logistics_company",
    name: "Goods Transport Company",
    category: "logistics",
    width: 2,
    height: 2,
    baseCost: 1200,
    baseIronCost: 40,
    baseLimestoneCost: 20,
    baseMortarCost: 15,
    baseWoodCost: 35,
    baseMaintenance: 10,
    description: "Speeds up shop sales. Requires 40 Iron, 20 Lime, 15 Mortar, 35 Wood.",
    color: "bg-purple-800 border border-purple-400",
  },
  travel_tourism: {
    id: "travel_tourism",
    name: "Tourism Office",
    category: "tourism",
    width: 2,
    height: 2,
    baseCost: 1000,
    baseIronCost: 20,
    baseLimestoneCost: 20,
    baseMortarCost: 10,
    baseWoodCost: 25,
    baseMaintenance: 6,
    description: "Boosts shop demand. Requires 20 Iron, 20 Lime, 10 Mortar, 25 Wood.",
    color: "bg-pink-700",
  },
  bank: {
    id: "bank",
    name: "Imperial Bank",
    category: "bank",
    width: 2,
    height: 2,
    baseCost: 2500,
    baseIronCost: 50,
    baseLimestoneCost: 50,
    baseMortarCost: 35,
    baseWoodCost: 45,
    baseMaintenance: 15,
    description: "Yields 5% bonus profit. Requires 50 Iron, 50 Lime, 35 Mortar, 45 Wood.",
    color: "bg-emerald-600 border border-yellow-400",
  },

  // Merged Large Company HQ Footprints
  clothing_company_hq: {
    id: "clothing_company_hq",
    name: "Clothing Company HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 45,
    description: "Automated fashion enterprise.",
    color: "bg-rose-900 border-4 border-yellow-500",
  },
  car_company_hq: {
    id: "car_company_hq",
    name: "Car Manufacturing Company HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 85,
    description: "Automated motor industry.",
    color: "bg-cyan-900 border-4 border-yellow-500",
  },
  construction_company_hq: {
    id: "construction_company_hq",
    name: "Construction Conglomerate HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 65,
    description: "Massive service contract revenues.",
    color: "bg-blue-900 border-4 border-yellow-500",
  },
  pharma_company_hq: {
    id: "pharma_company_hq",
    name: "Pharmaceutical Company HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 75,
    description: "Automated high-margin pharmaceuticals.",
    color: "bg-sky-900 border-4 border-yellow-500",
  },
  petroleum_company_hq: {
    id: "petroleum_company_hq",
    name: "Petroleum Corporation HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 95,
    description: "Pumping oil into energy sales.",
    color: "bg-zinc-900 border-4 border-yellow-500",
  },
  electricity_company_hq: {
    id: "electricity_company_hq",
    name: "Electricity Board HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 55,
    description: "Power generator selling electricity.",
    color: "bg-yellow-900 border-4 border-amber-400",
  },
  hotel_company_hq: {
    id: "hotel_company_hq",
    name: "Grand Hotel Resort Chain HQ",
    category: "hq",
    width: 4,
    height: 4,
    baseCost: 0,
    baseIronCost: 0,
    baseLimestoneCost: 0,
    baseMortarCost: 0,
    baseWoodCost: 0,
    baseMaintenance: 110,
    description: "Mass luxury tourism lodging.",
    color: "bg-fuchsia-950 border-4 border-yellow-500",
  },
};

// Merger Configuration
export interface MergerConfig {
  id: string;
  name: string;
  requirements: Record<string, { qty: number; minProgression?: number }>;
  hqBuildingType: string;
  description: string;
}

export const MERGERS_CONFIG: Record<string, MergerConfig> = {
  clothing_company: {
    id: "clothing_company",
    name: "Clothing Company Merger",
    requirements: {
      clothing_shop: { qty: 1, minProgression: 1 },
      small_factory: { qty: 1 },
      clothing_shop_showroom: { qty: 1, minProgression: 2 },
    },
    hqBuildingType: "clothing_company_hq",
    description: "Combine 1 Clothing Shop, 1 Small Factory, and 1 Clothing Showroom (Progression 2).",
  },
  car_company: {
    id: "car_company",
    name: "Car Manufacturing Company",
    requirements: {
      medium_factory: { qty: 1 },
      garage: { qty: 1, minProgression: 1 },
      garage_showroom: { qty: 1, minProgression: 2 },
    },
    hqBuildingType: "car_company_hq",
    description: "Merge 1 Medium Factory, 1 Auto Garage, and 1 Professional Garage Showroom.",
  },
  construction_company: {
    id: "construction_company",
    name: "Construction Company Merger",
    requirements: {
      interior_design_studio: { qty: 1 },
      architecture_firm: { qty: 1 },
    },
    hqBuildingType: "construction_company_hq",
    description: "Merge 1 Interior Design Studio and 1 Architecture Firm.",
  },
  pharma_company: {
    id: "pharma_company",
    name: "Pharmaceutical Company",
    requirements: {
      medical_shop: { qty: 1 },
      small_factory: { qty: 1 },
    },
    hqBuildingType: "pharma_company_hq",
    description: "Combine 1 Medical Shop and 1 Small Factory.",
  },
  petroleum_company: {
    id: "petroleum_company",
    name: "Petroleum Corporation",
    requirements: {
      oil_rig: { qty: 1 },
      medium_factory: { qty: 1 },
    },
    hqBuildingType: "petroleum_company_hq",
    description: "Combine 1 Oil Rig and 1 Refinery (Medium Factory).",
  },
  electricity_company: {
    id: "electricity_company",
    name: "Electricity Utility",
    requirements: {
      coal_extractor: { qty: 1 },
      small_factory: { qty: 1 },
    },
    hqBuildingType: "electricity_company_hq",
    description: "Combine 1 Coal Mine and 1 Power Station (Small Factory).",
  },
  hotel_company: {
    id: "hotel_company",
    name: "Hotel Chain Company",
    requirements: {
      hotel: { qty: 1 },
      travel_tourism: { qty: 1 },
    },
    hqBuildingType: "hotel_company_hq",
    description: "Merge 1 Resort Hotel and 1 Tourism Office.",
  },
};

// Logistics vehicles upgrades
export interface VehicleConfig {
  id: string;
  name: string;
  cost: number;
  deliverySpeedBonus: number;
  capacity: number;
  fuelEfficiency: number;
}

export const VEHICLE_CONFIGS: VehicleConfig[] = [
  { id: "pickup", name: "Pickup Truck", cost: 1000, deliverySpeedBonus: 0.1, capacity: 50, fuelEfficiency: 0.8 },
  { id: "delivery_van", name: "Delivery Van", cost: 2500, deliverySpeedBonus: 0.25, capacity: 150, fuelEfficiency: 0.85 },
  { id: "medium_truck", name: "Medium Delivery Truck", cost: 6000, deliverySpeedBonus: 0.45, capacity: 400, fuelEfficiency: 0.9 },
  { id: "heavy_truck", name: "Heavy Cargo Truck", cost: 12000, deliverySpeedBonus: 0.7, capacity: 1000, fuelEfficiency: 0.95 },
];
