//trainer name, class, if it's an enemy and others things may be in the pokemon class (placeholder for now)
export function showText(p, pokemon, target, msg, pos, affix) {
  let x = TextData.Base.X;
  let y = TextData.Base.Y;
  let size = TextData.Base.SIZE;
  if (pos === TextData.PartyMenuBottom.ID) {
    y = TextData.PartyMenuBottom.Y;
    size = TextData.PartyMenuBottom.SIZE;
  }
  if (pos === TextData.DayCareTop.ID) {
    y = TextData.DayCareTop.Y;
    size = TextData.DayCareTop.SIZE;
  }
  const pkmnName = affix ? getNameWithAffix(pokemon) : pokemon.name;
  const targetName = affix ? getNameWithAffix(target) : target.name;
  switch (msg) {
    case Text.WILD_APPEARED_ONE:
      drawText(p, `A wild ${pkmnName} appeared!`, x, y, size);
      break;
    case Text.SEND_OUT_PLAYER:
      drawText(p, `${pkmnName}, Go!`, x, y, size);
      break;
    case Text.SEND_OUT_TRAINER:
      drawText(p, `${pokemon.trainer.name} sent out ${pkmnName}!`, x, y, size);
      break;
    case Text.TRAINER_APPEARED:
      drawText(p, `${pokemon.trainer.name} would like to battle!`, x, y, size);
      break;
    case Text.WHAT_WILL_PKMN_DO:
      drawText(p, `What will ${pkmnName} do?`, x, y, size);
      break;
      default:
  }
}

function getNameWithAffix(pokemon) {
  return `Wild ${pokemon.name}`;
}