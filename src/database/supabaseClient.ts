import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to save game state to local storage or Supabase
export interface GameState {
  id: string;
  money: number;
  resources: Record<string, number>; // Dynamic resources map for all items (iron_ore, fuel, steel, etc.)
  buildings: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    level: number;
    // Progression level: 1 = Retail Shop / Office, 2 = Showroom / Professional Firm, 3 = Dealership / Corporate Office
    progressionLevel?: number;
    recipeId?: string; // Selected manufacturing recipe
    
    // V0.3 Extractor/Farm Local Storage and Crop cycles
    localResources?: Record<string, number>;
    cropCycleSelected?: "food" | "cotton" | null;
    cropCycleProgress?: number; // Time elapsed in seconds (e.g. 0 to 60)
    integrity?: number; // Building integrity percent (0 to 100)
    productionQuota?: number; // V0.3 Factory target threshold (-1 = infinite)
    departments?: Record<string, number>; // V0.4 Allocated levels for success factors
  }>;
  companies: Array<{
    id: string;
    type: string; // HQ building type
    x: number;
    y: number;
    level: number;
    revenue: number;
    profit: number;
    skills: {
      production: number;
      marketing: number;
      finance: number;
    };
    qualityScore?: number; // V0.4 Merger Quality inherited from components
  }>;
  skills: {
    production: number;
    marketing: number;
    finance: number;
  };
  unlocked_land: number;
  depositNodes: Array<{
    x: number;
    y: number;
    type: "iron_deposit" | "coal_deposit" | "oil_field" | "limestone_deposit" | "fertile_land" | "forest" | "stone_deposit" | "copper_deposit" | "silicon_deposit" | "uranium_deposit";
  }>;
  vehicles: Array<{
    id: string;
    type: string; // 'pickup', 'delivery_van', 'medium_truck', 'heavy_truck'
    speedLevel: number;
    capacityLevel: number;
    fuelLevel: number;
  }>;
  // V0.3 Imports queue
  imports?: Array<{
    id: string;
    resource: string;
    qty: number;
    timeRemaining: number; // in seconds
  }>;
  // V0.3 Dispatch-based shipments queue
  shipments?: Array<{
    id: string;
    buildingId: string;
    resource: string;
    qty: number;
    qtyDelivered: number;
  }>;
  // V0.5 Builder Queue and Roads
  buildersCount?: number;
  constructionQueue?: Array<{
    id: string;
    buildingId: string;
    type: "construct" | "upgrade";
    timeRemaining: number; // in seconds
    totalTime: number; // original time duration
  }>;
  roads?: Array<{
    x: number;
    y: number;
  }>;
}

export async function saveGame(state: GameState): Promise<boolean> {
  // Always save to localStorage as local backup
  localStorage.setItem("business_empire_save", JSON.stringify(state));

  if (!supabase) {
    console.log("Supabase not configured, saved to localStorage.");
    return true;
  }

  try {
    const { error } = await supabase
      .from("game_saves")
      .upsert({
        id: state.id,
        money: state.money,
        resources: state.resources,
        buildings: state.buildings,
        companies: state.companies,
        skills: state.skills,
        unlocked_land: state.unlocked_land,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error saving game to Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception saving game to Supabase:", err);
    return false;
  }
}

function sanitizeGameState(state: any): GameState {
  if (!state) return state;
  
  // Remove duplicates from companies array
  if (Array.isArray(state.companies)) {
    const seenCompanies = new Set<string>();
    state.companies = state.companies.filter((c: any) => {
      if (!c || !c.id) return false;
      if (seenCompanies.has(c.id)) return false;
      seenCompanies.add(c.id);
      return true;
    });
  }

  // Remove duplicates from buildings array
  if (Array.isArray(state.buildings)) {
    const seenBuildings = new Set<string>();
    state.buildings = state.buildings.filter((b: any) => {
      if (!b || !b.id) return false;
      if (seenBuildings.has(b.id)) return false;
      seenBuildings.add(b.id);
      return true;
    });
  }

  return state as GameState;
}

export async function loadGame(id: string): Promise<GameState | null> {
  // Try to load from Supabase first if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("game_saves")
        .select("*")
        .eq("id", id)
        .single();

      if (data && !error) {
        return sanitizeGameState({
          id: data.id,
          money: Number(data.money),
          resources: data.resources,
          buildings: data.buildings,
          companies: data.companies,
          skills: data.skills,
          unlocked_land: data.unlocked_land || 100,
          depositNodes: data.depositNodes || [],
          vehicles: data.vehicles || [],
        });
      }
    } catch (err) {
      console.warn("Could not load from Supabase, trying localStorage...", err);
    }
  }

  // Fallback to localStorage
  const localSave = localStorage.getItem("business_empire_save");
  if (localSave) {
    try {
      const parsed = JSON.parse(localSave);
      return sanitizeGameState(parsed);
    } catch (e) {
      console.error("Error parsing local save:", e);
    }
  }

  return null;
}
