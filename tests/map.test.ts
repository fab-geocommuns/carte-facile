/**
 * Test suite for the map module
 * These tests verify the core map functionality including:
 * - Map styles configuration and properties
 * - Map thumbnails availability
 * - Style metadata and accessibility
 */
import { mapStyles, mapThumbnails, addOverlay, removeOverlay, showLayers, hideLayers, LayerGroup } from '../src/map/maps';
import maplibregl from 'maplibre-gl';

describe('mapStyle', () => {
  // Test each map style configuration and its properties
  it('should have simple style', () => {
    const map = mapStyles.simple;
    expect(map).toBeDefined();
    expect(map.name).toBe('simple');
  });

  it('should have desaturated style', () => {
    const map = mapStyles.desaturated;
    expect(map).toBeDefined();
    expect(map.name).toBe('desaturated');
  });

  it('should have aerial style', () => {
    const map = mapStyles.aerial;
    expect(map).toBeDefined();
    expect(map.name).toBe('aerial');
  });

  it('should have simple OSM style', () => {
    const map = mapStyles.simpleOsm;
    expect(map).toBeDefined();
    expect(map.name).toBe('simple-osm');
  });
});

describe('mapThumbnails', () => {
  // Verify that thumbnails are available for all map styles
  it('should have all required thumbnails', () => {
    expect(mapThumbnails.simple).toBeDefined();
    expect(mapThumbnails.desaturated).toBeDefined();
    expect(mapThumbnails.aerial).toBeDefined();
    expect(mapThumbnails.simpleOsm).toBeDefined();
    expect(mapThumbnails.cadastre).toBeDefined();
    expect(mapThumbnails.administrativeBoundaries).toBeDefined();
    expect(mapThumbnails.levelCurves).toBeDefined();
  });
});

describe('mapOverlays', () => {
  let map: maplibregl.Map;

  beforeEach(() => {
    // Create a mock MapLibre map instance with all required methods
    map = {
      getStyle: jest.fn().mockReturnValue({ name: 'simple' }),
      getSource: jest.fn().mockReturnValue(false),
      getLayer: jest.fn().mockReturnValue(false),
      addSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      removeSource: jest.fn(),
      loaded: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as unknown as maplibregl.Map;
  });

  it('should get style when removing overlay', () => {
    // Ensure getStyle is called when removing an overlay
    removeOverlay(map, 'cadastre');
    expect(map.getStyle).toHaveBeenCalled();
  });

  it('should not add duplicate sources or layers', () => {
    // Simulate that all sources and layers already exist
    map.getSource = jest.fn().mockReturnValue(true);
    map.getLayer = jest.fn().mockReturnValue(true);

    addOverlay(map, 'cadastre');

    // No new sources or layers should be added
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it('should add all layers from the neutral variant for simple style', () => {
    // For simple style, all neutral layers should be added
    addOverlay(map, 'administrativeBoundaries');
    expect(map.addLayer).toHaveBeenCalledTimes(8);
  });

  it('should add all layers from the color variant for aerial style', () => {
    // For aerial style, all color layers should be added
    map.getStyle = jest.fn().mockReturnValue({ name: 'aerial' });
    addOverlay(map, 'administrativeBoundaries');
    expect(map.addLayer).toHaveBeenCalledTimes(8);
  });

  it('should add all layers from the neutral variant for level curves style', () => {
    // For level curves style, all neutral layers should be added
    addOverlay(map, 'levelCurves');
    expect(map.addLayer).toHaveBeenCalledTimes(3);
  });
  
});

describe('Layer visibility', () => {
  let map: maplibregl.Map;

  beforeEach(() => {
    // Create a mock MapLibre map with two layers:
    // - A buildings layer
    // - A streets layer
    map = {
      getStyle: jest.fn().mockReturnValue({
        layers: [
          { id: 'layer1', metadata: { 'cartefacile:group': 'buildings' } },
          { id: 'layer2', metadata: { 'cartefacile:group': 'streets' } }
        ]
      }),
      setLayoutProperty: jest.fn(),
      loaded: jest.fn().mockReturnValue(true),
      once: jest.fn()
    } as unknown as maplibregl.Map;
  });

  it('should show and hide layers', () => {
    // Test showing a layer
    showLayers(map, [LayerGroup.buildings]);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('layer1', 'visibility', 'visible');

    // Test hiding a different layer
    hideLayers(map, [LayerGroup.streets]);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('layer2', 'visibility', 'none');
  });

  it('should wait for map to load', () => {
    // Simulate map not being loaded
    map.loaded = jest.fn().mockReturnValue(false);
    showLayers(map, [LayerGroup.buildings]);
    
    // Verify that we wait for the load event
    expect(map.once).toHaveBeenCalledWith('load', expect.any(Function));
    expect(map.setLayoutProperty).not.toHaveBeenCalled();
    
    // Simulate map being loaded and trigger the load callback
    map.loaded = jest.fn().mockReturnValue(true);
    (map.once as jest.Mock).mock.calls[0][1]();
    
    // Verify that the layer visibility is set after loading
    expect(map.setLayoutProperty).toHaveBeenCalledWith('layer1', 'visibility', 'visible');
  });
});