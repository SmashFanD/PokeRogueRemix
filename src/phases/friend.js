import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

/** Replace the capture mechanic, when a pkmn is KOed there is a chance it will want to join your party
 * Unlike catch mechanic, both pokemon can become friend, and it doesn't end the battle if the second pkmn is still alive
 */
export class FriendPhase extends PokemonPhase {
  phaseName = "FriendPhase";
  constructor(targetIndex) {
    super(BattlerIndex.ENEMY + targetIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(false);
    }

    this.originalY = pokemon.y;

    const catchRate = Math.pow(pokemon.species.catchRate / 255, 0.5) * 0.1
    const succes = Math.random() <= catchRate;

    const fpOffset = pokemon.getFieldPositionOffset();
    if (succes) {
        const substitute = pokemon.getTag(SubstituteTag);
        if (substitute) {
            substitute.sprite.setVisible(false);
        }
        addFriend()
    }
    else failFriend();
  }

  failFriend() {
    this.end();
  }

  addFriend() {
    const pokemon = this.getPokemon();

    const speciesForm = pokemon.fusionSpecies ? pokemon.getFusionSpeciesForm() : pokemon.getSpeciesForm();

    globalScene.pokemonInfoContainer.show(pokemon, true);

    globalScene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

    globalScene.ui.showText(
      i18next.t("battle:pokemonFriend", {
        pokemonName: pokemon.name,
      }),
      null,
      () => {
        const end = () => {
          globalScene.pokemonInfoContainer.hide();
          this.end();
        };
        const removePokemon = () => {
          pokemon.hp = 0;
          pokemon.doSetStatus(StatusEffect.FAINT);
          globalScene.clearEnemyHeldItemModifiers();
          pokemon.leaveField(true, true, true);
        };
        const addToParty = (slotIndex) => {
          const newPokemon = pokemon.addToParty(slotIndex);
          const modifiers = globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
          Promise.all(modifiers.map(m => globalScene.addModifier(m, true))).then(() => {
            globalScene.updateModifiers(true);
            removePokemon();
            if (newPokemon) {
              newPokemon.leaveField(true, true, false);
              newPokemon.loadAssets().then(end);
            } else {
              end();
            }
          });
        };
        //from here we should be able to send pokemon to the daycare
        Promise.all([pokemon.hideInfo(), globalScene.gameData.setPokemonCaught(pokemon)]).then(() => {
          if (globalScene.getPlayerParty().length === PLAYER_PARTY_MAX_SIZE) {
            const promptRelease = () => {
              globalScene.ui.showText(
                i18next.t("battle:partyFull", {
                  pokemonName: pokemon.getNameToRender(),
                }),
                null,
                () => {
                  globalScene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
                  globalScene.ui.setMode(
                    UiMode.CONFIRM,
                    () => {
                      const newPokemon = globalScene.addPlayerPokemon(
                        pokemon.species,
                        pokemon.level,
                        pokemon.abilityIndex,
                        pokemon.formIndex,
                        pokemon.gender,
                        pokemon.shiny,
                        pokemon.variant,
                        pokemon.ivs,
                        pokemon.nature,
                        pokemon,
                      );
                      globalScene.ui.setMode(
                        UiMode.SUMMARY,
                        newPokemon,
                        0,
                        SummaryUiMode.DEFAULT,
                        () => {
                          globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                            promptRelease();
                          });
                        },
                        false,
                      );
                    },
                    () => {
                      const attributes = {
                        shiny: pokemon.shiny,
                        variant: pokemon.variant,
                        form: pokemon.formIndex,
                        female: pokemon.gender === Gender.FEMALE,
                      };
                      globalScene.ui.setOverlayMode(
                        UiMode.POKEDEX_PAGE,
                        pokemon.species,
                        attributes,
                        null,
                        null,
                        () => {
                          globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                            promptRelease();
                          });
                        },
                      );
                    },
                    () => {
                      globalScene.ui.setMode(
                        UiMode.PARTY,
                        PartyUiMode.RELEASE,
                        this.fieldIndex,
                        (slotIndex, _option) => {
                          globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                            if (slotIndex < 6) {
                              addToParty(slotIndex);
                            } else {
                              promptRelease();
                            }
                          });
                        },
                      );
                    },
                    () => {
                      globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                        removePokemon();
                        end();
                      });
                    },
                    "fullParty",
                  );
                },
              );
            };
            promptRelease();
          } else {
            addToParty();
          }
        });
      },
      0,
      true,
    );
  }
}