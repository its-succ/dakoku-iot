'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');  // eslint-disable-line node/no-unpublished-require
const mqtt = require('mqtt');  // eslint-disable-line node/no-unpublished-require

const MQTT_HOST = 'mqtt.googleapis.com';
const MQTT_PORT = 8883;

const {PROJECT_ID, CLOUD_REGION, REGISTRY_ID, DEVICE_ID, PRIVATE_KEY_FILE} = process.env;
const ALGORITHM = 'RS256';
const MESSAGE_TYPE = 'events';

const mqttClientId = `projects/${PROJECT_ID}/locations/${CLOUD_REGION}/registries/${REGISTRY_ID}/devices/${DEVICE_ID}`;
const mqttTopic = `/devices/${DEVICE_ID}/${MESSAGE_TYPE}`;

// Create a Cloud IoT Core JWT for the given project id, signed with the given
// private key.
// [START iot_mqtt_jwt]
function createJwt (projectId, privateKeyFile, algorithm) {
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  const token = {
    'iat': parseInt(Date.now() / 1000),
    'exp': parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
    'aud': projectId
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, { algorithm: algorithm });
}
// [END iot_mqtt_jwt]

// With Google Cloud IoT Core, the username field is ignored, however it must be
// non-empty. The password field is used to transmit a JWT to authorize the
// device. The "mqtts" protocol causes the library to connect using SSL, which
// is required for Cloud IoT Core.
const settings = {
  host: MQTT_HOST,
  port: MQTT_PORT,
  clientId: mqttClientId,
  username: 'unused',
  password: createJwt(PROJECT_ID, PRIVATE_KEY_FILE, ALGORITHM),
  protocol: 'mqtts',
  secureProtocol: 'TLSv1_2_method'
};

const client = mqtt.connect(settings);

/* MAIN */
const payload = JSON.stringify({
  cardNumber: '1234567890123456',
  action: 'enter',
  device: DEVICE_ID
});

// Publish "payload" to the MQTT topic. qos=1 means at least once delivery.
// Cloud IoT Core also supports qos=0 for at most once delivery.
console.log('Publishing message:', payload);
client.publish(mqttTopic, payload, { qos: 1 }, err => {
  if (err) {
    console.log('ERROR', err);
  } else {
    console.log('Published');
  }
});
