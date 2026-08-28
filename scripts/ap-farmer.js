const MODULE_ID = "ap-farmer";
const FLAG_DEATH_AP = "deathApAmount";
const RECIPIENT_TYPE = "character";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "fallbackNpcAp", {
    name: "AP-FARMER.SettingFallbackName",
    hint: "AP-FARMER.SettingFallbackHint",
    scope: "world",
    config: true,
    type: Number,
    default: 0
  });
});

Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
  const actor = sheet.actor;
  if (!actor?.isOwner) return;

  buttons.unshift({
    label: game.i18n.localize("AP-FARMER.HeaderButton"),
    class: "ap-farmer-set-value",
    icon: "fas fa-skull-crossbones",
    onclick: () => openDeathValueDialog(actor)
  });
});

Hooks.on("createActiveEffect", (effect) => {
  const actor = effect.parent;
  if (!(actor instanceof Actor)) return;
  if (!isDefeatedEffect(effect)) return;
  if (!isPrimaryGM()) return;

  handleDefeat(actor);
});

function isDefeatedEffect(effect) {
  const defeatedId = CONFIG.specialStatusEffects?.DEFEATED ?? "dead";
  if (effect.statuses instanceof Set) return effect.statuses.has(defeatedId);
  return effect.getFlag("core", "statusId") === defeatedId;
}

function isPrimaryGM() {
  if (game.users.activeGM) return game.user.id === game.users.activeGM.id;
  const activeGMs = game.users.filter((u) => u.isGM && u.active).sort((a, b) => a.id.localeCompare(b.id));
  return activeGMs[0]?.id === game.user.id;
}

function handleDefeat(actor) {
  const isPlayerType = actor.type === RECIPIENT_TYPE;
  let amount = actor.getFlag(MODULE_ID, FLAG_DEATH_AP);
  if ((amount === undefined || amount === null || amount === "") && !isPlayerType) {
    amount = game.settings.get(MODULE_ID, "fallbackNpcAp");
  }
  amount = Number(amount) || 0;

  openApprovalDialog(actor, isPlayerType, amount);
}

function openDeathValueDialog(actor) {
  const current = actor.getFlag(MODULE_ID, FLAG_DEATH_AP) ?? "";

  new Dialog({
    title: game.i18n.format("AP-FARMER.DialogSetTitle", { name: actor.name }),
    content: `<form>
      <div class="form-group">
        <label>${game.i18n.localize("AP-FARMER.DialogSetLabel")}</label>
        <input type="number" name="amount" value="${current}" min="0" step="1"/>
      </div>
    </form>`,
    buttons: {
      save: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("AP-FARMER.Save"),
        callback: async (html) => {
          const val = Number(html.find('[name="amount"]').val());
          await actor.setFlag(MODULE_ID, FLAG_DEATH_AP, Number.isFinite(val) ? val : 0);
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("AP-FARMER.Cancel")
      }
    },
    default: "save"
  }).render(true);
}

function openApprovalDialog(actor, isPlayerType, amount) {
  new Dialog({
    title: game.i18n.localize("AP-FARMER.ApprovalTitle"),
    content: `<form>
      <p><strong>${game.i18n.localize("AP-FARMER.ApprovalName")}:</strong> ${actor.name}</p>
      <p><strong>${game.i18n.localize("AP-FARMER.ApprovalType")}:</strong> ${game.i18n.localize(isPlayerType ? "AP-FARMER.TypePlayer" : "AP-FARMER.TypeEnemy")}</p>
      <div class="form-group">
        <label>${game.i18n.localize("AP-FARMER.ApprovalAmount")}</label>
        <input type="number" name="amount" value="${amount}" min="0" step="1"/>
      </div>
    </form>`,
    buttons: {
      grant: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("AP-FARMER.Grant"),
        callback: async (html) => {
          const val = Number(html.find('[name="amount"]').val()) || 0;
          await distributeAp(val, actor);
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("AP-FARMER.Cancel")
      }
    },
    default: "grant"
  }).render(true);
}

async function distributeAp(amount, sourceActor) {
  const recipients = game.actors.filter((a) => a.type === RECIPIENT_TYPE && a.hasPlayerOwner);

  for (const pc of recipients) {
    const current = pc.system.details?.experience?.total ?? 0;
    await pc.update({ "system.details.experience.total": current + amount });
  }

  const names = recipients.map((a) => a.name).join(", ") || game.i18n.localize("AP-FARMER.NoRecipients");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: game.i18n.localize("AP-FARMER.ModuleName") }),
    content: `<p><strong>${game.i18n.localize("AP-FARMER.ChatTitle")}</strong></p>
      <p>${game.i18n.format("AP-FARMER.ChatBody", { source: sourceActor.name, amount, names })}</p>`
  });
}
