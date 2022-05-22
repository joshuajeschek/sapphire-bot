import './lib/setup';
import { CustomClient } from './CustomClient';

const client = new CustomClient();

const main = async () => {
	try {
		client.logger.info('[DISCORD] Logging in');
		await client.login();
		client.logger.info('[DISCORD] Logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
