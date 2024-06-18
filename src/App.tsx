import {Component, createSignal} from 'solid-js';
import * as atlas from 'azure-maps-control';
import AzureMap from "./components/AzureMap";
import * as turf from '@turf/turf';
import InteractiveSearch from "./components/AzureMapSearch";
import DataPreloader from "./components/DataPreloader";
import ConcentricIsochronesService from "./components/calculate_consentric_isochrones";
import IsochroneLegend from "./components/IsochroneLegend";

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

    /*function closePolygonRings(polygon) {
        //Ensure the first and last coordinate of each polygon ring are identical to form a closed polygon ring.
        for (var i = 0; i < polygon.geometry.coordinates.length; i++) {
            var ring = polygon.geometry.coordinates[i];

            if (!atlas.data.Position.areEqual(ring[0], ring[ring.length - 1])) {
                ring.push(ring[0]);
            }
        }
    }*/


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

                // Update the map camera to display the largest isochrone area.
                // mapRef.setCamera({
                //   bounds: atlas.data.BoundingBox.fromData(polygons[polygons.length - 1])
                // });
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
                //Create a polygon layer to render the isochrones.
                new atlas.layer.PolygonLayer(isochronesDatasource, null, {
                    fillColor: ['get', 'color']
                }),

                //Create a layer to outline the polygon areas.
                new atlas.layer.LineLayer(isochronesDatasource, null, {
                    strokeColor: 'white'
                })
            ], 'labels');
        });
    };

    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
            <AzureMap
                subscriptionKey={subscriptionKey}
                center={[10.3951, 63.4305]} // Optional: specify the initial center
                zoom={10} // Optional: specify the initial zoom level
                onMapReady={handleMapReady}
            />
            {map() && (
                <>
                    <InteractiveSearch
                        map={map()}
                        subscriptionKey={subscriptionKey}
                    />
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
    );
};

export default App;
