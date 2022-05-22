import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ListenerOptions } from '@sapphire/framework';
import { isNullishOrEmpty } from '@sapphire/utilities';
import type { Interaction } from 'discord.js';

const lastInteractionMap = new Map<string, Date>();
export const buttonCooldown = 60 * 1000;

@ApplyOptions<ListenerOptions>({
	event: Events.InteractionCreate
})
export class UserEvent extends Listener<typeof Events.InteractionCreate> {
	public async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		let wantsNewsletter = null;
		if (interaction.customId === 'newsletterUnsubscribe') wantsNewsletter = false;
		if (interaction.customId === 'newsletterSubscribe') wantsNewsletter = true;
		if (wantsNewsletter === null) return;

		await interaction.deferReply({ ephemeral: true });

		const lastInteraction = lastInteractionMap.get(interaction.user.id);
		const cooldown = lastInteraction ? lastInteraction.getTime() + buttonCooldown - new Date().getTime() : -1;
		if (cooldown > 0) {
			return interaction.editReply(`Slow down there bud! Try again in ${cooldown / 1000} seconds!`);
		} else {
			lastInteractionMap.set(interaction.user.id, new Date());
		}

		const res = await this.container.db.user.upsert({
			create: {
				id: interaction.user.id,
				wantsNewsletter
			},
			update: {
				wantsNewsletter
			},
			where: {
				id: interaction.user.id
			}
		});

		if (isNullishOrEmpty(res)) return interaction.editReply('An error occured! Please try again later!');

		return interaction.editReply(
			wantsNewsletter ? '🔔 You are now subscribed to the newsletter!' : '🔕 You are now unsubscribed from the newsletter.'
		);
	}
}
