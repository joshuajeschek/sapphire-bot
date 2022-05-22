import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';
import { CommandInteraction, InteractionReplyOptions, Message, MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from 'discord.js';
import { getGuildIds } from '../../lib/env-parser';
import si from 'systeminformation';
import { version, homepage, bugs } from '../../../package.json';
import { getBotAccentColor, millisecondsToTime } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: "Get information about the bot's status"
})
export class StatusCommand extends Command {
	private osInfo?: string;

	public async messageRun(message: Message) {
		return message.reply((await this.getStatusMessage()) as MessageOptions);
	}
	public async chatInputRun(interaction: CommandInteraction) {
		return interaction.reply((await this.getStatusMessage()) as InteractionReplyOptions);
	}

	private async getStatusMessage(): Promise<MessageOptions | InteractionReplyOptions> {
		this.osInfo ||= await this.getOsInfo();

		const ping = `${this.container.client.ws.ping ? `${Math.round(this.container.client.ws.ping)} ms` : 'N/A'}`;
		const embed = new MessageEmbed()
			.setTitle('Status')
			.setColor(await getBotAccentColor())
			.addField('ping: ', ping)
			.addField('uptime: ', millisecondsToTime(this.container.client.uptime))
			.addField('running on:', this.osInfo)
			.addField('bot version:', version);
		if (this.container.client.user) embed.setThumbnail(this.container.client.user.displayAvatarURL());

		const row = new MessageActionRow().addComponents(
			new MessageButton().setStyle('LINK').setLabel('GitHub').setURL(homepage).setEmoji('951055563607912449'),
			new MessageButton().setStyle('LINK').setLabel('Report Bugs and Request Features').setURL(bugs)
		);

		return { embeds: [embed], components: [row] };
	}

	private async getOsInfo() {
		const info = await si.osInfo();
		return `Platform: ${info.platform}
            Distribution: ${info.distro}
            Release: ${info.release}`;
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand((b) => b.setName(this.name).setDescription(this.description), {
			guildIds: getGuildIds(),
			idHints: []
		});
	}
}
