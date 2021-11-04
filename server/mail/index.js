const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { SECRETS_PATH, readSecret, writeSecret } = require('../secrets');

let gmail;

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_SECRET = '/mail/token.json';
const CREDS_SECRET = '/mail/credentials.json';

// Load client secrets from a local file.
readSecret(CREDS_SECRET).then(creds => {
  authorize(creds, (auth) => {
    gmail = google.gmail({version: 'v1', auth});
  });
}).catch(console.log)

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  readSecret(TOKEN_SECRET).then(token => {
    oAuth2Client.setCredentials(token)
    callback(oAuth2Client)
  }).catch(err => {
    console.log(err)
    getNewToken(oAuth2Client, callback)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      writeSecret(TOKEN_SECRET, token)
      callback(oAuth2Client)
    });
  });
}

const linkRegex = /(?:https?:\/\/)?((?:\w+\.)+[\w/#\+]{2,})/gi
const convertLinks = str => {
  // console.log(str.split(linkRegex).filter(part => part))
  return str.split(linkRegex).filter(part => part).map((part, i) => {
    if (linkRegex.test(part)) {
      return part
        .replace(linkRegex, `<a href="https://$1">$&</a>`)
        .replace(/href="https:\/\/((?:ht|f)tp(?:s?)\:\/\/|~\/|\/)/i, `href="$1`)
    } else {
      return part
    }
  }).join('')
}

function buildRequest(subject, to, message, extraHeaders=[]) {
  message = convertLinks(message)
  const str = [
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: base64',
    `Subject: ${subject}`,
    `From: cyrus@freshman.dev`,
    `To: ${to}`,
    ...extraHeaders,
    '',
    `<div>${message}</div>`,
  ].join('\n');
  return {
    auth: gmail.context.auth,
    userId: 'me',
    resource: {
      raw: Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_')
    },
  }
}
function execRequest(request) {
  return new Promise((resolve, reject) => {
    gmail.users.messages.send(request, (err, res) => {
      if (err) {
        console.log(err)
        return reject(err)
      }
      console.log('[MAILED]', res.data.id)
      return resolve(res)
    });
  })
}

module.exports = {
  send: async (to, subject, message) => {
    return execRequest(
      buildRequest(subject, to, message),
    )
  },
  chain: async (baseId, message) => {
    let res = await gmail.users.messages.get({
      auth: gmail.context.auth,
      userId: 'me',
      id: baseId
    })
    let [subject, to, refId] =
      'subject to message-id'
        .split(' ')
        .map(field => res.data.payload.headers
          .find(item => item.name.toLowerCase() === field).value)
    let request = buildRequest(subject, to, message, [
      `In-Reply-To: ${refId}`,
      `References: ${refId}`,
    ])
    request.resource['threadId'] = baseId
    return execRequest(request)
  },
}