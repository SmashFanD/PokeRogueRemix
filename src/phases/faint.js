import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class FaintPhase extends PokemonPhase {
  phaseName = "FaintPhase";
  /**
   * Whether or not instant revive should be prevented
   */
  preventInstantRevive

  /**
   * The source Pokemon that dealt fatal damage; only present for faints triggered by a move.
   */
  // TODO: This should be handled by a move in flight object/similar
  source

  constructor(battlerIndex, preventInstantRevive = false, source) {
    super(battlerIndex);

    this.preventInstantRevive = preventInstantRevive;
    this.source = source;
  }

  start() {
    super.start();

    const faintPokemon = this.getPokemon();

    if (this.source) {
      faintPokemon.getTag(BattlerTagType.DESTINY_BOND)?.lapse(this.source, BattlerTagLapseType.CUSTOM);
      faintPokemon.getTag(BattlerTagType.GRUDGE)?.lapse(faintPokemon, BattlerTagLapseType.CUSTOM, this.source);
    }

    faintPokemon.resetSummonData();

    if (!this.preventInstantRevive) {
      const instantReviveModifier = globalScene.applyModifier(
        PokemonInstantReviveModifier,
        this.player,
        faintPokemon,
      );

      if (instantReviveModifier) {
        faintPokemon.loseHeldItem(instantReviveModifier);
        globalScene.updateModifiers(this.player);
        return this.end();
      }
    }

    /**
     * In case the current pokemon was just switched in, make sure it is counted as participating in the combat.
     * For EXP_SHARE purposes, if the current pokemon faints as the combat ends and it was the ONLY player pokemon
     * involved in combat, it needs to be counted as a participant so the other party pokemon can get their EXP,
     * so the fainted pokemon has been included.
     */
    for (const pokemon of globalScene.getPlayerField()) {
      if (pokemon?.isActive() || pokemon?.isFainted()) {
        globalScene.currentBattle.addParticipant(pokemon);
      }
    }

    this.doFaint();
  }

  doFaint() {
    const pokemon = this.getPokemon();

    // Track total times pokemon have been KO'd for Last Respects/Supreme Overlord
    if (pokemon.isPlayer()) {
      globalScene.arena.playerFaints += 1;
      globalScene.currentBattle.playerFaintsHistory.push({
        pokemon,
        turn: globalScene.currentBattle.turn,
      });
    } else {
      globalScene.currentBattle.enemyFaints += 1;
      globalScene.currentBattle.enemyFaintsHistory.push({
        pokemon,
        turn: globalScene.currentBattle.turn,
      });
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("battle:fainted", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      null,
      true,
    );
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);

    // TODO: this can be simplified by just checking whether lastAttack is defined
    if (pokemon.turnData.attacksReceived?.length > 0) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyAbAttrs("PostFaintAbAttr", {
        pokemon,
        // TODO: We should refactor lastAttack's sourceId to forbid null and just use undefined
        attacker: globalScene.getPokemonById(lastAttack.sourceId) ?? undefined,
        // TODO: improve the way that we provide the move that knocked out the pokemon...
        move: new PokemonMove(lastAttack.move).getMove(),
      }); // TODO: is this bang correct?
    } else {
      //If killed by indirect damage, apply post-faint abilities without providing a last move
      applyAbAttrs("PostFaintAbAttr", { pokemon });
    }

    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      applyAbAttrs("PostKnockOutAbAttr", { pokemon: p, victim: pokemon });
    }
    if (pokemon.turnData.attacksReceived?.length > 0) {
      const defeatSource = this.source;

      if (defeatSource?.isOnField()) {
        applyAbAttrs("PostVictoryAbAttr", { pokemon: defeatSource });
        const pvmove = allMoves[pokemon.turnData.attacksReceived[0].move];
        const pvattrs = pvmove.getAttrs("PostVictoryStatStageChangeAttr");
        if (pvattrs.length > 0) {
          for (const pvattr of pvattrs) {
            pvattr.applyPostVictory(defeatSource, defeatSource, pvmove);
          }
        }
      }
    }

    if (this.player) {
      /** The total number of Pokemon in the player's party that can legally fight */
      const legalPlayerPokemon = globalScene.getPokemonAllowedInBattle();
      /** The total number of legal player Pokemon that aren't currently on the field */
      const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
      if (legalPlayerPokemon.length === 0) {
        /** If the player doesn't have any legal Pokemon, end the game */
        globalScene.phaseManager.unshiftNew("GameOverPhase");
      } else if (
        globalScene.currentBattle.double
        && legalPlayerPokemon.length === 1
        && legalPlayerPartyPokemon.length === 0
      ) {
        /**
         * If the player has exactly one Pokemon in total at this point in a double battle, and that Pokemon
         * is already on the field, unshift a phase that moves that Pokemon to center position.
         */
        globalScene.phaseManager.unshiftNew("ToggleDoublePositionPhase", true);
      } else if (legalPlayerPartyPokemon.length > 0) {
        /**
         * If previous conditions weren't met, and the player has at least 1 legal Pokemon off the field,
         * push a phase that prompts the player to summon a Pokemon from their party.
         */
        globalScene.phaseManager.pushNew("SwitchPhase", SwitchType.SWITCH, this.fieldIndex, true, false);
      }
    } else {
      globalScene.phaseManager.unshiftNew("VictoryPhase", this.battlerIndex);
      if ([BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType)) {
        const hasReservePartyMember =
          globalScene
            .getEnemyParty()
            .filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === pokemon.trainerSlot)
            .length > 0;
        if (hasReservePartyMember) {
          globalScene.phaseManager.pushNew("SwitchSummonPhase", SwitchType.SWITCH, this.fieldIndex, -1, false, false);
        }
      }
    }

    // in double battles redirect potential moves off fainted pokemon
    const allyPokemon = pokemon.getAlly();
    if (globalScene.currentBattle.double && allyPokemon != null) {
      globalScene.redirectPokemonMoves(pokemon, allyPokemon);
    }

    pokemon.faintCry(() => {
      if (pokemon.isPlayer()) {
        pokemon.addFriendship(-FRIENDSHIP_LOSS_FROM_FAINT);
      }
      pokemon.hideInfo();
      globalScene.playSound("se/faint");
      globalScene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          pokemon.lapseTags(BattlerTagLapseType.FAINT);

          pokemon.y -= 150;
          pokemon.doSetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer()) {
            globalScene.currentBattle.removeFaintedParticipant(pokemon);
          } else {
            globalScene.addFaintedEnemyScore(pokemon);
            globalScene.currentBattle.addPostBattleLoot(pokemon);
          }
          pokemon.leaveField();
          this.end();
        },
      });
    });
  }
}