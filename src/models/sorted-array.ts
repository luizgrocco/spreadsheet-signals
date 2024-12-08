// I randomly decided to implement a SortedArray class with to practice binary search for funsies.
// This probably doesn't belong in this project.

class SortedArray<Item, Key extends string = string> {
  items: [Key, Item][];
  comparisonFn: (a: Key, b: Key) => number;

  constructor(
    items: [Key, Item][] = [],
    comparisonFn: (a: Key, b: Key) => number = (a, b) => a.localeCompare(b)
  ) {
    this.comparisonFn = comparisonFn;
    this.items = items.sort(([a], [b]) => comparisonFn(a, b));
  }

  get(key: Key): Item | undefined {
    let low = 0;
    let high = this.items.length - 1;
    let mid;
    let middleElKey: Key, middleElItem: Item;
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      [middleElKey, middleElItem] = this.items[mid];

      if (this.comparisonFn(key, middleElKey) === 0) {
        return middleElItem;
      } else if (this.comparisonFn(key, middleElKey) <= -1) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return undefined;
  }

  set(key: Key, item: Item): Item {
    let i = this.items.length - 1;
    for (; i >= 0 && this.comparisonFn(this.items[i][0], key) === 1; i--) {
      this.items[i + 1] = this.items[i];
    }

    this.items[i + 1] = [key, item];
    return item;
  }
}
