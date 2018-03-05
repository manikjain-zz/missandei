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

        console.log(`Connected to ${team.name} as ${user.name}`);

        let allChannels = this.slack.dataStore.channels;
        
        let channels = [];

        for (let id in allChannels) {
            let channel = allChannels[id];
            if (channel.is_member) {
                channels.push(channel);
            }
        }

        let channelNames = channels.map((channel) => {
                return channel.name;
            }).join(', ');
            
        console.log(`Currently in: ${channelNames}`)
            
/*        channels.forEach((channel) => {
            let members = channel.members.map((id) => {
                return this.slack.dataStore.getUserById(id);
            });
            
            members = members.filter((member) => {
                return !member.is_bot;
            });
            
            let memberNames = members.map((member) => {
                return member.name;
            }).join(', ');
            
            console.log('Members of this channel: ', memberNames);
        });
*/
    });

    this.keywords = new Map();

    this.slack.on(RTM_EVENTS.MESSAGE, (message) => {
      if (!message.text) {
        return;
      }

      let channel = this.slack.dataStore.getChannelGroupOrDMById(message.channel);
      let user = this.slack.dataStore.getUserById(message.user);

      for (let regex of this.keywords.keys()) {    
        if (regex.test(message.text)) {
          let callback = this.keywords.get(regex);
          callback(message, channel, user);
        }
      }
    });

    this.slack.start();
  }

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
    if (start) {
      keywords = '^' + keywords;
    }

    let regex = new RegExp(keywords, 'i');

    this.keywords.set(regex, callback);
  }
}

module.exports = Bot;
