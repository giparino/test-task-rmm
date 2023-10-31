import {
  ChangeDetectionStrategy,
  Component, DestroyRef,
  ElementRef,
  HostListener, inject,
  OnDestroy,
  OnInit, Self
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {ItemInterface} from "@rmm-task/api";
import {delay, Subject, switchMap, take, timer} from "rxjs";
import {AsyncPipe, CommonModule} from "@angular/common";
import {MatCardModule} from "@angular/material/card";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ApplicationService} from "./application.service";

@Component({
  selector: 'libs-menu',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatCardModule, AsyncPipe, CommonModule],
  providers: [ApplicationService],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit, OnDestroy {

  public currentIndex: number | undefined;
  public applications$ = new Subject<ItemInterface[]>();

  private applications: ItemInterface[] = [];
  private columnsCount: number | undefined;
  private observer: ResizeObserver | undefined;
  private destroyRef = inject(DestroyRef);

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowLeft":
        this.previousBlock();
        break;
      case "ArrowRight":
        this.nextBlock();
        break;
      case "ArrowDown":
        event.preventDefault();
        this.nextBlock(true);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.previousBlock(true);
        break;
      case "Enter":
        this.showBlockName();
        break;
      case "Backspace":
        this.removeApplication();
        break;
    }
  }

  constructor(@Self() private applicationService: ApplicationService,
              private host: ElementRef) {
  }

  ngOnInit(): void {
    this.applications$.pipe(
      take(1),
      delay(0)
    ).subscribe(() => this.addResizeListener());

    timer(0, 10000).pipe(
      switchMap(() => this.applicationService.getAllItems()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((items: ItemInterface[]) => {
      this.applications = items;
      this.applications$.next(this.applications);
    });
  }

  addApplication(): void {
    this.applicationService.addNewItem().subscribe((newItem: ItemInterface) => {
      this.applications.push(newItem);
      this.applications$.next(this.applications);
    });
  }

  removeApplication(): void {
    if (typeof this.currentIndex !== "undefined") {
      this.applicationService.deleteItem(this.applications[this.currentIndex]!).subscribe(() =>{
        this.applications.splice(this.currentIndex!, 1);
        this.applications$.next(this.applications);
        this.currentIndex = undefined;
      });
    }
  }

  private addResizeListener(): void{
    const element = document.querySelector('.card') as HTMLElement;
    if (element) {
      const blockWidth: number = parseInt(window.getComputedStyle(element).width, 10) + parseInt(window.getComputedStyle(element).marginRight, 10);
      this.observer = new ResizeObserver(() => this.calculateColumns(blockWidth));
      this.observer.observe(this.host.nativeElement);
    }
  }

  private calculateColumns(blockWidth: number): void {
    const container = document.querySelector('.content') as HTMLElement;
    const containerWidth = container.clientWidth - parseInt(window.getComputedStyle(container).paddingLeft, 10) - parseInt(window.getComputedStyle(container).paddingRight, 10);
    this.columnsCount = Math.floor(containerWidth / blockWidth);
  }

  private previousBlock(isVertically?: boolean): void {
    if (typeof this.currentIndex === "undefined") {
      this.currentIndex = 0;
    } else if (isVertically && this.isRequiredBlocksCount(true)) {
      this.currentIndex -= this.columnsCount!;
    } else if (!isVertically && this.currentIndex > 0) {
      this.currentIndex -= 1;
    }
  }

  private nextBlock(isVertically?: boolean): void {
    if (typeof this.currentIndex === "undefined") {
      this.currentIndex = 0;
    } else if (isVertically && this.isRequiredBlocksCount()) {
      this.currentIndex += this.columnsCount!;
    } else if (this.currentIndex < this.applications.length - 1) {
      this.currentIndex += 1;
    }
  }

  private isRequiredBlocksCount(back?: boolean): boolean {
    if (typeof this.currentIndex !== "undefined") {
      const blocksCount: number = back ? this.currentIndex + 1 : this.applications.length - (this.currentIndex + 1);
      return blocksCount >= this.columnsCount!;
    }
    return false;
  }

  private showBlockName(): void {
    if (this.applications.length && typeof this.currentIndex !== "undefined") {
      alert(`Приложение ${this.applications[this.currentIndex]!.name} запущено`);
    }
  }

  ngOnDestroy(): void {
    this.observer!.unobserve(this.host.nativeElement);
  }
}
