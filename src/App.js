import './App.css';
import * as React from 'react';
import TimeFieldNoLimit from './TimeFieldNoLimit';
import {TextField, InputLabel, Select, MenuItem, FormControl, Typography, TableContainer, Table, RadioGroup,
        TableHead, TableRow, TableCell, TableBody, Paper, FormLabel, FormControlLabel, Radio, InputAdornment
            } from "@mui/material";

const commonDistances = {
    '1500m' : {km: 1.5, mi : 0.932057},
    '1mi' : {km: 1.6093, mi : 1},
    '3K' : {km: 3, mi : 1.86411},
    '2mi' : {km: 3.21869, mi : 2},
    '5K' : {km: 5, mi : 3.10686},
    '10K' : {km: 10, mi : 6.21371},
    '15K' : {km: 15, mi : 9.32057},
    'Half marathon' : {km: 21.0975, mi : 13.10937873},
    'Marathon' : {km: 42.195, mi : 26.2187575}
};

function App() {
  return (
      <VDOTForm/>
  );
}

class VDOTForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            distanceSelect: '5K',
            distance: commonDistances['5K'].km,
            time: '00:00:00',
            pace: '00:00',
            vdot: '',
            equivalents : [],
            unit: 'km'
        };
    }

    updatePace = () => {
        let distance = Number(this.state.distance)

        if (isNaN(distance) || distance <= 0) {
            return
        }

        let timeInSeconds = convertTimeStringToSeconds(this.state.time);
        let pace = timeInSeconds / distance;

        this.setState({pace : createTimeString(pace, false)}, this.stateChanged)
    }

    updateTime = () => {
        let distance = Number(this.state.distance)

        if (isNaN(distance) || distance <= 0) {
            return
        }

        let paceInSeconds = convertTimeStringToSeconds(this.state.pace);
        let timeInSeconds = paceInSeconds * distance;

        this.setState({time : createTimeString(timeInSeconds, true)}, this.stateChanged)
    }

    stateChanged = () => {
        this.calculateVdot();
        this.calculateEquivalents();
    }

    calculateVdot = () => {
        let timeInSeconds  =  convertTimeStringToSeconds(this.state.time);
        let timeInMinutes  =  timeInSeconds / 60;
        let distanceInMeter  =  Number(this.state.distance) * (this.state.unit === 'km' ? 1000 : 1609.3);
        let metersPerMinute = distanceInMeter / timeInMinutes;

        let percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeInMinutes) + 0.2989558 * Math.exp(-0.1932605 * timeInMinutes);
        let VO2 = -4.60 + 0.182258 * metersPerMinute + 0.000104 * (metersPerMinute ** 2);
        let VO2Max = VO2 / percentMax;

        this.setState({vdot : VO2Max.toFixed(2)});
    }

    onTimeChange = (event, time) => {
        this.setState({time: time}, this.updatePace);
    }

    onPaceChange = (event, pace) => {
        this.setState({pace: pace}, this.updateTime);
    }

    onUnitChange = (event, unit) => {
        this.setState({unit: unit, distance: commonDistances[this.state.distanceSelect][unit]}, this.updatePace);
    }

    onDistanceSelect = (event) => {
        let value = commonDistances[event.target.value][this.state.unit];

        this.setState({distanceSelect: event.target.value, distance: value}, this.updatePace);
    }

    onDistanceChange = (event) => {
        let distanceSelectValue = '';
        if (Object.values(commonDistances).includes(Number(event.target.value))) {
            distanceSelectValue = event.target.value;
        }
        this.setState({distanceSelect: distanceSelectValue, distance: event.target.value}, this.updatePace);
    }

    calculateEquivalents = () => {
        let timeInSeconds  =  convertTimeStringToSeconds(this.state.time);
        let distance  =  Number(this.state.distance);

        let equivalents = [];

        for (let commonDistance in commonDistances) {
            let eqDistance = commonDistances[commonDistance][this.state.unit];
            let eqTime = timeInSeconds * (eqDistance / distance) ** 1.06;
            let eqPace = eqTime / eqDistance;

            let timeString = new Date(eqTime * 1000).toISOString().substr(11, 8);
            let paceString = new Date(eqPace * 1000).toISOString().substr(11, 8);

            equivalents.push({Distance: commonDistance, Time : timeString, Pace : paceString});
        }

        this.setState({equivalents : equivalents});
    }


    render() {
        let distanceMenuitems = [];
        for (let commonDistance in commonDistances) {
            distanceMenuitems.push(<MenuItem key={commonDistance} value={commonDistance}>{commonDistance}</MenuItem>);
        }

        return (
            <div className="App">
                <Typography variant="h2" gutterBottom component="div">
                    Knicketiknaxens VDOT Calculator
                </Typography>
                <div>
                <FormControl component="fieldset">
                    <RadioGroup row aria-label="position"
                                name="position"
                                defaultValue="top"
                                value={this.state.unit}
                                onChange={this.onUnitChange}>
                        <FormControlLabel value="km" control={<Radio />} label="km" />
                        <FormControlLabel value="mi" control={<Radio />} label="mi" />
                    </RadioGroup>
                </FormControl>
                </div>
                <FormControl sx={{minWidth: 300}} margin={"normal"}>
                    <div>
                            <FormControl sx={{minWidth: 150}}>
                            <InputLabel id="demo-simple-select-helper-label">Select Distance</InputLabel>
                            <Select
                                labelId="demo-simple-select-helper-label"
                                id="demo-simple-select-helper"
                                label={"Select Distance"}
                                value={this.state.distanceSelect} onChange={this.onDistanceSelect}>
                                {distanceMenuitems}
                            </Select>
                        </FormControl>
                        <FormControl sx={{maxWidth: 150}}>
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
                        <FormControl sx={{maxWidth: 150}} margin={"normal"}>
                            <TimeFieldNoLimit
                                input={<TextField />}
                                showHours
                                label={"Time"}
                                value={this.state.time}
                                onChange={this.onTimeChange}
                            />
                        </FormControl>
                        <FormControl sx={{maxWidth: 150}} margin={"normal"}>
                            <TimeFieldNoLimit
                                input={<TextField InputProps={{
                                    endAdornment: <InputAdornment position="end">/ {this.state.unit}</InputAdornment>,
                                }}/>}
                                label={"Pace"}
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

function convertTimeStringToSeconds(timeString) {
    let p = timeString.split(':');
    let s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

function createTimeString(seconds, withHours = true) {
    let timeString;

    if (withHours) {
        timeString = new Date(seconds * 1000).toISOString().substr(11, 8);
    } else {
        let paceMinutes = Math.floor(seconds / 60);
        let paceSeconds = Math.floor(seconds % 60);

        if (paceMinutes > 99) {
            paceMinutes = 0;
            paceSeconds = 0;
        }

        timeString = `${('0' + paceMinutes).slice(-2)}:${('0' + paceSeconds).slice(-2)}`
    }

    return timeString;
}


export default App;
