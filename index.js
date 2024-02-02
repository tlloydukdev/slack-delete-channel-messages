import dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';
import prompts from 'prompts';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';

dotenv.config();

const web = new WebClient(process.env.BOT_TOKEN);
const userWeb = new WebClient(process.env.USER_TOKEN);
let batchSize = null;
let pauseDurationMs = null;

const progressBar = new cliProgress.SingleBar({
	format: 'Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} messages',
	barCompleteChar: '\u2588',
	barIncompleteChar: '\u2591',
	stopOnComplete: true,
	clearOnComplete: true,
	gracefulExit: true
});

const allMessageIds = [];

async function findConversation(name) {
	try {
		const result = await web.conversations.list({
			token: process.env.BOT_TOKEN
		});

		for (const channel of result.channels) {
			if (channel && channel.name && channel.name === name) {
				return channel.id;
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function getMessages(channelId, cursor) {
	const options = {
		channel: channelId,
		cursor: cursor
	};

	const result = await web.conversations.history(options);

	if (result.messages.length > 0) {
		const messageIds = result.messages.map((message) => message.ts);
		allMessageIds.push(...messageIds);
		if (result.has_more) {
			await getMessages(channelId, result.response_metadata.next_cursor);
		}
	}
}

async function deleteMessages(channelId) {
	for (let i = 0; i < allMessageIds.length; i++) {
		const messageId = allMessageIds[i];

		try {
			await userWeb.chat.delete({
				channel: channelId,
				ts: messageId
			});
			progressBar.increment();
		} catch (error) {
			console.error(`Error deleting message with ID ${messageId}: ${error.message}`);
		}
		if (batchSize && (i + 1) % batchSize === 0) {
			console.log(
				'\n',
				chalk.bgBlue.white(' PAUSE '),
				`Pausing for ${pauseDurationMs / 1000} seconds after deleting ${batchSize} messages...`
			);
			await new Promise((resolve) => setTimeout(resolve, pauseDurationMs));
		}
	}
}

async function init() {
	const questions = [
		{
			type: 'text',
			name: 'channelName',
			message: 'Slack channel name?',
			validate: (channelName) => (channelName.trim().length === 0 ? 'Required field' : true)
		}
	];
	const response = await prompts(questions);
	if (Object.keys(response).length > 0) {
		const channelName = response.channelName.replace('#', '');
		const channelId = await findConversation(channelName);
		if (channelId) {
			console.log(
				chalk.bgGreen.black(' OK '),
				`Found channel #${channelName} with ID: ${channelId}, please wait...`
			);
			await getMessages(channelId);
			if (allMessageIds.length > 0) {
				console.log(chalk.bgGreen.black(' OK '), `Found ${allMessageIds.length} messages to delete`);

				const rateLimit = await prompts([
					{
						type: 'toggle',
						name: 'customRateLimit',
						message:
							'Do you want to use a custom rate limit (No to use Slack API defaults - can be slower)?',
						initial: true,
						active: 'yes',
						inactive: 'no'
					}
				]);

				if (rateLimit.customRateLimit) {
					const rateLimitValues = await prompts([
						{
							type: 'number',
							name: 'batchSize',
							message: 'Batch Size',
							initial: 15,
							min: 3,
							max: 100
						},
						{
							type: 'number',
							name: 'pauseDurationMs',
							message: 'Pause Duration (in milliseconds) e.g. 5 seconds = 5000',
							initial: 10000,
							min: 2000,
							max: 60000
						}
					]);

					batchSize = rateLimitValues.batchSize;
					pauseDurationMs = rateLimitValues.pauseDurationMs;
				}

				const proceed = await prompts({
					type: 'confirm',
					name: 'proceed',
					message: 'Proceed with delete?',
					initial: false
				});
				if (proceed.proceed) {
					progressBar.start(allMessageIds.length, 0, {
						speed: 'N/A'
					});
					await deleteMessages(channelId);
					console.log('\n', '\n', '\n');
					console.log(chalk.bgGreen.black(' OK '), `Complete`);
				}
			} else {
				console.log(chalk.bgRed.white(' PROBLEM '), `There are 0 messages in #${channelName} to delete`);
			}
		} else {
			console.log(chalk.bgRed.white(' PROBLEM '), `Unable to find #${channelName}`);
		}
	}
}

init();
