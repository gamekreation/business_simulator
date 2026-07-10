// Centralized Construction Economy Configurations
// Every constructible building references this configuration for material costs.

export interface EconomyCost {
  money: number;
  stone: number;
  wood: number;
  iron: number;
  mortar: number;
}

export const CONSTRUCTION_ECONOMY_CONFIG: Record<string, EconomyCost> = {
  // Foundation Age extractors
  stone_quarry: { money: 1500, stone: 20, wood: 40, iron: 15, mortar: 0 },
  iron_mine: { money: 2000, stone: 25, wood: 45, iron: 20, mortar: 0 },
  lumber_mill: { money: 1800, stone: 20, wood: 20, iron: 15, mortar: 0 },
  agricultural_farm: { money: 1500, stone: 15, wood: 35, iron: 10, mortar: 0 },

  // Foundation Age retail
  food_shop: { money: 2500, stone: 20, wood: 35, iron: 20, mortar: 15 },
  grocery_shop: { money: 2500, stone: 20, wood: 35, iron: 20, mortar: 15 },
  clothing_shop: { money: 3000, stone: 25, wood: 40, iron: 25, mortar: 20 },
  furniture_shop: { money: 3500, stone: 30, wood: 50, iron: 30, mortar: 20 },
  medical_shop: { money: 4500, stone: 35, wood: 45, iron: 35, mortar: 25 },
  electronics_shop: { money: 5000, stone: 40, wood: 50, iron: 40, mortar: 30 },

  // Foundation Age services
  interior_design_studio: { money: 5000, stone: 40, wood: 50, iron: 35, mortar: 30 },
  architecture_firm: { money: 7000, stone: 50, wood: 55, iron: 45, mortar: 40 },
  consulting_firm: { money: 8000, stone: 50, wood: 50, iron: 45, mortar: 40 },
  garage: { money: 6000, stone: 45, wood: 45, iron: 50, mortar: 35 },

  // Industrial Age
  coal_extractor: { money: 8000, stone: 50, wood: 70, iron: 60, mortar: 50 },
  quarry: { money: 8000, stone: 50, wood: 70, iron: 60, mortar: 50 }, // Limestone quarry
  oil_rig: { money: 15000, stone: 80, wood: 90, iron: 120, mortar: 80 },
  small_factory: { money: 10000, stone: 70, wood: 80, iron: 80, mortar: 60 },
  medium_factory: { money: 35000, stone: 150, wood: 180, iron: 200, mortar: 160 },

  // Technology Age
  copper_mine: { money: 25000, stone: 120, wood: 120, iron: 180, mortar: 120 },
  silicon_mine: { money: 30000, stone: 130, wood: 130, iron: 200, mortar: 140 },
  large_factory: { money: 100000, stone: 300, wood: 350, iron: 450, mortar: 300 },

  // Nuclear Age
  uranium_mine: { money: 250000, stone: 500, wood: 300, iron: 700, mortar: 500 },
  nuclear_plant: { money: 1000000, stone: 1500, wood: 800, iron: 2000, mortar: 1500 },

  // Corporate HQs (Merged companies)
  clothing_company_hq: { money: 100000, stone: 250, wood: 250, iron: 250, mortar: 200 },
  furniture_company_hq: { money: 120000, stone: 280, wood: 280, iron: 280, mortar: 220 },
  construction_company_hq: { money: 150000, stone: 350, wood: 300, iron: 350, mortar: 300 },
  petroleum_company_hq: { money: 300000, stone: 500, wood: 400, iron: 700, mortar: 500 },
  car_company_hq: { money: 500000, stone: 700, wood: 500, iron: 900, mortar: 700 },
  pharma_company_hq: { money: 350000, stone: 450, wood: 350, iron: 600, mortar: 450 },
  electricity_company_hq: { money: 600000, stone: 700, wood: 500, iron: 900, mortar: 700 },
  hotel_company_hq: { money: 400000, stone: 600, wood: 600, iron: 500, mortar: 500 },
};

// Core Regional Infrastructure - free in tutorial, upgraded later
export const INFRASTRUCTURE_UPGRADE_COSTS: Record<string, EconomyCost[]> = {
  town_hall: [
    { money: 0, stone: 0, wood: 0, iron: 0, mortar: 0 }, // Level 1 (Free)
    { money: 12000, stone: 100, wood: 100, iron: 80, mortar: 60 }, // Level 2
    { money: 35000, stone: 250, wood: 250, iron: 200, mortar: 150 }, // Level 3
  ],
  warehouse: [
    { money: 0, stone: 0, wood: 0, iron: 0, mortar: 0 },
    { money: 15000, stone: 120, wood: 120, iron: 100, mortar: 80 },
    { money: 40000, stone: 300, wood: 300, iron: 250, mortar: 200 },
  ],
  import_hq: [
    { money: 0, stone: 0, wood: 0, iron: 0, mortar: 0 },
    { money: 18050, stone: 150, wood: 150, iron: 120, mortar: 100 },
    { money: 50000, stone: 400, wood: 400, iron: 300, mortar: 250 },
  ],
  logistics_hq: [
    { money: 0, stone: 0, wood: 0, iron: 0, mortar: 0 },
    { money: 10000, stone: 80, wood: 80, iron: 60, mortar: 50 },
    { money: 30000, stone: 200, wood: 200, iron: 150, mortar: 120 },
  ],
  builder_company: [
    { money: 0, stone: 0, wood: 0, iron: 0, mortar: 0 },
    { money: 8000, stone: 60, wood: 60, iron: 50, mortar: 40 },
    { money: 25000, stone: 150, wood: 150, iron: 120, mortar: 90 },
  ],
};
