import { Directive, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';

@Directive({
  selector: '[appMarqueeIfOverflow]',
  standalone: true,
})
export class MarqueeIfOverflowDirective implements AfterViewInit, OnDestroy {
  private resizeObserver: ResizeObserver;
  private isOverflow = false;

  constructor(private el: ElementRef, private zone: NgZone) {
    this.resizeObserver = new ResizeObserver(() => this.checkOverflow());
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.resizeObserver.observe(this.el.nativeElement);
      this.checkOverflow();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver.disconnect();
  }

  private checkOverflow(): void {
    const element = this.el.nativeElement;
    const isOverflowing = element.scrollWidth > element.clientWidth;

    if (isOverflowing && !this.isOverflow) {
      element.classList.add('scrolling-text');
      this.isOverflow = true;
    } else if (!isOverflowing && this.isOverflow) {
      element.classList.remove('scrolling-text');
      this.isOverflow = false;
    }
  }
}
