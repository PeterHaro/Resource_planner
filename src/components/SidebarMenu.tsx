// SidebarMenu.tsx
import { createSignal } from 'solid-js';
import InteractiveSearch from "./AzureMapSearch";
import atlas from "azure-maps-control";

const SidebarMenu = ({ map, subscriptionKey }) => {
    const [isExpanded, setIsExpanded] = createSignal(false);
    const [activeTab, setActiveTab] = createSignal('resources');
    const [resourcesQuery, setResourcesQuery] = createSignal('');
    const [everythingQuery, setEverythingQuery] = createSignal('');
    const [resourcesResults, setResourcesResults] = createSignal([]);
    const [everythingResults, setEverythingResults] = createSignal([]);

    const handleResourcesSearch = () => {
        performSearch(resourcesQuery(), setResourcesResults);
    };

    const handleEverythingSearch = () => {
        performSearch(everythingQuery(), setEverythingResults);
    };

    const performSearch = (query, setResults) => {
        let searchUrl = `https://atlas.microsoft.com/search/poi/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${query}`;
        if (map) {
            const bounds = map.getCamera().bounds;
            searchUrl += `&btmRight=${bounds[1]},${bounds[2]}&topLeft=${bounds[3]},${bounds[0]}`;
        } else {
            console.warn("No Map in search!\n");
        }

        fetch(searchUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results) {
                    setResults(data.results);
                }
            })
            .catch(error => {
                console.error('Error performing search:', error);
            });
    };

    const handleResultClick = (result) => {
        if (map) {
            const position = result.position;
            map.setCamera({
                center: [position.lon, position.lat],
                zoom: 14,
            });

            const marker = new atlas.HtmlMarker({
                position: [position.lon, position.lat],
                text: '📍',
                color: 'blue'
            });
            map.markers.add(marker);
        }
    };

    return (
        <div class={`sidebar-menu ${isExpanded() ? 'expanded' : 'collapsed'}`}>
            <button class="hamburger" onClick={() => setIsExpanded(!isExpanded())}>
                ☰
            </button>
            {isExpanded() && (
                <div class="content">
                    <InteractiveSearch map={map} subscriptionKey={subscriptionKey} />
                    <div class="tabs">
                        <button onClick={() => setActiveTab('resources')} class={activeTab() === 'resources' ? 'active' : ''}>Resources</button>
                        <button onClick={() => setActiveTab('everything')} class={activeTab() === 'everything' ? 'active' : ''}>Everything</button>
                    </div>
                    <div class="search-box">
                        {activeTab() === 'resources' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Search resources"
                                    value={resourcesQuery()}
                                    onInput={(e) => setResourcesQuery(e.target.value)}
                                />
                                <button onClick={handleResourcesSearch}>Search</button>
                                <ul class="search-results">
                                    {resourcesResults().map((result) => (
                                        <li key={result.id} onClick={() => handleResultClick(result)}>
                                            <div class="result-item">
                                                <h3>{result.poi.name || 'Unknown Location'}</h3>
                                                <div class="result-info">
                                                    <p><strong>Address:</strong> {result.address.freeformAddress}</p>
                                                    {result.poi.phone && <p><strong>Phone:</strong> {result.poi.phone}</p>}
                                                    {result.poi.url && <p><a href={result.poi.url} target="_blank" rel="noopener noreferrer">Website</a></p>}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {activeTab() === 'everything' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Search everything"
                                    value={everythingQuery()}
                                    onInput={(e) => setEverythingQuery(e.target.value)}
                                />
                                <button onClick={handleEverythingSearch}>Search</button>
                                <ul class="search-results">
                                    {everythingResults().map((result) => (
                                        <li key={result.id} onClick={() => handleResultClick(result)}>
                                            <div class="result-item">
                                                <h3>{result.poi.name || 'Unknown Location'}</h3>
                                                <div class="result-info">
                                                    <p><strong>Address:</strong> {result.address.freeformAddress}</p>
                                                    {result.poi.phone && <p><strong>Phone:</strong> {result.poi.phone}</p>}
                                                    {result.poi.url && <p><a href={result.poi.url} target="_blank" rel="noopener noreferrer">Website</a></p>}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarMenu;
