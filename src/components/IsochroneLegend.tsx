import {Component} from 'solid-js';

interface LegendProps {
    ranges: number[];
    colors: string[];
}

const IsochroneLegend: Component<LegendProps> = ({ranges, colors}) => {
    return (
        <div class="legend">
            <b>Travel time (minutes)</b>
            <table>
                {ranges.map((range, index) => (
                    <tr key={index}>
                        <td><i style={`background:${colors[index]}`}/></td>
                        <td>{range}</td>
                    </tr>
                ))}
            </table>
            <div id="statusPanel"></div>
        </div>
    );
};

export default IsochroneLegend;