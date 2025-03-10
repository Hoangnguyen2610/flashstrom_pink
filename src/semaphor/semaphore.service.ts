import { Semaphore } from 'async-mutex';

export class SemaphoreService {
  private static instance: SemaphoreService;
  private semaphores = new Map<string, Semaphore>();

  private constructor() {}

  public static getInstance(): SemaphoreService {
    if (!SemaphoreService.instance) {
      SemaphoreService.instance = new SemaphoreService();
    }
    return SemaphoreService.instance;
  }

  public getSemaphore(key: string): Semaphore {
    if (!this.semaphores.has(key)) {
      this.semaphores.set(key, new Semaphore(1));
    }
    return this.semaphores.get(key)!;
  }
}
