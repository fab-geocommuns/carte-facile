/**
 * Test suite for the map styles and thumbnails
 * These tests verify that all map styles and thumbnails are properly defined and accessible
 */
import { mapStyle, mapThumbnails } from '../src/map/maps';

describe('mapStyle', () => {
  // Test each map style configuration
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
});

describe('mapThumbnails', () => {
  // Verify that thumbnails are available for all map styles
  it('should have all required thumbnails', () => {
    expect(mapThumbnails.simple).toBeDefined();
    expect(mapThumbnails.desaturated).toBeDefined();
    expect(mapThumbnails.aerial).toBeDefined();
  });
});