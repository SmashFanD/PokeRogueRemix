import { globalScene } from "../global-scene.js";
import { CommonAnimPhase } from "./common-anim.js";

export class WeatherEffectPhase extends CommonAnimPhase {
  phaseName = "WeatherEffectPhase";
  weather;

  constructor() {
    super(
      undefined,
      undefined,
      CommonAnim.SUNNY + ((globalScene?.arena?.weather?.weatherType || WeatherType.NONE) - 1),
    );
    this.weather = globalScene?.arena?.weather;
  }

  start() {
    // Update weather state with any changes that occurred during the turn
    this.weather = globalScene?.arena?.weather;

    if (!this.weather) {
      return this.end();
    }

    this.setAnimation(CommonAnim.SUNNY + (this.weather.weatherType - 1));

    if (this.weather.isDamaging()) {
      const cancelled = new BooleanHolder(false);

      this.executeForAll((pokemon) =>
        applyAbAttrs("SuppressWeatherEffectAbAttr", { pokemon, weather: this.weather, cancelled }),
      );

      if (!cancelled.value) {
        const inflictDamage = (pokemon) => {
          const cancelled = new BooleanHolder(false);

          applyAbAttrs("PreWeatherDamageAbAttr", { pokemon, weather: this.weather, cancelled });
          applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

          if (
            cancelled.value
            || pokemon.getTag(BattlerTagType.UNDERGROUND)
            || pokemon.getTag(BattlerTagType.UNDERWATER)
          ) {
            return;
          }

          const damage = toDmgValue(pokemon.getMaxHp() / 16);

          globalScene.phaseManager.queueMessage(getWeatherDamageMessage(this.weather.weatherType, pokemon) ?? "");
          pokemon.damageAndUpdate(damage, { result: HitResult.INDIRECT, ignoreSegments: true });
        };

        this.executeForAll((pokemon) => {
          const immune =
            !pokemon
            || pokemon.getTypes(true, true).filter(t => this.weather?.isTypeDamageImmune(t)).length > 0
            || pokemon.switchOutStatus;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    globalScene.ui.showText(getWeatherLapseMessage(this.weather.weatherType) ?? "", null, () => {
      this.executeForAll((pokemon) => {
        if (!pokemon.switchOutStatus) {
          applyAbAttrs("PostWeatherLapseAbAttr", { pokemon, weather: this.weather });
        }
      });

      super.start();
    });
  }
}