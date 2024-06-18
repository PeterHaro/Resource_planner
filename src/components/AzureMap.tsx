import { onCleanup, onMount } from 'solid-js';
import { Component } from 'solid-js';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

interface AzureMapProps {
    subscriptionKey: string;
    center?: [number, number];
    zoom?: number;
    onMapReady?: (map: atlas.Map) => void;
}

const AzureMap: Component<AzureMapProps> = (props) => {
    let mapContainer: HTMLDivElement | undefined;

    onMount(() => {
        if (mapContainer) {
            const map = new atlas.Map(mapContainer, {
                center: props.center || [0, 0],
                zoom: props.zoom || 2,
                authOptions: {
                    authType: atlas.AuthenticationType.subscriptionKey,
                    subscriptionKey: props.subscriptionKey,
                },
            });

            if (props.onMapReady) {
                props.onMapReady(map);
            }

            // Cleanup on component unmount
            onCleanup(() => {
                map.dispose();
            });
        }
    });

    return <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>;
};

export default AzureMap;
