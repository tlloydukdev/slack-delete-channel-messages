<h3 align="center">Delete all messages from a Slack channel</h3>

  <p align="center">
    A feature that isn't natively available in Slack (at the time of writing) 
    <br />
    Use this script to delete all messages from any slack channel, including #general.
    <br />
    You will need to be a Slack Administrator.
    </p>
</div>

<!-- Demo Gif -->
## Demo
![til](./assets/demo.gif)

<!-- Quick Start -->
## Quick Start
1. Clone the repository
2. Install dependencies with `npm install` or `yarn install`
3. Copy `.env.example` to `.env`
4. Create a Slack App (see Guide below)
6. Run the script and follow the prompts `node index.js`

<!-- Slack Guide -->
## Slack App Setup
To use the script you must create a Slack app that has the required permissions to view and delete messages. The steps are described below.
1. Log in to [Slack App](https://api.slack.com/apps) management
2. Click **Create New App**
3. Select *From Scratch*
4. Enter an **App Name** e.g. *Deletor*
5. Select the workspace to add the App to
6. Click **Create App**
7. On the left, click **OAuth & Permissions**
8. Scroll down to *Scopes*
9. Under *Bot Token Scopes* click **Add an OAuth Scope** and add `channels:history`, `channels:read` and `chat:write` in turn
10. Under *User Token Scopes* click **Add an OAuth Scope** and add `chat:write` ![til](./assets/scopes.png)
11. Scroll to the top and click **Install to Workspace**
12. Copy the **User OAuth Token** into the `USER_TOKEN` property in `.env`
13. Copy the **Bot User OAuth Token** into the `BOT_TOKEN` property in `.env`![til](./assets/tokens.png)
14. Go to your Slack client and `/invite @deletor` into the channel you want to remove messages from
15. Run the script and follow the prompts `node index.js`

<!-- Rate Limiting -->
## Rate Limiting
The script allows you to specify a custom rate limit if required. This is particularly useful on channels with a lot of messages. If you decide to use the Slack API defaults, then very quickly the delete attempts will be throttled until it's quite slow.
By applying a custom rate limit, you can try and keep under the official rate limit radar.
You can select which option to choose when running the script.

<!-- Troubleshooting -->
## Troubleshooting
You're most likely to encounter errors relating to the tokens and scopes, for example `cant_delete_message` - double check steps 8-10 in the Slack App Setup above and also make sure you have correctly created your `.env` file, it should look like:
```
BOT_TOKEN=xoxb-222888608336-6599678687984-2Ufo177zpOIg06l1WVvyiiox
USER_TOKEN=xoxp-222888608336-223470001299-6589549747649-f9cb406156c663158de29d07566dfeb4
```

<!-- After Use -->
## After Use
I highly recommend you remove the app from your channel and delete the App from the Slack control panel. At the very least, revoke the tokens!

