import { mapStyle, mapThumbnails } from '../src/map/maps';

/*
  * Test suite for the mapStyle and mapThumbnails functions
  * This test suite ensures that the mapStyle and mapThumbnails functions return the correct map style configuration
  * and thumbnails for the given map type and provider.
*/
describe('mapStyle', () => {
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
  it('should have all required thumbnails', () => {
    expect(mapThumbnails.simple).toBeDefined();
    expect(mapThumbnails.desaturated).toBeDefined();
    expect(mapThumbnails.aerial).toBeDefined();
  });
});