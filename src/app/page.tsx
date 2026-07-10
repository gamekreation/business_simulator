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
import { 
  BUSINESS_SKILLS, 
  UNIVERSAL_EXTRACTOR_SKILLS, 
  UNIQUE_EXTRACTOR_SKILLS, 
  UNIVERSAL_CORPORATE_SKILLS, 
  UNIQUE_CORPORATE_SKILLS 
} from "../buildings/departmentConfig";
import { runSimulationTick, TickResult } from "../simulation/simulationEngine";
import { GameState, saveGame, loadGame, isSupabaseConfigured } from "../database/supabaseClient";

const LOCAL_SAVE_ID = "proto_player_v0_2";

// Helper to pre-populate fixed natural resource nodes on the 20x20 grid procedurally
const generateProceduralDepositNodes = () => {
  const nodes: { x: number; y: number; type: "iron_deposit" | "coal_deposit" | "oil_field" | "limestone_deposit" | "fertile_land" | "forest" | "stone_deposit" | "copper_deposit" | "silicon_deposit" | "uranium_deposit" }[] = [];
  
  // Seed resource clusters across 20x20 map
  const clusters = [
    { type: "iron_deposit" as const, cx: 2, cy: 2, count: 4 },
    { type: "coal_deposit" as const, cx: 15, cy: 2, count: 4 },
    { type: "limestone_deposit" as const, cx: 2, cy: 15, count: 4 },
    { type: "oil_field" as const, cx: 15, cy: 15, count: 4 },
    { type: "fertile_land" as const, cx: 8, cy: 8, count: 9 },
    { type: "forest" as const, cx: 9, cy: 3, count: 6 },
    { type: "forest" as const, cx: 4, cy: 10, count: 4 },
    { type: "stone_deposit" as const, cx: 2, cy: 9, count: 4 },
    { type: "copper_deposit" as const, cx: 14, cy: 9, count: 4 },
    { type: "silicon_deposit" as const, cx: 9, cy: 14, count: 4 },
    { type: "uranium_deposit" as const, cx: 9, cy: 18, count: 3 },
  ];

  clusters.forEach(({ type, cx, cy, count }) => {
    const size = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      const offsetX = i % size;
      const offsetY = Math.floor(i / size);
      const x = cx + offsetX;
      const y = cy + offsetY;
      if (x >= 0 && x < 20 && y >= 0 && y < 20) {
        nodes.push({ x, y, type });
      }
    }
  });

  return nodes;
};

const DEFAULT_DEPOSIT_NODES = generateProceduralDepositNodes();

