/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */
const cloudTasks = require('@google-cloud/tasks');

exports.subscribe = (event, callback) => {
  // The Cloud Pub/Sub Message object.
  const pubsubMessage = event.data;

  // We're just going to log the message to prove that
  // it worked.
  console.log(Buffer.from(pubsubMessage.data, 'base64').toString());

  const client = new cloudTasks.CloudTasksClient();

  console.log('ENV', process.env);
  const parent = client.queuePath(process.env.GCP_PROJECT, process.env.FUNCTION_REGION, process.env.DAKOKU_QUEUE_DAKOKU);

  const task = {
    appEngineHttpRequest: {
      httpMethod: 'POST',
      relativeUri: '/api/dakoku',
      headers: {
        'Content-Type': 'application/json'
      },
      body: pubsubMessage.data
    },
  };

  const request = {
    parent: parent,
    task: task,
  };

  client.createTask(request).then(response => {
    console.log('PUSH TASK', response);
    // Don't forget to call the callback.
    callback();
  });
};