import { createSignal, For, Component } from 'solid-js';

interface InteractiveVehiclePickerProps {
    transportationMethods: string[];
}

const InteractiveVehiclePicker: Component<InteractiveVehiclePickerProps> = (props) => {
    const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);
    const [selectedVehicles, setSelectedVehicles] = createSignal<Record<string, boolean>>({});

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen());
    };

    const handleCheck = (vehicle: string) => {
        setSelectedVehicles((prevSelectedVehicles) => ({
            ...prevSelectedVehicles,
            [vehicle]: !prevSelectedVehicles[vehicle],
        }));
    };

    return (
        <div>
            <button onClick={toggleDropdown}>
                {isDropdownOpen() ? 'Hide Vehicles' : 'Show Vehicles'}
            </button>
            {isDropdownOpen() && (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <For each={props.transportationMethods}>
                        {(vehicle) => (
                            <li key={vehicle}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!selectedVehicles()[vehicle]}
                                        onChange={() => handleCheck(vehicle)}
                                    />
                                    {vehicle}
                                </label>
                            </li>
                        )}
                    </For>
                </ul>
            )}
        </div>
    );
};

export default InteractiveVehiclePicker;
