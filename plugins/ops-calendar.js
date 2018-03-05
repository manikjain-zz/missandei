'use strict';

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment = require('moment');
var request = require('superagent');
var getUrls = require('get-urls');
var data = require('../bot.json');


class OpsCalendar {
    constructor() {
        var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
        var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
            process.env.USERPROFILE) + '/.credentials/';
        var TOKEN_PATH = TOKEN_DIR + 'ops-calendar.json';
        var WEBHOOK_URL = data.WEBHOOK_URL.opsprivate;

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
        };

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
        };

        this.authorize = function (credentials, callback) {
            var clientSecret = credentials.installed.client_secret;
            var clientId = credentials.installed.client_id;
            var redirectUrl = credentials.installed.redirect_uris[0];
            var auth = new googleAuth();
            var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
          
            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, function(err, token) {
              if (err) {
                getNewToken(oauth2Client, callback);
              } else {
                oauth2Client.credentials = JSON.parse(token);
                callback(oauth2Client);
              }
            });
        };
          

        this.listEvents = function (auth) {
            var calendar = google.calendar('v3');
            var current_time = moment();
            calendar.events.list({
              auth: auth,
              calendarId: 'primary',
              timeMin: (new Date()).toISOString(),
              maxResults: 2,
              singleEvents: true,
              orderBy: 'startTime'
            }, function(err, response) {
              if (err) {
                console.log('The API returned an error: ' + err);
                return;
              }
              var events = response.items;
              for (var i = 0; i < events.length; i++) {
                var start = moment(events[i].start.dateTime);
                var time_until_meet = start.diff(current_time, 'minutes');
                if (events[i].location) {
                  var link = getUrls(events[i].location);
                  link.forEach(function(element) {link = element.replace(/,/g, "")});
                } else {
                  var link = "No link found. Please add a link to the 'Where' field of the event.";
                }
                if (time_until_meet === 1) {
                    request
                    .post(WEBHOOK_URL)
                    .send({
                    "text": "<!here> Event starting in 1 minute:",
                    "attachments": [
                        {
                            "title": events[i].summary,
                            "title_link": link,
                            "text": events[i].description,
                            "color": "#9493FF",
                            "fields": [
                                {
                                    "title": "Meeting link:",
                                    "value": link,
                                    "short": false
                                }
                            ]
                        }
                    ]
                    })
                    .end((err, res) => { if (err)
                    console.log(err);
                    });
                }
              }
            });
        };
    }
}

module.exports = OpsCalendar;
