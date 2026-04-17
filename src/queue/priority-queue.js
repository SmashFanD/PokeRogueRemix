/**
 * class representing a {@link https://en.wikipedia.org/wiki/Priority_queue#Min-priority_queue | Min-priority queue}.
 *
 * Dynamically updates ordering to always return the "highest priority" item,
 * based on the implementation of {@linkcode reorder}.
 */
export class PriorityQueue {
  /** The items in the queue. */
  queue = [];

  /**
   * Reorder the queue before removing and returning the highest priority element.
   * @returns The front-most element of the queue after sorting,
   * or `undefined` if the queue is empty.
   * @sealed
   */
  pop() {
    if (this.isEmpty()) {
      return;
    }

    this.reorder();
    return this.queue.shift();
  }

  /**
   * Add an element to the queue.
   * @param element - The element to add
   */
  push(element) {
    this.queue.push(element);
  }

  /**
   * Remove all elements from the queue.
   * @sealed
   */
  clear() {
    this.queue.splice(0, this.queue.length);
  }

  /**
   * @returns Whether the queue is empty
   * @sealed
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Remove the first element in the queue matching a given condition.
   * @param condition - If provided, will restrict the removal to only entries matching the given condition
   * @returns Whether a removal occurred
   */
  remove(condition) {
    // Reorder to remove the first element
    this.reorder();
    const index = this.queue.findIndex(condition);
    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    return true;
  }

  /** @returns An element matching the condition function */
  find(condition) {
    return this.queue.find(condition);
  }

  /** @returns Whether an element matching the condition function exists */
  has(condition) {
    return this.queue.some(condition);
  }
}