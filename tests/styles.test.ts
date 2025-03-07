import { getMapStyle } from '../src/styles';
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

  it('should return IGN aerial style', () => {
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

  it('should throw error for OSM provider (not implemented)', () => {
    expect(() => {
      getMapStyle('standard', 'osm');
    }).toThrow('OSM styles not implemented yet');
  });
});