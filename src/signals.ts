interface Subject {
  observers: Set<Observer>;
  registerObserver: (observer: Observer) => void;
  unregisterObserver: (observer: Observer) => void;
  notifyObservers: () => void;
}

interface Observer {
  subjects: Set<Subject>;
  update: () => void;
}

class Signal<T> implements Subject {
  constructor(value: T) {
    this.value = value;
  }

  // Subject properties
  value: T;
  observers: Set<Observer> = new Set();

  // Subject methods
  registerObserver(observer: Observer): void {
    this.observers.add(observer);
  }

  unregisterObserver(observer: Observer): void {
    this.observers.delete(observer);
  }

  notifyObservers(): void {
    for (const observer of this.observers) {
      observer.update();
    }
  }

  // Signal methods
  get(): T {
    // Add Observers
    if (Runtime.currentlyUpdatingObserver != null) {
      this.registerObserver(Runtime.currentlyUpdatingObserver);
      Runtime.currentlyUpdatingObserver.subjects.add(this);
    }

    // Return value
    return this.value;
  }

  set(value: T) {
    if (value !== this.value) {
      // Set own value
      this.value = value;

      // Remove dependant Observers before notifying
      [...this.observers].forEach((observer) => {
        [...observer.subjects].forEach((subject) =>
          subject.unregisterObserver(observer)
        );
        // Notify Observers
        observer.update();
      });
    }
  }
}

export class Effect implements Observer {
  constructor(effect: () => void) {
    this.effect = effect;

    this.update();
  }

  // Observer properties
  effect: () => void;
  subjects: Set<Subject> = new Set();

  // Observer methods
  update(): void {
    Runtime.updateObserverWithRuntime(this, () => {
      this.effect();
    });
  }
}

export class Computed<T> implements Subject, Observer {
  skipMemo = false;

  constructor(fn: () => T) {
    this.updateFn = fn;

    this.update();
  }

  // Subject properties
  value!: T;
  observers: Set<Observer> = new Set();

  // Observer properties
  updateFn: () => T;
  subjects: Set<Subject> = new Set();

  // Subject methods
  registerObserver(observer: Observer): void {
    this.observers.add(observer);
  }

  unregisterObserver(observer: Observer): void {
    this.observers.delete(observer);
  }

  notifyObservers(): void {
    for (const observer of this.observers) {
      observer.update();
    }
  }

  // Observer methods
  update(): void {
    Runtime.updateObserverWithRuntime(this, () => {
      // Run this Observer and cache it's value
      console.log({ myFunc: this.updateFn });
      const newValue = this.updateFn();
      console.log({ myNewValue: newValue });
      const valueHasChanged = newValue !== this.value;

      if (valueHasChanged || this.skipMemo) {
        this.skipMemo = false;
        this.value = newValue;

        // Remove dependant Observers before notifying
        [...this.observers].forEach((observer) => {
          [...observer.subjects].forEach((subject) =>
            subject.unregisterObserver(observer)
          );
          // Notify Observers
          observer.update();
        });
      }
    });
  }

  // Signal methods
  get(): T {
    // Register observers
    if (Runtime.currentlyUpdatingObserver != null) {
      this.registerObserver(Runtime.currentlyUpdatingObserver);
      Runtime.currentlyUpdatingObserver.subjects.add(this);
    }

    // Return value
    return this.value;
  }

  set(fn: () => T) {
    this.updateFn = fn;

    this.skipMemo = true;
    this.subjects.clear();
    this.update();
  }
}

export class Runtime {
  static currentlyUpdatingObserver: Observer | null = null;

  static updateObserverWithRuntime(observer: Observer, fn: () => void) {
    // Push the Observer onto stack
    const prevRunningObserver = Runtime.currentlyUpdatingObserver;
    Runtime.currentlyUpdatingObserver = observer;

    // Run the Observer
    fn();

    // Pop the Observer off stack
    Runtime.currentlyUpdatingObserver = prevRunningObserver;
  }

  static createSignal<T>(value: T): [() => T, (value: T) => void] {
    const signal = new Signal<T>(value);
    const getter = () => signal.get();
    const setter = (value: T) => signal.set(value);
    return [getter, setter];
  }

  static createEffect(fn: () => void) {
    new Effect(fn);
  }

  static createMemo<T>(fn: () => T) {
    const computed = new Computed<T>(fn);
    const getter = () => computed.get();
    const setter = (fn: () => T) => computed.set(fn);
    getter.set = setter;

    return getter;
  }
}

export const createSignal = Runtime.createSignal;
export const createEffect = Runtime.createEffect;
export const createMemo = Runtime.createMemo;
export type createSignalType<T> = ReturnType<typeof createSignal<T>>;
export type createMemoType<T> = ReturnType<typeof createMemo<T>>;
