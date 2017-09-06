'use strict';

const redis = require('redis');
const Bot = require('./bot.js');
const data = require('./bot.json');
const Handover = require('./plugins').Handover;
const https = require('https');
const request = require('superagent');

const WEBHOOK_URL = "[SOME_HOOK]";
const client = redis.createClient();
const bot = new Bot({token: data.BOT.key});
const handover = new Handover(client, bot);

function getArgs(msg) {
  return msg.split(' ').slice(1);
}

bot.respondTo('(hello|hi|good morning|gm|good evening|good afternoon|g\'day) (team|missandei)$', (message, channel, user) => {
  bot.send(`Athchomar chomakaan, ${user.name}!`, channel)
}, true);

client.on('error', (err) => {
  console.log('Error ' + err);
});

client.on('connect', () => {
console.log('Connected to Redis!');
});

client.hgetall('oncall', (err, reply) => {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log(reply);
    if (reply === null) {
      client.hmset('oncall', {username: 'none', realname: 'None'}, (err) => {
        if (err) {
        console.log(err);
      } else { 
          console.log('Set default value for oncall');
      }
      });
    }
  }
});


bot.respondTo('oncall', (message, channel, user) => {
  let args = getArgs(message.text);
  if (!user.is_bot){
    switch(args[0]) {
      case 'take':
        client.hgetall('oncall', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} @${reply.username} was oncall, now ${user.profile.real_name} @${user.name} is oncall.`, channel);
        });
        client.hmset('oncall', {username: user.name, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you on alerts but failed. :(', channel);
          }
        });
        break;

      case 'who':
      case 'whom':
        client.hgetall('OnAlerts', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} @${reply.username} is oncall`, channel);
        });
        
        break;

      case 'help':
      default:
        bot.send('Usage: \`oncall [who|whom]\` - Find who is oncall, \`oncall take\` - Put yourself oncall', channel);
        break;
    }
  }

}, true);

bot.respondTo('handover', (message, channel, user) => {
  let args = getArgs(message.text);

  switch(args[0]) {
    case 'add':
      handover.addTask(user.profile.first_name, args.slice(1).join(' '), channel);
      break;

    case 'complete':
      handover.completeTask(user.profile.first_name, parseInt(args[1], 10), channel);    
      break;

    case 'delete':
      handover.removeTaskOrTodoList(user.profile.first_name, args[1], channel);    
      break;

    case 'help':
      bot.send('Add handover tasks with \`handover add [TASK]\`, complete them with \`handover complete [TASK_NUMBER]\` and remove them with \`handover delete [TASK_NUMBER]\` or \`handover delete all\`', channel);
      break;

    default:
      handover.showHandover(user.profile.first_name, channel);
      break;
  }
}, true);

const options = {
  host: '[SOME_URL]',
  port: 443,
  path: '/to/path',
  headers: {
    'Authorization': 'Basic ' + new Buffer(data.user + ':' + data.pass).toString('base64')
  }
};

setInterval(function() {
  https.get(options, function(res){
    var body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
    //here we have the full response, html or json object
      body = JSON.parse(body)
      if (body.length == 1) {
        request
        .post(WEBHOOK_URL)
        .send({
          text: `Some message`
        })
        .end((err, res) => {
          console.log(err);
        });
      } else if (body.length > 1){
        request
        .post(WEBHOOK_URL)
        .send({
          text: `Some Message`
        })
        .end((err, res) => {
          console.log(err);
        });
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, 120000);

bot.respondTo('check$', (message, channel, user) => {
  https.get(options, function(res){
    var body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
    //here we have the full response, html or json object
      body = JSON.parse(body)
      if (body.length < 1) {
        bot.send(`Some Message`, channel);
      } else if (body.length > 1){
          bot.send(`Some Message`, channel);
      } else {
          bot.send(`Some message`, channel);
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, true);
