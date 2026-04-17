import { Phase } from "../phase.js";

/**
 * This "phase" exists for the sole purpose of marking the location and type of a dynamic phase
 * for the {@linkcode PhaseManager}.
 *
 * It is never actually run.
 */
export class DynamicPhaseMarker extends Phase {
  phaseName = "DynamicPhaseMarker";
  /**
   * The name of the {@linkcode Phase} being tracked. \
   * Will be executed when this Phase would otherwise be run.
   */
  constructor(type) {
    super();
    this.phaseType = type;
  }
}