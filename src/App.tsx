import './App.css';
import * as React from 'react';
import { TextField, InputLabel, Select, MenuItem, FormControl, Typography, TableContainer, Table, RadioGroup, TableHead, TableRow, TableCell, TableBody, Paper, FormLabel, FormControlLabel, Radio, InputAdornment, SelectChangeEvent } from "@mui/material";
import TimeField from 'react-advanced-timefield';

type Distance = {
    km: number;
    mi: number;
}

type DistanceUnit = 'km' | 'mi';

const mile : number = 1.6093;

const commonDistances: { [key: string]: Distance } = {
    '1500m': { km: 1.5, mi: 0.932057 },
    '1mi': { km: 1.6093, mi: 1 },
    '3K': { km: 3, mi: 1.86411 },
    '2mi': { km: 3.21869, mi: 2 },
    '5K': { km: 5, mi: 3.10686 },
    '10K': { km: 10, mi: 6.21371 },
    '15K': { km: 15, mi: 9.32057 },
    'Half marathon': { km: 21.0975, mi: 13.10937873 },
    'Marathon': { km: 42.195, mi: 26.2187575 }
};

interface State {
    distanceSelect: string;
    distance: number;
    time: string;
    pace: string;
    vdot: string;
    equivalents: { Distance: string, Time: string, Pace: string }[];
    unit: DistanceUnit;
}

class VDOTForm extends React.Component<{}, State> {

    constructor(props: {}) {
        super(props);
        this.state = {
            distanceSelect: '5K',
            distance: commonDistances['5K'].km,
            time: '00:00:00',
            pace: '00:00',
            vdot: '',
            equivalents: [],
            unit: 'km'
        };
    }

    updatePace = () => {
        const distance = this.state.distance;

        if (distance <= 0) {
            return;
        }

        const timeInSeconds = convertTimeStringToSeconds(this.state.time);
        const pace = timeInSeconds / distance;

        this.setState({ pace: createTimeString(pace, false) }, this.stateChanged);
    }

    updateTime = () => {
        const distance = this.state.distance;

        if (distance <= 0) {
            return;
        }

        const paceInSeconds = convertTimeStringToSeconds(this.state.pace);
        const timeInSeconds = paceInSeconds * distance;

        this.setState({ time: createTimeString(timeInSeconds, true) }, this.stateChanged);
    }

    stateChanged = () => {
        this.calculateVdot();
        this.calculateEquivalents();
    }

    calculateVdot = () => {
        const timeInSeconds = convertTimeStringToSeconds(this.state.time);
        const timeInMinutes = timeInSeconds / 60;
        const distanceInMeter = this.state.distance * (this.state.unit === 'km' ? 1000 : 1609.3);
        const metersPerMinute = distanceInMeter / timeInMinutes;

        const percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeInMinutes) + 0.2989558 * Math.exp(-0.1932605 * timeInMinutes);
        const VO2 = -4.60 + 0.182258 * metersPerMinute + 0.000104 * (metersPerMinute ** 2);
        const VO2Max = VO2 / percentMax;

