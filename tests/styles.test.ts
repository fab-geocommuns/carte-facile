import { getMap } from '../src/map';
import type { MapType, MapProvider } from '../src/map/types';

describe('getMap', () => {
  it('should return IGN standard style by default', () => {
    const style = getMap('standard');
    expect(style).toBeDefined();
    expect(style.name).toBe('Standard');
    expect(style.metadata.source).toBe('IGN');
  });

  it('should return IGN desaturated style', () => {
    const style = getMap('desaturated', 'ign');
    expect(style).toBeDefined();
    expect(style.name).toBe('Desaturated');
    expect(style.metadata.source).toBe('IGN');
  });

  it('should return IGN aerial photography style', () => {
    const style = getMap('aerial', 'ign');
    expect(style).toBeDefined();
    expect(style.name).toBe('Aerial photography');
    expect(style.metadata.source).toBe('IGN');
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      getMap('standard', 'unsupported' as MapProvider);
    }).toThrow('Provider unsupported not supported');
  });

  it('should throw error for non-existent style type', () => {
    expect(() => {
      getMap('nonexistent' as MapType, 'ign');
    }).toThrow('Style nonexistent not found for provider ign');
  });

  it('should throw error for OSM provider (empty provider)', () => {
    expect(() => {
      getMap('standard', 'osm');
    }).toThrow('Style standard not found for provider osm');
  });
});