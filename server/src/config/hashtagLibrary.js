/**
 * Curated sector-specific hashtag library
 * Used as transparent fallback when no live trending API key is configured.
 * All tags returned from this library are strictly labeled with source: "curated"
 */
export const SECTOR_HASHTAG_LIBRARY = {
  sustainability: [
    '#ClimateAction',
    '#SustainableDevelopment',
    '#NGOImpact',
    '#ForTheEarth',
    '#ActOnClimate',
    '#SustainabilityNow',
    '#GreenFuture',
  ],
  reforestation: [
    '#TreePlanting',
    '#Reforestation',
    '#PlantTrees',
    '#ForestRestoration',
    '#GreenCanopy',
    '#Afforestation',
    '#EcosystemRecovery',
  ],
  ocean_cleanup: [
    '#OceanCleanup',
    '#SaveOurSeas',
    '#BeatPlasticPollution',
    '#CoastalRestoration',
    '#CleanOceans',
    '#MarineConservation',
    '#PlasticFree',
  ],
  water_sanitation: [
    '#CleanWaterForAll',
    '#WaterSanitation',
    '#SafeWater',
    '#WASHImpact',
    '#WaterAccess',
    '#CommunityHealth',
  ],
  renewable_energy: [
    '#CleanEnergy',
    '#RenewableEnergy',
    '#SolarImpact',
    '#OffGridEnergy',
    '#EnergyTransition',
    '#ZeroEmissions',
  ],
  agriculture: [
    '#RegenerativeAgriculture',
    '#SustainableFarming',
    '#FoodSecurity',
    '#SoilHealth',
    '#FarmersFirst',
    '#Agroforestry',
  ],
  wildlife: [
    '#WildlifeConservation',
    '#Biodiversity',
    '#HabitatProtection',
    '#EndangeredSpecies',
    '#ProtectWildlife',
  ],
  community_infrastructure: [
    '#CommunityEmpowerment',
    '#SustainableInfrastructure',
    '#RuralDevelopment',
    '#LocalImpact',
    '#GrassrootsChange',
  ],
  default: [
    '#ImpactEvidence',
    '#VerifiedImpact',
    '#FieldWork',
    '#SocialGood',
    '#Sustainability',
    '#NGOCommunity',
  ],
};

/**
 * Returns curated tags for a given sector
 * @param {string} sector
 */
export const getCuratedHashtagsForSector = (sector = '') => {
  const normalized = (sector || '').toLowerCase().replace(/[\s-]+/g, '_');
  
  for (const [key, tags] of Object.entries(SECTOR_HASHTAG_LIBRARY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return tags;
    }
  }

  return SECTOR_HASHTAG_LIBRARY.default;
};
