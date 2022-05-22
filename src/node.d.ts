declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production';
		readonly DISCORD_TOKEN: string;
		readonly OWNERS: string;
		readonly GUILDIDS: string;
		readonly OWNER_GUILDIDS: string;
		readonly DATABASE_URL: string;
	}
}
