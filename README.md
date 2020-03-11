# Vleet

> Virtual fLeet of system simulator for AirVantage platform

[![Build Status](https://travis-ci.org/AirVantage/vleet.svg?branch=master)](https://travis-ci.org/AirVantage/vleet)

## Usage

### Installation

1. [Download](https://nodejs.org/en/download/) & install NodeJS
2. From the command line, install vleet globally

```console
$ npm install
```

### Set up your REPLAY simulation (ideal for simulating small amount of datapoints (< 1K))

1. copy a raw data json file to `simulations` folder

-   a sample raw data file is included in `sample_raw_data` folder

2. Rename `setup.json.replay.template` to `setup.json`
3. Fix fields in `setup.json`

-   companyUid
-   username
-   password

4. Rename `simulations/trucks.json.replay.template` to `simulations/trucks.json`
5. Fix fields in `trucks.json`

-   simulationLabel
-   dataFile (change it to the file name you use in step #1)
-   nbDaysInPast (this is used to specify which day you would like the data to be replayed as. For example, if the value is 1, then the data will be replayed with yesterday's timestamp)

### Set up your DATAPOINT_BACK_DOOR simulation (ideal for simulating a large amount of datapoints (> 1K))

1. copy a raw data json file to `simulations` folder

-   a sample raw data file is included in `sample_raw_data` folder

2. Rename `setup.json.datapointBackDoor.template` to `setup.json`
3. Fix fields in `setup.json`

-   companyUid
-   username
-   password

4. Rename `simulations/trucks.json.datapointBackDoor.template` to `simulations/trucks.json`
5. Fix fields in `trucks.json`

-   simulationLabel
-   dataFile (change it to the file name you use in step #1)
-   nbDaysInPast (this is used to specify which day you would like the data to be replayed as. For example, if the value is 1, then the data will be replayed with yesterday's timestamp)

6. Establish a SSH tunnel to `av-yak` on dev1

-   An easy option is to use the `av-dev-tools` to establish the tunnel.

7. The datapoints loaded using this method will not be available in the data lake immediately. The loader is scheduled every 2 hours on DEV1. Once the loader finishes its job, then the datapoints will be available in the data lake.

### Launch the simulation

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
