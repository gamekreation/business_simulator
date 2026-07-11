import { BUILDING_CONFIGS } from "./buildingConfig";

export interface UpgradeCost {
  money: number;
  iron: number;
  stone: number;
  mortar: number;
  wood: number;
  durationInDays: number;
}

/**
 * Calculates building upgrade cost dynamically based on original construction stats
 * - Money: 35%, 45%, 55%, 65% for L2, L3, L4, L5
 * - Resources: 25%, 30%, 35%, 40% for L2, L3, L4, L5
 * - Extrapolates higher levels systematically
 */
export function getBuildingUpgradeCost(buildingType: string, currentLevel: number): UpgradeCost {
  const config = BUILDING_CONFIGS[buildingType];
  if (!config) {
    return { money: 0, iron: 0, stone: 0, mortar: 0, wood: 0, durationInDays: 1 };
  }

  const nextLevel = currentLevel + 1;
  let moneyMult = 0.35;
  let resourceMult = 0.25;

  if (nextLevel === 2) {
    moneyMult = 0.35;
    resourceMult = 0.25;
  } else if (nextLevel === 3) {
    moneyMult = 0.45;
    resourceMult = 0.30;
  } else if (nextLevel === 4) {
    moneyMult = 0.55;
    resourceMult = 0.35;
  } else if (nextLevel === 5) {
    moneyMult = 0.65;
    resourceMult = 0.40;
  } else {
    // Extrapolate for levels >= 6
    moneyMult = 0.65 + 0.10 * (nextLevel - 5);
    resourceMult = 0.40 + 0.05 * (nextLevel - 5);
  }

  const baseCost = config.baseCost || 0;
  const baseIron = config.baseIronCost || 0;
  const baseStone = config.baseStoneCost || 0;
  const baseMortar = config.baseMortarCost || 0;
  const baseWood = config.baseWoodCost || 0;

  // Base construction days
  const baseBuildDays = (() => {
    if (config.category === "extractor") return 2;
    if (config.category === "factory") return 7;
    if (config.category === "retail") return 2;
    if (buildingType === "warehouse") return 3;
    if (config.category === "service") return 3;
    return 4;
  })();

  // Upgrades take roughly 50% of the base build duration * current level factor
  const durationInDays = Math.max(1, Math.round(baseBuildDays * 0.5 * currentLevel));

  return {
    money: Math.floor(baseCost * moneyMult),
    iron: Math.floor(baseIron * resourceMult),
    stone: Math.floor(baseStone * resourceMult),
    mortar: Math.floor(baseMortar * resourceMult),
    wood: Math.floor(baseWood * resourceMult),
    durationInDays
  };
}
