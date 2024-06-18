import { Component, createEffect, createSignal } from 'solid-js';
import * as atlas from 'azure-maps-control';

interface DataPreloaderProps {
    map: atlas.Map;
    paths: string[];
    layerNames: string[];
    onCalculateIsochrone: (coordinates: [number, number]) => void;
}

const DataPreloader: Component<DataPreloaderProps> = ({ map, paths, layerNames, onCalculateIsochrone }) => {
    const [geojsonData, setGeojsonData] = createSignal<atlas.data.FeatureCollection[]>([]);

    createEffect(() => {
        const fetchData = async () => {
            const data: atlas.data.FeatureCollection[] = await Promise.all(paths.map(async (path) => {
                const response = await fetch(path);
                return await response.json();
            }));
            setGeojsonData(data);
        };

        fetchData();
    }, [paths]);

    createEffect(() => {
        const onMapReady = () => {
            if (geojsonData().length > 0) {
                geojsonData().forEach((data, index) => {
                    const source = new atlas.source.DataSource();
                    source.add(data);
                    map.sources.add(source);

                    const layer = new atlas.layer.SymbolLayer(source, layerNames[index], {
                        iconOptions: {
                            image: 'pin-round-darkblue', // Example icon
                            allowOverlap: true,
                        },
                        textOptions: {
                            textField: ['get', 'name'], // Assuming the GeoJSON features have a 'name' property
                            offset: [0, -2.5]
                        }
                    });

                    map.layers.add(layer, 'labels'); // Add the layer before the 'labels' layer

                    // Add a click event listener to show popup
                    map.events.add('click', layer, (e) => {
                        if (e.shapes && e.shapes.length > 0) {
                            let properties;
                            if (e.shapes[0] && e.shapes[0].properties) {
                                properties = e.shapes[0].properties
                            } else {
                                properties = e.shapes[0].getProperties();
                            }

                            let position;
                            if (e.shapes[0] && e.shapes[0].geometry) {
                                position = e.shapes[0].geometry.coordinates;
                            } else {
                                position = e.shapes[0].getCoordinates();
                            }

                            const popupContent = document.createElement('div');
                            popupContent.className = 'popup-content';
                            popupContent.innerHTML = `
                                <div class="popup-header">
                                    <h3>${properties.name || 'No Name'}</h3>
                                </div>
                                <div class="popup-body">
                                    ${properties.phone ? `<p><strong>Phone:</strong> ${properties.phone}</p>` : ''}
                                    ${properties.url ? `<p><strong>Website:</strong> <a href="${properties.url}" target="_blank">${properties.url}</a></p>` : ''}
                                    ${properties['num_vaccines'] ? `<p><strong>Num Vaccines:</strong> ${properties['num_vaccines']}</p>` : ''}
                                </div>
                                <div class="popup-footer">
                                    <button class="isochrone-button">Calculate isochrones</button>
                                </div>
                            `;

                            const popup = new atlas.Popup({
                                content: popupContent,
                                position: position
                            });
                            popup.open(map);

                            // Attach event listener for the button
                            popupContent.querySelector('.isochrone-button').addEventListener('click', () => {
                                onCalculateIsochrone([position[0], position[1]]);
                            });
                        }
                    });
                });
            }
        };

        if (map) {
            if (map.ready) {
                onMapReady();
            } else {
                map.events.add('ready', onMapReady);
            }
        }
    }, [map, geojsonData]);

    return null; // This component does not render anything
};

export default DataPreloader;
