import { GameState } from "../database/supabaseClient";

export interface AchievementTier {
  id: string; // e.g. "shop_built_tier1"
  difficulty: "bronze" | "silver" | "gold" | "diamond";
  name: string;
  description: string;
  metricType: 
    | "money_earned" 
    | "money_spent" 
    | "resource_produced" 
    | "resource_sold" 
    | "resource_imported" 
    | "buildings_built" 
    | "building_max_level"
    | "building_type_count"
    | "companies_merged" 
    | "trucks_owned" 
    | "play_time" 
    | "regions_unlocked" 
    | "industry_age" 
    | "self_sufficiency";
  metricDetail?: string; // e.g. "iron_ore", "furniture_shop", "logistics_hq"
  targetValue: number;
  rewardMoney: number;
  rewardGems: number;
  rewardIron?: number;
  rewardStone?: number;
  rewardMortar?: number;
  rewardWood?: number;
}

export interface AchievementGroup {
  id: string; // e.g. "earn_money"
  category: "business" | "extraction" | "manufacturing" | "economy" | "logistics" | "expansion" | "corporate" | "education";
  name: string;
  description: string;
  tiers: AchievementTier[];
}

export const ACHIEVEMENT_GROUPS: AchievementGroup[] = [
  // 🏢 BUSINESS CATEGORY
  {
    id: "shops_built",
    category: "business",
    name: "Shops Built",
    description: "Construct retail business shops on the grid.",
    tiers: [
      { id: "shop_built_1", difficulty: "bronze", name: "Entrepreneur Startup", description: "Build your first Shop", metricType: "buildings_built", targetValue: 1, rewardMoney: 500, rewardGems: 5 },
      { id: "shop_built_2", difficulty: "silver", name: "Chain Operations", description: "Own 10 active Businesses on the map", metricType: "building_max_level", targetValue: 10, rewardMoney: 5000, rewardGems: 15 }, // we map this as active business count
    ]
  },
  {
    id: "business_count",
    category: "business",
    name: "Business Expansion",
    description: "Expand your company holdings.",
    tiers: [
      { id: "bus_count_10", difficulty: "bronze", name: "Local Brand", description: "Own 10 active Businesses", metricType: "buildings_built", targetValue: 10, rewardMoney: 2000, rewardGems: 10 },
      { id: "bus_count_50", difficulty: "gold", name: "Corporate Empire", description: "Own 50 active Businesses", metricType: "buildings_built", targetValue: 50, rewardMoney: 25000, rewardGems: 50 },
    ]
  },
  {
    id: "shop_level",
    category: "business",
    name: "Building Heights",
    description: "Upgrade your businesses to higher structural levels.",
    tiers: [
      { id: "shop_level_10", difficulty: "bronze", name: "Local Legend", description: "Reach level 10 with any shop", metricType: "building_max_level", targetValue: 10, rewardMoney: 3000, rewardGems: 10 },
      { id: "shop_level_30", difficulty: "silver", name: "Megastructure", description: "Reach level 30 with any shop", metricType: "building_max_level", targetValue: 30, rewardMoney: 15000, rewardGems: 25 },
    ]
  },

  // ⛏ RESOURCE EXTRACTION CATEGORY
  {
    id: "extractor_built",
    category: "extraction",
    name: "Raw Mining",
    description: "Construct resource extractors.",
    tiers: [
      { id: "ext_built_1", difficulty: "bronze", name: "First Excavation", description: "Build your first Extractor Mine", metricType: "building_type_count", metricDetail: "lumber_mill", targetValue: 1, rewardMoney: 500, rewardGems: 5 }
    ]
  },
  {
    id: "produce_stone",
    category: "extraction",
    name: "Stone Quarrying",
    description: "Produce stone to fuel early-game construction.",
    tiers: [
      { id: "stone_prod_1000", difficulty: "bronze", name: "Pebble Collector", description: "Produce 1,000 Stone", metricType: "resource_produced", metricDetail: "stone", targetValue: 1000, rewardMoney: 1000, rewardGems: 5 },
      { id: "stone_prod_5000", difficulty: "silver", name: "Mason Apprentice", description: "Produce 5,000 Stone", metricType: "resource_produced", metricDetail: "stone", targetValue: 5000, rewardMoney: 4000, rewardGems: 10 }
    ]
  },
  {
    id: "produce_iron_ore",
    category: "extraction",
    name: "Iron Ore Smelting",
    description: "Extract iron ore deposits.",
    tiers: [
      { id: "iron_prod_5000", difficulty: "silver", name: "Iron Pioneer", description: "Produce 5,000 Iron Ore", metricType: "resource_produced", metricDetail: "iron_ore", targetValue: 5000, rewardMoney: 5000, rewardGems: 15 }
    ]
  },
  {
    id: "produce_wood",
    category: "extraction",
    name: "Wood Production",
    description: "Harvest wood from Forest nodes.",
    tiers: [
      { id: "wood_prod_10000", difficulty: "gold", name: "Timber Baron", description: "Produce 10,000 Wood", metricType: "resource_produced", metricDetail: "wood", targetValue: 10000, rewardMoney: 12000, rewardGems: 25 }
    ]
  },
  {
    id: "produce_coal",
    category: "extraction",
    name: "Coal Shaft Mining",
    description: "Extract coal from deposits.",
    tiers: [
      { id: "coal_prod_1000", difficulty: "bronze", name: "Fossil Fueler", description: "Produce 1,000 Coal", metricType: "resource_produced", metricDetail: "coal", targetValue: 1000, rewardMoney: 2000, rewardGems: 10 }
    ]
  },
  {
    id: "produce_oil",
    category: "extraction",
    name: "Black Gold",
    description: "Pump crude oil from Oil Fields.",
    tiers: [
      { id: "oil_prod_1000", difficulty: "bronze", name: "Oil Magnate Starter", description: "Produce 1,000 Oil", metricType: "resource_produced", metricDetail: "oil", targetValue: 1000, rewardMoney: 3000, rewardGems: 10 }
    ]
  },

  // 🏭 MANUFACTURING CATEGORY
  {
    id: "factory_built",
    category: "manufacturing",
    name: "Industrialist",
    description: "Establish manufacturing factories.",
    tiers: [
      { id: "fact_built_1", difficulty: "bronze", name: "Smokestack Rising", description: "Build your first Factory", metricType: "building_type_count", metricDetail: "factory", targetValue: 1, rewardMoney: 1000, rewardGems: 10 }
    ]
  },
  {
    id: "produce_furniture",
    category: "manufacturing",
    name: "Fine Carpentry",
    description: "Manufacture furniture products.",
    tiers: [
      { id: "furn_prod_1", difficulty: "bronze", name: "First Bench", description: "Produce your first Furniture product", metricType: "resource_produced", metricDetail: "furniture", targetValue: 1, rewardMoney: 500, rewardGems: 5 }
    ]
  },
  {
    id: "produce_clothes",
    category: "manufacturing",
    name: "High Fashion",
    description: "Manufacture clothes products.",
    tiers: [
      { id: "cloth_prod_1", difficulty: "bronze", name: "First Seam", description: "Produce your first Clothes product", metricType: "resource_produced", metricDetail: "clothes", targetValue: 1, rewardMoney: 500, rewardGems: 5 }
    ]
  },
  {
    id: "produce_steel",
    category: "manufacturing",
    name: "Heavy Alloys",
    description: "Produce steel in smelters.",
    tiers: [
      { id: "steel_prod_1", difficulty: "bronze", name: "Steel Tempered", description: "Manufacture your first Steel", metricType: "resource_produced", metricDetail: "steel", targetValue: 1, rewardMoney: 800, rewardGems: 8 }
    ]
  },

  // 💰 ECONOMY CATEGORY
  {
    id: "earn_money",
    category: "economy",
    name: "Capital Accumulator",
    description: "Earn total money from retail sales and services.",
    tiers: [
      { id: "earn_10k", difficulty: "bronze", name: "Thrifty Citizen", description: "Earn ₹10,000", metricType: "money_earned", targetValue: 10000, rewardMoney: 1000, rewardGems: 5, rewardIron: 10, rewardStone: 15, rewardMortar: 5, rewardWood: 15 },
      { id: "earn_100k", difficulty: "silver", name: "Rising Manager", description: "Earn ₹100,000", metricType: "money_earned", targetValue: 100000, rewardMoney: 5000, rewardGems: 15, rewardIron: 40, rewardStone: 60, rewardMortar: 20, rewardWood: 60 },
      { id: "earn_1m", difficulty: "gold", name: "Lakhpati Venture", description: "Earn ₹1,000,000 (10 Lakhs)", metricType: "money_earned", targetValue: 1000000, rewardMoney: 20000, rewardGems: 50, rewardIron: 150, rewardStone: 200, rewardMortar: 80, rewardWood: 200 },
      { id: "earn_10m", difficulty: "diamond", name: "Crorepati Empire", description: "Earn ₹10,000,000 (1 Crore)", metricType: "money_earned", targetValue: 10000000, rewardMoney: 100000, rewardGems: 200, rewardIron: 800, rewardStone: 1000, rewardMortar: 400, rewardWood: 1000 },
    ]
  },
  {
    id: "spend_money",
    category: "economy",
    name: "Capital Reinvestment",
    description: "Spend money upgrading your regional infrastructure.",
    tiers: [
      { id: "spend_50k", difficulty: "bronze", name: "Active Capitalist", description: "Spend ₹50,000", metricType: "money_spent", targetValue: 50000, rewardMoney: 2500, rewardGems: 10 },
      { id: "spend_500k", difficulty: "silver", name: "Infrastructure Investor", description: "Spend ₹500,000", metricType: "money_spent", targetValue: 500000, rewardMoney: 15000, rewardGems: 30 },
      { id: "spend_5m", difficulty: "gold", name: "Mega Spendthrift", description: "Spend ₹5,000,000", metricType: "money_spent", targetValue: 5000000, rewardMoney: 50000, rewardGems: 100 },
    ]
  },

  // 🚛 LOGISTICS CATEGORY
  {
    id: "truck_bought",
    category: "logistics",
    name: "Fleet Management",
    description: "Purchase logistical trucks.",
    tiers: [
      { id: "truck_bought_1", difficulty: "bronze", name: "First Delivery", description: "Purchase your first logistical fleet Truck", metricType: "trucks_owned", targetValue: 1, rewardMoney: 500, rewardGems: 5 }
    ]
  },
  {
    id: "logistics_hq_upgrade",
    category: "logistics",
    name: "Logistics Tower",
    description: "Upgrade the level of your Logistics HQ.",
    tiers: [
      { id: "log_hq_lvl_2", difficulty: "bronze", name: "Operations Coordinator", description: "Upgrade Logistics HQ to level 2", metricType: "building_max_level", metricDetail: "logistics_hq", targetValue: 2, rewardMoney: 1500, rewardGems: 10 }
    ]
  },

  // 🌍 EXPANSION CATEGORY
  {
    id: "regions_unlocked",
    category: "expansion",
    name: "Land Acquisition",
    description: "Unlock additional land regions.",
    tiers: [
      { id: "region_unlock_2", difficulty: "bronze", name: "Border Expansion", description: "Unlock a second region tile", metricType: "regions_unlocked", targetValue: 2, rewardMoney: 5000, rewardGems: 15 },
      { id: "region_unlock_5", difficulty: "silver", name: "Provincial Governor", description: "Unlock 5 total region tiles", metricType: "regions_unlocked", targetValue: 5, rewardMoney: 25000, rewardGems: 50 },
    ]
  },

  // 🤝 CORPORATE CATEGORY
  {
    id: "companies_merged",
    category: "corporate",
    name: "Boardroom Restructuring",
    description: "Merge adjacent buildings into Large Companies HQs.",
    tiers: [
      { id: "merge_1", difficulty: "bronze", name: "Boardroom Merger", description: "Merge your first Corporate HQ", metricType: "companies_merged", targetValue: 1, rewardMoney: 2000, rewardGems: 10 }
    ]
  },

  // 📚 EDUCATION CATEGORY
  {
    id: "self_sufficient_wood",
    category: "education",
    name: "Self-Sufficient Timber",
    description: "Become self-sufficient in Wood by producing it without imports.",
    tiers: [
      { id: "self_wood", difficulty: "silver", name: "Forest Steward", description: "Produce at least 500 Wood while maintaining 0 imports of it", metricType: "self_sufficiency", metricDetail: "wood", targetValue: 500, rewardMoney: 3000, rewardGems: 15 }
    ]
  },
  {
    id: "self_sufficient_food",
    category: "education",
    name: "Self-Sufficient Farming",
    description: "Become self-sufficient in Food Crops.",
    tiers: [
      { id: "self_food", difficulty: "silver", name: "Sovereign Harvest", description: "Produce at least 500 Crops while maintaining 0 imports of it", metricType: "self_sufficiency", metricDetail: "crops", targetValue: 500, rewardMoney: 3000, rewardGems: 15 }
    ]
  }
];

