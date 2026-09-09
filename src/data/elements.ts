export type ElementId =
  | 'ember'
  | 'tide'
  | 'terra'
  | 'gale'
  | 'circuit'
  | 'wraith'
  | 'bloom'
  | 'arcane';

export interface ElementDef {
  id: ElementId;
  name: string;
  color: string;
  glow: string;
  description: string;
}

export const ELEMENTS: Record<ElementId, ElementDef> = {
  ember: {
    id: 'ember',
    name: 'Ember',
    color: '#ff6a3d',
    glow: '#ffcf6b',
    description: 'Fire and heat. Melts ice barriers and lights beacon torches.',
  },
  tide: {
    id: 'tide',
    name: 'Tide',
    color: '#3da9ff',
    glow: '#9fe3ff',
    description: 'Water and current. Douses flame walls and fills dry channels.',
  },
  terra: {
    id: 'terra',
    name: 'Terra',
    color: '#a97c50',
    glow: '#e0c087',
    description: 'Stone and earth. Crumbles rubble and anchors heavy switches.',
  },
  gale: {
    id: 'gale',
    name: 'Gale',
    color: '#8fe3d0',
    glow: '#e9fffa',
    description: 'Wind and sky. Rides updrafts across chasms.',
  },
  circuit: {
    id: 'circuit',
    name: 'Circuit',
    color: '#f6d132',
    glow: '#fff6b0',
    description: 'Spark and gear. Powers dormant machinery.',
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    color: '#8a5fd6',
    glow: '#d7c3ff',
    description: 'Shadow and spirit. Slips through veils invisible to the living.',
  },
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    color: '#4fbf5e',
    glow: '#c8ffb0',
    description: 'Root and growth. Grows bridges from seed pods.',
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane',
    color: '#c76bf0',
    glow: '#f0d0ff',
    description: 'Raw magic. Unlocks warded runes.',
  },
};

export const ELEMENT_LIST: ElementId[] = Object.keys(ELEMENTS) as ElementId[];
