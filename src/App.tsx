// App.tsx
import { Component, createSignal } from 'solid-js';
import * as atlas from 'azure-maps-control';
import AzureMap from "./components/AzureMap";
import * as turf from '@turf/turf';
import DataPreloader from "./components/DataPreloader";
import ConcentricIsochronesService from "./components/calculate_consentric_isochrones";
import IsochroneLegend from "./components/IsochroneLegend";
import SidebarMenu from "./components/SidebarMenu"; // Import the new SidebarMenu component
import './sidebar-menu.css'; // Import the CSS file for sidebar menu

const App: Component = () => {
    const subscriptionKey = import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY;
    const [map, setMap] = createSignal<atlas.Map>();
    const isochronesDatasource = new atlas.source.DataSource();

    const colors: string [] = ['LawnGreen', 'Yellow', 'Orange', 'Red']; //Turf.js colors, makes life simpler
    const ranges: number[] = [10, 20, 60, 120]; // Isochrone ranges in minutes //TODO: MAKE CONFIGURABLE
    const concentricIsochrones = new ConcentricIsochronesService(subscriptionKey);
    const [showLegend, setShowLegend] = createSignal(false);

    const closePolygonRings = (feature) => {
        if (feature.geometry && feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates.forEach((ring) => {
                if (ring[0] !== ring[ring.length - 1]) {
                    ring.push(ring[0]);
                }
            });
        }
    };

    const calculateIsochrone = (coordinates: [number, number]) => {
        generateConcentricIsochrones(coordinates, ranges);
        setShowLegend(true); // Show the legend when isochrones are rendered
    };

    const generateConcentricIsochrones = async (coordinates: [number, number], ranges: number[]) => {
        isochronesDatasource.clear();
        const center = {latitude: coordinates[1], longitude: coordinates[0]};
        const mode = 'car';

        console.log('Generating isochrone');

        try {
            const isochrones = await concentricIsochrones.getConcentricIsochrones(center, ranges, mode);
            console.log('Isochrones:', isochrones);
            if (isochrones.features.length === 0) {
                console.error('No isochrones generated');
                return;
            }

            let prev = isochrones.features[0];
            prev.properties = {color: colors[0]};

            // Ensure polygon rings are closed.
            closePolygonRings(prev);

            let polygons = [prev];

            for (let i = 1; i < isochrones.features.length; i++) {
                let f = isochrones.features[i];

                // Ensure polygon rings are closed.
                closePolygonRings(f);

                // Subtract the previous isochrone from the current one.
                var difference = turf.difference(turf.featureCollection([f, prev]));
                difference.properties.color = colors[i];
                polygons.push(difference);
                prev = f;
            }

            if (polygons.length > 0) {
                isochronesDatasource.add(polygons);
            }
        } catch (error) {
            console.error('Error calculating isochrones:', error);
        }
    };

    const handleMapReady = (mapInstance: atlas.Map) => {
        setMap(mapInstance);
        mapInstance.events.add('ready', () => {
            mapInstance.sources.add(isochronesDatasource);

            mapInstance.layers.add([
                new atlas.layer.PolygonLayer(isochronesDatasource, null, {
                    fillColor: ['get', 'color']
                }),
                new atlas.layer.LineLayer(isochronesDatasource, null, {
                    strokeColor: 'white'
                })
            ], 'labels');
        });
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
            <SidebarMenu map={map()} subscriptionKey={subscriptionKey} /> {/* Add SidebarMenu component */}
            <div style={{ flex: 1, position: 'relative' }}>
                <AzureMap
                    subscriptionKey={subscriptionKey}
                    center={[10.3951, 63.4305]}
                    zoom={10}
                    onMapReady={handleMapReady}
                />
                {map() && (
                    <>
                        <DataPreloader
                            map={map()}
                            paths={['/data/pharmacies.geojson', '/data/three_distanced_hospitals.geojson', '/data/truck_depot.geojson']}
                            layerNames={['Pharmacies', 'Hospitals', 'Truck Depot']}
                            onCalculateIsochrone={calculateIsochrone}
                        />
                        {showLegend() && <IsochroneLegend ranges={ranges} colors={colors} />}
                    </>
                )}
            </div>
        </div>
    );
};

export default App;
