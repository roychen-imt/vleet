const _ = require('lodash');
const Bromise = require('bluebird');
const conzole = require('conzole');
const generators = require('../generators');
const moment = require('moment');
const mqtt = require('mqtt');
const jsonfile = require('jsonfile');

const MQTT_PORT = '1883';

ReplayEngine.prototype.sendData = function(systemData) {
  return new Bromise((resolve, reject) => {
    console.log(this);
    const system = systemData.system,
      data = systemData.data,
      mqttId = getMQTTId(system, this.simulation),
      mqttPwd = system.communication.mqtt.password,
      mqttClient = createMQTTClient(mqttId, mqttPwd, this.mqttServer);

    mqttClient.on('error', e => {
      mqttClient.end();
      conzole.failed('[MQTT]', system.name, '- Error while connecting');
      conzole.failed(e);
      reject(e);
    });

    mqttClient.on('connect', () => {
      conzole.done('System', mqttId, 'connected ');
      mqttClient.publish(mqttId + '/messages/json', JSON.stringify(data), () => {
        mqttClient.end();
        conzole.indent(4).fromTo(system.name, JSON.stringify(data));
        resolve();
      });
    });
  });
};

ReplayEngine.prototype.generateData = function(system) {
  var self = this;
  conzole.start('Generate data for system:', system.name);
  var data = {};
  var rawData = [];

  try {
    var raw = jsonfile.readFileSync(`./simulations/${self.getDataFile()}`);
    rawData = _.orderBy(raw, ['ts', 'value_index']);
  } catch (error) {
    conzole.failed(error.stack);
  }

  try {
    conzole.start(`Preparing ${rawData.length} datapoints`);
    _.each(rawData, function(datapoint) {
      var currentDay = moment()
        .subtract(self.getDaysInPast(), 'days')
        .hours(0)
        .minutes(0)
        .seconds(0);
      var ts = moment(datapoint.ts)
        .year(currentDay.year())
        .month(currentDay.month())
        .date(currentDay.date());
      var timestamp = ts.valueOf();
      var dataDescriptor = datapoint.data_id;
      var value = _.isNull(datapoint.value_num) ? datapoint.value_string : datapoint.value_num;
      if (!data[timestamp]) {
        data[timestamp] = {};
      }
      data[timestamp][dataDescriptor] = value;
      conzole
        .indent(2)
        .start(
          `Generating data on ${ts.valueOf()}-${ts.format('dddd, MMMM Do YYYY, h:mm:ss a')}, ${dataDescriptor}=${value}`
        );
    });
    // conzole.start(JSON.stringify(data));
  } catch (error) {
    conzole.failed('Data generation error:', error.stack);
  }
  return data;
};

ReplayEngine.prototype.generateValue = function(dataDescriptor, system) {
  var generationConfig = this.getDataGenerationConfig(dataDescriptor);
  var generator = this.dataGenerators[dataDescriptor];
  if (!generator) {
    generator = this.getGenerator(generationConfig);
    this.dataGenerators[dataDescriptor] = generator;
  }

  return generator.generate(system);
};

ReplayEngine.prototype.getGenerator = function(generatorId) {
  return generators(generatorId);
};

ReplayEngine.prototype.getDataGenerationConfig = function(dataId) {
  return this.simulation.generation.data[dataId];
};

ReplayEngine.prototype.getGenerationData = function() {
  return this.simulation.generation.data;
};

ReplayEngine.prototype.getDaysInPast = function() {
  return this.simulation.generation.replay.nbDaysInPast;
};

ReplayEngine.prototype.getDataFile = function() {
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

function ReplayEngine(simulation, config) {
  this.simulation = simulation;
  this.mqttServer = 'tcp://' + config.server;
  this.dataGenerators = {};
}

ReplayEngine.prototype.start = function(systems) {
  var self = this;
  this.systems = systems;
  var fleetData = _.map(this.systems, system => ({ system, data: this.generateData(system) }));

  return Bromise.mapSeries(fleetData, systemData => this.sendData(systemData));
};

module.exports = ReplayEngine;
