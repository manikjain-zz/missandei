'use strict';

const RtmClient = require('@slack/client').RtmClient;
const MemoryDataStore = require('@slack/client').MemoryDataStore;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

class Bot {
  constructor(opts) {
    let slackToken = opts.token;
    let autoReconnect = opts.autoReconnect || true;
    let autoMark = opts.autoMark || true;

    this.slack = new RtmClient(slackToken, { 
      logLevel: 'error', 
      dataStore: new MemoryDataStore(),
      autoReconnect: autoReconnect,
      autoMark: autoMark
    });

    this.slack.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
        console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
    });
        
    this.slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
        // Get the user's name
        let user = this.slack.dataStore.getUserById(this.slack.activeUserId);

        // Get the team's name
        let team = this.slack.dataStore.getTeamById(this.slack.activeTeamId);

        // Log the slack team name and the bot's name, using ES6's
        // template string syntax
        console.log(`Connected to ${team.name} as ${user.name}`);

        // Note how the dataStore object contains a list of all
        // channels available
        let allChannels = this.slack.dataStore.channels;
        
        let channels = [];

        for (let id in allChannels) {
            // Get an individual channel
            let channel = allChannels[id];
            // Is this user a member of the channel?
            if (channel.is_member) {
                // If so, push it to the array
                channels.push(channel);
            }
        }

        // Use Array.map to loop over every instance and return an
        // array of the names of each channel. Then chain Array.join
        // to convert the names array to a string
        let channelNames = channels.map((channel) => {
                return channel.name;
            }).join(', ');
            
        console.log(`Currently in: ${channelNames}`)
            
        // log the members of the channel
        channels.forEach((channel) => {
            // get the members by ID using the data store's
            // 'getUserByID' function
            let members = channel.members.map((id) => {
                return this.slack.dataStore.getUserById(id);
            });
            
            // Filter out the bots from the member list using Array.filter
            members = members.filter((member) => {
                return !member.is_bot;
            });
            
            // Each member object has a 'name' property, so let's
            // get an array of names and join them via Array.join
            let memberNames = members.map((member) => {
                return member.name;
            }).join(', ');
            
            console.log('Members of this channel: ', memberNames);
            
            // Send a greeting to everyone in the channel
            this.slack.sendMessage(`Hello ${memberNames}!`, channel.id);
        });
    });

    // Create an ES6 Map to store our regular expressions
    this.keywords = new Map();

    this.slack.on(RTM_EVENTS.MESSAGE, (message) => {
      // Only process text messages
      if (!message.text) {
        return;
      }

      let channel = this.slack.dataStore.getChannelGroupOrDMById(message.channel);
      let user = this.slack.dataStore.getUserById(message.user);

      // Loop over the keys of the keywords Map object and test each
      // regular expression against the message's text property
      for (let regex of this.keywords.keys()) {    
        if (regex.test(message.text)) {
          let callback = this.keywords.get(regex);
          callback(message, channel, user);
        }
      }
    });

    this.slack.start();
  }

  // Send a message to a channel, with an optional callback
  send(message, channel, cb) {
    this.slack.sendMessage(message, channel.id, () => {
      if (cb) {
        cb();
      }
    });
  }

  setTypingIndicator(channel) {
    this.slack.send({ type: 'typing', channel: channel.id });
  }

  respondTo(keywords, callback, start) {
    // If 'start' is truthy, prepend the '^' anchor to instruct the
    // expression to look for matches at the beginning of the string
    if (start) {
      keywords = '^' + keywords;
    }

    // Create a new regular expression, setting the case insensitive (i) flag
    // Note: avoid using the global (g) flag
    let regex = new RegExp(keywords, 'i');

    // Set the regular expression to be the key, with the callback function as the value
    this.keywords.set(regex, callback);
  }
}

// Export the Bot class, which will be imported when 'require' is used
module.exports = Bot;