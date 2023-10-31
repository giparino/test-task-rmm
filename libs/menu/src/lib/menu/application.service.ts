import {ApiService, generateRandomItem, ItemInterface} from "@rmm-task/api";
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";

@Injectable()
export class ApplicationService{
  constructor(private apiService: ApiService) {}

  public getAllItems(): Observable<ItemInterface[]>{
    return this.apiService.getAllItems$();
  }

  public addNewItem(): Observable<ItemInterface>{
    return this.apiService.addNewItem$(generateRandomItem());
  }

  public deleteItem(item: ItemInterface){
    return this.apiService.deleteItem$(item);
  }
}
