export class PhaseTree {
  levels = [[]];
  currentLevel = 0;
  deferredActive = false;
  add(phase, level) {
    if (level === this.currentLevel + 1 && level === this.levels.length) {
      this.levels.push([]);
    }

    const addLevel = this.levels[level];
    if (addLevel == null) {
      throw new Error("Attempted to add a phase to a nonexistent level of the PhaseTree!\nLevel: " + level.toString());
    }
    addLevel.push(phase);
  }
  addPhase(phase, defer = false) {
    if (defer && !this.deferredActive) {
      this.deferredActive = true;
      this.levels.splice(-1, 0, []);
      this.currentLevel += 1;
    }
    this.add(phase, this.currentLevel + 1 - +defer);
  }
  addAfter(phase, type) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const insertIdx = this.levels[i].findIndex(p => p.is(type)) + 1;
      if (insertIdx !== 0) {
        this.levels[i].splice(insertIdx, 0, phase);
        return;
      }
    }

    this.addPhase(phase);
  }
  pushPhase(phase) {
    this.add(phase, 0);
  }
  getNextPhase() {
    this.currentLevel = this.levels.length - 1;
    while (this.currentLevel > 0 && this.levels[this.currentLevel].length === 0) {
      this.deferredActive = false;
      this.levels.pop();
      this.currentLevel--;
    }

    return this.levels[this.currentLevel].shift();
  }
  find(phaseName, phaseFilter) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phase = level.find((p) => p.is(phaseName) && (!phaseFilter || phaseFilter(p)));
      if (phase) {
        return phase;
      }
    }
  }
  findAll(phaseName, phaseFilter) {
    const phases = [];
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      phases.push(...level.filter((p) => p.is(phaseName) && (!phaseFilter || phaseFilter(p))));
    }
    return phases;
  }
  clear(leaveFirstLevel = false) {
    this.levels = [leaveFirstLevel ? (this.levels.at(-1) ?? []) : []];
    this.currentLevel = 0;
  }
  remove(phaseName, phaseFilter) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phaseIndex = level.findIndex(p => p.is(phaseName) && (!phaseFilter || phaseFilter(p)));
      if (phaseIndex !== -1) {
        level.splice(phaseIndex, 1);
        return true;
      }
    }
    return false;
  }
  removeAll(phaseName) {
    for (let i = 0; i < this.levels.length; i++) {
      this.levels[i] = this.levels[i].filter(phase => !phase.is(phaseName));
    }
  }
  exists(phaseName, phaseFilter = () => true) {
    return this.levels.some(level => level.some(phase => phase.is(phaseName) && phaseFilter(phase)));
  }
}
