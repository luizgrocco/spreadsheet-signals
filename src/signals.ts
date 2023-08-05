type SignalId = number;
type EffectId = number;

class Signal<T> {
  #id: SignalId;

  constructor(value: T) {
    Runtime.signalValues.push(value);
    const id = Runtime.signalValues.length - 1;
    this.#id = id;
  }

  get(): T {
    // Get value
    const value = Runtime.signalValues[this.#id] as T;

    // Add subscribers
    if (Runtime.runningEffectId != null) {
      const effectIdsSet =
        Runtime.signalSubscribers.get(this.#id) || new Set<EffectId>();
      effectIdsSet.add(Runtime.runningEffectId);

      const signalIdsSet =
        Runtime.effectNotifiers.get(Runtime.runningEffectId) ||
        new Set<SignalId>();
      signalIdsSet.add(this.#id);

      if (!Runtime.signalSubscribers.has(this.#id)) {
        Runtime.signalSubscribers.set(this.#id, effectIdsSet);
      }

      if (!Runtime.effectNotifiers.has(Runtime.runningEffectId)) {
        Runtime.effectNotifiers.set(Runtime.runningEffectId, signalIdsSet);
      }
    }

    // Return value
    return value;
  }

  set(value: T) {
    // Set value
    Runtime.signalValues[this.#id] = value;

    // Notify subscribers
    if (Runtime.signalSubscribers.has(this.#id)) {
      const effectIds = Runtime.signalSubscribers.get(this.#id);
      if (effectIds) {
        const clonedEffectIds = Array.from(effectIds);

        clonedEffectIds.forEach((effectId) => {
          const signalIds = Runtime.effectNotifiers.get(effectId);
          if (signalIds) {
            // Right before re-running the effect, eliminate this effect as a dependency from each signal that used to trigger it.
            // Reason being the effect will re-run so it will re-aquire its dependencies.
            signalIds.forEach(
              (signalId) =>
                Runtime.signalSubscribers.get(signalId)?.delete(effectId)
            );
          }
          Runtime.runEffect(effectId);
        });
      }
    }
  }
}

export class Runtime {
  static signalValues: unknown[] = [];
  static signalSubscribers: Map<SignalId, Set<EffectId>> = new Map();
  static effectNotifiers: Map<EffectId, Set<SignalId>> = new Map();
  static runningEffectId: EffectId | null = null;
  static effects: Function[] = [];

  static createSignal<T>(value: T): [() => T, (value: T) => void] {
    const signal = new Signal<T>(value);
    const getter = () => signal.get();
    const setter = (value: T) => signal.set(value);
    return [getter, setter];
  }

  static createEffect(fn: Function) {
    Runtime.effects.push(fn);
    const effectId = Runtime.effects.length - 1;

    Runtime.runEffect(effectId);
  }

  static runEffect(effectId: EffectId) {
    // Push the effect onto stack
    const prevRunningEffect = Runtime.runningEffectId;
    Runtime.runningEffectId = effectId;

    // Run the effect
    const effect = Runtime.effects[effectId];
    effect();

    // Pop the effect off stack
    Runtime.runningEffectId = prevRunningEffect;
  }
}

export const createSignal = Runtime.createSignal;
export const createEffect = Runtime.createEffect;
