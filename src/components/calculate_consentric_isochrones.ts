import axios from 'axios';

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface IsochroneOptions {
    range: number[]; // Array of isochrone ranges in minutes
    mode: 'car' | 'pedestrian' | 'truck' | 'van' | 'bus'; // Travel mode
}

interface IsochroneResponse {
    reachableRange: {
        boundary: Coordinate[];
    };
}

class ConcentricIsochronesService {
    private subscriptionKey: string;

    constructor(subscriptionKey: string) {
        this.subscriptionKey = subscriptionKey;
    }

    async calculateIsochrones(center: Coordinate, options: IsochroneOptions): Promise<IsochroneResponse[]> {
        const { range, mode } = options;
        const responses: IsochroneResponse[] = [];

        for (const r of range) {
            const url = `https://atlas.microsoft.com/route/range/json?subscription-key=${this.subscriptionKey}&api-version=1.0&query=${center.latitude},${center.longitude}&timeBudgetInSec=${r * 60}&mode=${mode}`;
            const response = await axios.get(url);
            responses.push(response.data);
        }

        return responses;
    }

    async getConcentricIsochrones(center: Coordinate, ranges: number[], mode: 'car' | 'pedestrian' | 'truck' | 'van'): Promise<GeoJSON.FeatureCollection> {
        const options: IsochroneOptions = { range: ranges, mode: mode };
        const responses = await this.calculateIsochrones(center, options);
        const features: GeoJSON.Feature[] = [];

        for (const response of responses) {
            const coordinates = response.reachableRange.boundary.map(point => [point.longitude, point.latitude]);
            const polygon = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coordinates]
                },
                properties: {}
            };
            features.push(polygon);
        }

        return {
            type: 'FeatureCollection',
            features: features
        };
    }
}

export default ConcentricIsochronesService;
