# missandei
Slack Bot in Node.js

This app makes use of a slack bot and incoming webhooks. The bot functionality helps respond to messages posted in a channel, and incoming webhooks are used to post random messages/notifications based on some defined criteria.

The app uses '@slack/client' node module and leverages the RTM Events API for working with messages/connection/authentication.

Note:- 

* Some screenshots have a different botname, because it was changed in the app later
* Some hidden files/values for integration with the bot,webhooks in slack app and google calendar API have been omitted.

## Features

### Help Menu

![screenshot at mar 05 18-13-12](https://user-images.githubusercontent.com/21245503/36975693-e5c23662-20a0-11e8-87bd-d34101d3880b.png)

![screenshot at mar 05 18-15-13](https://user-images.githubusercontent.com/21245503/36975796-37337ab0-20a1-11e8-9c1c-ea7761ef3b77.png)

### Oncall/PagerDuty


* **Oncall notifications**/**Take oncall**

![screenshot at mar 05 17-43-44](https://user-images.githubusercontent.com/21245503/36974460-cac03e4e-209c-11e8-90ce-755471c87971.png)

* **Ping oncall**

![screenshot at mar 05 18-00-01](https://user-images.githubusercontent.com/21245503/36975117-10b6c218-209f-11e8-8a6b-c2e8549abc63.png)

* **Notifications for unassigned oncalls**

(Loud notification if unassigned oncall is less than 4 hours away)

![screenshot at mar 05 18-03-44](https://user-images.githubusercontent.com/21245503/36975275-9b515190-209f-11e8-8338-0c20ed0ce0f6.png)


### Meeting Reminders


![screenshot at mar 05 18-08-35](https://user-images.githubusercontent.com/21245503/36975524-5f91e876-20a0-11e8-9d94-46df225b7214.png)


### Handover List

* **List handover tasks**

![screenshot at mar 05 18-23-02](https://user-images.githubusercontent.com/21245503/36976145-96db5d60-20a2-11e8-954a-fd6d572ea97c.png)

* **Add handover tasks**

![screenshot at mar 05 18-26-35](https://user-images.githubusercontent.com/21245503/36976806-e42cf78e-20a4-11e8-8ebe-5ac1c8c30b15.png)

* **Completing/Deleting tasks**

![screenshot at mar 05 18-45-08](https://user-images.githubusercontent.com/21245503/36976942-5c8227d6-20a5-11e8-9092-18617517db2d.png)


### Greetings


![screenshot at mar 05 18-51-20](https://user-images.githubusercontent.com/21245503/36977160-38ef7548-20a6-11e8-9361-ca8b3b2505d4.png)


### Count of Issues (calling an internal API)

![screenshot at mar 05 18-53-25](https://user-images.githubusercontent.com/21245503/36977248-81902a18-20a6-11e8-8c25-ef96e16a5a93.png)




