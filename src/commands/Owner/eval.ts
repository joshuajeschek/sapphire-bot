import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Type } from '@sapphire/type';
import { codeBlock, isThenable } from '@sapphire/utilities';
import type { CommandInteraction, Interaction, Message } from 'discord.js';
import { inspect } from 'util';
import { getGuildIds } from '../../lib/env-parser';

@ApplyOptions<CommandOptions>({
	aliases: ['ev'],
	description: 'Evals any JavaScript code',
	quotes: [],
	preconditions: ['OwnerOnly'],
	flags: ['async', 'hidden', 'showHidden', 'silent', 's'],
	options: ['depth']
})
export class EvalCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const code = await args.rest('string');

		const { result, success, type } = await this.eval(message, code, {
			async: args.getFlags('async'),
			depth: Number(args.getOption('depth')) ?? 0,
			showHidden: args.getFlags('hidden', 'showHidden')
		});

		const output = success ? codeBlock('js', result) : `**ERROR**: ${codeBlock('bash', result)}`;
		if (args.getFlags('silent', 's')) return null;

		const typeFooter = `**Type**: ${codeBlock('typescript', type)}`;

		if (output.length > 2000) {
			return send(message, {
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`,
				files: [{ attachment: Buffer.from(output), name: 'output.js' }]
			});
		}

		return send(message, `${output}\n${typeFooter}`);
	}

	public async chatInputRun(interaction: CommandInteraction) {
		const code = interaction.options.getString('code', true);

		const { result, success, type } = await this.eval(interaction, code, {
			async: interaction.options.getBoolean('async') ?? false,
			depth: interaction.options.getInteger('depth') ?? 0,
			showHidden: interaction.options.getBoolean('showHidden') ?? false
		});

		const output = success ? codeBlock('js', result) : `**ERROR**: ${codeBlock('bash', result)}`;
		if (interaction.options.getBoolean('silent')) return interaction.reply(`||result hidden||`);

		const typeFooter = `**Type**: ${codeBlock('typescript', type)}`;

		if (output.length > 2000) {
			return interaction.reply({
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`,
				files: [{ attachment: Buffer.from(output), name: 'output.js' }]
			});
		}

		return interaction.reply(`${output}\n${typeFooter}`);
	}

	private async eval(message: Message | Interaction, code: string, flags: { async: boolean; depth: number; showHidden: boolean }) {
		if (flags.async) code = `(async () => {\n${code}\n})();`;

		// @ts-expect-error value is never read, this is so `msg` is possible as an alias when sending the eval.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const msg = message;

		let success = true;
		let result = null;

		try {
			// eslint-disable-next-line no-eval
			result = eval(code);
		} catch (error) {
			if (error && error instanceof Error && error.stack) {
				this.container.client.logger.error(error);
			}
			result = error;
			success = false;
		}

		const type = new Type(result).toString();
		if (isThenable(result)) result = await result;

		if (typeof result !== 'string') {
			result = inspect(result, {
				depth: flags.depth,
				showHidden: flags.showHidden
			});
		}

		return { result, success, type };
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			(b) =>
				b
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((o) => o.setName('code').setDescription('the code to evaluate').setRequired(true))
					.addBooleanOption((o) => o.setName('async').setDescription('wether the code is asynchronous'))
					.addBooleanOption((o) => o.setName('silent').setDescription('wether the result should be printed'))
					.addBooleanOption((o) => o.setName('showhidden').setDescription('showHidden passed to util.inspect'))
					.addIntegerOption((o) => o.setName('depth').setDescription('depth passed to util.inspect')),
			{ guildIds: getGuildIds(), idHints: [] }
		);
	}
}
