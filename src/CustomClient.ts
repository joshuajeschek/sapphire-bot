import { PrismaClient } from '@prisma/client';
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import { container, LogLevel, SapphireClient } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class CustomClient extends SapphireClient {
	public constructor() {
		super({
			defaultPrefix: '!',
			typing: true,
			regexPrefix: /^(hey +)?bot[,! ]/i,
			caseInsensitiveCommands: true,
			logger: {
				level: LogLevel.Debug
			},
			shards: 'auto',
			intents: [
				'GUILDS',
				'GUILD_MEMBERS',
				'GUILD_BANS',
				'GUILD_EMOJIS_AND_STICKERS',
				'GUILD_VOICE_STATES',
				'GUILD_MESSAGES',
				'GUILD_MESSAGE_REACTIONS',
				'DIRECT_MESSAGES',
				'DIRECT_MESSAGE_REACTIONS'
			],
			presence: {
				activities: [
					{
						name: 'CS:GO',
						type: 'PLAYING'
					}
				]
			},
			loadMessageCommandListeners: true
		});
	}

	public override async login(token?: string) {
		container.db = new PrismaClient();
		return super.login(token);
	}

	public override async destroy() {
		await container.db.$disconnect();
		this.logger.info('disconnected from database');
		return super.destroy();
	}

	/**
	 * Retrieves the prefix for the guild, or if not used in a guild, the default prefix.
	 * @param ctx The message / interaction that gives context.
	 */
	public override fetchPrefix = async (ctx: Message) => {
		if (isGuildBasedChannel(ctx.channel)) {
			const res = await container.db.guild.findFirst({
				where: { id: ctx.guildId || undefined },
				select: { prefix: true }
			});
			if (res && 'prefix' in res) return res.prefix;
		}
		return [this.options.defaultPrefix, ''] as readonly string[];
	};
}

declare module '@sapphire/pieces' {
	interface Container {
		db: PrismaClient;
	}
}
