"use client";

import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  TrendingUp, 
  DollarSign, 
  Warehouse as WarehouseIcon, 
  Store, 
  Layers, 
  Trash2, 
  ArrowUpRight, 
  Plus, 
  Grid3X3,
  Award,
  Zap,
  Info,
  Maximize2,
  Database,
  CloudLightning,
  RefreshCw,
  X,
  Truck,
  Building,
  Compass,
  ArrowRight,
  TrendingDown,
  Hammer,
  Mountain,
  TreePine
} from "lucide-react";
import { 
  BUILDING_CONFIGS, 
  BuildingConfig, 
  RESOURCES_CONFIG, 
  FACTORY_RECIPES, 
  MERGERS_CONFIG, 
  VEHICLE_CONFIGS 
} from "../buildings/buildingConfig";
import { DEPARTMENTS_BY_CATEGORY } from "../buildings/departmentConfig";
import { runSimulationTick, TickResult } from "../simulation/simulationEngine";
import { GameState, saveGame, loadGame, isSupabaseConfigured } from "../database/supabaseClient";

const LOCAL_SAVE_ID = "proto_player_v0_2";

// Helper to pre-populate fixed natural resource nodes on the 10x10 grid
const DEFAULT_DEPOSIT_NODES = [
  { x: 1, y: 1, type: "iron_deposit" },
  { x: 2, y: 1, type: "iron_deposit" },
  { x: 8, y: 2, type: "coal_deposit" },
  { x: 8, y: 3, type: "coal_deposit" },
  { x: 4, y: 5, type: "fertile_land" },
  { x: 5, y: 5, type: "fertile_land" },
  { x: 1, y: 7, type: "limestone_deposit" },
  { x: 2, y: 8, type: "limestone_deposit" },
  { x: 7, y: 8, type: "oil_field" },
  { x: 8, y: 8, type: "oil_field" },
  { x: 4, y: 2, type: "forest" },
  { x: 5, y: 2, type: "forest" },
] as const;

