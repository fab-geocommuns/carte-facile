import { getMapStyle } from '../src/map/styles';
import type { MapStyleType, MapProvider } from '../src/types/map';

describe('getMapStyle', () => {
  it('should return IGN standard style by default', () => {
    const style = getMapStyle('standard');
    expect(style).toBeDefined();
    expect(style.name).toBe('Standard');
    expect(style.metadata.source).toBe('IGN');
  });

  it('should return IGN desaturated style', () => {
    const style = getMapStyle('desaturated', 'ign');
    expect(style).toBeDefined();
    expect(style.name).toBe('Desaturated');
    expect(style.metadata.source).toBe('IGN');
  });

  it('should return IGN aerial photography style', () => {
    const style = getMapStyle('aerial', 'ign');
    expect(style).toBeDefined();
    expect(style.name).toBe('Aerial photography');
    expect(style.metadata.source).toBe('IGN');
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      getMapStyle('standard', 'unsupported' as MapProvider);
    }).toThrow('Provider unsupported not supported');
  });

  it('should throw error for non-existent style type', () => {
    expect(() => {
      getMapStyle('nonexistent' as MapStyleType, 'ign');
    }).toThrow('Style nonexistent not found for provider ign');
  });

  it('should throw error for OSM provider (empty provider)', () => {
    expect(() => {
      getMapStyle('standard', 'osm');
    }).toThrow('Style standard not found for provider osm');
  });
});