/**
 * Test suite for the map module
 * These tests verify the core map functionality including:
 * - Map styles configuration and properties
 * - Map thumbnails availability
 * - Style metadata and accessibility
 */
import { mapStyle, mapThumbnails } from '../src/map/maps';

describe('mapStyle', () => {
  // Test each map style configuration and its properties
  it('should have simple style', () => {
    const map = mapStyle.simple;
    expect(map).toBeDefined();
    expect(map.name).toBe('Simple');
    expect(map.id).toBe('simple');
  });

  it('should have desaturated style', () => {
    const map = mapStyle.desaturated;
    expect(map).toBeDefined();
    expect(map.name).toBe('Desaturated');
    expect(map.id).toBe('desaturated');
  });

  it('should have aerial style', () => {
    const map = mapStyle.aerial;
    expect(map).toBeDefined();
    expect(map.name).toBe('Aerial');
    expect(map.id).toBe('aerial');
  });

  it('should have simple OSM style', () => {
    const map = mapStyle.simpleOsm;
    expect(map).toBeDefined();
    expect(map.name).toBe('Simple (OSM)');
    expect(map.id).toBe('simple-osm');
  });
});

describe('mapThumbnails', () => {
  // Verify that thumbnails are available for all map styles
  it('should have all required thumbnails', () => {
    expect(mapThumbnails.simple).toBeDefined();
    expect(mapThumbnails.desaturated).toBeDefined();
    expect(mapThumbnails.aerial).toBeDefined();
    expect(mapThumbnails.simpleOsm).toBeDefined();
  });
});