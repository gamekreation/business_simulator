import { BUILDING_CONFIGS, BuildingConfig, RESOURCES_CONFIG, FACTORY_RECIPES, VEHICLE_CONFIGS } from "../buildings/buildingConfig";
import { GameState } from "../database/supabaseClient";

export interface TickResult {
  nextState: GameState;
  revenueThisTick: number;
  expensesThisTick: number;
  profitThisTick: number;
  logs: string[];
}

export function runSimulationTick(state: GameState): TickResult {
  // Deep clone state
  const nextState: GameState = JSON.parse(JSON.stringify(state));
  const logs: string[] = [];
  const workingBuildingIds = new Set<string>();

  let revenueThisTick = 0;
  let expensesThisTick = 0;

  // Initialize missing resource fields to 0 if not present
  Object.keys(RESOURCES_CONFIG).forEach(resId => {
    if (nextState.resources[resId] === undefined) {
      nextState.resources[resId] = 0;
    }
  });

  // 1. Calculate Warehouse Volume Storage limits
  // Base warehouse capacity if no warehouses is 200 volume.
  // Each warehouse adds its baseCapacity * level multiplier
  const warehouses = nextState.buildings.filter(b => b.type === "warehouse");
  const baseWarehouseCap = 200;
  const warehouseBonus = warehouses.reduce((sum, b) => {
    const levelMult = 1 + (b.level - 1) * 0.6; // +60% capacity per upgrade level
    const config = BUILDING_CONFIGS.warehouse;
    return sum + (config.baseCapacity || 1000) * levelMult;
  }, 0);
  // V0.4 Factory Silo department bonus (+50 VU max cap per point)
  const factorySiloBonus = nextState.buildings
    .filter(b => BUILDING_CONFIGS[b.type]?.category === "factory")
    .reduce((sum, b) => {
      const deptSilo = b.departments?.silo || 0;
      return sum + (deptSilo * 50);
    }, 0);
  const maxStorageVolume = baseWarehouseCap + warehouseBonus + factorySiloBonus;

  // Helper: Calculate current storage volume used
  const getUsedVolume = (resMap: Record<string, number>): number => {
    return Object.entries(resMap).reduce((sum, [resId, qty]) => {
      const config = RESOURCES_CONFIG[resId];
      if (!config) return sum;
      return sum + qty * config.volume;
    }, 0);
  };

  const currentUsedVolume = getUsedVolume(nextState.resources);

  // 2. Global Player Modifiers
  const playerProdSkill = nextState.skills.production || 0;
  const playerMktSkill = nextState.skills.marketing || 0;
  const playerFinSkill = nextState.skills.finance || 0;

  const playerProdSpeedBonus = playerProdSkill * 0.1; // +10% per level
  const playerMktPriceBonus = playerMktSkill * 0.1; // +10% sell price per level
  const playerFinCostReduction = Math.min(0.5, playerFinSkill * 0.08); // -8% maintenance cost per level (max 50%)

  // Check if player has Bank building(s) (collects automatic money & yields 5% profit bonus per bank, max 15%)
  const bankCount = nextState.buildings.filter(b => b.type === "bank").length;
  const bankProfitBonus = Math.min(0.15, bankCount * 0.05);

  // Check if player has Logistics trucks (each vehicle adds delivery speed bonus)
  // Let's sum logistics vehicle speed boosts
  let deliverySpeedBonus = 0;
  nextState.vehicles.forEach(veh => {
    // base speed bonus + upgrade level bonuses
    if (veh.type === "pickup") deliverySpeedBonus += 0.1 + (veh.speedLevel * 0.02);
    else if (veh.type === "delivery_van") deliverySpeedBonus += 0.25 + (veh.speedLevel * 0.04);
    else if (veh.type === "medium_truck") deliverySpeedBonus += 0.45 + (veh.speedLevel * 0.06);
    else if (veh.type === "heavy_truck") deliverySpeedBonus += 0.70 + (veh.speedLevel * 0.10);
  });

  // Check if player has Tourism Office (+20% customer reach/demand)
  const tourismCount = nextState.buildings.filter(b => b.type === "travel_tourism").length;
  const tourismMultiplier = 1 + tourismCount * 0.20;

  // 3. Initialize Building integrity if missing
  nextState.buildings.forEach(b => {
    if (b.integrity === undefined) {
      b.integrity = 100;
    }
  });

  // 4. Extractor Node Production (Iron Mine, Quarry, Oil Rig, Coal Shaft, Farm)
  // Extractors must be built on matching natural deposit nodes.
  nextState.buildings.forEach(b => {
    const config = BUILDING_CONFIGS[b.type];
    if (!config || config.category !== "extractor") return;

    // V0.3 Agriculture Farm handles its crop growth cycle separately!
    if (b.type === "agricultural_farm") return;

    // Verify integrity (0% stops production)
    if (b.integrity !== undefined && b.integrity <= 0) return;

    // Initialize local storage properties
    if (!b.localResources) {
      b.localResources = {};
    }

    // Verify if there is a matching deposit node at the building coordinates
    const depositMatched = nextState.depositNodes.some(
      node => node.x === b.x && node.y === b.y && node.type === config.requiredDepositNode
    ) || nextState.depositNodes.some(
      node => node.x >= b.x && node.x < b.x + config.width && node.y >= b.y && node.y < b.y + config.height && node.type === config.requiredDepositNode
    );

    // If matching deposit node exists, produce resources. If not, operates at 20% efficiency.
    const efficiency = depositMatched ? 1.0 : 0.2;
    const levelMult = 1 + (b.level - 1) * 0.5;
    const baseRate = config.baseProductionRate || 2;
    // V0.4 Extractor Department: Extraction Efficiency
    const deptEfficiency = b.departments?.efficiency || 0;
    const prodRate = baseRate * levelMult * (1 + playerProdSpeedBonus + deptEfficiency * 0.15) * efficiency;

    const resId = config.producesResource;
    if (resId && RESOURCES_CONFIG[resId]) {
      // V0.4 Extractor Department: Silo Capacity (+25 space per point)
      const deptCapacity = b.departments?.capacity || 0;
      const localCap = (100 * b.level) + (deptCapacity * 25);
      
      const currentLocal = b.localResources[resId] || 0;
      const spaceLeft = Math.max(0, localCap - currentLocal);
      const addedQty = Math.min(prodRate, spaceLeft);

      if (addedQty > 0) {
        b.localResources[resId] = currentLocal + addedQty;
        workingBuildingIds.add(b.id);
      } else if (prodRate > 0 && spaceLeft <= 0) {
        if (Math.random() < 0.1) {
          logs.push(`${config.name} storage full! Production halted.`);
        }
      }
    }
  });

  // 5. Factory Production (Manufacturing)
  // Factories consume raw/processed items and output finished items based on selected recipe.
  nextState.buildings.forEach(b => {
    const config = BUILDING_CONFIGS[b.type];
    if (!config || config.category !== "factory") return;

    // Verify integrity (0% stops production)
    if (b.integrity !== undefined && b.integrity <= 0) return;

    // Progression/Level modifiers
    const levelMult = 1 + (b.level - 1) * 0.4;
    // Factory size speed/consumption scaling
    const factoryRate = config.baseProductionRate || 1; // Small: 1x, Medium: 2.2x, Large: 5x

    // V0.4 Factory Department: Automation & Robotics (+15% processing speed per level)
    const deptAutomation = b.departments?.automation || 0;
    const speedCoeff = factoryRate * levelMult * (1 + playerProdSpeedBonus + deptAutomation * 0.15);

    // V0.4 Factory Department: Material Science (-5% material inputs per level, max -25%)
    const deptEfficiency = b.departments?.efficiency || 0;
    const inputMultiplier = Math.max(0.75, 1 - deptEfficiency * 0.05);

    // Default recipe mapping if none is selected
    let recipeId = b.recipeId;
    if (!recipeId) {
      // Assign default recipes based on size or generic defaults
      if (b.type === "large_factory") recipeId = "vehicle_assembly";
      else if (b.type === "medium_factory") recipeId = "steel_smelting";
      else recipeId = "food_processing";
    }

    const recipe = FACTORY_RECIPES[recipeId];
    if (!recipe) return;

    // V0.3 Factory Production Quota threshold check
    if (b.productionQuota !== undefined && b.productionQuota > 0) {
      const primaryOutput = recipe.outputs[0];
      if (primaryOutput) {
        const currentStock = nextState.resources[primaryOutput.resource] || 0;
        if (currentStock >= b.productionQuota) {
          // Target quota reached, factory stops!
          return;
        }
      }
    }

    // Check if we have the inputs
    let canProduce = true;
    let inputScaleLimit = speedCoeff;

    recipe.inputs.forEach(input => {
      // scaled by inputMultiplier
      const needed = input.amount * inputMultiplier * speedCoeff;
      const available = nextState.resources[input.resource] || 0;
      if (available < needed) {
        // scale down production to match available inputs
        const scale = available / (input.amount * inputMultiplier * speedCoeff);
        if (scale < inputScaleLimit) inputScaleLimit = scale;
      }
    });

    if (inputScaleLimit <= 0.05) {
      // Not enough inputs to operate
      return;
    }

    // Determine outputs and verify storage volume space
    const primaryOutput = recipe.outputs[0];
    if (primaryOutput) {
      const outputConfig = RESOURCES_CONFIG[primaryOutput.resource];
      if (outputConfig) {
        const outVol = outputConfig.volume;
        const totalAddedQty = primaryOutput.amount * inputScaleLimit;
        
        // Calculate remaining volume space in warehouse
        const currentVol = getUsedVolume(nextState.resources);
        // Exclude inputs we are about to consume to free up space (scaled by inputMultiplier)
        const inputsFreedVol = recipe.inputs.reduce((sum, input) => {
          const resConf = RESOURCES_CONFIG[input.resource];
          return sum + (input.amount * inputMultiplier * inputScaleLimit) * (resConf?.volume || 0);
        }, 0);

        const remainingVol = (maxStorageVolume - currentVol) + inputsFreedVol;
        const possibleQty = Math.max(0, remainingVol / outVol);
        const actualQty = Math.min(totalAddedQty, possibleQty);

        if (actualQty > 0) {
          // Consume inputs (scaled by inputMultiplier)
          recipe.inputs.forEach(input => {
            const consumed = input.amount * inputMultiplier * (actualQty / primaryOutput.amount);
            nextState.resources[input.resource] = Math.max(0, (nextState.resources[input.resource] || 0) - consumed);
          });

          // Produce outputs
          nextState.resources[primaryOutput.resource] = (nextState.resources[primaryOutput.resource] || 0) + actualQty;
          logs.push(`${config.name} crafted ${actualQty.toFixed(1)} ${outputConfig.name} via ${recipe.name}.`);
          workingBuildingIds.add(b.id);
        } else {
          logs.push(`Factory paused: no warehouse space for ${outputConfig.name}.`);
        }
      }
    }
  });

  // 6. Service Businesses (Interior Design, Architecture, Consulting, Garage, Hotel)
  // Generates service revenue directly based on type and progression tier (Office, Firm, Corporate)
  nextState.buildings.forEach(b => {
    const config = BUILDING_CONFIGS[b.type];
    if (!config || config.category !== "service") return;

    // Verify integrity (0% stops service billing)
    if (b.integrity !== undefined && b.integrity <= 0) return;

    let baseServiceRevenue = 0;
    if (b.type === "interior_design_studio") baseServiceRevenue = 40;
    else if (b.type === "garage") baseServiceRevenue = 55;
    else if (b.type === "architecture_firm") baseServiceRevenue = 90;
    else if (b.type === "consulting_firm") baseServiceRevenue = 120;
    else if (b.type === "hotel") baseServiceRevenue = 200;

    const levelMult = 1 + (b.level - 1) * 0.5;
    // Progression: 1 = Office (1x), 2 = Firm (2x), 3 = Corporate (4x)
    const progLevel = b.progressionLevel || 1;
    const progMult = progLevel === 3 ? 4.0 : progLevel === 2 ? 2.0 : 1.0;

    // V0.4 Service Departments: Executive Expertise (+15% per level) and Client Relations (+15% velocity per level)
    const deptExpertise = b.departments?.expertise || 0;
    const deptRelations = b.departments?.relations || 0;

    const serviceRev = baseServiceRevenue * levelMult * progMult * 
      (1 + playerMktPriceBonus + deptExpertise * 0.15) * 
      (1 + deptRelations * 0.15) * 
      tourismMultiplier;

    if (serviceRev > 0) {
      revenueThisTick += serviceRev;
      workingBuildingIds.add(b.id);
    }
  });

  // 7. Retail Sales (Selling Finished Goods)
  // Retail shops sell match resource items to customers
  nextState.buildings.forEach(b => {
    const config = BUILDING_CONFIGS[b.type];
    if (!config || config.category !== "retail") return;

    // Verify integrity (0% stops sales operations)
    if (b.integrity !== undefined && b.integrity <= 0) return;

    // Progression Multipliers: 1 = Shop (1x), 2 = Showroom (2.5x speed, 1.6x price), 3 = Dealership (6x speed, 2.5x price)
    const progLevel = b.progressionLevel || 1;
    const progSpeedMult = progLevel === 3 ? 6.0 : progLevel === 2 ? 2.5 : 1.0;
    const progPriceMult = progLevel === 3 ? 2.5 : progLevel === 2 ? 1.6 : 1.0;

    const levelMult = 1 + (b.level - 1) * 0.5;
    // V0.4 Retail Department: Retail Display (+20% sell speed per level)
    const deptDisplay = b.departments?.display || 0;
    const sellRate = (config.baseCapacity || 10) * 0.1 * levelMult * progSpeedMult * (1 + deliverySpeedBonus + deptDisplay * 0.2);

    // Map shop type to resource sold
    let itemToSell = "";
    if (b.type === "clothing_shop") itemToSell = "fabric";
    else if (b.type === "furniture_shop") itemToSell = "furniture";
    else if (b.type === "food_shop") itemToSell = "food";
    else if (b.type === "grocery_shop") {
      // Sells crops or food (sell whichever has higher quantity)
      const cropsQty = nextState.resources.fertile_land_crop || 0;
      const foodQty = nextState.resources.food || 0;
      itemToSell = cropsQty > foodQty ? "fertile_land_crop" : "food";
    } else if (b.type === "medical_shop") itemToSell = "medicine";
    else if (b.type === "gas_station") itemToSell = "fuel";
    else if (b.type === "electronics_shop") {
      const elecQty = nextState.resources.electronics || 0;
      const vehQty = nextState.resources.vehicles || 0;
      const steelQty = nextState.resources.steel || 0;

      if (vehQty > 0) itemToSell = "vehicles";
      else if (elecQty > 0) itemToSell = "electronics";
      else if (steelQty > 0) itemToSell = "steel";
    }

    const availableQty = nextState.resources[itemToSell] || 0;
    if (availableQty > 0 && itemToSell) {
      const resConfig = RESOURCES_CONFIG[itemToSell];
      if (resConfig) {
        // V0.4 Retail Department: Branding & Premium Pricing (+10% pricing per level)
        const deptBranding = b.departments?.branding || 0;
        const toSell = Math.min(sellRate, availableQty);
        const finalPrice = resConfig.basePrice * progPriceMult * (1 + playerMktPriceBonus + deptBranding * 0.10) * tourismMultiplier;
        const rev = toSell * finalPrice;

        nextState.resources[itemToSell] -= toSell;
        revenueThisTick += rev;
        logs.push(`${config.name} sold ${toSell.toFixed(1)} ${resConfig.name} for $${rev.toFixed(1)}.`);
        if (toSell > 0) {
          workingBuildingIds.add(b.id);
        }
      }
    }
  });

  // 8. Large Companies HQ (Merged Entities)
  nextState.companies.forEach(company => {
    const config = BUILDING_CONFIGS[company.type];
    if (!config) return;

    // HQ Maintenance
    const levelMult = 1 + (company.level - 1) * 0.8;
    const rawMaintenance = config.baseMaintenance * levelMult;
    const cFin = company.skills.finance || 0;
    const costReduction = Math.min(0.6, cFin * 0.12);
    const maintenance = rawMaintenance * (1 - costReduction) * (1 - playerFinCostReduction);
    expensesThisTick += maintenance;

    // HQ Revenue & Resource Consumption
    const cProd = company.skills.production || 0;
    const cMkt = company.skills.marketing || 0;

    let resourceRequired = "";
    let requiredQty = 0;
    let baseRevenue = config.baseProductionRate || 100;

    // Define HQ custom consumption loops
    if (company.type === "clothing_company_hq") {
      resourceRequired = "fabric";
      requiredQty = Math.ceil(4 * levelMult);
      baseRevenue = 250;
    } else if (company.type === "car_company_hq") {
      resourceRequired = "vehicles";
      requiredQty = Math.ceil(1 * levelMult);
      baseRevenue = 550;
    } else if (company.type === "pharma_company_hq") {
      resourceRequired = "medicine";
      requiredQty = Math.ceil(2 * levelMult);
      baseRevenue = 400;
    } else if (company.type === "petroleum_company_hq") {
      resourceRequired = "oil";
      requiredQty = Math.ceil(6 * levelMult);
      baseRevenue = 450;
    } else if (company.type === "electricity_company_hq") {
      resourceRequired = "coal";
      requiredQty = Math.ceil(5 * levelMult);
      baseRevenue = 280;
    } else if (company.type === "construction_company_hq") {
      // Passive service contracts, no input required
      baseRevenue = 350;
    } else if (company.type === "hotel_company_hq") {
      // Passive luxury hospitality, no input required
      baseRevenue = 600;
    }

    let efficiency = 0.6; // 60% baseline idle efficiency
    if (resourceRequired) {
      const available = nextState.resources[resourceRequired] || 0;
      if (available >= requiredQty) {
        nextState.resources[resourceRequired] -= requiredQty;
        efficiency = 1.0;
        logs.push(`${config.name} consumed ${requiredQty} ${resourceRequired} for 100% capacity.`);
      } else if (available > 0) {
        const fraction = available / requiredQty;
        efficiency = 0.6 + fraction * 0.4;
        nextState.resources[resourceRequired] = 0;
        logs.push(`${config.name} low on inputs. Running at ${Math.round(efficiency * 100)}% efficiency.`);
      } else {
        logs.push(`${config.name} lacks ${resourceRequired}. Operating at 60% idle capacity.`);
      }
    }

    const prodSpeedBonus = cProd * 0.15;
    const mktBonus = cMkt * 0.25;

    // V0.4 Merger Quality Score inheritance multiplier
    const qualityMult = company.qualityScore !== undefined ? (company.qualityScore / 100) : 1.0;
    const companyRevenue = baseRevenue * levelMult * efficiency * (1 + prodSpeedBonus) * (1 + mktBonus) * (1 + playerMktPriceBonus) * qualityMult;
    revenueThisTick += companyRevenue;

    company.revenue = companyRevenue;
    company.profit = companyRevenue - maintenance;
  });

  // 10. V0.3 Agriculture Farm growth cycle progress
  nextState.buildings.forEach(b => {
    if (b.type !== "agricultural_farm") return;

    // Verify integrity (0% pauses crop growth)
    if (b.integrity !== undefined && b.integrity <= 0) return;

    if (!b.localResources) b.localResources = {};

    // If a crop cycle is selected, tick it forward!
    if (b.cropCycleSelected) {
      b.cropCycleProgress = (b.cropCycleProgress || 0) + 1;
      
      const targetTime = 60; // 60 seconds cycle (snappy growth)
      if (b.cropCycleProgress >= targetTime) {
        b.cropCycleProgress = 0;
        
        // Output resource
        const resId = b.cropCycleSelected === "food" ? "fertile_land_crop" : "cotton";
        const yieldQty = 124 * b.level; // 124 base crops produced, scales with level
        
        const localCap = 100 * b.level;
        const currentLocal = b.localResources[resId] || 0;
        const spaceLeft = Math.max(0, localCap - currentLocal);
        const added = Math.min(yieldQty, spaceLeft);
        
        if (added > 0) {
          b.localResources[resId] = currentLocal + added;
          logs.push(`Farm finished crop cycle: Produced ${added.toFixed(0)}x ${RESOURCES_CONFIG[resId].name} stored in local farm silo.`);
        } else {
          logs.push(`Farm crop cycle completed but local storage silo is full! Yield lost.`);
        }

        b.cropCycleSelected = null; // Clear active crop to return farm to idle
      }
    }
  });

  // 11. V0.3 Logistics Fleet Hauling (Dispatch Shipment Queue)
  if (nextState.vehicles && nextState.vehicles.length > 0 && nextState.shipments && nextState.shipments.length > 0) {
    // Shuffle vehicles so different trucks get priority
    const shuffledVehicles = [...nextState.vehicles].sort(() => Math.random() - 0.5);

    for (const v of shuffledVehicles) {
      const cfg = VEHICLE_CONFIGS.find(vc => vc.id === v.type);
      if (!cfg) continue;

      const truckCapacity = (cfg.capacity || 50) * (1 + (v.capacityLevel - 1) * 0.25);
      
      // Find the first shipment that is not yet fully delivered
      const activeShipment = nextState.shipments.find(s => s.qtyDelivered < s.qty);
      if (!activeShipment) break;

      const resConfig = RESOURCES_CONFIG[activeShipment.resource];
      if (!resConfig) continue;

      // Calculate how much is left to carry for this shipment
      const remainingToDeliver = activeShipment.qty - activeShipment.qtyDelivered;

      // Verify remaining volume in global warehouse
      const currentVol = getUsedVolume(nextState.resources);
      const remainingVol = maxStorageVolume - currentVol;
      const spaceForItems = Math.max(0, remainingVol / resConfig.volume);

      // We haul up to the truck capacity, the remaining shipment qty, and available warehouse volume
      const amountToHaul = Math.min(remainingToDeliver, truckCapacity, spaceForItems);
      if (amountToHaul > 0) {
        activeShipment.qtyDelivered += amountToHaul;
        nextState.resources[activeShipment.resource] = (nextState.resources[activeShipment.resource] || 0) + amountToHaul;
        
        // Log origin building as active
        if (activeShipment.buildingId) {
          workingBuildingIds.add(activeShipment.buildingId);
        }
      }
    }

    // Clean up fully completed shipments
    nextState.shipments = nextState.shipments.filter(s => s.qtyDelivered < s.qty);
  }

  // 11b. V0.3 Building Wear Decay based on active status
  nextState.buildings.forEach(b => {
    // If working: wears out slower (0.12% integrity decay per tick ~800s to 0)
    // If stopped/idle: wears out faster (0.35% integrity decay per tick ~285s to 0)
    let decayRate = workingBuildingIds.has(b.id) ? 0.12 : 0.35;

    // V0.4 Department Decay Reductions (Safety / Operations)
    const config = BUILDING_CONFIGS[b.type];
    if (config) {
      if (config.category === "extractor") {
        const deptMaint = b.departments?.maintenance || 0;
        decayRate = decayRate * (1 - deptMaint * 0.12);

        // V0.4 Silo is full check -> stops extractor and freezes decay completely
        const resId = config.producesResource;
        if (resId && b.localResources) {
          const deptCapacity = b.departments?.capacity || 0;
          const localCap = (100 * b.level) + (deptCapacity * 25);
          const currentLocal = b.localResources[resId] || 0;
          if (currentLocal >= localCap) {
            decayRate = 0;
          }
        }
      } else if (config.category === "service") {
        const deptOps = b.departments?.operations || 0;
        decayRate = decayRate * (1 - deptOps * 0.12);
      } else if (config.category === "factory") {
        // V0.4 Stopped state check -> pauses factory and freezes decay completely
        const recipeId = b.recipeId || (b.type === "large_factory" ? "vehicle_assembly" : b.type === "medium_factory" ? "steel_smelting" : "food_processing");
        const recipe = FACTORY_RECIPES[recipeId];
        if (recipe) {
          const primaryOutput = recipe.outputs[0];
          if (primaryOutput) {
            // Check target quota limit
            if (b.productionQuota !== undefined && b.productionQuota > 0) {
              const currentStock = nextState.resources[primaryOutput.resource] || 0;
              if (currentStock >= b.productionQuota) {
                decayRate = 0;
              }
            }
            // Check global warehouse capacity limits
            const currentVol = getUsedVolume(nextState.resources);
            const resConfig = RESOURCES_CONFIG[primaryOutput.resource];
            if (resConfig) {
              const spaceLeft = maxStorageVolume - currentVol;
              if (spaceLeft < resConfig.volume * primaryOutput.amount) {
                decayRate = 0;
              }
            }
          }
        }
      }
    }

    b.integrity = Math.max(0, (b.integrity ?? 100) - decayRate);
  });

  // 12. V0.3 Imports Delivery countdown
  if (nextState.imports && nextState.imports.length > 0) {
    nextState.imports = nextState.imports.map(imp => {
      return {
        ...imp,
        timeRemaining: imp.timeRemaining - 1
      };
    });

    // Handle completed imports
    const completed = nextState.imports.filter(imp => imp.timeRemaining <= 0);
    completed.forEach(imp => {
      const resConfig = RESOURCES_CONFIG[imp.resource];
      if (resConfig) {
        nextState.resources[imp.resource] = (nextState.resources[imp.resource] || 0) + imp.qty;
        logs.push(`Import Order Completed: Received ${imp.qty}x ${resConfig.name} in global warehouse.`);
      }
    });

    // Remove completed orders
    nextState.imports = nextState.imports.filter(imp => imp.timeRemaining > 0);
  }

  // Apply bank bonus profit (+5% per bank, max +15%)
  if (bankProfitBonus > 0 && revenueThisTick > 0) {
    const bankBonus = revenueThisTick * bankProfitBonus;
    revenueThisTick += bankBonus;
    logs.push(`Imperial Bank gathered automatic assets yielding +${(bankProfitBonus * 100).toFixed(0)}% profit bonus (+$${bankBonus.toFixed(1)}).`);
  }

  // 9. Profit Calculation and Money Balance Update
  const profitThisTick = revenueThisTick - expensesThisTick;
  nextState.money += profitThisTick;

  if (nextState.money < 0) {
    nextState.money = 0;
  }

  return {
    nextState,
    revenueThisTick,
    expensesThisTick,
    profitThisTick,
    logs: logs.slice(0, 10),
  };
}
