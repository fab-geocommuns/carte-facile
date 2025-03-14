import { getMap } from '../src/map';
import type { MapType, MapProvider } from '../src/map/types';

/*
  * Test suite for the getMap function
  * This test suite ensures that the getMap function returns the correct map style configuration
  * for the given map type and provider.
*/
describe('getMap', () => {
  it('should return IGN standard style by default', () => {
    const map = getMap('standard');
    expect(map).toBeDefined();
    expect(map.name).toBe('Standard');
    expect(map.metadata.source).toBe('IGN');
  });

  it('should return IGN desaturated style', () => {
    const map = getMap('desaturated', 'ign');
    expect(map).toBeDefined();
    expect(map.name).toBe('Desaturated');
    expect(map.metadata.source).toBe('IGN');
  });

  it('should return IGN aerial photography style', () => {
    const map = getMap('aerial', 'ign');
    expect(map).toBeDefined();
    expect(map.name).toBe('Aerial photography');
    expect(map.metadata.source).toBe('IGN');
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      getMap('standard', 'unsupported' as MapProvider);
    }).toThrow('Provider "unsupported" not supported. Available providers are: ign, osm');
  });

  it('should throw error for non-existent style type', () => {
    expect(() => {
      getMap('nonexistent' as MapType, 'ign');
    }).toThrow('Map type "nonexistent" not found for provider "ign". Available map types are: desaturated, standard, aerial');
  });

  it('should throw error for OSM provider (empty provider)', () => {
    expect(() => {
      getMap('standard', 'osm');
    }).toThrow('Map type "standard" not found for provider "osm". Available map types are: desaturated, standard, aerial');
  });
});