import { makeAutoObservable } from "mobx";
import { StateStore } from "./state";
import { LocalizationsStore } from "./localizations";
import { ActionsStore } from "./actions";
import { GlupoStore } from "./glupo";

export class RootStore {
  public state: StateStore;
  public localizations: LocalizationsStore;
  public actions: ActionsStore;
  public glupo: GlupoStore;

  constructor() {
    makeAutoObservable(this);

    this.state = new StateStore();
    this.localizations = new LocalizationsStore();
    this.actions = new ActionsStore();
    
    this.glupo = new GlupoStore();
  }
}

export const rootStore = new RootStore();