        this.setState({ vdot: VO2Max.toFixed(2) });
    }

    onTimeChange = (event: React.ChangeEvent<HTMLInputElement>, time: string) => {
        this.setState({ time }, this.updatePace);
    }

    onPaceChange = (event: React.ChangeEvent<HTMLInputElement>, pace: string) => {
        this.setState({ pace }, this.updateTime);
    }

    onUnitChange = (event: React.ChangeEvent<HTMLInputElement>, unit: string) => {
        let distance = this.state.distance;

        if (this.state.distanceSelect) {
           distance = commonDistances[this.state.distanceSelect][unit as DistanceUnit];
        } else if (this.state.unit != unit) {
            distance = convertDistance(distance, unit as DistanceUnit);
        }

        this.setState({ unit: unit as DistanceUnit, distance: distance }, this.updatePace);
    }

    onDistanceSelect = (event: SelectChangeEvent<string>) => {
        const distance = commonDistances[event.target.value][this.state.unit];
        this.setState({ distanceSelect: event.target.value, distance: distance }, this.updatePace);
    }

    onDistanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let distanceSelectValue = Object.keys(commonDistances).find(
            (distance) => 
                commonDistances[distance].km == Number(event.target.value) ||
                commonDistances[distance].mi == Number(event.target.value)
        );

        this.setState({ distanceSelect: distanceSelectValue ?? '', distance: Number(event.target.value) }, this.updatePace);
    }

    calculateEquivalents = () => {
        const timeInSeconds = convertTimeStringToSeconds(this.state.time);
        const distance = Number(this.state.distance);

        const equivalents = Object.keys(commonDistances).map(commonDistance => {
            const eqDistance = commonDistances[commonDistance][this.state.unit];
            const eqTime = timeInSeconds * (eqDistance / distance) ** 1.06;
            const eqPace = eqTime / eqDistance;

            const timeString = new Date(eqTime * 1000).toISOString().substr(11, 8);
            const paceString = new Date(eqPace * 1000).toISOString().substr(11, 8);

            return { Distance: commonDistance, Time: timeString, Pace: paceString };
        });

        this.setState({ equivalents });
    }

    render() {
        const distanceMenuitems = Object.keys(commonDistances).map(commonDistance => (
            <MenuItem key={commonDistance} value={commonDistance}>{commonDistance}</MenuItem>
        ));

        return (
            <div className="App">
                <Typography variant="h2" gutterBottom component="div">
                    Knickedixen's VDOT Calculator
                </Typography>
                <div>
                    <FormControl component="fieldset">
                        <RadioGroup
                            row
                            aria-label="position"
                            name="position"
                            defaultValue="top"
                            value={this.state.unit}
                            onChange={this.onUnitChange}
                        >
                            <FormControlLabel value="km" control={<Radio />} label="km" />
                            <FormControlLabel value="mi" control={<Radio />} label="mi" />
                        </RadioGroup>
                    </FormControl>
                </div>
                <FormControl sx={{ minWidth: 300 }} margin={"normal"}>
                    <div>
                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel id="demo-simple-select-helper-label">Select Distance</InputLabel>
                            <Select
                                labelId="demo-simple-select-helper-label"
                                id="demo-simple-select-helper"
                                label={"Select Distance"}
                                value={this.state.distanceSelect}
                                onChange={this.onDistanceSelect}
                            >
                                {distanceMenuitems}
                            </Select>
                        </FormControl>
                        <FormControl sx={{ maxWidth: 150 }}>
                            <TextField
                                id="outlined-number"
                                label="Distance"
                                type="number"
                                value={this.state.distance}
                                onChange={this.onDistanceChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </FormControl>
                    </div>
                    <div>
                        <FormControl sx={{ maxWidth: 150 }} margin={"normal"}>
                            <TimeField
                                input={<TextField />}
                                value={this.state.time}
                                onChange={this.onTimeChange}
                                showSeconds
                            />
                        </FormControl>
                        <FormControl sx={{ maxWidth: 150 }} margin={"normal"}>
                            <TimeField
                                input={<TextField InputProps={{
                                    endAdornment: <InputAdornment position="end">/ {this.state.unit}</InputAdornment>,
                                }} />}
                                value={this.state.pace}
                                onChange={this.onPaceChange}
                            />
                        </FormControl>
                    </div>
                </FormControl>
                <Typography variant="h5" gutterBottom component="div">
                    VDOT: {this.state.vdot}
                </Typography>
                <FormControl>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Distance</TableCell>
                                    <TableCell align="right">Time</TableCell>
                                    <TableCell align="right">Pace</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {this.state.equivalents.map((row) => (
                                    <TableRow
                                        key={row.Distance}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.Distance}
                                        </TableCell>
                                        <TableCell align="right">{row.Time}</TableCell>
                                        <TableCell align="right">{row.Pace} / {this.state.unit}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </FormControl>
            </div>
        )
    }
}

function convertTimeStringToSeconds(timeString: string): number {
    const p = timeString.split(':');
    let s = 0;
    let m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop()!, 10);
        m *= 60;
    }

    return s;
}

function convertDistance(distance: number, unit: DistanceUnit): number {
    if (unit == 'km') {
        return distance * mile;
    } else if (unit == 'mi') {
        return distance / mile;
    }

    return distance;
}

function createTimeString(seconds: number, withHours = true): string {
    let timeString: string;

    if (withHours) {
        timeString = new Date(seconds * 1000).toISOString().substr(11, 8);
    } else {
        let paceMinutes = Math.floor(seconds / 60);
        let paceSeconds = Math.floor(seconds % 60);

        if (paceMinutes > 99) {
            paceMinutes = 0;
            paceSeconds = 0;
        }

        timeString = `${('0' + paceMinutes).slice(-2)}:${('0' + paceSeconds).slice(-2)}`;
    }

    return timeString;
}

export default VDOTForm;
