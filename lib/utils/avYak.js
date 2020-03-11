const http = require('request-promise');

module.exports = {
  publishEvent: (yakUrl, eventType, eventPayload) => {
    console.log(
      JSON.stringify({
        uri: `${yakUrl}/internal/pub`,
        body: [
          {
            type: eventType,
            payload: eventPayload
          }
        ]
      })
    );
    const options = {
      method: 'POST',
      uri: `${yakUrl}/internal/pub`,
      body: [
        {
          type: eventType,
          payload: eventPayload
        }
      ],
      json: true
    };
    return http(options)
      .then(response => {
        console.log('yak event sent');
        if (response) {
          console.log(response.statusCode);
        }
      })
      .catch(error => {
        console.error(error.statusCode);
        console.error(error.message);
      });
  }
};
