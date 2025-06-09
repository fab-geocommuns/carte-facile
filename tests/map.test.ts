/**
 * Test suite for the map module
 * These tests verify the core map functionality including:
 * - Map styles configuration and properties
 * - Map thumbnails availability
 * - Style metadata and accessibility
 */
import { mapStyles, mapThumbnails, addOverlay, removeOverlay, showLayers, hideLayers, LayerGroup, mapOverlays } from '../src/map/maps';
import { OverlayType } from '../src/map/types';
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

  const testOverlay = (type: OverlayType, expectedLayers: number) => {
    describe(`${type} overlay`, () => {
      it('should add overlay with correct number of layers', () => {
        addOverlay(map, type);
        expect(map.addLayer).toHaveBeenCalledTimes(expectedLayers);
        expect(map.addSource).toHaveBeenCalled();
      });

      it('should update overlay when style changes', () => {
        addOverlay(map, type);
        map.getStyle = jest.fn().mockReturnValue({ name: 'aerial' });
        const styledataCallback = (map.on as jest.Mock).mock.calls.find(
          call => call[0] === 'styledata'
        )[1];
        styledataCallback();
        expect(map.addLayer).toHaveBeenCalledTimes(expectedLayers * 2); // Called twice: initial + style change
      });

      it('should remove overlay completely', () => {
        addOverlay(map, type);
        map.getLayer = jest.fn().mockReturnValue(true);
        map.getSource = jest.fn().mockReturnValue(true);
        
        removeOverlay(map, type);
        
        expect(map.removeLayer).toHaveBeenCalledTimes(expectedLayers);
        expect(map.removeSource).toHaveBeenCalled();
        expect(map.off).toHaveBeenCalledWith('styledata', expect.any(Function));
      });

      it('should not add duplicate layers or sources', () => {
        map.getLayer = jest.fn().mockReturnValue(true);
        map.getSource = jest.fn().mockReturnValue(true);
        
        addOverlay(map, type);
        
        expect(map.addLayer).not.toHaveBeenCalled();
        expect(map.addSource).not.toHaveBeenCalled();
      });
    });
  };

  testOverlay('cadastre', 6);
  testOverlay('administrativeBoundaries', 8);
  testOverlay('levelCurves', 3);
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