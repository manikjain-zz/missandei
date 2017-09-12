'use strict';

const redis = require('redis');
const Bot = require('./bot.js');
const data = require('./bot.json');
const Handover = require('./plugins').Handover;
const https = require('https');
const request = require('superagent');
const moment = require('moment');

const WEBHOOK_URL = "[SOME_URL]";
const client = redis.createClient();
const bot = new Bot({token: data.BOT.key});
const handover = new Handover(client, bot);

function getArgs(msg) {
  return msg.split(' ').slice(1);
}

function sendRandom(message){
  request
  .post(WEBHOOK_URL)
  .send({
    text: message
  })
  .end((err, res) => { if (err)
    console.log(err);
  });
}

bot.respondTo('(hello|hi|good morning|gm|good evening|good afternoon|gday|morning) (ops|opsians)$', (message, channel, user) => {
  var messages = [`Hello to you too, ${user.profile.first_name}!`,
  `Howdy howdy howdy, ${user.profile.real_name}!`,
  `Whaddup.`,
  `Ahoy matey!`,
  `Ello Mate!`,
  `Yo-yo yiggidy-yo!`,
  `${user.profile.first_name}, where have you been all my life?`,
  `Don't even think about not saying hi.`,
  `Look what the cat dragged in!`,
  `Oh, there you are!`,
  `What's going on ${user.profile.first_name}?`,
  `Rise n’ shine, ${user.profile.real_name}`];
  bot.send(messages[Math.floor(Math.random() * messages.length)], channel);
}, true);

bot.respondTo('(goodbye|bbye|bye|see ya|see ya later|later) (ops|opsians)$', (message, channel, user) => {
  var messages = [`Catch ya on the flipside, ${user.profile.first_name}!`,
  `Later gater.`,
  `Catcha lataaaa`,
  `Bye, boomerang!`,
  `Take it easy, ${user.profile.first_name}`,
  `Catch ya later, ${user.profile.real_name}`,
  `Have a good one, ${user.profile.real_name}`,
  `Oh wait, we need your help! :wink:`,
  `See you later, ${user.profile.real_name}`,
  `Take care ${user.profile.real_name}`,
  `Stay classy, sassy, and a bit bad assy.`,
  `Is your name Winter? Because you'll be coming soon.`];
  bot.send(messages[Math.floor(Math.random() * messages.length)], channel);
}, true);

client.on('error', (err) => {
  console.log('Error ' + err);
});

client.on('connect', () => {
console.log('Connected to Redis!');
});

