module.exports = function Handover(client, bot) {
    this.showHandover = function(name, channel) {
        client.smembers('handover', (err, set) => {
        if (err || set.length < 1) {
            bot.send(`There are no handover tasks listed currrently, ${name}! :dancerbanana:`, channel);
            return;
        }
    
        bot.send(`OPS handover items:`, channel);
    
        set.forEach((task, index) => {
            bot.send(`${index + 1}. ${task}`, channel);
        });
        });
    };
  
  this.addTask = function(name, task, channel) {
    if (task === '') {
      channel.send('Usage: \`handover add [TASK]\`');
      return;
    }
  
    client.sadd('handover', task);
    bot.send('Added the task to handover!', channel);
    this.showHandover(name, channel);
  };

  this.editTask = function(name, target, task, channel) {
    let taskNum = parseInt(target, 10);

    if (Number.isNaN(taskNum) || task === '') {
      bot.send('Usage: \`handover edit [TASK_NUMBER] [TASK]\` ', channel);
      return;
    }

    client.smembers('handover', (err, set) => {
      if (err || taskNum <= 0 || taskNum > set.length) {
        bot.send('Oops, that task doesn\'t exist!', channel);
        return;
      }

      client.srem('handover', set[taskNum - 1]);
      client.sadd('handover', task);
      bot.send('Updated handover task!', channel);
      this.showHandover(name, channel);
    });
  }

  this.completeTask = function(name, taskNum, channel) {
    if (Number.isNaN(taskNum)) {
      channel.send('Usage: \`handover complete [TASK_NUMBER]\`');
      return;
    }
  
    client.smembers('handover', (err, set) => {
      if (err || set.length < 1) {
        bot.send(`There are no handover tasks listed currrently, ${name}!`, channel);
        return;
      }
  
      // make sure no task numbers that are out of bounds are given
      if (taskNum > set.length || taskNum <= 0) {
        bot.send('Oops, that task doesn\'t exist!', channel);
        return;
      }
  
      let task = set[taskNum - 1];
  
      if (/~/i.test(task)) {
        bot.send('That task has already been completed!', channel);
        return;
      }
  
      // remove the task from the set
      client.srem('handover', task);
  
      // re-add the task, but with a strikethrough effect
      client.sadd('handover', `~${task}~`);
  
      bot.send(`Task #${taskNum} marked as completed!`, channel);
      this.showHandover(name, channel);
    });
  };
  
  this.removeTaskOrTodoList = function(name, target, channel) {
    if (typeof target === 'string' && target === 'all') {
      client.del('handover');
      bot.send('Handover list cleared!', channel);
      return;
    }
  
    let taskNum = parseInt(target, 10);
  
    if (Number.isNaN(taskNum)) {
      bot.send('Usage: \`handover delete [TASK_NUMBER]\` or \`handover delete all\`', channel);
      return;
    }
  
    // get the set and the exact task
    client.smembers('handover', (err, set) => {
      if (err || set.length < 1) {
        bot.send(`There are no tasks to delete, ${name}!`, channel);
        return;
      }
  
      if (taskNum > set.length || taskNum <= 0) {
        bot.send('Oops, that task doesn\'t exist!', channel);
        return;
      }
  
      client.srem('handover', set[taskNum - 1]);
      bot.send(`Task #${taskNum} deleted!`, channel);
      this.showHandover(name, channel);
    });
  }
}
