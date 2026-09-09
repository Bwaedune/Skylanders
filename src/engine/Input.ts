export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private justReleased = new Set<string>();
  public mouseX = 0;
  public mouseY = 0;
  public mouseDown = false;
  public mouseJustDown = false;

  constructor(target: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.justPressed.add(k);
      this.keys.add(k);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      this.justReleased.add(k);
    });
    target.addEventListener('mousemove', (e) => {
      const rect = target.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    target.addEventListener('mousedown', () => {
      this.mouseDown = true;
      this.mouseJustDown = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  wasPressed(key: string): boolean {
    return this.justPressed.has(key.toLowerCase());
  }

  wasReleased(key: string): boolean {
    return this.justReleased.has(key.toLowerCase());
  }

  /** Call once per frame after all systems have read input. */
  endFrame(): void {
    this.justPressed.clear();
    this.justReleased.clear();
    this.mouseJustDown = false;
  }
}
