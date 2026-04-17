import { MoveTarget } from "../../enums/move-target.js";
import { PokemonType } from "../../enums/pokemon-type.js";
import { allMoves } from "../data-list.js";


/**
 * Return whether the move targets the field
 *
 * Examples include
 * - Hazard moves like spikes
 * - Weather moves like rain dance
 * - User side moves like reflect and safeguard
 */
export function isFieldTargeted(move) {
  switch (move.moveTarget) {
    case MoveTarget.BOTH_SIDES:
    case MoveTarget.USER_SIDE:
    case MoveTarget.ENEMY_SIDE:
      return true;
  }
  return false;
}

export function getMoveTargets(user, move, replaceTarget) {
  const variableTarget = new NumberHolder(0);
  user.getOpponents(false).forEach(p => applyMoveAttrs("VariableTargetAttr", user, p, allMoves[move], variableTarget));

  let moveTarget;
  if (allMoves[move].hasAttr("VariableTargetAttr")) {
    moveTarget = variableTarget.value;
  } else if (replaceTarget !== undefined) {
    moveTarget = replaceTarget;
  } else if (move) {
    moveTarget = allMoves[move].moveTarget;
  } else if (move === undefined) {
    moveTarget = MoveTarget.NEAR_OTHER;
  }
  const opponents = user.getOpponents(false);

  let set = [];
  switch (moveTarget) {
    case MoveTarget.USER:
    case MoveTarget.PARTY:
      set = [user];
      break;
    case MoveTarget.NEAR_OTHER:
      set = opponents;
      break;
    case MoveTarget.ENEMY_SIDE:
      set = opponents;
      break;
    case MoveTarget.ATTACKER:
      return { targets: [-1]};
    case MoveTarget.USER_SIDE:
      set = [user];
      break;
    case MoveTarget.ALL:
    case MoveTarget.BOTH_SIDES:
      set = ([user]).concat(opponents);
      break;
    case MoveTarget.CURSE:
      {
        const extraTargets = [];
        set = user.getTypes(true).includes(PokemonType.GHOST) ? opponents.concat(extraTargets) : [user];
      }
      break;
  }

  return {
    targets: set
      .filter(p => p?.isActive(true))
      .map(p => p.getBattlerIndex())
      .filter(t => t !== undefined)
  };
}

export const frenzyMissFunc = (user, move) => {
  while (user.getMoveQueue().length > 0 && user.getMoveQueue()[0].move === move.id) {
    user.getMoveQueue().shift();
  }
  user.removeTag(BattlerTagType.FRENZY); // FRENZY tag should be disrupted on miss/no effect

  return true;
};

/**
 * Determine the target for the `user`'s counter-attack move
 * @param user - The pokemon using the counter-like move
 * @param damageCategory - The category of move to counter (physical or special), or `undefined` to counter both
 * @returns - The battler index of the most recent, non-ally attacker using a move that matches the specified category, or `null` if no such attacker exists
 */
export function getCounterAttackTarget(user, damageCategory) {
  for (const attackRecord of user.turnData.attacksReceived) {
    // check if the attacker was an ally
    const moveCategory = allMoves[attackRecord.move].category;
    const sourceBattlerIndex = attackRecord.sourceBattlerIndex;
    if (
      moveCategory !== MoveCategory.STATUS
      && (damageCategory === undefined || moveCategory === damageCategory)
    ) {
      return sourceBattlerIndex;
    }
  }
  return null;
}

/**
 * Determine whether the move's {@linkcode Move#moveTarget | target} can target an opponent
 * @param move - The move to check
 * @returns Whether the move can target an opponent
 */
export function mayTargetOpponent(move) {
  switch (move.moveTarget) {
    case MoveTarget.ENEMY_SIDE:
    case MoveTarget.ATTACKER:
      return true;
  }
  return false;
}

/**
 * @returns Whether the move is instantly charged by the given weather
 * @param move - The move to check
 * @param weather - The weather to check
 */
export function isWeatherInstantCharge(move, weather) {
  return !!move.findAttr(attr => attr.is("WeatherInstantChargeAttr") && attr.weatherTypes.includes(weather));
}