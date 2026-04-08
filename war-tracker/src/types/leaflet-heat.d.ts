declare module 'leaflet.heat' {
  import * as L from 'leaflet';

  namespace L {
    function heatLayer(
      latlngs: Array<[number, number, number?]>,
      options?: {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: Record<number, string>;
      }
    ): L.Layer;
  }
}