export default function BusinessEmpireGame() {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    id: LOCAL_SAVE_ID,
    money: 5000,
    resources: {
      iron_ore: 70,
      stone: 70,
      mortar: 70,
      wood: 70,
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
    buildersCount: 2,
    constructionQueue: [],
    roads: [],
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
  const [catalogCategory, setCatalogCategory] = useState<"infrastructure" | "extraction" | "industry" | "commerce">("extraction");
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  
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
  const [isMounted, setIsMounted] = useState(false);

  // --- Load Game on Mount ---
  useEffect(() => {
    async function initLoad() {
      const saved = await loadGame(LOCAL_SAVE_ID);
      if (saved) {
        // Reset deposit nodes to align with new 20x20 layout clusters
        saved.depositNodes = [...DEFAULT_DEPOSIT_NODES];
        if (!saved.vehicles) {
          saved.vehicles = [];
        }
        if (!saved.roads) {
          saved.roads = [];
        }
        if (!saved.constructionQueue) {
          saved.constructionQueue = [];
        }
        // Save-healing: Give bootstrap materials to existing saves to prevent deadlock
        if (!saved.resources) {
          saved.resources = {};
        }
        saved.resources.iron_ore = Math.max(saved.resources.iron_ore || 0, 70);
        saved.resources.stone = Math.max(saved.resources.stone || 0, 70);
        saved.resources.mortar = Math.max(saved.resources.mortar || 0, 70);
        saved.resources.wood = Math.max(saved.resources.wood || 0, 70);
        delete saved.resources.cotton; // Remove cotton

        setGameState(saved);
        setSaveStatus(isSupabaseConfigured ? "Loaded from Cloud" : "Loaded from local storage");
      } else {
        setSaveStatus("New V0.5 Game Started");
      }
      setIsMounted(true);
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
        money: 5000,
        resources: {
          iron_ore: 70,
          stone: 70,
          mortar: 70,
          wood: 70,
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
        buildersCount: 2,
        constructionQueue: [],
        roads: [],
      };
      setGameState(resetState);
      localStorage.removeItem("business_empire_save");
      await triggerSave(resetState);
      setSaveStatus("Reset Successful");
    }
  };

  // --- Helpers for Grid Math ---
  const gridSize = 20;

  // Check if building fits, doesn't overlap, and matches deposit nodes for extractors
  const canPlaceBuilding = (
    type: string, 
    x: number, 
    y: number, 
    excludeId: string | null = null
  ): boolean => {
    // V0.5 Road placement checks
    if (type === "road") {
      if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return false;
      const isOccupied = 
        (gameState.roads || []).some(r => r.x === x && r.y === y) || 
        gameState.buildings.some(b => {
          const config = BUILDING_CONFIGS[b.type];
          return config && x >= b.x && x < b.x + config.width && y >= b.y && y < b.y + config.height;
        });
      return !isOccupied;
    }

    const config = BUILDING_CONFIGS[type];
    if (!config) return false;

    // 1. Boundary check
    if (x < 0 || y < 0 || x + config.width > gridSize || y + config.height > gridSize) {
      return false;
    }

    // V0.5 Roads overlap check (cannot place buildings on top of roads)
    for (let dy = 0; dy < config.height; dy++) {
      for (let dx = 0; dx < config.width; dx++) {
        if ((gameState.roads || []).some(r => r.x === x + dx && r.y === y + dy)) {
          return false;
        }
      }
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
      // V0.5 Road Placement Logic
      if (placingType === "road") {
        const hasRoadResources = 
          gameState.money >= 10 &&
          (gameState.resources.stone || 0) >= 1 &&
          (gameState.resources.wood || 0) >= 1;

        const isRoadOccupied = 
          (gameState.roads || []).some(r => r.x === x && r.y === y) || 
          gameState.buildings.some(b => {
            const config = BUILDING_CONFIGS[b.type];
            return config && x >= b.x && x < b.x + config.width && y >= b.y && y < b.y + config.height;
          });

        if (hasRoadResources && !isRoadOccupied) {
          setGameState(prev => {
            const updatedResources = { ...prev.resources };
            updatedResources.stone = Math.max(0, (updatedResources.stone || 0) - 1);
            updatedResources.wood = Math.max(0, (updatedResources.wood || 0) - 1);

            return {
              ...prev,
              money: prev.money - 10,
              resources: updatedResources,
              roads: [...(prev.roads || []), { x, y }]
            };
          });
        }
        return;
      }

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
                  skills: {},
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
        (gameState.resources.stone || 0) >= (config.baseStoneCost || 0) &&
        (gameState.resources.mortar || 0) >= (config.baseMortarCost || 0) &&
        (gameState.resources.wood || 0) >= (config.baseWoodCost || 0);

      // V0.5 Builder availability check
      const busyBuilders = gameState.constructionQueue?.length || 0;
      const totalBuilders = 2 + (gameState.buildings.filter(b => b.type === "builder_company" && !(gameState.constructionQueue || []).some(cq => cq.buildingId === b.id)).length);
      if (busyBuilders >= totalBuilders) {
        alert("All builders are busy! Wait for existing projects to complete.");
        setPlacingType(null);
        return;
      }

      if (hasResources && canPlaceBuilding(placingType, x, y)) {
        const generatedId = `build-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Define builder project duration
        const duration = (() => {
          if (config.category === "extractor") return 12;
          if (config.category === "factory") return 18;
          if (config.category === "retail") return 8;
          if (config.category === "service") return 14;
          return 10;
        })();

        const newProject = {
          id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          buildingId: generatedId,
          type: "construct" as const,
          timeRemaining: duration,
          totalTime: duration
        };

        setGameState(prev => {
          if (prev.buildings.some(b => b.id === generatedId)) return prev;

          const updatedResources = { ...prev.resources };
          updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - (config.baseIronCost || 0));
          updatedResources.stone = Math.max(0, (updatedResources.stone || 0) - (config.baseStoneCost || 0));
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
            ],
            constructionQueue: [...(prev.constructionQueue || []), newProject]
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
      setIsInspectorOpen(true);
      return;
    }

    const clickedCompany = gameState.companies.find(c => {
      const config = BUILDING_CONFIGS[c.type];
      return config && x >= c.x && x < c.x + config.width && y >= c.y && y < c.y + config.height;
    });

    if (clickedCompany) {
      setSelectedBuildingId(clickedCompany.id);
      setIsInspectorOpen(true);
      return;
    }

    setSelectedBuildingId(null);
    setIsInspectorOpen(false);
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
    setIsInspectorOpen(false);
  };

  const handleUpgradeBuilding = (id: string) => {
    // V0.5 Builder availability check
    const busyBuilders = gameState.constructionQueue?.length || 0;
    const totalBuilders = 2 + (gameState.buildings.filter(b => b.type === "builder_company" && !(gameState.constructionQueue || []).some(cq => cq.buildingId === b.id)).length);
    if (busyBuilders >= totalBuilders) {
      alert("👷 All builders are busy! Wait for existing projects to complete.");
      return;
    }

    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === id);
      if (!b) return prev;

      // Ensure building is not already in upgrade/construction queue
      const isBusy = (prev.constructionQueue || []).some(cq => cq.buildingId === id);
      if (isBusy) {
        alert("👷 Building is already under construction or upgrade!");
        return prev;
      }

      const config = BUILDING_CONFIGS[b.type];
      const moneyCost = Math.floor(config.baseCost * Math.pow(1.6, b.level));
      const ironCost = Math.floor((config.baseIronCost || 0) * Math.pow(1.4, b.level));
      const stoneCost = Math.floor((config.baseStoneCost || 0) * Math.pow(1.4, b.level));
      const mortarCost = Math.floor((config.baseMortarCost || 0) * Math.pow(1.4, b.level));
      const woodCost = Math.floor((config.baseWoodCost || 0) * Math.pow(1.4, b.level));

      const hasResources = 
        prev.money >= moneyCost &&
        (prev.resources.iron_ore || 0) >= ironCost &&
        (prev.resources.stone || 0) >= stoneCost &&
        (prev.resources.mortar || 0) >= mortarCost &&
        (prev.resources.wood || 0) >= woodCost;

      if (hasResources) {
        const updatedResources = { ...prev.resources };
        updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - ironCost);
        updatedResources.stone = Math.max(0, (updatedResources.stone || 0) - stoneCost);
        updatedResources.mortar = Math.max(0, (updatedResources.mortar || 0) - mortarCost);
        updatedResources.wood = Math.max(0, (updatedResources.wood || 0) - woodCost);

        const baseDuration = (() => {
          if (config.category === "extractor") return 12;
          if (config.category === "factory") return 18;
          if (config.category === "retail") return 8;
          if (config.category === "service") return 14;
          return 10;
        })();
        const duration = baseDuration * b.level;

        const newProject = {
          id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          buildingId: id,
          type: "upgrade" as const,
          timeRemaining: duration,
          totalTime: duration
        };

        return {
          ...prev,
          money: prev.money - moneyCost,
          resources: updatedResources,
          constructionQueue: [...(prev.constructionQueue || []), newProject]
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

    // V0.6 Promotion rules:
    // Shop -> Showroom: Level 15 + Expansion-related skill level 3
    // Showroom -> Dealership: Level 30 + Expansion-related skill level 5
    
    // Dynamic lookup helper for expansion skill IDs
    const getExpansionSkillId = (buildingType: string): string => {
      if (buildingType === "clothing_shop") return "expansion";
      if (buildingType === "furniture_shop") return "showroom_space";
      if (buildingType === "food_shop") return "seating_capacity";
      if (buildingType === "grocery_shop") return "inventory_management";
      if (buildingType === "medical_shop") return "medicine_inventory";
      if (buildingType === "electronics_shop") return "expansion";
      if (buildingType === "gas_station") return "fuel_tanks";
      if (buildingType === "interior_design_studio") return "expansion";
      if (buildingType === "architecture_firm") return "office_space";
      if (buildingType === "consulting_firm") return "expansion";
      if (buildingType === "garage") return "workshop_space";
      if (buildingType === "hotel") return "resort_expansion";
      return "expansion"; // default fallback
    };

    const expansionSkillId = getExpansionSkillId(targetB.type);
    const expansionLvl = targetB.departments?.[expansionSkillId] || 0;

    if (currentTier === 1) {
      if (targetB.level < 15) {
        alert("Progression Blocked: Building must reach Level 15 first.");
        return;
      }
      if (expansionLvl < 3) {
        alert(`Progression Blocked: Requires Expansion-related skill (${expansionSkillId}) Level 3.`);
        return;
      }
    } else if (currentTier === 2) {
      if (targetB.level < 30) {
        alert("Progression Blocked: Building must reach Level 30 first.");
        return;
      }
      if (expansionLvl < 5) {
        alert(`Progression Blocked: Requires Expansion-related skill (${expansionSkillId}) Level 5.`);
        return;
      }
    }

    setGameState(prev => {
      const b = prev.buildings.find(item => item.id === id);
      if (!b) return prev;

      const moneyCost = currentTier === 1 ? 1200 : 3500;
      const ironCost = currentTier === 1 ? 30 : 80;
      const stoneCost = currentTier === 1 ? 30 : 80;
      const mortarCost = currentTier === 1 ? 15 : 45;
      const woodCost = currentTier === 1 ? 40 : 100;

      const hasResources = 
        prev.money >= moneyCost &&
        (prev.resources.iron_ore || 0) >= ironCost &&
        (prev.resources.stone || 0) >= stoneCost &&
        (prev.resources.mortar || 0) >= mortarCost &&
        (prev.resources.wood || 0) >= woodCost;

      if (hasResources) {
        const updatedResources = { ...prev.resources };
        updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - ironCost);
        updatedResources.stone = Math.max(0, (updatedResources.stone || 0) - stoneCost);
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
  const handleUpgradeCompanySkill = (companyId: string, skillId: string) => {
    setGameState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;

      const spentPoints = Object.values(company.skills || {}).reduce((sum: number, val) => sum + (val as number), 0);
      const availablePoints = company.level - spentPoints;
      if (availablePoints <= 0) return prev;

      const currentLvl = company.skills[skillId] || 0;
      if (currentLvl >= 5) return prev; // max cap 5

      const updatedSkills = { ...company.skills, [skillId]: currentLvl + 1 };

      return {
        ...prev,
        companies: prev.companies.map(c => 
          c.id === companyId ? { ...c, skills: updatedSkills } : c
        )
      };
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
    const satisfiesBuildings = Object.entries(merger.requirements).every(([reqType, req]) => {
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

    if (!satisfiesBuildings) return false;

    // Verify construction resource costs
    const hqConfig = BUILDING_CONFIGS[merger.hqBuildingType];
    if (hqConfig) {
      const hasResources =
        gameState.money >= hqConfig.baseCost &&
        (gameState.resources.iron_ore || 0) >= hqConfig.baseIronCost &&
        (gameState.resources.stone || 0) >= hqConfig.baseStoneCost &&
        (gameState.resources.mortar || 0) >= hqConfig.baseMortarCost &&
        (gameState.resources.wood || 0) >= hqConfig.baseWoodCost;
      if (!hasResources) return false;
    }

    return true;
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

      const hqConfig = BUILDING_CONFIGS[merger.hqBuildingType];
      const updatedResources = { ...prev.resources };
      if (hqConfig) {
        updatedResources.iron_ore = Math.max(0, (updatedResources.iron_ore || 0) - hqConfig.baseIronCost);
        updatedResources.stone = Math.max(0, (updatedResources.stone || 0) - hqConfig.baseStoneCost);
        updatedResources.mortar = Math.max(0, (updatedResources.mortar || 0) - hqConfig.baseMortarCost);
        updatedResources.wood = Math.max(0, (updatedResources.wood || 0) - hqConfig.baseWoodCost);
      }

      return {
        ...prev,
        money: prev.money - (hqConfig?.baseCost || 0),
        resources: updatedResources,
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

  const totalWarehouseCapacity = 1600 + gameState.buildings.filter(b => b.type === "warehouse").reduce((sum, b) => {
    const levelMult = 1 + (b.level - 1) * 0.6;
    return sum + (BUILDING_CONFIGS.warehouse.baseCapacity || 1000) * levelMult;
  }, 0);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-xs font-mono text-neutral-500 space-y-2">
        <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Initializing RTS Logistics Simulator...</span>
      </div>
    );
  }

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

          <div className="flex items-center gap-2" title="Stone Stock">
            <Mountain className="h-4 w-4 text-stone-400" />
            <span className="text-sm font-bold font-mono text-stone-200">
              {Math.floor(gameState.resources.stone || 0)}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">Stone</span>
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

          {/* V0.5 Builders HUD indicator */}
          {(() => {
            const busy = gameState.constructionQueue?.length || 0;
            const total = 2 + (gameState.buildings.filter(b => b.type === "builder_company" && !(gameState.constructionQueue || []).some(cq => cq.buildingId === b.id)).length);
            const free = total - busy;
            return (
              <div className="flex items-center gap-2" title="Builders Status">
                <Wrench className="h-4 w-4 text-sky-400" />
                <span className="text-sm font-bold font-mono text-sky-200">
                  {free} / {total}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">Builders</span>
              </div>
            );
          })()}

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
                  </div>  </div>

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
            <div className="flex flex-col gap-4 w-full relative">
              {/* Construction/Placing mode warning indicator */}
              {(placingType || movingBuildingId) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top duration-200">
                  <span className="text-amber-300 font-medium">
                    {movingBuildingId 
                      ? "Select relocation tile on grid" 
                      : `Placing: ${placingType === "road" ? "Transit Road" : (BUILDING_CONFIGS[placingType || ""]?.name || "")}`}
                  </span>
                  <button
                    onClick={() => {
                      setPlacingType(null);
                      setMovingBuildingId(null);
                    }}
                    className="text-neutral-400 hover:text-white px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 rounded-lg text-[10px] font-bold"
                  >
                    Cancel Placement
                  </button>
                </div>
              )}

              {/* Grid visualization */}
              <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col items-center">
                <div className="text-[10px] text-neutral-500 font-mono mb-2 self-start flex justify-between w-full">
                  <span>Hover tiles to inspect. Click to select building.</span>
                  <span>GridSize: 20x20</span>
                </div>
                <div className="w-full border border-neutral-850 rounded-xl bg-neutral-950 p-1.5">
                  <div 
                    className="grid gap-[1px] bg-neutral-950 select-none w-full"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    }}
                  >
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

                          // V0.5 Road check
                          const isRoad = (gameState.roads || []).some(r => r.x === x && r.y === y);

                          const activeCell = building || company;
                          const isTopLeft = activeCell && activeCell.x === x && activeCell.y === y;
                          const activeConfig = activeCell ? BUILDING_CONFIGS[activeCell.type] : null;

                          // Placement hover states
                          let isHoverOverlay = false;
                          let isValidPlacement = false;
                          if (hoverTile && (placingType || movingBuildingId)) {
                            const configToPlace = placingType === "road"
                              ? { width: 1, height: 1 }
                              : (BUILDING_CONFIGS[placingType || ""] || (movingBuildingId ? BUILDING_CONFIGS[gameState.buildings.find(b => b.id === movingBuildingId)?.type || ""] : null));
                            if (configToPlace) {
                              const w = configToPlace.width;
                              const h = configToPlace.height;
                              if (x >= hoverTile.x && x < hoverTile.x + w && y >= hoverTile.y && y < hoverTile.y + h) {
                                isHoverOverlay = true;
                                isValidPlacement = placingType === "road"
                                  ? !activeCell && !isRoad
                                  : canPlaceBuilding(placingType || (movingBuildingId ? (gameState.buildings.find(b => b.id === movingBuildingId)?.type || "") : ""), hoverTile.x, hoverTile.y, movingBuildingId || undefined);
                              }
                            }
                          }

                          return (
                            <div
                              key={`${x}-${y}`}
                              onClick={() => handleGridClick(x, y)}
                              onMouseEnter={() => setHoverTile({ x, y })}
                              onMouseLeave={() => setHoverTile(null)}
                              title={
                                activeCell 
                                  ? `${activeConfig?.name} (L${activeCell.level})` 
                                  : depositNode 
                                    ? `${depositNode.type.replace(/_/g, " ").toUpperCase()}` 
                                    : isRoad 
                                      ? "Transit Road" 
                                      : `Tile (${x}, ${y})`
                              }
                              className={`w-full aspect-square rounded-[1px] flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                                isHoverOverlay
                                  ? isValidPlacement 
                                    ? "bg-amber-500/60 ring-1 ring-amber-400 z-20" 
                                    : "bg-rose-600/50 ring-1 ring-rose-500 z-20"
                                  : isTopLeft
                                    ? `${activeConfig?.color} shadow shadow-black/40 ring-1 ring-white/10 z-10 font-bold`
                                    : activeCell
                                      ? `${activeConfig?.color} opacity-80`
                                      : isRoad
                                        ? "bg-neutral-800 border border-neutral-700/80 shadow-inner z-10"
                                        : depositNode
                                          ? `${
                                              depositNode.type === "fertile_land" 
                                                ? "bg-emerald-950/40 border border-emerald-900/10" 
                                                : depositNode.type === "forest"
                                                  ? "bg-green-950/30 border border-green-900/10"
                                                  : depositNode.type === "iron_deposit"
                                                    ? "bg-slate-800/40 border border-slate-700/10"
                                                    : depositNode.type === "coal_deposit"
                                                      ? "bg-neutral-950/40 border border-neutral-900/10"
                                                      : depositNode.type === "limestone_deposit"
                                                        ? "bg-stone-850/40 border border-stone-800/10"
                                                        : depositNode.type === "stone_deposit"
                                                          ? "bg-stone-700/30 border border-stone-600/10"
                                                          : depositNode.type === "copper_deposit"
                                                            ? "bg-orange-950/30 border border-orange-900/10"
                                                            : depositNode.type === "silicon_deposit"
                                                              ? "bg-cyan-950/30 border border-cyan-900/10"
                                                              : depositNode.type === "uranium_deposit"
                                                                ? "bg-lime-950/40 border border-lime-800/20"
                                                                : "bg-amber-950/40 border border-amber-900/10"
                                            } font-bold`
                                          : "bg-neutral-900 hover:bg-neutral-850 border border-neutral-800/10"
                              }`}
                            >
                              {/* V0.5 Road visual dashed divider lines */}
                              {isRoad && !activeCell && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-[50%] h-[1px] bg-yellow-500/55 border-t border-dashed border-yellow-400/40" />
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

              {/* Floating Hammer Build Button */}
              {!placingType && !movingBuildingId && (
                <button
                  onClick={() => setIsBuildMenuOpen(true)}
                  className="fixed bottom-8 right-8 z-40 p-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-full shadow-2xl transition hover:scale-110 active:scale-95 flex items-center justify-center border-4 border-neutral-900 group"
                  title="Open Build Menu"
                >
                  <Hammer className="h-6 w-6 font-black animate-pulse" />
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-sans text-xs font-black uppercase tracking-wider">
                    Build
                  </span>
                </button>
              )}

              {/* Build Menu Catalog Modal */}
              {isBuildMenuOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                      <h2 className="text-sm font-black text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                        <Store className="h-4 w-4 text-amber-500" />
                        Construction Catalog
                      </h2>
                      <button
                        onClick={() => setIsBuildMenuOpen(false)}
                        className="text-neutral-400 hover:text-white font-bold text-xs bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1 rounded-lg transition"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-850 text-[10px] font-bold text-center">
                      <button
                        onClick={() => setCatalogCategory("infrastructure")}
                        className={`py-2 rounded-lg transition uppercase ${catalogCategory === "infrastructure" ? "bg-indigo-900/60 text-white font-extrabold" : "text-neutral-400 hover:text-neutral-200"}`}
                      >
                        Infra
                      </button>
                      <button
                        onClick={() => setCatalogCategory("extraction")}
                        className={`py-2 rounded-lg transition uppercase ${catalogCategory === "extraction" ? "bg-amber-900/60 text-white font-extrabold" : "text-neutral-400 hover:text-neutral-200"}`}
                      >
                        Extract
                      </button>
                      <button
                        onClick={() => setCatalogCategory("industry")}
                        className={`py-2 rounded-lg transition uppercase ${catalogCategory === "industry" ? "bg-orange-850/60 text-white font-extrabold" : "text-neutral-400 hover:text-neutral-200"}`}
                      >
                        Factory
                      </button>
                      <button
                        onClick={() => setCatalogCategory("commerce")}
                        className={`py-2 rounded-lg transition uppercase ${catalogCategory === "commerce" ? "bg-emerald-850/60 text-white font-extrabold" : "text-neutral-400 hover:text-neutral-200"}`}
                      >
                        Retail
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                      {/* V0.5 Road Building Option (Infra tab only) */}
                      {catalogCategory === "infrastructure" && (() => {
                        const isPlacing = placingType === "road";
                        const hasResources = 
                          gameState.money >= 10 &&
                          (gameState.resources.stone || 0) >= 1 &&
                          (gameState.resources.wood || 0) >= 1;
                        return (
                          <div 
                            className="p-3 rounded-xl border bg-neutral-950/45 border-neutral-850 hover:border-neutral-700 transition-all flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold flex items-center gap-1.5 text-neutral-100">
                                Transit Road
                                <span className="text-[9px] text-neutral-500 font-mono">(1x1)</span>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal max-w-[280px]">
                                Lays a road tile. Connects structures. Adds +0.5% hauling speed multiplier per tile.
                              </p>
                              <div className="flex gap-2 mt-1.5 font-mono text-[9px]">
                                <span className={gameState.money >= 10 ? "text-emerald-450" : "text-rose-400 font-bold"}>$10</span>
                                <span className={(gameState.resources.stone || 0) >= 1 ? "text-stone-400" : "text-rose-400 font-bold"}>1 Stone</span>
                                <span className={(gameState.resources.wood || 0) >= 1 ? "text-green-400" : "text-rose-400 font-bold"}>1 Wood</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setPlacingType("road");
                                setMovingBuildingId(null);
                                setIsBuildMenuOpen(false);
                              }}
                              disabled={!hasResources}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition shrink-0 ${
                                hasResources 
                                  ? "bg-amber-505 hover:bg-amber-450 text-neutral-950 font-black" 
                                  : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                              }`}
                            >
                              Build
                            </button>
                          </div>
                        );
                      })()}

                      {Object.entries(BUILDING_CONFIGS)
                        .filter(([_, config]) => {
                          if (config.category === "hq") return false;
                          
                          let mappedCategory = "";
                          if (config.category === "extractor") mappedCategory = "extraction";
                          else if (config.category === "factory") mappedCategory = "industry";
                          else if (config.category === "retail" || config.category === "service") mappedCategory = "commerce";
                          else mappedCategory = "infrastructure";

                          return mappedCategory === catalogCategory;
                        })
                        .map(([key, config]) => {
                          const cost = config.baseCost;
                          const hasResources = 
                            gameState.money >= cost &&
                            (gameState.resources.iron_ore || 0) >= (config.baseIronCost || 0) &&
                            (gameState.resources.stone || 0) >= (config.baseStoneCost || 0) &&
                            (gameState.resources.mortar || 0) >= (config.baseMortarCost || 0) &&
                            (gameState.resources.wood || 0) >= (config.baseWoodCost || 0);

                          return (
                            <div 
                              key={key}
                              className="p-3 rounded-xl border bg-neutral-950/45 border-neutral-850 hover:border-neutral-700 transition-all flex items-center justify-between animate-in fade-in-20 duration-150"
                            >
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5 text-neutral-100">
                                  <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${config.color}`} />
                                  {config.name}
                                  <span className="text-[9px] text-neutral-500 font-mono">({config.width}x{config.height})</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal max-w-[280px]">
                                  {config.description}
                                </p>
                                
                                <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5 font-mono text-[9px]">
                                  <span className={gameState.money >= cost ? "text-emerald-450" : "text-rose-450 font-bold"}>${cost}</span>
                                  {(config.baseIronCost || 0) > 0 && (
                                    <span className={(gameState.resources.iron_ore || 0) >= (config.baseIronCost || 0) ? "text-slate-350" : "text-rose-450 font-bold"}>
                                      {config.baseIronCost} Iron
                                    </span>
                                  )}
                                  {(config.baseStoneCost || 0) > 0 && (
                                    <span className={(gameState.resources.stone || 0) >= (config.baseStoneCost || 0) ? "text-stone-400" : "text-rose-450 font-bold"}>
                                      {config.baseStoneCost} Stone
                                    </span>
                                  )}
                                  {(config.baseMortarCost || 0) > 0 && (
                                    <span className={(gameState.resources.mortar || 0) >= (config.baseMortarCost || 0) ? "text-amber-500" : "text-rose-450 font-bold"}>
                                      {config.baseMortarCost} Mortar
                                    </span>
                                  )}
                                  {(config.baseWoodCost || 0) > 0 && (
                                    <span className={(gameState.resources.wood || 0) >= (config.baseWoodCost || 0) ? "text-green-400 font-semibold" : "text-rose-450 font-bold"}>
                                      {config.baseWoodCost} Wood
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setPlacingType(key);
                                  setMovingBuildingId(null);
                                  setIsBuildMenuOpen(false);
                                }}
                                disabled={!hasResources}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition shrink-0 ${
                                  hasResources 
                                    ? "bg-amber-505 hover:bg-amber-450 text-neutral-950 font-black" 
                                    : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                                }`}
                              >
                                Build
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Inspector Modal Overlay */}
              {isInspectorOpen && selectedInfo && bObj && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                      <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-amber-500 animate-bounce" />
                        Property Inspector
                      </h3>
                      <button
                        onClick={() => {
                          setIsInspectorOpen(false);
                          setSelectedBuildingId(null);
                        }}
                        className="text-neutral-400 hover:text-white font-bold text-xs bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1 rounded-lg transition"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs scrollbar-thin">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-3.5 h-3.5 rounded shrink-0 ${selectedInfo.config.color}`} />
                          <h4 className="font-black text-neutral-100 text-base truncate">{selectedInfo.config.name}</h4>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-normal">
                          {selectedInfo.config.description}
                        </p>
                      </div>

                      {/* Recipe selectors for factories */}
                      {selectedInfo.config.category === "factory" && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <span className="text-[10px] text-neutral-450 font-bold uppercase block tracking-wider">Manufacturing Recipe</span>
                          {bObj.recipeId ? (
                            <div className="text-xs font-black text-amber-400 font-mono bg-neutral-900 px-2 py-1.5 rounded border border-neutral-850">
                              🛠️ {FACTORY_RECIPES[bObj.recipeId]?.name} (Specialized)
                            </div>
                          ) : (
                            <select 
                              value={bObj.recipeId || ""}
                              onChange={(e) => handleSelectRecipe(bObj.id, e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 p-1.5 text-xs rounded font-sans"
                            >
                              <option value="">Select Recipe...</option>
                              {Object.values(FACTORY_RECIPES).map(recipe => (
                                <option key={recipe.id} value={recipe.id}>
                                  {recipe.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {bObj.recipeId && FACTORY_RECIPES[bObj.recipeId] && (
                            <div className="text-[10px] space-y-1 mt-1 text-neutral-400 font-mono">
                              <div>Inputs: {FACTORY_RECIPES[bObj.recipeId].inputs.map(i => `${i.amount}x ${RESOURCES_CONFIG[i.resource]?.name || i.resource}`).join(", ")}</div>
                              <div>Outputs: {FACTORY_RECIPES[bObj.recipeId].outputs.map(o => `${o.amount}x ${RESOURCES_CONFIG[o.resource]?.name || o.resource}`).join(", ")}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Local silo indicators */}
                      {bObj.localResources !== undefined && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-neutral-455 uppercase tracking-wider">Local Silo Storage</span>
                            <span className="font-mono text-neutral-350">{Object.values(bObj.localResources).reduce((s: number, v) => s + (v as number), 0)} / {((selectedInfo.config.baseCapacity || 100) * bObj.level)} units</span>
                          </div>

                          <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[9px] text-neutral-400">
                            {Object.entries(bObj.localResources).map(([resId, count]) => {
                              if ((count as number) <= 0) return null;
                              return (
                                <div key={resId} className="flex justify-between border-b border-neutral-900/60 pb-0.5">
                                  <span>{RESOURCES_CONFIG[resId]?.name || resId}</span>
                                  <span className="font-bold text-amber-400">{(count as number).toFixed(0)} units</span>
                                </div>
                              );
                            })}
                          </div>

                          {(() => {
                            const hasActiveShipment = (gameState.shipments || []).some(s => s.buildingId === bObj.id);
                            const activeShipment = (gameState.shipments || []).find(s => s.buildingId === bObj.id);
                            const hasLocalStock = Object.values(bObj.localResources).some(qty => (qty as number) > 0);

                            return (
                              <div className="flex gap-2 pt-1.5 flex-col">
                                <button
                                  onClick={() => handleDispatchShipment(bObj.id)}
                                  disabled={!hasLocalStock || hasActiveShipment}
                                  className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-40"
                                >
                                  📤 Dispatch Shipment
                                </button>
                                {hasActiveShipment && activeShipment && (
                                  <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800 space-y-1.5 font-mono text-[9px] w-full">
                                    <div className="flex justify-between text-[10px] font-bold text-amber-400">
                                      <span>🚚 Dispatch In Transit</span>
                                      <span>{Math.round((activeShipment.qtyDelivered / activeShipment.qty) * 100)}%</span>
                                    </div>
                                    <div className="text-neutral-450 leading-normal">
                                      Carrying: {Math.floor(activeShipment.qtyDelivered)} / {Math.floor(activeShipment.qty)} {RESOURCES_CONFIG[activeShipment.resource]?.name || activeShipment.resource}
                                    </div>
                                    <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden border border-neutral-800">
                                      <div 
                                        className="bg-amber-500 h-full transition-all"
                                        style={{ width: `${(activeShipment.qtyDelivered / activeShipment.qty) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Factory Target Quotas */}
                      {selectedInfo.config.category === "factory" && bObj.productionQuota !== undefined && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <span className="text-[10px] text-neutral-450 font-bold uppercase block tracking-wider">Production Limit Target</span>
                          <div className="flex items-center gap-1.5">
                            {[-1, 50, 100, 250, 500].map(quotaVal => (
                              <button
                                key={quotaVal}
                                onClick={() => handleSetProductionQuota(bObj.id, quotaVal)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition ${
                                  bObj.productionQuota === quotaVal 
                                    ? "bg-amber-505 text-neutral-950" 
                                    : "bg-neutral-900 hover:bg-neutral-850 text-neutral-400 border border-neutral-850"
                                }`}
                              >
                                {quotaVal === -1 ? "Infinite" : quotaVal}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Farming committed grow cycles */}
                      {selectedInfo.config.id === "agricultural_farm" && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <span className="text-[10px] text-neutral-455 font-bold uppercase block tracking-wider">Committed Agricultural Crops</span>
                          
                          {bObj.cropCycleSelected ? (
                            <div className="space-y-1.5 p-2 bg-neutral-900 rounded border border-neutral-850 font-mono text-[10px]">
                              <div className="flex justify-between items-center text-neutral-300">
                                <span>Active Crop:</span>
                                <span className="text-emerald-400 font-bold uppercase">{bObj.cropCycleSelected}</span>
                              </div>
                              <div className="flex justify-between items-center text-neutral-450">
                                <span>Cycle Progress:</span>
                                <span>{(bObj.cropCycleProgress || 0).toFixed(0)} / 60 seconds</span>
                              </div>
                              <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, ((bObj.cropCycleProgress || 0) / 60) * 100)}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSelectFarmCrop(bObj.id, "food")}
                                className="flex-1 py-2 bg-neutral-900 border border-neutral-850 hover:border-amber-500 rounded-xl transition text-[10px] font-extrabold flex flex-col items-center"
                              >
                                <span className="text-base mb-0.5">🌾</span>
                                Grow Food (Crops)
                              </button>
                              <button
                                onClick={() => handleSelectFarmCrop(bObj.id, "cotton")}
                                className="flex-1 py-2 bg-neutral-900 border border-neutral-850 hover:border-amber-500 rounded-xl transition text-[10px] font-extrabold flex flex-col items-center"
                              >
                                <span className="text-base mb-0.5">🌱</span>
                                Grow Cotton (Cotton)
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Structural Integrity repairs */}
                      {bObj.integrity !== undefined && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-neutral-300 uppercase tracking-wider">Structural Integrity</span>
                            <span className={`font-mono font-bold ${(bObj.integrity ?? 100) > 50 ? "text-emerald-450" : (bObj.integrity ?? 100) > 20 ? "text-amber-450" : "text-rose-500 font-black animate-pulse"}`}>
                              {Math.floor(bObj.integrity ?? 100)}%
                            </span>
                          </div>

                          <div className="w-full bg-neutral-900 border border-neutral-800 rounded-full h-2 overflow-hidden">
                            <div className={`h-full transition-all ${(bObj.integrity ?? 100) > 50 ? "bg-emerald-500" : (bObj.integrity ?? 100) > 20 ? "bg-amber-500" : "bg-rose-600"}`} style={{ width: `${bObj.integrity ?? 100}%` }} />
                          </div>

                          {(bObj.integrity ?? 100) < 100 && (() => {
                            const currentIntegrity = bObj.integrity ?? 100;
                            const repairCost = Math.max(10, Math.floor(selectedInfo.config.baseCost * 0.15 * (1 - currentIntegrity / 100)));
                            const canAffordRepair = gameState.money >= repairCost;

                            return (
                              <button
                                onClick={() => handleRepairBuilding(bObj.id)}
                                disabled={!canAffordRepair}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                                  canAffordRepair ? "bg-blue-650 hover:bg-blue-600 text-white shadow-md" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                }`}
                              >
                                🔧 Repair Structure (Cost: ${repairCost})
                              </button>
                            );
                          })()}
                        </div>
                      )}

                      {/* Business & Corporate HQ dynamic skills */}
                      {!selectedInfo.isCompany ? (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Business Skills</span>
                            <button
                              onClick={() => handleRestructureDepartments(bObj.id)}
                              className="text-[9px] text-rose-450 hover:text-rose-350 transition font-bold"
                            >
                              🔄 Reset Skills ($1,000)
                            </button>
                          </div>
                          
                          {(() => {
                            let skillsList: any[] = [];
                            if (selectedInfo.config.category === "extractor") {
                              const unique = UNIQUE_EXTRACTOR_SKILLS[selectedInfo.config.id] || [];
                              skillsList = [...UNIVERSAL_EXTRACTOR_SKILLS, ...unique];
                            } else if (selectedInfo.config.category === "factory") {
                              skillsList = BUSINESS_SKILLS.factory || [];
                            } else {
                              skillsList = BUSINESS_SKILLS[selectedInfo.config.id] || [];
                            }
                            const maxDP = bObj.level;
                            const spentDP = Object.values(bObj.departments || {}).reduce((sum: number, val) => sum + (val as number), 0);
                            const availableDP = maxDP - spentDP;

                            return (
                              <div className="space-y-2">
                                <div className="text-[10px] font-mono flex justify-between bg-neutral-900 px-2 py-1 rounded text-neutral-350">
                                  <span>Available Points:</span>
                                  <span className={availableDP > 0 ? "text-amber-400 font-extrabold text-[11px]" : "text-neutral-500"}>
                                    {availableDP} / {maxDP} pts
                                  </span>
                                </div>

                                {skillsList.map(skill => {
                                  const currentLvl = bObj.departments?.[skill.id] || 0;
                                  return (
                                    <div key={skill.id} className="bg-neutral-900/40 p-2 rounded border border-neutral-850 space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-neutral-200 text-[10px]">{skill.name}</span>
                                        <button
                                          onClick={() => handleUpgradeDepartment(bObj.id, skill.id)}
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
                                      
                                      <div className="flex gap-0.5 h-1">
                                        {[1, 2, 3, 4, 5].map(idx => (
                                          <div 
                                            key={idx} 
                                            className={`flex-1 rounded-sm ${idx <= currentLvl ? "bg-amber-400" : "bg-neutral-850"}`} 
                                          />
                                        ))}
                                      </div>
                                      
                                      <p className="text-[9px] text-neutral-400 leading-normal font-sans">
                                        {skill.description}
                                      </p>
                                      
                                      <div className="text-[8px] font-mono text-neutral-500 flex justify-between pt-0.5 border-t border-neutral-850/45">
                                        <span className="text-amber-400/80">{skill.effectDescription}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Corporate HQ Skills</span>
                          </div>

                          <div className="border-t border-neutral-850 pt-2 space-y-1.5">
                            {(() => {
                              const mergerId = bObj.type.replace("_hq", "");
                              const uniqueCorp = UNIQUE_CORPORATE_SKILLS[mergerId] || [];
                              const corpSkillsList = [...UNIVERSAL_CORPORATE_SKILLS, ...uniqueCorp];
                              
                              const spentPoints = Object.values(bObj.skills || {}).reduce((sum: number, val) => sum + (val as number), 0);
                              const availablePoints = bObj.level - spentPoints;

                              return (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-neutral-400 font-bold uppercase text-[9px] block tracking-wider">Corporate Skills</span>
                                    <span className="font-mono text-[9px] text-amber-400 font-bold">
                                      Available: {availablePoints} / {bObj.level} pts
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                    {corpSkillsList.map(skill => {
                                      const currentLvl = bObj.skills?.[skill.id] || 0;
                                      return (
                                        <div key={skill.id} className="bg-neutral-900 p-2 rounded-xl border border-neutral-850 space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span className="font-bold text-neutral-200 text-[10px]">{skill.name}</span>
                                            <button
                                              onClick={() => handleUpgradeCompanySkill(bObj.id, skill.id)}
                                              disabled={availablePoints <= 0 || currentLvl >= 5}
                                              className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition ${
                                                availablePoints > 0 && currentLvl < 5
                                                  ? "bg-amber-505 hover:bg-amber-400 text-neutral-950 font-black"
                                                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                              }`}
                                            >
                                              Upgrade (L{currentLvl})
                                            </button>
                                          </div>
                                          <div className="flex gap-0.5 h-1">
                                            {[1, 2, 3, 4, 5].map(idx => (
                                              <div 
                                                key={idx} 
                                                className={`flex-1 rounded-sm ${idx <= currentLvl ? "bg-amber-400" : "bg-neutral-850"}`} 
                                              />
                                            ))}
                                          </div>
                                          <p className="text-[8px] text-neutral-450 leading-normal">{skill.description}</p>
                                          <div className="text-[7.5px] font-mono text-amber-500/80">{skill.effectDescription}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Upgrade & Tier actions */}
                      <div className="border-t border-neutral-800 pt-3 space-y-3 font-mono text-[10px] text-neutral-300">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Upgrade Level:</span>
                          <span className="text-white font-bold">{bObj.level}</span>
                        </div>
                        {bObj.progressionLevel !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Current Tier:</span>
                            <span className="text-amber-400 font-extrabold uppercase">
                              {bObj.progressionLevel === 1 ? "Shop" : bObj.progressionLevel === 2 ? "Showroom" : "Dealership"}
                            </span>
                          </div>
                        )}

                        <div className="space-y-2 pt-1 font-sans">
                          {/* Level Up grade action */}
                          {!selectedInfo.isCompany ? (() => {
                            const upgradeMoneyCost = Math.floor(selectedInfo.config.baseCost * Math.pow(1.6, bObj.level));
                            const upgradeIronCost = Math.floor((selectedInfo.config.baseIronCost || 0) * Math.pow(1.4, bObj.level));
                            const upgradestoneCost = Math.floor((selectedInfo.config.baseStoneCost || 0) * Math.pow(1.4, bObj.level));
                            const upgradeMortarCost = Math.floor((selectedInfo.config.baseMortarCost || 0) * Math.pow(1.4, bObj.level));
                            const upgradeWoodCost = Math.floor((selectedInfo.config.baseWoodCost || 0) * Math.pow(1.4, bObj.level));

                            const hasResourcesToUpgrade = 
                              gameState.money >= upgradeMoneyCost &&
                              (gameState.resources.iron_ore || 0) >= upgradeIronCost &&
                              (gameState.resources.stone || 0) >= upgradestoneCost &&
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
                                  {upgradestoneCost > 0 && (
                                    <span className={(gameState.resources.stone || 0) >= upgradestoneCost ? "text-stone-400" : "text-rose-450 font-bold"}>
                                      {upgradestoneCost} Stone
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
                            </div>
                          )}

                          {/* Progression promotion action */}
                          {!selectedInfo.isCompany && bObj.progressionLevel !== undefined && bObj.progressionLevel < 3 && (() => {
                            const currentTier = bObj.progressionLevel || 1;
                            const progressMoneyCost = currentTier === 1 ? 1200 : 3500;
                            const progressIronCost = currentTier === 1 ? 30 : 80;
                            const progressStoneCost = currentTier === 1 ? 30 : 80;
                            const progressMortarCost = currentTier === 1 ? 15 : 45;

                            const hasResourcesToProgress = 
                              gameState.money >= progressMoneyCost &&
                              (gameState.resources.iron_ore || 0) >= progressIronCost &&
                              (gameState.resources.stone || 0) >= progressStoneCost &&
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
                                  <span className={(gameState.resources.stone || 0) >= progressStoneCost ? "text-stone-400" : "text-rose-450 font-bold"}>
                                    {progressStoneCost} Stone
                                  </span>
                                  <span className={(gameState.resources.mortar || 0) >= progressMortarCost ? "text-amber-500" : "text-rose-450 font-bold"}>
                                    {progressMortarCost} Mortar
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Relocation and Demolition actions */}
                          <div className="grid grid-cols-2 gap-2 mt-2 font-sans">
                            <button
                              onClick={() => {
                                setMovingBuildingId(bObj.id);
                                setPlacingType(null);
                                setIsInspectorOpen(false);
                              }}
                              className="py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl font-bold text-center text-xs transition"
                            >
                              Move Location
                            </button>
                            {!selectedInfo.isCompany && (
                              <button
                                onClick={() => handleDemolish(bObj.id)}
                                className="py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 rounded-xl font-bold flex items-center justify-center gap-1 text-xs transition"
                              >
                                <Trash2 className="h-3 w-3" />
                                Demolish
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

              {(() => {
                const hasLogisticsHq = gameState.buildings.some(b => b.type === "logistics_hq" && !(gameState.constructionQueue || []).some(cq => cq.buildingId === b.id));
                if (!hasLogisticsHq) {
                  return (
                    <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-850 text-center space-y-2">
                      <Truck className="h-6 w-6 text-neutral-600 mx-auto" />
                      <h4 className="text-[11px] font-bold text-neutral-350">🔒 Logistics HQ Operations Offline</h4>
                      <p className="text-[9px] text-neutral-500 max-w-sm mx-auto leading-normal">
                        You must construct a **Logistics HQ Operations** center (under the Infrastructure catalog tab) to purchase cargo trucks and upgrade fleet stats.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
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
                  </>
                );
              })()}
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

                {(() => {
                  const activeTradeCenters = gameState.buildings.filter(b => b.type === "trade_center" && !(gameState.constructionQueue || []).some(cq => cq.buildingId === b.id));
                  const hasTradeCenter = activeTradeCenters.length > 0;
                  const tradeCenterLvl = activeTradeCenters[0]?.level || 1;
                  const maxActiveImports = 1 + tradeCenterLvl;
                  const activeImportsCount = gameState.imports?.length || 0;

                  if (!hasTradeCenter) {
                    return (
                      <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-850 text-center space-y-2">
                        <Compass className="h-6 w-6 text-neutral-600 mx-auto" />
                        <h4 className="text-[11px] font-bold text-neutral-350">🔒 International Trade Terminal Locked</h4>
                        <p className="text-[9px] text-neutral-500 max-w-sm mx-auto leading-normal">
                          You must construct an **International Trade Center** (under the Infrastructure catalog tab) to unlock material imports.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="text-[9px] font-mono text-neutral-400 bg-neutral-950 p-1.5 px-3 rounded border border-neutral-850 flex justify-between">
                        <span>Trade Center L{tradeCenterLvl}</span>
                        <span className={activeImportsCount >= maxActiveImports ? "text-rose-400 font-bold" : "text-emerald-400"}>
                          Active Cargo Slots: {activeImportsCount} / {maxActiveImports} used
                        </span>
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
                            const isSlotFull = activeImportsCount >= maxActiveImports;

                            return (
                              <div key={resId} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 flex flex-col justify-between h-24">
                                <div>
                                  <span className="font-bold text-neutral-300 block truncate">{cfg.name}</span>
                                  <span className="text-neutral-500 text-[9px] block">Order: 50x</span>
                                  <span className="text-amber-500 text-[9px] font-bold block">${totalCost.toFixed(0)}</span>
                                </div>
                                
                                <button
                                  onClick={() => {
                                    if (activeImportsCount >= maxActiveImports) {
                                      alert("Trade slots full! Upgrade your Trade Center to unlock more slots.");
                                      return;
                                    }
                                    setGameState(prev => {
                                      const newImport = {
                                        id: `imp-${Date.now()}-${Math.floor(Math.random() * 1050)}`,
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
                                  disabled={!canAfford || isSlotFull}
                                  className="w-full mt-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/30 rounded text-[9px] font-bold disabled:opacity-30 text-center"
                                >
                                  {isSlotFull ? "Slots Full" : "Order"}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}

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
              {(() => {
                const pendingBuilding = gameState.buildings.find(b => b.id === pendingFactoryPlacementId);
                const factoryConfig = pendingBuilding ? BUILDING_CONFIGS[pendingBuilding.type] : null;
                const allowed = factoryConfig?.allowedRecipes || [];

                return Object.values(FACTORY_RECIPES)
                  .filter(recipe => allowed.includes(recipe.id))
                  .map(recipe => (
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
                  ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