client.hgetall('OnCall', (err, reply) => {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log(reply);
    if (reply === null) {
      client.hmset('OnCall', {username: 'none', realname: 'None'}, (err) => {
        if (err) {
        console.log(err);
      } else { 
          console.log('Set default value for OnCall');
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
        client.hgetall('OnCall', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on call but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} @${reply.username} was oncall, now ${user.profile.real_name} @${user.name} is oncall.`, channel);
        });
        client.hmset('OnCall', {username: user.name, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you on call but failed. :(', channel);
          }
        });
        break;
      
      case 'taketh':
        client.hgetall('OnCall', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s oncall but failed. :(', channel);
            return;
          }
          bot.send(`Forsooth! ${reply.realname} @${reply.username} was the oncall, but ${user.profile.real_name} @${user.name} taketh alerts henceforth!  May thy crits be not..`, channel);
        });
        client.hmset('OnCall', {username: user.name, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you oncall but failed. :(', channel);
          }
        });
        break;
      
      // Just for fun :D
      case 'takewhatisyours':
        client.hgetall('OnCall', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s oncall but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} @${reply.username}, you stand in the presence of ${user.profile.real_name} @${user.name} of House PagerDuty, rightful heir to the oncall, the Unburnt, the Breaker of alerts. Bend thy knee!`, channel);
        });
        client.hmset('OnCall', {username: user.name, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you oncall but failed. :(', channel);
          }
        });
        break;
      
      case 'who':
      case 'whom':
        client.hgetall('OnCall', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s oncall but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} @${reply.username} is oncall.`, channel);
        });
        
        break;

      case 'help':
      default:
        bot.send('Usage: \`oncall [who|whom]\` - Find who is on oncall, \`oncall [take|taketh|takewhatisyours]\` - Put yourself on oncall', channel);
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

const opts = {
  host: 'FQDN',
  port: 443,
  path: '/path/to/something',
  headers: {
    'Authorization': 'Basic ' + new Buffer(data.user + ':' + data.pass).toString('base64')
  }
};

setInterval(function() {
  https.get(opts, function(res){
    var body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
    //here we have the full response, html or json object
      body = JSON.parse(body)
      if (body.length === 1) {
        sendRandom(`Some message`);
      } else if (body.length > 1){
          sendRandom(`Some message`);
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, 120000);

bot.respondTo('check$', (message, channel, user) => {
  https.get(opts, function(res){
    var body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      body = JSON.parse(body)
      if (body.length < 1) {
        bot.send(`Some message :happyhourparrot:`, channel);
      } else if (body.length > 1){
          bot.send(`Some message`, channel);
      } else {
          bot.send(`Some message`, channel);
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, true);

const pd_opts = {
  host: 'api.pagerduty.com',
  port: 443,
  path: '',
  headers: {
    'Accept': 'application/vnd.pagerduty+json;version=2', 'Authorization': 'Token token=' + data.PD.token
  }
};

var last_emerg_message = moment();

setInterval(function() {
  let since = encodeURIComponent(moment().toISOString());
  let until = encodeURIComponent(moment().add(10, 'days').toISOString());
  pd_opts.path = '/oncalls?time_zone=UTC&include%5B%5D=users&user_ids%5B%5D=' +
                  data.PD.userid + '&escalation_policy_ids%5B%5D=' + data.PD.esc_policy + '&schedule_ids%5B%5D=' + data.PD.sch_id + '&since='
                  + since + '&until=' + until;
  https.get(pd_opts, function(res){
    let body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      let oncalls = JSON.parse(body)['oncalls'];
      let gaps_count = oncalls.length;
      let time_now = moment();
      if ( time_now.diff(last_emerg_message, 'minutes') > 3 ) {
        if (gaps_count > 1) {
          sendRandom(`${gaps_count} coverage gaps in PD need an assignee.`);
        } else if (gaps_count === 1) {
            sendRandom(`${gaps_count} coverage gap in PD needs an assignee.`);
        }
      }
      oncalls.forEach(function(element){
        let start_time = moment(element['start']);
        let diff = start_time.diff(time_now, 'days');
        if ( diff < 10 ) {
          if ( time_now.diff(last_emerg_message, 'minutes') > 5 ) {
            let gap_time = start_time.format('H:m UTC');
            sendRandom(`<!here> A coverage gap at ${gap_time} needs an assignee urgently!`);
            last_emerg_message = moment();
          }
        }
      });
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });

  pd_opts.path = '/incidents?statuses%5B%5D=triggered&statuses%5B%5D=acknowledged&user_ids%5B%5D=' +
                  data.PD.userid + '&time_zone=UTC';
  https.get(pd_opts, function(res){
    let body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      let incidents = JSON.parse(body)['incidents'];
      let no_of_incidents = incidents.length;
      if (incidents > 1) {
        sendRandom(`<!here> There are ${no_of_incidents} incidents unassigned in PagerDuty.`)
      } else if (incidents === 1) {
        sendRandom(`<!here> There is ${no_of_incidents} incident unassigned in PagerDuty.`);
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, 120000);

bot.respondTo('pd', (message, channel, user) => {
  let args = getArgs(message.text);
  let until = encodeURIComponent(moment().add(1, 'days').toISOString());  
  let pd_cmd_opts = {
    host: 'api.pagerduty.com',
    port: 443,
    path: '/oncalls?time_zone=UTC&escalation_policy_ids%5B%5D=' + data.PD.esc_policy + '&schedule_ids%5B%5D='+ data.PD.sch_id + '&' +
    'until=' + until + '&earliest=false',
    headers: {
      'Accept': 'application/vnd.pagerduty+json;version=2', 'Authorization': 'Token token=' + data.PD.token
    }
  };
  switch(args[0]) {
    case 'oncall':
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let oncall = JSON.parse(body)['oncalls'][0].user.summary;
          bot.send(`${oncall} is currently oncall.`, channel)
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    case 'next':
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let oncall = JSON.parse(body)['oncalls'][1].user.summary;
          bot.send(`${oncall} is next oncall.`, channel)
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    default:
      bot.send('Usage: \`pd oncall\` - Finds who is currently on call, \`pd next\` - Finds who is next on call', channel);
      break;
  }
}, true);