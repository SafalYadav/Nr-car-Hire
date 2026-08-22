export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

/**
 * Supported rental locations across Australia.
 * Phase 3 will replace this with database-backed location management.
 */
export const locations: Location[] = [
  {
    id: 'loc-syd',
    name: 'Sydney Airport',
    city: 'Sydney',
    state: 'NSW',
    address: 'Terminal 1, Sydney Airport, Mascot NSW 2020',
  },
  {
    id: 'loc-mel',
    name: 'Melbourne Airport',
    city: 'Melbourne',
    state: 'VIC',
    address: 'Terminal 2, Melbourne Airport, Tullamarine VIC 3043',
  },
  {
    id: 'loc-bne',
    name: 'Brisbane Airport',
    city: 'Brisbane',
    state: 'QLD',
    address: 'Domestic Terminal, Brisbane Airport, Brisbane QLD 4008',
  },
  {
    id: 'loc-per',
    name: 'Perth Airport',
    city: 'Perth',
    state: 'WA',
    address: 'Terminal 1, Perth Airport, Perth WA 6105',
  },
  {
    id: 'loc-adl',
    name: 'Adelaide Airport',
    city: 'Adelaide',
    state: 'SA',
    address: 'Sir Richard Williams Ave, Adelaide SA 5950',
  },
  {
    id: 'loc-ool',
    name: 'Gold Coast Airport',
    city: 'Gold Coast',
    state: 'QLD',
    address: 'Terminal Dr, Bilinga QLD 4225',
  },
];

/**
 * Returns location options formatted for select dropdowns.
 */
export function getLocationOptions(): { value: string; label: string }[] {
  return locations.map((loc) => ({
    value: loc.id,
    label: `${loc.city}, ${loc.state}`,
  }));
}