export default function BusinessEmpireGame() {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    id: LOCAL_SAVE_ID,
    money: 6000,
    resources: {
      iron_ore: 100,
      limestone: 100,
      mortar: 100,
      wood: 100,
      cotton: 20,
    },
    buildings: [],
    companies: [],
    skills: {
      production: 0,
      marketing: 0,
      finance: 0,
    },
    unlocked_land: 100,
    depositNodes: [...DEFAULT_DEPOSIT_NODES],
    vehicles: [],
  });

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"map" | "logistics" | "mergers" | "skills" | "dashboard">("map");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  
  // Placement State
  const [placingType, setPlacingType] = useState<string | null>(null);
  const [movingBuildingId, setMovingBuildingId] = useState<string | null>(null);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [mergerQualityScore, setMergerQualityScore] = useState<number | null>(null);
  const [pendingFactoryPlacementId, setPendingFactoryPlacementId] = useState<string | null>(null);
  
  // Simulation Ticker Statistics
  const [lastTickStats, setLastTickStats] = useState<{
    revenue: number;
    expenses: number;
    profit: number;
    logs: string[];
  }>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    logs: [],
  });

  // Saving Notification
  const [saveStatus, setSaveStatus] = useState<string>("Synced locally");
  const [autoSaveTimer, setAutoSaveTimer] = useState<number>(30);

  // --- Load Game on Mount ---
  useEffect(() => {
    async function initLoad() {
      const saved = await loadGame(LOCAL_SAVE_ID);
      if (saved) {
        // Ensure new V0.2 fields exist
        if (!saved.depositNodes || saved.depositNodes.length === 0) {
          saved.depositNodes = [...DEFAULT_DEPOSIT_NODES];
        }
        if (!saved.vehicles) {
          saved.vehicles = [];
        }
        // Save-healing: Give bootstrap materials to existing saves to prevent deadlock
        if (!saved.resources) {
          saved.resources = {};
        }
        saved.resources.iron_ore = Math.max(saved.resources.iron_ore || 0, 100);
        saved.resources.limestone = Math.max(saved.resources.limestone || 0, 100);
        saved.resources.mortar = Math.max(saved.resources.mortar || 0, 100);
        saved.resources.wood = Math.max(saved.resources.wood || 0, 100);
        saved.resources.cotton = Math.max(saved.resources.cotton || 0, 20);

        setGameState(saved);
        setSaveStatus(isSupabaseConfigured ? "Loaded from Cloud" : "Loaded from local storage");
      } else {
        setSaveStatus("New V0.2 Game Started");
      }
    }
    initLoad();
  }, []);

  // --- Game loop tick (1 second) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        const result = runSimulationTick(prev);
        setLastTickStats({
          revenue: result.revenueThisTick,
          expenses: result.expensesThisTick,
          profit: result.profitThisTick,
          logs: result.logs,
        });
        return result.nextState;
      });

      setAutoSaveTimer(prev => {
        if (prev <= 1) {
          triggerSave();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Handle explicit or auto saving
  const triggerSave = async (stateToSave = gameState) => {
    setSaveStatus("Saving...");
    const ok = await saveGame(stateToSave);
    if (ok) {
      setSaveStatus(isSupabaseConfigured ? "Cloud Saved" : "Local Backup Saved");
    } else {
      setSaveStatus("Save failed");
    }
    setTimeout(() => {
      setSaveStatus(isSupabaseConfigured ? "Cloud Synced" : "Synced locally");
    }, 3000);
  };

  const handleResetGame = async () => {
    if (window.confirm("Are you sure you want to completely reset your game progress? All V0.2 infrastructure will be wiped.")) {
      const resetState: GameState = {
        id: LOCAL_SAVE_ID,
        money: 6000,
        resources: {
          iron_ore: 100,
          limestone: 100,
          mortar: 100,
          wood: 100,
          cotton: 20,
        },
        buildings: [],
        companies: [],
        skills: {
          production: 0,
          marketing: 0,
          finance: 0,
        },
        unlocked_land: 100,
        depositNodes: [...DEFAULT_DEPOSIT_NODES],
        vehicles: [],
      };
      setGameState(resetState);
      localStorage.removeItem("business_empire_save");
      await triggerSave(resetState);
      setSaveStatus("Reset Successful");
    }
  };

  // --- Helpers for Grid Math ---
  const gridSize = 10;

  // Check if building fits, doesn't overlap, and matches deposit nodes for extractors
  const canPlaceBuilding = (
    type: string, 
    x: number, 
    y: number, 
    excludeId: string | null = null
  ): boolean => {
    const config = BUILDING_CONFIGS[type];
    if (!config) return false;

    // 1. Boundary check
    if (x < 0 || y < 0 || x + config.width > gridSize || y + config.height > gridSize) {
      return false;
    }

    // 2. Deposit Node requirements for Extractors
    if (config.category === "extractor" && config.requiredDepositNode) {
      let nodeMatch = false;
      for (let dy = 0; dy < config.height; dy++) {
        for (let dx = 0; dx < config.width; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          if (gameState.depositNodes.some(n => n.x === checkX && n.y === checkY && n.type === config.requiredDepositNode)) {
            nodeMatch = true;
            break;
          }
        }
        if (nodeMatch) break;
      }
      if (!nodeMatch) return false; // Must cover at least one deposit tile of matching type
    }

    // 3. Overlap check with other buildings
    for (const b of gameState.buildings) {
      if (excludeId && b.id === excludeId) continue;
      const bConfig = BUILDING_CONFIGS[b.type];
      if (!bConfig) continue;

      const overlapX = x < b.x + bConfig.width && x + config.width > b.x;
      const overlapY = y < b.y + bConfig.height && y + config.height > b.y;
      if (overlapX && overlapY) {
        return false;
      }
    }

    // 4. Overlap check with merged company HQs
    for (const c of gameState.companies) {
      if (excludeId && c.id === excludeId) continue;
      const cConfig = BUILDING_CONFIGS[c.type];
      if (!cConfig) continue;

      const overlapX = x < c.x + cConfig.width && x + config.width > c.x;
      const overlapY = y < c.y + cConfig.height && y + config.height > c.y;
      if (overlapX && overlapY) {
        return false;
      }
    }

    return true;
  };

  // Place or move on Grid
  const handleGridClick = (x: number, y: number) => {
    if (movingBuildingId) {
      const b = gameState.buildings.find(item => item.id === movingBuildingId);
      if (b && canPlaceBuilding(b.type, x, y, b.id)) {
        setGameState(prev => {
          return {
            ...prev,
            buildings: prev.buildings.map(item => 
              item.id === movingBuildingId ? { ...item, x, y } : item
            )
          };
        });
        setMovingBuildingId(null);
        setPlacingType(null);
      }
      return;
    }

    if (placingType) {
      const config = BUILDING_CONFIGS[placingType];
      if (!config) return;

      // Merged HQs placement (costs $0 during placement phase after merge click)
      if (config.category === "hq") {
        if (canPlaceBuilding(placingType, x, y)) {
          const generatedId = `company-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          setGameState(prev => {
            if (prev.companies.some(c => c.id === generatedId)) return prev;
            return {
              ...prev,
              companies: [
                ...prev.companies,
                {
                  id: generatedId,
                  type: placingType,
                  x,
                  y,
                  level: 1,
                  revenue: 0,
                  profit: 0,
                  skills: {
                    production: 0,
                    marketing: 0,
                    finance: 0,
                  },
                  qualityScore: mergerQualityScore !== null ? mergerQualityScore : 50
                }
              ]
            };
          });
          setPlacingType(null);
          setMergerQualityScore(null);
        }
        return;
      }

      // Normal constructible buildings costing resources
      const hasResources = 
        gameState.money >= config.baseCost &&
        (gameState.resources.iron_ore || 0) >= (config.baseIronCost || 0) &&
        (gameState.resources.limestone || 0) >= (config.baseLimestoneCost || 0) &&
        (gameState.resources.mortar || 0) >= (config.baseMortarCost || 0) &&
        (gameState.resources.wood || 0) >= (config.baseWoodCost || 0);

      if (hasResources && canPlaceBuilding(placingType, x, y)) {
        const generatedId = `build-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setGameState(prev => {
          if (prev.buildings.some(b => b.id === generatedId)) return prev;

          const updatedResources = { ...prev.resources };
          updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - (config.baseIronCost || 0));
          updatedResources.limestone = Math.max(0, (updatedResources.limestone || 0) - (config.baseLimestoneCost || 0));
          updatedResources.mortar = Math.max(0, (updatedResources.mortar || 0) - (config.baseMortarCost || 0));
          updatedResources.wood = Math.max(0, (updatedResources.wood || 0) - (config.baseWoodCost || 0));

          return {
            ...prev,
            money: prev.money - config.baseCost,
            resources: updatedResources,
            buildings: [
              ...prev.buildings,
              {
                id: generatedId,
                type: placingType,
                x,
                y,
                level: 1,
                progressionLevel: 1, // Default Shop/Office
                recipeId: placingType.includes("factory") ? "" : undefined,
              }
            ]
          };
        });
        if (placingType.includes("factory")) {
          setPendingFactoryPlacementId(generatedId);
        }
        setPlacingType(null);
      }
      return;
    }

    // Selection checking
    const clickedBuilding = gameState.buildings.find(b => {
      const config = BUILDING_CONFIGS[b.type];
      return config && x >= b.x && x < b.x + config.width && y >= b.y && y < b.y + config.height;
    });

    if (clickedBuilding) {
      setSelectedBuildingId(clickedBuilding.id);
      return;
    }

    const clickedCompany = gameState.companies.find(c => {
      const config = BUILDING_CONFIGS[c.type];
      return config && x >= c.x && x < c.x + config.width && y >= c.y && y < c.y + config.height;
    });

    if (clickedCompany) {
      setSelectedBuildingId(clickedCompany.id);
      return;
    }

    setSelectedBuildingId(null);
  };

  const handleDemolish = (id: string) => {
    const b = gameState.buildings.find(item => item.id === id);
    if (!b) return;
    const config = BUILDING_CONFIGS[b.type];
    if (!config) return;

    const refund = Math.floor(config.baseCost * 0.5);
    setGameState(prev => {
      return {
        ...prev,
        money: prev.money + refund,
        buildings: prev.buildings.filter(item => item.id !== id)
      };
    });
    setSelectedBuildingId(null);
  };

  const handleUpgradeBuilding = (id: string) => {
    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === id);
      if (!b) return prev;
      const config = BUILDING_CONFIGS[b.type];
      const moneyCost = Math.floor(config.baseCost * Math.pow(1.6, b.level));
      const ironCost = Math.floor((config.baseIronCost || 0) * Math.pow(1.4, b.level));
      const limeCost = Math.floor((config.baseLimestoneCost || 0) * Math.pow(1.4, b.level));
      const mortarCost = Math.floor((config.baseMortarCost || 0) * Math.pow(1.4, b.level));
      const woodCost = Math.floor((config.baseWoodCost || 0) * Math.pow(1.4, b.level));

      const hasResources = 
        prev.money >= moneyCost &&
        (prev.resources.iron_ore || 0) >= ironCost &&
        (prev.resources.limestone || 0) >= limeCost &&
        (prev.resources.mortar || 0) >= mortarCost &&
        (prev.resources.wood || 0) >= woodCost;

      if (hasResources) {
        const updatedResources = { ...prev.resources };
        updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - ironCost);
        updatedResources.limestone = Math.max(0, (updatedResources.limestone || 0) - limeCost);
        updatedResources.mortar = Math.max(0, (updatedResources.mortar || 0) - mortarCost);
        updatedResources.wood = Math.max(0, (updatedResources.wood || 0) - woodCost);

        return {
          ...prev,
          money: prev.money - moneyCost,
          resources: updatedResources,
          buildings: prev.buildings.map(item => 
            item.id === id ? { ...item, level: item.level + 1 } : item
          )
        };
      }
      return prev;
    });
  };

  // Progression: Retail Shop -> Showroom -> Dealership, Office -> Professional Firm -> Corporate Office
  const handleProgressTier = (id: string) => {
    // Check constraints before making modifications
    const targetB = gameState.buildings.find(item => item.id === id);
    if (!targetB) return;
    const config = BUILDING_CONFIGS[targetB.type];
    if (!config) return;

    const currentTier = targetB.progressionLevel || 1;
    if (currentTier >= 3) return;

    // V0.4 Progression constraints
    const configCategory = config.category;
    let expansionDeptId = "";
    if (configCategory === "extractor") expansionDeptId = "capacity";
    else if (configCategory === "factory") expansionDeptId = "silo";
    else if (configCategory === "retail") expansionDeptId = "expansion";
    else if (configCategory === "service") expansionDeptId = "relations";

    const expansionLvl = targetB.departments?.[expansionDeptId] || 0;

    if (currentTier === 1) {
      if (targetB.level < 10) {
        alert("Progression Blocked: Building must reach Level 10 first.");
        return;
      }
      if (expansionLvl < 3) {
        alert("Progression Blocked: Requires Capacity / Store Expansion Department Level 3.");
        return;
      }
    } else if (currentTier === 2) {
      if (targetB.level < 25) {
        alert("Progression Blocked: Building must reach Level 25 first.");
        return;
      }
      if (expansionLvl < 5) {
        alert("Progression Blocked: Requires Capacity / Store Expansion Department Level 5.");
        return;
      }
    }

    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === id);
      if (!b) return prev;

      const moneyCost = currentTier === 1 ? 1200 : 3500;
      const ironCost = currentTier === 1 ? 30 : 80;
      const limeCost = currentTier === 1 ? 30 : 80;
      const mortarCost = currentTier === 1 ? 15 : 45;
      const woodCost = currentTier === 1 ? 40 : 100;

      const hasResources = 
        prev.money >= moneyCost &&
        (prev.resources.iron_ore || 0) >= ironCost &&
        (prev.resources.limestone || 0) >= limeCost &&
        (prev.resources.mortar || 0) >= mortarCost &&
        (prev.resources.wood || 0) >= woodCost;

      if (hasResources) {
        const updatedResources = { ...prev.resources };
        updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - ironCost);
        updatedResources.limestone = Math.max(0, (updatedResources.limestone || 0) - limeCost);
        updatedResources.mortar = Math.max(0, (updatedResources.mortar || 0) - mortarCost);
        updatedResources.wood = Math.max(0, (updatedResources.wood || 0) - woodCost);

        return {
          ...prev,
          money: prev.money - moneyCost,
          resources: updatedResources,
          buildings: prev.buildings.map(item => 
            item.id === id ? { ...item, progressionLevel: currentTier + 1 } : item
          )
        };
      }
      return prev;
    });
  };

  // Select Manufacturing Recipe
  const handleSelectRecipe = (id: string, recipeId: string) => {
    setGameState(prev => {
      return {
        ...prev,
        buildings: prev.buildings.map(b => 
          b.id === id ? { ...b, recipeId } : b
        )
      };
    });
  };

  // V0.3 Select Farm Crop Cycle
  const handleSelectFarmCrop = (id: string, cropType: "food" | "cotton") => {
    setGameState(prev => {
      return {
        ...prev,
        buildings: prev.buildings.map(b => 
          b.id === id ? { ...b, cropCycleSelected: cropType, cropCycleProgress: 0 } : b
        )
      };
    });
  };

  // V0.3 Repair Building
  const handleRepairBuilding = (id: string) => {
    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === id);
      if (!b) return prev;
      const config = BUILDING_CONFIGS[b.type];
      if (!config) return prev;

      const currentIntegrity = b.integrity !== undefined ? b.integrity : 100;
      const repairCost = Math.max(10, Math.floor(config.baseCost * 0.15 * (1 - currentIntegrity / 100)));

      if (prev.money >= repairCost) {
        return {
          ...prev,
          money: prev.money - repairCost,
          buildings: prev.buildings.map(item => 
            item.id === id ? { ...item, integrity: 100 } : item
          )
        };
      }
      return prev;
    });
  };

  // V0.3 Dispatch Shipment
  const handleDispatchShipment = (id: string) => {
    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === id);
      if (!b || !b.localResources) return prev;

      const currentShipments = prev.shipments || [];
      if (currentShipments.some(s => s.buildingId === id)) {
        return prev; // already active shipment
      }

      // Find the first resource inside the silo with positive count
      const activeResPair = Object.entries(b.localResources).find(([_, qty]) => qty > 0);
      if (!activeResPair) return prev; // nothing to dispatch

      const [resId, qty] = activeResPair;
      const newShipment = {
        id: `ship-${Date.now()}`,
        buildingId: id,
        resource: resId,
        qty,
        qtyDelivered: 0
      };

      const updatedLocal = { ...b.localResources };
      updatedLocal[resId] = 0;

      return {
        ...prev,
        shipments: [...currentShipments, newShipment],
        buildings: prev.buildings.map(item => 
          item.id === id ? { ...item, localResources: updatedLocal } : item
        )
      };
    });
  };

  // V0.3 Set Factory Target Quota limit
  const handleSetProductionQuota = (id: string, quota: number) => {
    setGameState(prev => {
      return {
        ...prev,
        buildings: prev.buildings.map(b => 
          b.id === id ? { ...b, productionQuota: quota } : b
        )
      };
    });
  };

  // V0.4 Upgrade Department Level
  const handleUpgradeDepartment = (buildingId: string, deptId: string) => {
    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === buildingId);
      if (!b) return prev;

      const maxDP = b.level - 1;
      const spentDP = Object.values(b.departments || {}).reduce((sum: number, val) => sum + (val as number), 0);
      const availableDP = maxDP - spentDP;

      if (availableDP <= 0) return prev;

      const currentLvl = b.departments?.[deptId] || 0;
      if (currentLvl >= 5) return prev; // max cap 5

      const updatedDepts = { ...b.departments, [deptId]: currentLvl + 1 };

      return {
        ...prev,
        buildings: prev.buildings.map(item => 
          item.id === buildingId ? { ...item, departments: updatedDepts } : item
        )
      };
    });
  };

  // V0.4 Corporate Restructuring (Department Resets)
  const handleRestructureDepartments = (buildingId: string) => {
    if (gameState.money < 1000) {
      alert("Restructuring departments costs $1,000! You do not have enough funds.");
      return;
    }
    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === buildingId);
      if (!b) return prev;

      return {
        ...prev,
        money: prev.money - 1000,
        buildings: prev.buildings.map(item => 
          item.id === buildingId ? { ...item, departments: {} } : item
        )
      };
    });
  };

  // Upgrades global player skills
  const handleUpgradeSkill = (skill: "production" | "marketing" | "finance") => {
    const level = gameState.skills[skill] || 0;
    if (level >= 5) return;
    const cost = (level + 1) * 1200;

    if (gameState.money >= cost) {
      setGameState(prev => {
        return {
          ...prev,
          money: prev.money - cost,
          skills: {
            ...prev.skills,
            [skill]: level + 1
          }
        };
      });
    }
  };

  // --- Purchase/Upgrade Logistics Fleet ---
  const handleBuyVehicle = (vehId: string) => {
    const config = VEHICLE_CONFIGS.find(v => v.id === vehId);
    if (!config || gameState.money < config.cost) return;

    setGameState(prev => {
      const newVeh = {
        id: `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: vehId,
        speedLevel: 1,
        capacityLevel: 1,
        fuelLevel: 1
      };
      return {
        ...prev,
        money: prev.money - config.cost,
        vehicles: [...prev.vehicles, newVeh]
      };
    });
  };

  const handleUpgradeVehicleStat = (vehId: string, stat: "speed" | "capacity" | "fuel") => {
    setGameState(prev => {
      const veh = prev.vehicles.find(v => v.id === vehId);
      if (!veh) return prev;

      const level = stat === "speed" ? veh.speedLevel : stat === "capacity" ? veh.capacityLevel : veh.fuelLevel;
      const cost = level * 800;

      if (prev.money >= cost) {
        return {
          ...prev,
          money: prev.money - cost,
          vehicles: prev.vehicles.map(v => {
            if (v.id === vehId) {
              return {
                ...v,
                speedLevel: stat === "speed" ? v.speedLevel + 1 : v.speedLevel,
                capacityLevel: stat === "capacity" ? v.capacityLevel + 1 : v.capacityLevel,
                fuelLevel: stat === "fuel" ? v.fuelLevel + 1 : v.fuelLevel,
              };
            }
            return v;
          })
        };
      }
      return prev;
    });
  };

  // Upgrade merged company (HQ)
  const handleUpgradeCompany = (companyId: string) => {
    setGameState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;
      const cost = Math.floor(5000 * Math.pow(1.8, company.level));

      if (prev.money >= cost) {
        return {
          ...prev,
          money: prev.money - cost,
          companies: prev.companies.map(c => 
            c.id === companyId ? { ...c, level: c.level + 1 } : c
          )
        };
      }
      return prev;
    });
  };

  // Upgrade company skills
  const handleUpgradeCompanySkill = (companyId: string, skill: "production" | "marketing" | "finance") => {
    setGameState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;

      const currentLevel = company.skills[skill] || 0;
      const cost = (currentLevel + 1) * 2000;

      if (prev.money >= cost) {
        return {
          ...prev,
          money: prev.money - cost,
          companies: prev.companies.map(c => 
            c.id === companyId 
              ? { 
                  ...c, 
                  skills: { 
                    ...c.skills, 
                    [skill]: currentLevel + 1 
                  } 
                } 
              : c
          )
        };
      }
      return prev;
    });
  };

  // --- Generic Merger System ---
  const checkMergerFeasibility = (mergerId: string) => {
    const merger = MERGERS_CONFIG[mergerId];
    if (!merger) return false;

    // Count player buildings matching requirements
    const currentCounts: Record<string, number> = {};
    gameState.buildings.forEach(b => {
      let type = b.type;
      if (b.type.includes("factory")) {
        type = `${b.type}_${b.recipeId || ""}`;
      }
      currentCounts[type] = (currentCounts[type] || 0) + 1;

      // Special custom progression keys for mergers
      if (b.type === "clothing_shop" && b.progressionLevel === 2) {
        currentCounts["clothing_shop_showroom"] = (currentCounts["clothing_shop_showroom"] || 0) + 1;
      }
      if (b.type === "garage" && b.progressionLevel === 2) {
        currentCounts["garage_showroom"] = (currentCounts["garage_showroom"] || 0) + 1;
      }
    });

    // Validate if current building counts satisfy the requirements
    return Object.entries(merger.requirements).every(([reqType, req]) => {
      let lookupKey = reqType;
      if (reqType === "small_factory") {
        if (mergerId === "clothing_company") lookupKey = "small_factory_fabric_weaving";
        else if (mergerId === "pharma_company") lookupKey = "small_factory_medicine_synthesis";
        else if (mergerId === "electricity_company") lookupKey = "small_factory_power_generation";
      } else if (reqType === "medium_factory") {
        if (mergerId === "petroleum_company") lookupKey = "medium_factory_oil_refining";
        else if (mergerId === "car_company") lookupKey = "medium_factory_steel_smelting";
      }

      const count = currentCounts[lookupKey] || 0;
      return count >= req.qty;
    });
  };

  const handleExecuteMerger = (mergerId: string) => {
    const merger = MERGERS_CONFIG[mergerId];
    if (!merger || !checkMergerFeasibility(mergerId)) return;

    // V0.4 Calculate average qualityScore of buildings about to be merged
    const matchedBuildingsForQuality: typeof gameState.buildings = [];
    const trackerToRemove: Record<string, number> = {};
    Object.entries(merger.requirements).forEach(([k, v]) => {
      let matchKey = k;
      if (k === "small_factory") {
        if (mergerId === "clothing_company") matchKey = "small_factory_fabric_weaving";
        else if (mergerId === "pharma_company") matchKey = "small_factory_medicine_synthesis";
        else if (mergerId === "electricity_company") matchKey = "small_factory_power_generation";
      } else if (k === "medium_factory") {
        if (mergerId === "petroleum_company") matchKey = "medium_factory_oil_refining";
        else if (mergerId === "car_company") matchKey = "medium_factory_steel_smelting";
      }
      trackerToRemove[matchKey] = v.qty;
    });

    gameState.buildings.forEach(b => {
      let matchKey = b.type;
      if (b.type.includes("factory")) {
        matchKey = `${b.type}_${b.recipeId || ""}`;
      }

      if (b.type === "clothing_shop" && b.progressionLevel === 2 && trackerToRemove["clothing_shop_showroom"] > 0) {
        matchKey = "clothing_shop_showroom";
      } else if (b.type === "garage" && b.progressionLevel === 2 && trackerToRemove["garage_showroom"] > 0) {
        matchKey = "garage_showroom";
      }

      if (trackerToRemove[matchKey] !== undefined && trackerToRemove[matchKey] > 0) {
        trackerToRemove[matchKey]--;
        matchedBuildingsForQuality.push(b);
      }
    });

    const totalScoreSum = matchedBuildingsForQuality.reduce((sum, b) => {
      // level score: b.level / 30 * 100
      return sum + ((b.level || 1) / 30) * 100;
    }, 0);
    const calculatedAvgQuality = matchedBuildingsForQuality.length > 0 ? (totalScoreSum / matchedBuildingsForQuality.length) : 50;
    setMergerQualityScore(calculatedAvgQuality);

    // Remove required buildings
    setGameState(prev => {
      // Deep clone requirements count for safe decrementing during filtering
      const toRemove: Record<string, number> = {};
      Object.entries(merger.requirements).forEach(([k, v]) => {
        let matchKey = k;
        if (k === "small_factory") {
          if (mergerId === "clothing_company") matchKey = "small_factory_fabric_weaving";
          else if (mergerId === "pharma_company") matchKey = "small_factory_medicine_synthesis";
          else if (mergerId === "electricity_company") matchKey = "small_factory_power_generation";
        } else if (k === "medium_factory") {
          if (mergerId === "petroleum_company") matchKey = "medium_factory_oil_refining";
          else if (mergerId === "car_company") matchKey = "medium_factory_steel_smelting";
        }
        toRemove[matchKey] = v.qty;
      });

      const updatedBuildings = prev.buildings.filter(b => {
        let matchKey = b.type;
        if (b.type.includes("factory")) {
          matchKey = `${b.type}_${b.recipeId || ""}`;
        }

        // Custom requirements mapping for progression levels
        if (b.type === "clothing_shop" && b.progressionLevel === 2 && toRemove["clothing_shop_showroom"] > 0) {
          matchKey = "clothing_shop_showroom";
        } else if (b.type === "garage" && b.progressionLevel === 2 && toRemove["garage_showroom"] > 0) {
          matchKey = "garage_showroom";
        }

        if (toRemove[matchKey] !== undefined && toRemove[matchKey] > 0) {
          toRemove[matchKey]--;
          return false;
        }
        return true;
      });

      return {
        ...prev,
        buildings: updatedBuildings
      };
    });

    // Put into placement mode for the HQ
    setPlacingType(merger.hqBuildingType);
    setActiveTab("map");
    setSelectedBuildingId(null);
  };

  // --- Inspector Info ---
  const getSelectedBuilding = () => {
    if (!selectedBuildingId) return null;
    const b = gameState.buildings.find(item => item.id === selectedBuildingId);
    if (b) return { building: b, config: BUILDING_CONFIGS[b.type], isCompany: false };

    const c = gameState.companies.find(item => item.id === selectedBuildingId);
    if (c) return { building: c, config: BUILDING_CONFIGS[c.type], isCompany: true };

    return null;
  };

  const selectedInfo = getSelectedBuilding();
  const bObj = selectedInfo ? (selectedInfo.building as any) : null;

  // Volume/Storage helpers
  const currentWarehouseVolume = Object.entries(gameState.resources).reduce((sum, [resId, qty]) => {
    const resConfig = RESOURCES_CONFIG[resId];
    return sum + (qty * (resConfig?.volume || 0));
  }, 0);

  const totalWarehouseCapacity = 200 + gameState.buildings.filter(b => b.type === "warehouse").reduce((sum, b) => {
    const levelMult = 1 + (b.level - 1) * 0.6;
    return sum + (BUILDING_CONFIGS.warehouse.baseCapacity || 1000) * levelMult;
  }, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col antialiased">
      
      {/* HEADER */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/10">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Business Empire
            </h1>
            <p className="text-xs text-neutral-400 font-mono">Prototype V0.3 • Data-Driven Simulation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2 px-4 shadow-inner">
          <div className="flex items-center gap-2" title="Available Cash">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span className="text-lg font-bold font-mono text-emerald-400">
              {gameState.money.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-2" title="Iron Ore Stock">
            <Hammer className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold font-mono text-slate-200">
              {Math.floor(gameState.resources.iron_ore || 0)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">Iron</span>
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-2" title="Limestone Stock">
            <Mountain className="h-4 w-4 text-stone-400" />
            <span className="text-sm font-bold font-mono text-stone-200">
              {Math.floor(gameState.resources.limestone || 0)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">Lime</span>
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-2" title="Mortar Stock">
            <Layers className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold font-mono text-amber-400">
              {Math.floor(gameState.resources.mortar || 0)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">Mortar</span>
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-2" title="Wood Stock">
            <TreePine className="h-4 w-4 text-green-500" />
            <span className="text-sm font-bold font-mono text-green-200">
              {Math.floor(gameState.resources.wood || 0)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">Wood</span>
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="font-mono text-neutral-300">
              Net Profit:{" "}
              <span className={lastTickStats.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {lastTickStats.profit >= 0 ? "+" : ""}
                {lastTickStats.profit.toFixed(1)}/s
              </span>
            </span>
          </div>

          <div className="h-6 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-2 text-xs">
            <Database className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-neutral-400 font-mono">{saveStatus}</span>
            <button 
              onClick={() => triggerSave()} 
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
              title="Manual Save"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={handleResetGame} 
              className="p-1.5 hover:bg-rose-950/50 rounded text-rose-400 hover:text-rose-300 transition"
              title="Reset Game"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Infrastructure / Warehouse volume / Construction catalog */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Global Warehouse volume limits */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <WarehouseIcon className="h-4 w-4 text-amber-500" />
                Warehouse Volume storage
              </h2>
              <span className="text-xs text-neutral-500 font-mono">
                {currentWarehouseVolume.toFixed(0)} / {totalWarehouseCapacity.toFixed(0)} VU
              </span>
            </div>

            {/* Visual capacity bar */}
            <div className="w-full bg-neutral-950 rounded-full h-2.5 mb-4 overflow-hidden border border-neutral-800">
              <div 
                className={`h-full transition-all ${
                  (currentWarehouseVolume / totalWarehouseCapacity) > 0.85 
                    ? "bg-rose-500" 
                    : (currentWarehouseVolume / totalWarehouseCapacity) > 0.60 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, (currentWarehouseVolume / totalWarehouseCapacity) * 100)}%` }}
              />
            </div>

            {/* Resource details */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
              <div className="grid grid-cols-3 text-[10px] text-neutral-500 font-bold uppercase pb-1 border-b border-neutral-800">
                <span>Resource</span>
                <span className="text-center">Stored</span>
                <span className="text-right">Unit Space</span>
              </div>
              {Object.entries(gameState.resources)
                .filter(([_, qty]) => qty > 0)
                .map(([resId, qty]) => {
                  const rConfig = RESOURCES_CONFIG[resId];
                  if (!rConfig) return null;
                  return (
                    <div key={resId} className="grid grid-cols-3 font-mono text-neutral-300 py-0.5">
                      <span className="truncate">{rConfig.name}</span>
                      <span className="text-center font-bold text-amber-400">{qty.toFixed(1)}</span>
                      <span className="text-right text-neutral-500">{rConfig.volume} VU</span>
                    </div>
                  );
                })}
              {Object.values(gameState.resources).every(qty => qty === 0) && (
                <div className="text-neutral-600 italic py-2 text-center">Warehouse storage empty.</div>
              )}
            </div>
          </div>

          {/* Construction Shop */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Store className="h-4 w-4 text-amber-500" />
                Construction Catalog
              </h2>

              <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800/80 mb-4 text-xs font-medium">
                <button
                  onClick={() => setPlacingType(null)}
                  className={`flex-1 py-1.5 text-center rounded-lg transition ${!placingType ? "bg-neutral-850 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
                >
                  Buildings Shop
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {Object.entries(BUILDING_CONFIGS)
                  .filter(([_, config]) => config.category !== "hq")
                  .map(([key, config]) => {
                    const cost = config.baseCost;
                    const isPlacing = placingType === key;
                    const hasResources = 
                      gameState.money >= cost &&
                      (gameState.resources.iron_ore || 0) >= (config.baseIronCost || 0) &&
                      (gameState.resources.limestone || 0) >= (config.baseLimestoneCost || 0) &&
                      (gameState.resources.mortar || 0) >= (config.baseMortarCost || 0) &&
                      (gameState.resources.wood || 0) >= (config.baseWoodCost || 0);

                    return (
                      <div 
                        key={key}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isPlacing 
                            ? "bg-amber-500/10 border-amber-500" 
                            : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded shrink-0 ${config.color}`} />
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              {config.name}
                              <span className="text-[9px] text-neutral-500 font-mono">
                                ({config.width}x{config.height})
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal max-w-[200px]">
                              {config.description}
                            </p>
                            
                            {/* Cost list details */}
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 font-mono text-[9px]">
                              <span className={gameState.money >= cost ? "text-emerald-400" : "text-rose-400 font-bold"}>
                                ${cost}
                              </span>
                              {(config.baseIronCost || 0) > 0 && (
                                <span className={(gameState.resources.iron_ore || 0) >= (config.baseIronCost || 0) ? "text-slate-300" : "text-rose-400 font-bold"}>
                                  {config.baseIronCost} Iron
                                </span>
                              )}
                              {(config.baseLimestoneCost || 0) > 0 && (
                                <span className={(gameState.resources.limestone || 0) >= (config.baseLimestoneCost || 0) ? "text-stone-400" : "text-rose-400 font-bold"}>
                                  {config.baseLimestoneCost} Lime
                                </span>
                              )}
                              {(config.baseMortarCost || 0) > 0 && (
                                <span className={(gameState.resources.mortar || 0) >= (config.baseMortarCost || 0) ? "text-amber-500" : "text-rose-400 font-bold"}>
                                  {config.baseMortarCost} Mortar
                                </span>
                              )}
                              {(config.baseWoodCost || 0) > 0 && (
                                <span className={(gameState.resources.wood || 0) >= (config.baseWoodCost || 0) ? "text-green-400 font-semibold" : "text-rose-400 font-bold"}>
                                  {config.baseWoodCost} Wood
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (isPlacing) setPlacingType(null);
                            else {
                              setPlacingType(key);
                              setMovingBuildingId(null);
                            }
                          }}
                          disabled={!hasResources && !isPlacing}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition shrink-0 ${
                            isPlacing 
                              ? "bg-amber-500 text-neutral-950" 
                              : hasResources 
                                ? "bg-neutral-800 hover:bg-neutral-750 text-white" 
                                : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                          }`}
                        >
                          {isPlacing ? "Placing..." : "Build"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {(placingType || movingBuildingId) && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-amber-300 font-medium">
                  {movingBuildingId ? "Select relocation tile on grid" : `Placing: ${BUILDING_CONFIGS[placingType || ""].name}`}
                </span>
                <button
                  onClick={() => {
                    setPlacingType(null);
                    setMovingBuildingId(null);
                  }}
                  className="text-neutral-400 hover:text-white px-2 py-0.5 bg-neutral-800 hover:bg-neutral-750 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Tab selection and Main panels */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* TAB SYSTEM */}
          <div className="flex bg-neutral-900 border border-neutral-850 p-1.5 rounded-2xl text-xs font-semibold shadow-md">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 py-2 text-center rounded-xl transition ${activeTab === "map" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              Grid Map (10x10)
            </button>
            <button
              onClick={() => setActiveTab("mergers")}
              className={`flex-1 py-2 text-center rounded-xl transition ${activeTab === "mergers" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              Mergers Corporate
            </button>
            <button
              onClick={() => setActiveTab("logistics")}
              className={`flex-1 py-2 text-center rounded-xl transition ${activeTab === "logistics" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              Logistics Fleet ({gameState.vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex-1 py-2 text-center rounded-xl transition ${activeTab === "skills" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              Skills & Research
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-2 text-center rounded-xl transition ${activeTab === "dashboard" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              Dashboard
            </button>
          </div>

          {/* TAB 1: Grid Map */}
          {activeTab === "map" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Grid visualization */}
              <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex items-center justify-center">
                <div className="relative">
                  <div className="grid grid-cols-10 gap-[2px] bg-neutral-950 p-[3px] rounded-xl border border-neutral-800 select-none">
                    {Array.from({ length: gridSize }).map((_, y) => (
                      <React.Fragment key={y}>
                        {Array.from({ length: gridSize }).map((_, x) => {
                          
                          // Check for placed buildings
                          const building = gameState.buildings.find(b => {
                            const config = BUILDING_CONFIGS[b.type];
                            return config && x >= b.x && x < b.x + config.width && y >= b.y && y < b.y + config.height;
                          });

                          // Check for merged companies
                          const company = gameState.companies.find(c => {
                            const config = BUILDING_CONFIGS[c.type];
                            return config && x >= c.x && x < c.x + config.width && y >= c.y && y < c.y + config.height;
                          });

                          // Natural Deposit nodes marker (displayed behind buildings)
                          const depositNode = gameState.depositNodes.find(n => n.x === x && n.y === y);

                          const activeCell = building || company;
                          const isTopLeft = activeCell && activeCell.x === x && activeCell.y === y;
                          const activeConfig = activeCell ? BUILDING_CONFIGS[activeCell.type] : null;

                          // Placement hover states
                          let isHoverOverlay = false;
                          let isValidPlacement = false;
                          if (hoverTile && (placingType || movingBuildingId)) {
                            const configToPlace = BUILDING_CONFIGS[placingType || ""] || (movingBuildingId ? BUILDING_CONFIGS[gameState.buildings.find(b => b.id === movingBuildingId)?.type || ""] : null);
                            if (configToPlace) {
                              const inRangeX = x >= hoverTile.x && x < hoverTile.x + configToPlace.width;
                              const inRangeY = y >= hoverTile.y && y < hoverTile.y + configToPlace.height;
                              if (inRangeX && inRangeY) {
                                isHoverOverlay = true;
                                isValidPlacement = canPlaceBuilding(
                                  placingType || gameState.buildings.find(b => b.id === movingBuildingId)!.type, 
                                  hoverTile.x, 
                                  hoverTile.y,
                                  movingBuildingId
                                );
                              }
                            }
                          }

                          return (
                            <div
                              key={`${x}-${y}`}
                              onClick={() => handleGridClick(x, y)}
                              onMouseEnter={() => (placingType || movingBuildingId) && setHoverTile({ x, y })}
                              onMouseLeave={() => setHoverTile(null)}
                              className={`w-9 h-9 md:w-11 md:h-11 rounded flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                                isHoverOverlay
                                  ? isValidPlacement 
                                    ? "bg-amber-500/60 ring-2 ring-amber-400 z-20" 
                                    : "bg-rose-600/50 ring-2 ring-rose-500 z-20"
                                  : isTopLeft
                                    ? `${activeConfig?.color} shadow-lg ring-1 ring-white/10 z-10 font-bold`
                                    : activeCell
                                      ? `${activeConfig?.color} opacity-80 ring-1 ring-white/5`
                                      : depositNode
                                        ? `${
                                            depositNode.type === "fertile_land" 
                                              ? "bg-emerald-950/40 text-emerald-500 border border-emerald-900/30" 
                                              : depositNode.type === "forest"
                                                ? "bg-green-950/30 text-green-500 border border-green-900/20"
                                                : depositNode.type === "iron_deposit"
                                                  ? "bg-slate-800/40 text-slate-400 border border-slate-700/30"
                                                  : depositNode.type === "coal_deposit"
                                                    ? "bg-neutral-950/40 text-neutral-500 border border-neutral-900/30"
                                                    : depositNode.type === "limestone_deposit"
                                                      ? "bg-stone-850/40 text-stone-400 border border-stone-800/30"
                                                      : "bg-amber-950/40 text-amber-500 border border-amber-900/30"
                                          } font-bold`
                                        : "bg-neutral-900 hover:bg-neutral-850 border border-neutral-800/20"
                              }`}
                            >
                              {/* Display deposit node label if cell is empty */}
                              {!activeCell && depositNode && (
                                <div className="text-[6px] text-center font-bold tracking-tighter opacity-80">
                                  {depositNode.type === "iron_deposit" && "IRON"}
                                  {depositNode.type === "coal_deposit" && "COAL"}
                                  {depositNode.type === "oil_field" && "OIL"}
                                  {depositNode.type === "limestone_deposit" && "LIME"}
                                  {depositNode.type === "fertile_land" && "LAND"}
                                  {depositNode.type === "forest" && "FOREST"}
                                </div>
                              )}

                              {/* Display building info */}
                              {isTopLeft && activeCell && (
                                <div className="text-[7px] md:text-[8px] font-bold text-white text-center leading-tight truncate w-full px-0.5">
                                  {activeConfig?.name.split(" ")[0]}
                                  {"progressionLevel" in activeCell && activeCell.progressionLevel ? (
                                    <span className="block text-[6px] text-amber-300 font-mono">
                                      T{activeCell.progressionLevel} L{activeCell.level}
                                    </span>
                                  ) : (
                                    <span className="block text-[6px] text-yellow-400 font-mono">
                                      HQ L{activeCell.level}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inspector Panel */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-amber-500" />
                    Property Inspector
                  </h3>

                  {selectedInfo && bObj ? (
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-3.5 h-3.5 rounded shrink-0 ${selectedInfo.config.color}`} />
                          <h4 className="font-bold text-neutral-100 text-sm truncate">{selectedInfo.config.name}</h4>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-normal">
                          {selectedInfo.config.description}
                        </p>
                      </div>

                      {/* Display Recipe selectors for factories */}
                      {selectedInfo.config.category === "factory" && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block tracking-wider">Manufacturing Recipe</span>
                          
                          {bObj.recipeId ? (
                            <div className="text-xs font-black text-amber-400 font-mono bg-neutral-900 px-2 py-1.5 rounded border border-neutral-850">
                              🛠️ {FACTORY_RECIPES[bObj.recipeId]?.name} (Specialized)
                            </div>
                          ) : (
                            <select 
                              value={bObj.recipeId || ""}
                              onChange={(e) => handleSelectRecipe(bObj.id, e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 p-1.5 text-xs rounded"
                            >
                              <option value="">Select Recipe...</option>
                              {Object.values(FACTORY_RECIPES).map(recipe => (
                                <option key={recipe.id} value={recipe.id}>
                                  {recipe.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Recipe display inputs -> outputs */}
                          {bObj.recipeId && FACTORY_RECIPES[bObj.recipeId] && (
                            <div className="text-[10px] space-y-1 mt-1 text-neutral-400 font-mono">
                              <div>
                                <span className="text-rose-400">Inputs:</span>{" "}
                                {FACTORY_RECIPES[bObj.recipeId].inputs.map(i => `${i.amount}x ${RESOURCES_CONFIG[i.resource]?.name}`).join(", ")}
                              </div>
                              <div>
                                <span className="text-emerald-400">Output:</span>{" "}
                                {FACTORY_RECIPES[bObj.recipeId].outputs.map(o => `${o.amount}x ${RESOURCES_CONFIG[o.resource]?.name}`).join(", ")}
                              </div>
                            </div>
                          )}

                          {/* V0.3 Production Quota Selector */}
                          <div className="border-t border-neutral-900 pt-2.5 space-y-1">
                            <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Production Target Limit</span>
                            <select
                              value={bObj.productionQuota !== undefined ? bObj.productionQuota : -1}
                              onChange={(e) => handleSetProductionQuota(bObj.id, Number(e.target.value))}
                              className="w-full bg-neutral-900 border border-neutral-850 text-neutral-200 p-1.5 text-xs rounded font-mono"
                            >
                              <option value={-1}>Infinite (Produce continuously)</option>
                              <option value={50}>50 units max in warehouse</option>
                              <option value={100}>100 units max in warehouse</option>
                              <option value={250}>250 units max in warehouse</option>
                              <option value={500}>500 units max in warehouse</option>
                            </select>
                            <span className="text-[8px] text-neutral-550 italic block leading-normal">
                              Note: Factory pauses and enters low-wear decay mode when target quantity of output is reached in warehouse.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* V0.3 Local Storage Silo Display */}
                      {bObj.localResources && Object.keys(bObj.localResources).length > 0 && (() => {
                        const hasActiveShipment = (gameState.shipments || []).some(s => s.buildingId === bObj.id);
                        const activeShipment = (gameState.shipments || []).find(s => s.buildingId === bObj.id);
                        const hasLocalStock = Object.values(bObj.localResources).some(qty => (qty as number) > 0);

                        return (
                          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Local Storage Silo</span>
                            
                            <div className="space-y-1 font-mono text-[10px]">
                              {Object.entries(bObj.localResources).map(([resId, qty]) => {
                                const resConfig = RESOURCES_CONFIG[resId];
                                const localCap = 100 * bObj.level;
                                return (
                                  <div key={resId} className="flex justify-between text-neutral-300">
                                    <span>{resConfig?.name || resId}:</span>
                                    <span className="font-bold text-amber-400">
                                      {Math.floor(qty as number)} / {localCap}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Active Shipment Progress Display */}
                            {hasActiveShipment && activeShipment && (
                              <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800 space-y-1.5 mt-2 font-mono text-[9px]">
                                <div className="flex justify-between text-[10px] font-bold text-amber-400">
                                  <span>🚚 Dispatch In Transit</span>
                                  <span>{Math.round((activeShipment.qtyDelivered / activeShipment.qty) * 100)}%</span>
                                </div>
                                <div className="text-neutral-400 leading-normal">
                                  Carrying: {Math.floor(activeShipment.qtyDelivered)} / {Math.floor(activeShipment.qty)} {RESOURCES_CONFIG[activeShipment.resource]?.name}
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden border border-neutral-800">
                                  <div 
                                    className="bg-amber-500 h-full transition-all"
                                    style={{ width: `${(activeShipment.qtyDelivered / activeShipment.qty) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Dispatch Shipment Action Button */}
                            {!hasActiveShipment ? (
                              <button
                                onClick={() => handleDispatchShipment(bObj.id)}
                                disabled={!hasLocalStock}
                                className={`w-full py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 mt-1.5 ${
                                  hasLocalStock 
                                    ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/10" 
                                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                }`}
                              >
                                📤 Dispatch Shipment
                              </button>
                            ) : (
                              <div className="text-[8px] text-neutral-550 italic text-center leading-normal mt-1 border border-dashed border-neutral-850 p-1.5 rounded bg-neutral-950/20 font-mono">
                                Dispatch order active. Wait for delivery.
                              </div>
                            )}

                            <span className="text-[8px] text-neutral-500 italic block mt-1 leading-normal text-center">
                              Click Dispatch Shipment to empty silo and queue cargo transport.
                            </span>
                          </div>
                        );
                      })()}

                      {/* V0.3 Crop Cycle selector for Agricultural Farms */}
                      {selectedInfo.config.id === "agricultural_farm" && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block tracking-wider">Agriculture Planning</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleSelectFarmCrop(bObj.id, "food")}
                              disabled={!!bObj.cropCycleSelected}
                              className={`py-1.5 rounded text-[10px] font-bold transition ${
                                bObj.cropCycleSelected === "food"
                                  ? "bg-emerald-650 text-white font-extrabold"
                                  : "bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-40"
                              }`}
                            >
                              🌾 Grow Food
                            </button>
                            <button
                              onClick={() => handleSelectFarmCrop(bObj.id, "cotton")}
                              disabled={!!bObj.cropCycleSelected}
                              className={`py-1.5 rounded text-[10px] font-bold transition ${
                                bObj.cropCycleSelected === "cotton"
                                  ? "bg-rose-650 text-white font-extrabold"
                                  : "bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-40"
                              }`}
                            >
                              🌱 Grow Cotton
                            </button>
                          </div>

                          {bObj.cropCycleSelected ? (
                            <div className="space-y-1.5 pt-1 text-[10px] font-mono text-neutral-300">
                              <div className="flex justify-between items-center text-[9px]">
                                <span>Active: <span className="text-amber-400 font-bold uppercase">{bObj.cropCycleSelected}</span></span>
                                <span className="text-neutral-500">{60 - (bObj.cropCycleProgress || 0)}s remaining</span>
                              </div>
                              
                              {/* Visual progress bar */}
                              <div className="w-full bg-neutral-900 border border-neutral-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full transition-all"
                                  style={{ width: `${Math.min(100, ((bObj.cropCycleProgress || 0) / 60) * 100)}%` }}
                                />
                              </div>

                              <button
                                onClick={() => {
                                  if (window.confirm("Cancel crop growth? You will lose all current progress.")) {
                                    setGameState(prev => ({
                                      ...prev,
                                      buildings: prev.buildings.map(b => 
                                        b.id === bObj.id ? { ...b, cropCycleSelected: null, cropCycleProgress: 0 } : b
                                      )
                                    }));
                                  }
                                }}
                                className="w-full mt-1.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 rounded text-[9px] font-semibold"
                              >
                                Cancel Current Crop
                              </button>
                            </div>
                          ) : (
                            <div className="text-[9px] text-neutral-500 italic leading-normal text-center">
                              Commit to a 60s crop cycle. Yields 124 units.
                            </div>
                          )}
                        </div>
                      )}

                      {/* V0.4 Department Upgrades & Concept Success Factors */}
                      {!selectedInfo.isCompany && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Business Departments</span>
                            {/* Restructure reset button */}
                            <button
                              onClick={() => handleRestructureDepartments(bObj.id)}
                              className="text-[9px] text-rose-450 hover:text-rose-350 transition font-bold"
                            >
                              🔄 Restructure ($1,000)
                            </button>
                          </div>
                          
                          {(() => {
                            const depts = DEPARTMENTS_BY_CATEGORY[selectedInfo.config.category] || [];
                            const maxDP = bObj.level - 1;
                            const spentDP = Object.values(bObj.departments || {}).reduce((sum: number, val) => sum + (val as number), 0);
                            const availableDP = maxDP - spentDP;

                            return (
                              <div className="space-y-2">
                                <div className="text-[10px] font-mono flex justify-between bg-neutral-900 px-2 py-1 rounded text-neutral-350">
                                  <span>Available DP:</span>
                                  <span className={availableDP > 0 ? "text-amber-400 font-extrabold text-[11px]" : "text-neutral-500"}>
                                    {availableDP} pts
                                  </span>
                                </div>

                                {depts.map(dept => {
                                  const currentLvl = bObj.departments?.[dept.id] || 0;
                                  return (
                                    <div key={dept.id} className="bg-neutral-900/40 p-2 rounded border border-neutral-850 space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-neutral-200 text-[10px]">{dept.name}</span>
                                        {/* Upgrade button */}
                                        <button
                                          onClick={() => handleUpgradeDepartment(bObj.id, dept.id)}
                                          disabled={availableDP <= 0 || currentLvl >= 5}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition ${
                                            availableDP > 0 && currentLvl < 5
                                              ? "bg-amber-505 hover:bg-amber-400 text-neutral-950 font-black"
                                              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                          }`}
                                        >
                                          Upgrade (L{currentLvl})
                                        </button>
                                      </div>
                                      
                                      {/* Level blocks indicator */}
                                      <div className="flex gap-0.5 h-1">
                                        {[1, 2, 3, 4, 5].map(idx => (
                                          <div 
                                            key={idx} 
                                            className={`flex-1 rounded-sm ${idx <= currentLvl ? "bg-amber-400" : "bg-neutral-850"}`} 
                                          />
                                        ))}
                                      </div>
                                      
                                      <p className="text-[9px] text-neutral-400 leading-normal font-sans">
                                        {dept.description}
                                      </p>
                                      
                                      <div className="text-[8px] font-mono text-neutral-500 flex justify-between pt-0.5 border-t border-neutral-850/45">
                                        <span>Concept: {dept.realWorldConcept}</span>
                                        <span className="text-amber-400/80">{dept.effectDescription}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* V0.3 Structural Integrity & Repair Widget */}
                      {!selectedInfo.isCompany && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-neutral-300 uppercase tracking-wider">Structural Integrity</span>
                            <span className={`font-mono font-bold ${
                              (bObj.integrity ?? 100) > 50 
                                ? "text-emerald-400" 
                                : (bObj.integrity ?? 100) > 20 
                                  ? "text-amber-400" 
                                  : "text-rose-500 font-extrabold animate-pulse"
                            }`}>
                              {Math.floor(bObj.integrity ?? 100)}%
                            </span>
                          </div>

                          {/* Integrity bar */}
                          <div className="w-full bg-neutral-900 border border-neutral-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                (bObj.integrity ?? 100) > 50 
                                  ? "bg-emerald-500" 
                                  : (bObj.integrity ?? 100) > 20 
                                    ? "bg-amber-500" 
                                    : "bg-rose-600"
                              }`}
                              style={{ width: `${bObj.integrity ?? 100}%` }}
                            />
                          </div>

                          {/* Critical status warning overlay */}
                          {(bObj.integrity ?? 100) <= 0 && (
                            <div className="text-[9px] text-rose-400 font-bold bg-rose-950/20 border border-rose-900/30 p-1.5 rounded text-center leading-normal animate-pulse">
                              ⚠️ CRITICAL BREAKDOWN: All building operations paused. Pay repair fee to restart production.
                            </div>
                          )}

                          {/* Repair button */}
                          {(bObj.integrity ?? 100) < 100 && (() => {
                            const currentIntegrity = bObj.integrity ?? 100;
                            const repairCost = Math.max(10, Math.floor(selectedInfo.config.baseCost * 0.15 * (1 - currentIntegrity / 100)));
                            const canAffordRepair = gameState.money >= repairCost;

                            return (
                              <button
                                onClick={() => handleRepairBuilding(bObj.id)}
                                disabled={!canAffordRepair}
                                className={`w-full py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                                  canAffordRepair 
                                    ? "bg-blue-650 hover:bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                }`}
                              >
                                🔧 Repair Structure (Cost: ${repairCost})
                              </button>
                            );
                          })()}
                        </div>
                      )}

                      <div className="border-t border-neutral-800 pt-3 space-y-2 font-mono text-[11px] text-neutral-300">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Upgrade Level:</span>
                          <span className="text-white font-bold">{bObj.level}</span>
                        </div>
                        {bObj.progressionLevel !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Business Tier:</span>
                            <span className="text-amber-400 font-bold">
                              {bObj.progressionLevel === 3 ? "Dealership / Corporate" : bObj.progressionLevel === 2 ? "Showroom / Firm" : "Shop / Office"}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Size:</span>
                          <span>{selectedInfo.config.width}x{selectedInfo.config.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Wear Rate:</span>
                          <span className="text-rose-400">
                            -0.25% / tick
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        {/* Level Upgrade button */}
                        {!selectedInfo.isCompany ? (() => {
                          const upgradeMoneyCost = Math.floor(selectedInfo.config.baseCost * Math.pow(1.6, bObj.level));
                          const upgradeIronCost = Math.floor((selectedInfo.config.baseIronCost || 0) * Math.pow(1.4, bObj.level));
                          const upgradeLimeCost = Math.floor((selectedInfo.config.baseLimestoneCost || 0) * Math.pow(1.4, bObj.level));
                          const upgradeMortarCost = Math.floor((selectedInfo.config.baseMortarCost || 0) * Math.pow(1.4, bObj.level));
                          const upgradeWoodCost = Math.floor((selectedInfo.config.baseWoodCost || 0) * Math.pow(1.4, bObj.level));

                          const hasResourcesToUpgrade = 
                            gameState.money >= upgradeMoneyCost &&
                            (gameState.resources.iron_ore || 0) >= upgradeIronCost &&
                            (gameState.resources.limestone || 0) >= upgradeLimeCost &&
                            (gameState.resources.mortar || 0) >= upgradeMortarCost &&
                            (gameState.resources.wood || 0) >= upgradeWoodCost;

                          return (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleUpgradeBuilding(bObj.id)}
                                disabled={!hasResourcesToUpgrade}
                                className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                              >
                                Upgrade Level
                              </button>
                              
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center font-mono text-[9px] text-neutral-400 bg-neutral-950 p-1.5 rounded border border-neutral-850">
                                <span>Costs:</span>
                                <span className={gameState.money >= upgradeMoneyCost ? "text-emerald-400" : "text-rose-450 font-bold"}>
                                  ${upgradeMoneyCost}
                                </span>
                                {upgradeIronCost > 0 && (
                                  <span className={(gameState.resources.iron_ore || 0) >= upgradeIronCost ? "text-slate-350" : "text-rose-450 font-bold"}>
                                    {upgradeIronCost} Iron
                                  </span>
                                )}
                                {upgradeLimeCost > 0 && (
                                  <span className={(gameState.resources.limestone || 0) >= upgradeLimeCost ? "text-stone-400" : "text-rose-450 font-bold"}>
                                    {upgradeLimeCost} Lime
                                  </span>
                                )}
                                {upgradeMortarCost > 0 && (
                                  <span className={(gameState.resources.mortar || 0) >= upgradeMortarCost ? "text-amber-500" : "text-rose-450 font-bold"}>
                                    {upgradeMortarCost} Mortar
                                  </span>
                                )}
                                {upgradeWoodCost > 0 && (
                                  <span className={(gameState.resources.wood || 0) >= upgradeWoodCost ? "text-green-400" : "text-rose-450 font-bold"}>
                                    {upgradeWoodCost} Wood
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleUpgradeCompany(bObj.id)}
                              disabled={gameState.money < Math.floor(5000 * Math.pow(1.8, bObj.level))}
                              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                            >
                              Upgrade Corporate Level (Cost: ${Math.floor(5000 * Math.pow(1.8, bObj.level))})
                            </button>
                            
                            {/* V0.4 Merger Quality Score Display */}
                            {bObj.qualityScore !== undefined && (
                              <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 space-y-1 my-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Merger Quality Score</span>
                                  <span className="font-mono font-black text-amber-400 text-xs">{Math.round(bObj.qualityScore)}%</span>
                                </div>
                                <p className="text-[8px] text-neutral-550 leading-normal">
                                  Brand Multiplier: Corporate revenues are scaled by this quality score. Max out shop levels before merging to increase profit!
                                </p>
                              </div>
                            )}

                            <div className="border-t border-neutral-850 pt-2 space-y-1.5 text-[10px]">
                              <span className="text-neutral-400 font-bold uppercase block tracking-wider">Corporate Department Skills</span>
                              
                              <div className="flex justify-between items-center bg-neutral-950 p-1.5 rounded border border-neutral-850">
                                <span>Production Speed (L{bObj.skills?.production || 0})</span>
                                <button
                                  onClick={() => handleUpgradeCompanySkill(bObj.id, "production")}
                                  disabled={gameState.money < ((bObj.skills?.production || 0) + 1) * 2000}
                                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded font-bold"
                                >
                                  + (${((bObj.skills?.production || 0) + 1) * 2000})
                                </button>
                              </div>

                              <div className="flex justify-between items-center bg-neutral-950 p-1.5 rounded border border-neutral-850">
                                <span>Marketing Reach (L{bObj.skills?.marketing || 0})</span>
                                <button
                                  onClick={() => handleUpgradeCompanySkill(bObj.id, "marketing")}
                                  disabled={gameState.money < ((bObj.skills?.marketing || 0) + 1) * 2000}
                                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded font-bold"
                                >
                                  + (${((bObj.skills?.marketing || 0) + 1) * 2000})
                                </button>
                              </div>

                              <div className="flex justify-between items-center bg-neutral-950 p-1.5 rounded border border-neutral-850">
                                <span>Finance Audits (L{bObj.skills?.finance || 0})</span>
                                <button
                                  onClick={() => handleUpgradeCompanySkill(bObj.id, "finance")}
                                  disabled={gameState.money < ((bObj.skills?.finance || 0) + 1) * 2000}
                                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded font-bold"
                                >
                                  + (${((bObj.skills?.finance || 0) + 1) * 2000})
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Progression tier upgrade button */}
                        {!selectedInfo.isCompany && bObj.progressionLevel !== undefined && bObj.progressionLevel < 3 && (() => {
                          const currentTier = bObj.progressionLevel || 1;
                          const progressMoneyCost = currentTier === 1 ? 1200 : 3500;
                          const progressIronCost = currentTier === 1 ? 30 : 80;
                          const progressLimeCost = currentTier === 1 ? 30 : 80;
                          const progressMortarCost = currentTier === 1 ? 15 : 45;

                          const hasResourcesToProgress = 
                            gameState.money >= progressMoneyCost &&
                            (gameState.resources.iron_ore || 0) >= progressIronCost &&
                            (gameState.resources.limestone || 0) >= progressLimeCost &&
                            (gameState.resources.mortar || 0) >= progressMortarCost;

                          return (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleProgressTier(bObj.id)}
                                disabled={!hasResourcesToProgress}
                                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-45"
                              >
                                Progress Business Tier
                              </button>

                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center font-mono text-[9px] text-neutral-400 bg-neutral-950 p-1.5 rounded border border-neutral-850">
                                <span>Costs:</span>
                                <span className={gameState.money >= progressMoneyCost ? "text-emerald-400" : "text-rose-450 font-bold"}>
                                  ${progressMoneyCost}
                                </span>
                                <span className={(gameState.resources.iron_ore || 0) >= progressIronCost ? "text-slate-350" : "text-rose-450 font-bold"}>
                                  {progressIronCost} Iron
                                </span>
                                <span className={(gameState.resources.limestone || 0) >= progressLimeCost ? "text-stone-400" : "text-rose-450 font-bold"}>
                                  {progressLimeCost} Lime
                                </span>
                                <span className={(gameState.resources.mortar || 0) >= progressMortarCost ? "text-amber-500" : "text-rose-450 font-bold"}>
                                  {progressMortarCost} Mortar
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <button
                            onClick={() => {
                              setMovingBuildingId(bObj.id);
                              setPlacingType(null);
                            }}
                            className="py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg font-semibold text-center"
                          >
                            Move
                          </button>
                          {!selectedInfo.isCompany && (
                            <button
                              onClick={() => handleDemolish(bObj.id)}
                              className="py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 rounded-lg font-semibold flex items-center justify-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Demolish
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 border border-dashed border-neutral-850 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-neutral-500">
                      <Wrench className="h-6 w-6 text-neutral-600 mb-2" />
                      <span>Select any building on the grid to inspect stats, manage production recipes, and upgrade business tiers.</span>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 mt-4 text-[10px] text-neutral-400 space-y-1 font-mono">
                  <span className="text-amber-400 font-bold block">Grid Markers:</span>
                  <div>• Land Node = Fertile Land crop farms</div>
                  <div>• Lime Node = Limestone quarries</div>
                  <div>• Iron Node = Iron Mines</div>
                  <div>• Coal Node = Coal shaft mines</div>
                  <div>• Oil Node = Oil Rigs</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Mergers corporate */}
          {activeTab === "mergers" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Corporate Merger Boardroom</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Combine specialized infrastructure and local assets into highly profitable HQs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(MERGERS_CONFIG).map(merger => {
                  const eligible = checkMergerFeasibility(merger.id);
                  const hqConfig = BUILDING_CONFIGS[merger.hqBuildingType];

                  return (
                    <div 
                      key={merger.id}
                      className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {merger.name}
                        </h3>
                        <p className="text-[11px] text-neutral-400 leading-normal mt-1 mb-3">
                          {merger.description}
                        </p>

                        {/* Requirements */}
                        <div className="space-y-1.5 text-[10px] font-mono text-neutral-400 pb-4">
                          <span className="text-neutral-500 font-bold">REQUIRED INFRASTRUCTURE:</span>
                          {Object.entries(merger.requirements).map(([reqType, req]) => (
                            <div key={reqType} className="flex justify-between border-b border-neutral-900 pb-0.5">
                              <span>
                                {reqType.replace(/_/g, " ")} 
                                {req.minProgression && ` (Tier ${req.minProgression})`}
                              </span>
                              <span className="font-bold">x{req.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleExecuteMerger(merger.id)}
                        disabled={!eligible}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                          eligible 
                            ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/10" 
                            : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                        }`}
                      >
                        {eligible ? "Merge & Place HQ" : "Lacks Required Assets"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Logistics Fleet */}
          {activeTab === "logistics" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Logistics Fleet Management</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Purchase and upgrade delivery vehicles to speed up retail sales volume across all shops.
                  </p>
                </div>
                <Truck className="h-8 w-8 text-amber-500" />
              </div>

              {/* Buying Shop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VEHICLE_CONFIGS.map(v => (
                  <div key={v.id} className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex flex-col justify-between h-32">
                    <div>
                      <h4 className="font-bold text-xs text-neutral-200">{v.name}</h4>
                      <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                        Capacity: {v.capacity} VU<br />
                        Speed: +{Math.round(v.deliverySpeedBonus * 100)}%
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyVehicle(v.id)}
                      disabled={gameState.money < v.cost}
                      className="w-full py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-bold rounded disabled:opacity-40"
                    >
                      Buy (${v.cost})
                    </button>
                  </div>
                ))}
              </div>

              {/* Owned Vehicles List */}
              <div className="space-y-3 border-t border-neutral-850 pt-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">My Active Cargo Fleet ({gameState.vehicles.length})</h3>
                
                {gameState.vehicles.length === 0 ? (
                  <div className="text-xs text-neutral-600 italic py-4 text-center">No active vehicles purchased. Purchase delivery vans to speed up sales.</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {gameState.vehicles.map(veh => {
                      const speedCost = veh.speedLevel * 800;
                      const capCost = veh.capacityLevel * 800;

                      return (
                        <div key={veh.id} className="bg-neutral-950 p-3 rounded-xl border border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-neutral-200 capitalize">{veh.type.replace(/_/g, " ")}</span>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              Speed: L{veh.speedLevel} • Capacity: L{veh.capacityLevel}
                            </div>
                          </div>

                          <div className="flex gap-2 font-mono">
                            <button
                              onClick={() => handleUpgradeVehicleStat(veh.id, "speed")}
                              disabled={gameState.money < speedCost}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-[10px] text-neutral-200 rounded disabled:opacity-50"
                            >
                              +Speed (${speedCost})
                            </button>
                            <button
                              onClick={() => handleUpgradeVehicleStat(veh.id, "capacity")}
                              disabled={gameState.money < capCost}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-[10px] text-neutral-200 rounded disabled:opacity-50"
                            >
                              +Capacity (${capCost})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Skill tree */}
          {activeTab === "skills" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-6">
              <div>
                <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Executive Skill Trees</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Upgrade player parameters globally. Affects all extractors, factories, and shop selling price rates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Production */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 flex flex-col justify-between h-44">
                  <div>
                    <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                      <Zap className="h-4 w-4" />
                      Production Speed
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Improves mine extraction rates and factory processing speeds by +10% per level.
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                      <span>Level:</span>
                      <span className="text-amber-400 font-bold">{gameState.skills.production}/5</span>
                    </div>
                    <button
                      onClick={() => handleUpgradeSkill("production")}
                      disabled={gameState.skills.production >= 5 || gameState.money < (gameState.skills.production + 1) * 1200}
                      className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-750 text-[10px] font-bold rounded-lg disabled:opacity-40"
                    >
                      {gameState.skills.production >= 5 ? "MAXED" : `Upgrade ($${(gameState.skills.production + 1) * 1200})`}
                    </button>
                  </div>
                </div>

                {/* Marketing */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 flex flex-col justify-between h-44">
                  <div>
                    <h3 className="font-bold text-xs text-pink-400 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      Market demand Price
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Boosts raw and finished goods retail selling prices by +10% per level.
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                      <span>Level:</span>
                      <span className="text-pink-400 font-bold">{gameState.skills.marketing}/5</span>
                    </div>
                    <button
                      onClick={() => handleUpgradeSkill("marketing")}
                      disabled={gameState.skills.marketing >= 5 || gameState.money < (gameState.skills.marketing + 1) * 1200}
                      className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-750 text-[10px] font-bold rounded-lg disabled:opacity-40"
                    >
                      {gameState.skills.marketing >= 5 ? "MAXED" : `Upgrade ($${(gameState.skills.marketing + 1) * 1200})`}
                    </button>
                  </div>
                </div>

                {/* Finance */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 flex flex-col justify-between h-44">
                  <div>
                    <h3 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      Cost accounting
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Reduces global building maintenance expenses by -8% per level (cap -40%).
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                      <span>Level:</span>
                      <span className="text-emerald-400 font-bold">{gameState.skills.finance}/5</span>
                    </div>
                    <button
                      onClick={() => handleUpgradeSkill("finance")}
                      disabled={gameState.skills.finance >= 5 || gameState.money < (gameState.skills.finance + 1) * 1200}
                      className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-750 text-[10px] font-bold rounded-lg disabled:opacity-40"
                    >
                      {gameState.skills.finance >= 5 ? "MAXED" : `Upgrade ($${(gameState.skills.finance + 1) * 1200})`}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: Dashboard */}
          {activeTab === "dashboard" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-6">
              <div>
                <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Empire Dashboard</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time operational statistics of your grid and logistics networks.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div className="text-[10px] text-neutral-500 uppercase">Cash balance</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    ${gameState.money.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div className="text-[10px] text-neutral-500 uppercase">Active Units</div>
                  <div className="text-base font-bold text-neutral-300 mt-1">
                    {gameState.buildings.length} buildings
                  </div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div className="text-[10px] text-neutral-500 uppercase">Vehicles Owned</div>
                  <div className="text-base font-bold text-purple-400 mt-1">
                    {gameState.vehicles.length} trucks
                  </div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div className="text-[10px] text-neutral-500 uppercase">Merged HQs</div>
                  <div className="text-base font-bold text-yellow-500 mt-1">
                    {gameState.companies.length} brands
                  </div>
                </div>
              </div>

              {/* Ticker logs */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudLightning className="h-4 w-4 text-amber-500 animate-pulse" />
                  Live Operational Stream
                </h3>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 font-mono text-[10px] text-neutral-400 space-y-1 overflow-y-auto max-h-48">
                  {lastTickStats.logs.length === 0 ? (
                    <div className="text-neutral-600 italic">No operational logs generated yet. Build extractors to begin.</div>
                  ) : (
                    lastTickStats.logs.map((log, i) => (
                      <div key={i} className="flex gap-1.5">
                        <span className="text-neutral-600">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* V0.3 Import Goods Panel */}
              <div className="border-t border-neutral-850 pt-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-emerald-500" />
                    Global Materials Import Terminal
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Import critical raw materials instantly at a cost premium. Deliveries take 15 seconds.
                  </p>
                </div>

                {/* Import Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] font-mono">
                  {Object.entries(RESOURCES_CONFIG)
                    .filter(([id, cfg]) => cfg.category === "natural" || id === "mortar")
                    .map(([resId, cfg]) => {
                      const costPerUnit = cfg.basePrice * 2.5; // Premium import price
                      const importQty = 50;
                      const totalCost = costPerUnit * importQty;
                      const canAfford = gameState.money >= totalCost;

                      return (
                        <div key={resId} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 flex flex-col justify-between h-24">
                          <div>
                            <span className="font-bold text-neutral-300 block truncate">{cfg.name}</span>
                            <span className="text-neutral-500 text-[9px] block">Order: 50x</span>
                            <span className="text-amber-500 text-[9px] font-bold block">${totalCost.toFixed(0)}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setGameState(prev => {
                                const newImport = {
                                  id: `imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                  resource: resId,
                                  qty: importQty,
                                  timeRemaining: 15,
                                  cost: totalCost
                                };
                                return {
                                  ...prev,
                                  money: prev.money - totalCost,
                                  imports: [...(prev.imports || []), newImport]
                                };
                              });
                            }}
                            disabled={!canAfford}
                            className="w-full mt-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/30 rounded text-[9px] font-bold disabled:opacity-40 text-center"
                          >
                            Order
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Active Deliveries Queue */}
                {gameState.imports && gameState.imports.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Active Incoming Cargo Queue</span>
                    <div className="bg-neutral-950 rounded-xl border border-neutral-850 p-3 max-h-36 overflow-y-auto space-y-2">
                      {gameState.imports.map(imp => {
                        const resConfig = RESOURCES_CONFIG[imp.resource];
                        return (
                          <div key={imp.id} className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-900 pb-1 last:border-b-0 last:pb-0 text-neutral-300">
                            <div className="flex items-center gap-1.5">
                              <Truck className="h-3.5 w-3.5 text-amber-500 animate-bounce animate-pulse" />
                              <span>{imp.qty}x {resConfig?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Visual progress bar */}
                              <div className="w-16 bg-neutral-900 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-full transition-all"
                                  style={{ width: `${((15 - imp.timeRemaining) / 15) * 100}%` }}
                                />
                              </div>
                              <span className="text-amber-400 font-bold">{imp.timeRemaining}s</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-900/40 p-4 text-center text-xs text-neutral-500 font-mono">
        Business Empire V0.4 • RTS Silos, Dispatch Logistics, and Industry-Specific Department Success Factors.
      </footer>

      {/* V0.4 Factory Specialization Popup Modal */}
      {pendingFactoryPlacementId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">Placement Complete</span>
              <h3 className="text-base font-black text-neutral-100 mt-1">Configure Factory Specialization</h3>
              <p className="text-[11px] text-neutral-450 mt-1.5 leading-normal">
                Factories must be assigned a permanent industrial recipe upon construction. This specialization cannot be changed later.
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin">
              {Object.values(FACTORY_RECIPES).map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => {
                    setGameState(prev => ({
                      ...prev,
                      buildings: prev.buildings.map(b =>
                        b.id === pendingFactoryPlacementId ? { ...b, recipeId: recipe.id } : b
                      )
                    }));
                    setPendingFactoryPlacementId(null);
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-850 hover:border-amber-500 hover:bg-neutral-900/60 rounded-xl transition text-left group animate-in slide-in-from-bottom-2 duration-150"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-200 group-hover:text-amber-400 transition">{recipe.name}</div>
                    <div className="text-[9px] text-neutral-500 font-mono">
                      In: {recipe.inputs.map(i => `${i.amount}x ${RESOURCES_CONFIG[i.resource]?.name || i.resource}`).join(", ")}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[9px] text-emerald-455 font-bold">
                    Out: {recipe.outputs.map(o => `${o.amount}x ${RESOURCES_CONFIG[o.resource]?.name || o.resource}`).join(", ")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
