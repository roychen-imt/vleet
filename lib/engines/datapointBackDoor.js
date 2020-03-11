const _ = require('lodash');
const Bromise = require('bluebird');
const conzole = require('conzole');
const generators = require('../generators');
const moment = require('moment');
const jsonfile = require('jsonfile');
const avYak = require('../utils/avYak');
const s3Utils = require('../utils/s3Utils');
const uuidv4 = require('uuid/v4');
const http = require('request-promise');

const triggerYakEvent = (url, filePath) => {
  return avYak.publishEvent(url, 'av-yak.activity.newS3File', {
    filePath,
    eventType: 'av-core.system.communication'
  });
};

DatapointBackDoorEngine.prototype.sendData = async function(systemData) {
  var self = this;
  if (_.isEmpty(systemData.data)) {
    conzole.done('Empty data. Nothing to do');
    return;
  }
  // first, generate text
  conzole.start('generating text...');
  const text = _.join(systemData.data, '\n');
  conzole.message(text);
  // second, upload text file to S3
  conzole.start('uploading to s3...');
  const today = moment().format('YYYY-MM-DD');
  const s3Bucket = `dev1-av-yak-data/json/av-core.system.communication-1/day=${today}`;
  const s3key = `vleet-rchen-datapointBackDoor-${moment().valueOf()}`;
  //const filePath = 'roy';
  const filePath = await s3Utils.uploadJsonGz(text, s3Bucket, s3key);
  conzole.done(`${filePath} uploaded`);
  // third, trigger yak event
  conzole.start('triggering yak event...');
  await triggerYakEvent(this.avYakUrl, filePath);
  conzole.done('yak event triggered');
};

DatapointBackDoorEngine.prototype.generateMessage = function(system, dataChunk) {
  var self = this;
  const currentDay = moment()
    .subtract(self.getDaysInPast(), 'days')
    .hours(0)
    .minutes(0)
    .seconds(0);
  const data = _.map(dataChunk, datapoint => {
    const ts = moment(datapoint.ts)
      .year(currentDay.year())
      .month(currentDay.month())
      .date(currentDay.date());
    const timestamp = ts.valueOf();
    const path = datapoint.data_id;
    const value = _.isNull(datapoint.value_num) ? datapoint.value_string : datapoint.value_num;
    const type = _.isNull(datapoint.value_num) ? 'STRING' : 'DOUBLE';
    conzole
      .indent(2)
      .start(
        `Generating data on ${ts.valueOf()}-${ts.format('dddd, MMMM Do YYYY, h:mm:ss a')}, ${path}<${type}>=${value}`
      );
    return {
      path,
      timestamp,
      type,
      value
    };
  });

  const gwSN = getMQTTId(system, this.simulation);

  return JSON.stringify({
    id: uuidv4(),
    version: 1,
    type: 'av-core.system.communication',
    tags: ['MQTT', system.uid, 'DATA'],
    payload: {
      id: uuidWithoutHypens(),
      systemCommunicationId: gwSN,
      protocol: 'MQTT',
      receptionDate: moment().valueOf(),
      systemId: system.uid,
      companyId: this.companyId,
      values: data,
      source: 'V_4',
      type: 'DATA'
    },
    companyId: this.companyId
  });
};

DatapointBackDoorEngine.prototype.generateData = function(system) {
  var self = this;

  conzole.start('Generate data for system:', system.name);
  var textLines = [];
  var rawData = [];

  try {
    var raw = jsonfile.readFileSync(`./simulations/${self.getDataFile()}`);
    rawData = _.orderBy(raw, ['ts', 'value_index']);
  } catch (error) {
    conzole.failed(error.stack);
  }

  try {
    conzole.start(`Preparing ${rawData.length} datapoints`);
    textLines = _.map(_.chunk(rawData, 100), dataChunk => this.generateMessage(system, dataChunk));
    // conzole.start(JSON.stringify(data));
  } catch (error) {
    conzole.failed('Data generation error:', error.stack);
  }
  return textLines;
};

DatapointBackDoorEngine.prototype.getDaysInPast = function() {
  return this.simulation.generation.replay.nbDaysInPast;
};

DatapointBackDoorEngine.prototype.getDataFile = function() {
  return this.simulation.generation.replay.dataFile;
};

function getMQTTId(system, simulation) {
  const commIdField = _.get(simulation, 'fleet.communicationId', 'serialNumber');
  return system.gateway[commIdField];
}

function createMQTTClient(mqttId, mqttPwd, mqttServer) {
  var options = { username: mqttId, password: mqttPwd };
  conzole.start('Send data');
  conzole.quote('Create mqtt client:', MQTT_PORT, mqttServer, options);
  return mqtt.connect(mqttServer, options);
}

function uuidWithoutHypens() {
  return uuidv4().replace(/-/g, '');
}

function DatapointBackDoorEngine(simulation, config) {
  const setup = jsonfile.readFileSync(`${__dirname}/../../setup.json`);
  const serverConfig = jsonfile.readFileSync(`${__dirname}/../../config/${setup.dataCenter}.json`);
  this.simulation = simulation;
  this.avYakUrl = _.get(serverConfig, 'yakUrl', 'http://localhost:8089/yak');
  this.companyId = setup.companyUid;
  this.dataGenerators = {};
}

DatapointBackDoorEngine.prototype.start = function(systems) {
  var self = this;
  this.systems = systems;
  var fleetData = _.map(this.systems, system => ({ system, data: this.generateData(system) }));

  return Bromise.mapSeries(fleetData, systemData => this.sendData(systemData));
};

module.exports = DatapointBackDoorEngine;
