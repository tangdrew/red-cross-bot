var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // // Check if we have previously stored a token.
  // fs.readFile(TOKEN_PATH, function(err, token) {
  //   if (err) {
  //     console.log('setting google access token');
  //     oauth2Client.getToken('4/s68BY2c5TVwiTXgA6Y76mb0X1UMWlGFIfqD4ah8xyxw', function(err, token) {
  //       if (err) {
  //         console.log('Error while trying to retrieve access token', err);
  //         return;
  //       }
  //
  //       console.log('TOKEN', token);
  //       oauth2Client.credentials = token;
  //       storeToken(token);
  //       callback(oauth2Client);
  //     });
  //   } else {
  //     console.log('TOKEN', JSON.parse(token));
  //     oauth2Client.credentials = JSON.parse(token);
  //     callback(oauth2Client);
  //   }
  // });

  secret_token = {
    access_token: 'ya29.GlsIBGaY-jyxEAfv7BzLp0eOmrXQGB3bi-iHAJgeEy5qg8W1OGjFz1TQUuYXnxlirkmQXKfR0lHFbRF5dfAPlQbEsMbRb0rTAURAR2CYDhWv5eBBDQIo9NuHaoIH',
    refresh_token: '1/2VGGBPeqAp3W6_vNXGJ67HXFstZAL6Qx51OHtsh8oxo',
    token_type: 'Bearer',
    expiry_date: 1489012353758
  }
  oauth2Client.credentials = secret_token;
  callback(oauth2Client);

}

exports.getAuth = function(callback) {
  fs.readFile('client_secret.json', function(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    authorize(JSON.parse(content), auth => {
      callback(auth);
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

exports.readData = function(auth, callback) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: '1M4yBOZsr5dxVu1nCZDAdveVbdbC9U6jpCgNTPZY-Zq4',
    range: 'Database!A2:D',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    callback(response.values);
  });
}

exports.addRow = function(auth, values, callback) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: '1M4yBOZsr5dxVu1nCZDAdveVbdbC9U6jpCgNTPZY-Zq4',
    range: 'Database!A1',
    valueInputOption: 'RAW',
    resource: {
      values: values
    }
  }, function(err, response) {
    if(err) {
      console.error(err);
    } else {
      console.log(response);
      callback(response);
    }
  });
}
