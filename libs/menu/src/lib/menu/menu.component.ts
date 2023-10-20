import {ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {ApiService, generateRandomItem, ItemInterface} from "@rmm-task/api";
import {Subject, Subscription, switchMap, timer} from "rxjs";
import {AsyncPipe, CommonModule} from "@angular/common";
import {MatCardModule} from "@angular/material/card";

@Component({
  selector: 'libs-menu',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatCardModule, AsyncPipe, CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit, OnDestroy {

  public currentIndex: number | undefined;
  public applications$ = new Subject<ItemInterface[]>();

  private applications: ItemInterface[] = [];
  private subscription: Subscription | undefined;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowLeft":
        this.previousBlock();
        break;
      case "ArrowRight":
        this.nextBlock();
        break;
      case "Enter":
        this.showBlockName();
        break;
      case "Backspace":
        this.removeApplication();
        break;
    }
  }

  constructor(private apiService: ApiService) {
  }

  ngOnInit(): void {
    this.subscription = timer(0, 10000).pipe(
      switchMap(() => this.apiService.getAllItems$())
    ).subscribe((items: ItemInterface[]) => {
      this.applications = items;
      this.applications$.next(this.applications);
    });
  }

  addApplication(): void {
    this.apiService.addNewItem$(generateRandomItem()).subscribe((newItem: ItemInterface) => {
      this.applications.push(newItem);
      this.applications$.next(this.applications);
    });
  }

  removeApplication(): void {
    if (typeof this.currentIndex !== "undefined") {
      this.apiService.deleteItem$(this.applications[this.currentIndex]!).subscribe(() =>{
        this.applications.splice(this.currentIndex!, 1);
        this.applications$.next(this.applications);
        this.currentIndex = undefined;
      });
    }
  }

  private previousBlock(): void {
    if (typeof this.currentIndex === "undefined") {
      this.currentIndex = 0;
    } else if (this.currentIndex > 0) {
      this.currentIndex -= 1;
    }
  }

  private nextBlock(): void {
    if (typeof this.currentIndex === "undefined") {
      this.currentIndex = 0;
    } else if (this.currentIndex < this.applications.length - 1) {
      this.currentIndex += 1;
    }
  }

  private showBlockName(): void {
    if (this.applications.length && typeof this.currentIndex !== "undefined") {
      alert(`Приложение ${this.applications[this.currentIndex]!.name} запущено`);
    }
  }

  ngOnDestroy(): void {
    this.subscription!.unsubscribe();
  }
}
