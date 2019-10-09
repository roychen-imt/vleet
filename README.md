Vleet
============
> Virtual fLeet of system simulator for AirVantage platform


[![Build Status](https://travis-ci.org/AirVantage/vleet.svg?branch=master)](https://travis-ci.org/AirVantage/vleet)

## Usage

### Installation
1. [Download](https://nodejs.org/en/download/) & install NodeJS
2. From the command line, install vleet globally

```console
$ npm install
```

### Set up your simulation
1. copy raw data json file to `simulations` folder
2. Rename `setup.json.replay.template` to `setup.json`
3. Fix fields in `setup.json`
- companyUid
- username
- password
4. Rename `simulations/trucks.json.replay.template` to `simulations/trucks.json`
5. Fix fields in `trucks.json`
- simulationLabel
- dataFile (change it to the file name you use in step #1)
- nbDaysInPast (this is used to specify which day you would like the data to be replayed as. For example, if the value is 1, then the data will be replayed as yesterday's data)

### Launch the replay
From the root folder just launch `./cli.js`

## CLI 
```console
$ ./cli.js --help

Usage: ./cli.js [options] <your-setup.json> (default: setup.json)

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -c, --clean    Clean the simulated resources (Systems, Gateways, Applications with the "simulationLabel")
```

