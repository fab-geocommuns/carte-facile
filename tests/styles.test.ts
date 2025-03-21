import { mapStyle, mapThumbnails } from '../src/map/maps';
import type { MapStyle, MapThumbnails } from '../src/map/types';

/*
  * Test suite for the mapStyle and mapThumbnails functions
  * This test suite ensures that the mapStyle and mapThumbnails functions return the correct map style configuration
  * and thumbnails for the given map type and provider.
*/
describe('mapStyle', () => {
  it('should have IGN standard style', () => {
    const map = mapStyle.ign.standard;
    expect(map).toBeDefined();
    expect(map.name).toBe('Standard');
    expect(map.metadata.source).toBe('IGN');
  });

  it('should have IGN desaturated style', () => {
    const map = mapStyle.ign.desaturated;
    expect(map).toBeDefined();
    expect(map.name).toBe('Desaturated');
    expect(map.metadata.source).toBe('IGN');
  });

  it('should have IGN aerial photography style', () => {
    const map = mapStyle.ign.aerialPhotography;
    expect(map).toBeDefined();
    expect(map.name).toBe('Aerial photography');
    expect(map.metadata.source).toBe('IGN');
  });
});

describe('mapThumbnails', () => {
  it('should have all required thumbnails', () => {
    expect(mapThumbnails.standard).toBeDefined();
    expect(mapThumbnails.desaturated).toBeDefined();
    expect(mapThumbnails.aerialPhotography).toBeDefined();
  });
});