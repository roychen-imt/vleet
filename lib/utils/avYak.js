const httpGot = require('got');

module.exports = {
  publishEvent: async (yakUrl, eventType, eventPayload) => {
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

    const gotOptions = {
      method: 'POST',
      json: [
        {
          type: eventType,
          payload: eventPayload
        }
      ]
    };
    try {
      //const response = await http(options);
      const response = await httpGot(`${yakUrl}/internal/pub`, gotOptions);
      if (response) {
        console.log(`yak event sent. statusCode: ${response.statusCode}`);
        console.log(response.body);
      }
    } catch (error) {
      console.error(error.statusCode);
      console.error(error.message);
    }
    return;
  }
};