// Helper to evaluate achievement progress dynamically based on GameState
export function evaluateAchievement(tier: AchievementTier, state: GameState): { current: number; target: number; isCompleted: boolean } {
  const stats = state.stats || {
    totalMoneyEarned: 0,
    totalMoneySpent: 0,
    resourcesProduced: {} as Record<string, number>,
    resourcesSold: {} as Record<string, number>,
    resourcesImported: {} as Record<string, number>,
    totalBuildingsConstructed: 0,
    totalCompaniesMerged: 0,
    totalTrucksPurchased: 0,
    totalPlayTimeSeconds: 0,
    totalConstructionTimeSaved: 0,
    totalSkillPointsSpent: 0,
    totalMovedResources: 0
  };

  let current = 0;
  const target = tier.targetValue;

  switch (tier.metricType) {
    case "money_earned":
      current = stats.totalMoneyEarned;
      break;
    case "money_spent":
      current = stats.totalMoneySpent;
      break;
    case "resource_produced":
      if (tier.metricDetail) {
        current = stats.resourcesProduced[tier.metricDetail] || 0;
      }
      break;
    case "resource_sold":
      if (tier.metricDetail) {
        current = stats.resourcesSold[tier.metricDetail] || 0;
      }
      break;
    case "resource_imported":
      if (tier.metricDetail) {
        current = stats.resourcesImported[tier.metricDetail] || 0;
      }
      break;
    case "buildings_built":
      current = stats.totalBuildingsConstructed || state.buildings.length;
      break;
    case "building_max_level":
      if (tier.metricDetail) {
        const filtered = state.buildings.filter(b => b.type === tier.metricDetail);
        current = filtered.length > 0 ? Math.max(...filtered.map(b => b.level)) : 0;
      } else {
        current = state.buildings.length > 0 ? Math.max(...state.buildings.map(b => b.level)) : 0;
      }
      break;
    case "building_type_count":
      if (tier.metricDetail) {
        current = state.buildings.filter(b => b.type === tier.metricDetail).length;
      } else {
        current = state.buildings.length;
      }
      break;
    case "companies_merged":
      current = stats.totalCompaniesMerged || state.companies.length;
      break;
    case "trucks_owned":
      current = state.vehicles.length;
      break;
    case "play_time":
      current = stats.totalPlayTimeSeconds;
      break;
    case "regions_unlocked":
      current = state.unlocked_land;
      break;
    case "self_sufficiency":
      if (tier.metricDetail) {
        const produced = stats.resourcesProduced[tier.metricDetail] || 0;
        const imported = stats.resourcesImported[tier.metricDetail] || 0;
        if (imported === 0 && produced >= target) {
          current = target;
        } else {
          current = produced;
        }
      }
      break;
    default:
      current = 0;
  }

  return {
    current,
    target,
    isCompleted: current >= target
  };
}
