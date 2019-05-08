/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */
const cloudTasks = require('@google-cloud/tasks');

exports.subscribe = (data, context, callback) => {
  // The Cloud Pub/Sub Message object.
  const pubsubMessage = data;

  // We're just going to log the message to prove that
  // it worked.
  try {
    JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
  } catch(e) {
    // JSONが転送されてこない場合がある(なぜかeventsサブフォルダが送信されてくるが、Arduino SDKのバグかもしれない)
    callback();
  }
  console.log('PAYLOAD', Buffer.from(pubsubMessage.data, 'base64').toString());

  const client = new cloudTasks.CloudTasksClient();

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
    // console.log('PUSH TASK', response);
    // Don't forget to call the callback.
    callback();
  });
};