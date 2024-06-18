import { createSignal } from 'solid-js';
import atlas from 'azure-maps-control';

const InteractiveSearch = ({ map, subscriptionKey }) => {
    const [searchQuery, setSearchQuery] = createSignal('');
    const [searchResults, setSearchResults] = createSignal([]);

    const handleSearch = () => {
        //const searchUrl = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${searchQuery()}`;
        let searchUrl: string  =  `https://atlas.microsoft.com/search/poi/json?api-version=1.0&subscription-key=${subscriptionKey}&language=nb&query=${searchQuery()}}`;
        if(map) {
            const bounds = map.getCamera().bounds;
            searchUrl += `&btmRight=${bounds[1]},${bounds[2]}&topLeft=${bounds[3]},${bounds[0]}`;
        } else {
            console.warn("No Map in search!\n");
        }

        fetch(searchUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results) {
                    setSearchResults(data.results);
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
        <div class="overlay">
            <div class="search-input-box">
                <div class="search-input-group">
                    <div class="search-icon">🔍</div>
                    <input
                        type="text"
                        placeholder="Search for a location"
                        value={searchQuery()}
                        onInput={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch}>Search</button>
                </div>
            </div>
            <ul class="search-results">
                {searchResults().map((result) => (
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
        </div>
    );
};

export default InteractiveSearch;
