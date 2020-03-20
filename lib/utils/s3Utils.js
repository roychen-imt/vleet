const zlib = require('zlib');
const util = require('util');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const gzip = util.promisify(zlib.gzip);

module.exports = {
  uploadJsonGz: async (content, s3bucket, s3key) => {
    try {
      const buffer = new Buffer.from(content);
      const compressed = await gzip(buffer);

      const params = {
        Body: compressed,
        Bucket: s3bucket,
        Key: `${s3key}.json.gz`,
        ContentType: 'application/json',
        ContentEncoding: 'gzip'
      };

      await s3.putObject(params).promise();
      return `s3://${s3bucket}/${s3key}.json.gz`;
    } catch (e) {
      console.log(e);
    }
  }
};
