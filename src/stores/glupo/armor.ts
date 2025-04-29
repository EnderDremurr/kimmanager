import { GlupoStore } from "./store";
import { Stats, Armor } from "./types";

export const ArmorIds = {
  Penitence: "armor.penitence",
  RedEyes: "armor.red-eyes",
  Harvest: "armor.harvest",
  Heaven: "armor.heaven",
  Smile: "armor.smile",
  Twilight: "armor.twilight",
} as const;

export type ArmorId = (typeof ArmorIds)[keyof typeof ArmorIds];

class Penitence implements Armor {
  public readonly id = ArmorIds.Penitence;
  public readonly name = "glupo.armor.penitence";
  public readonly image = "armor.penitence";
  public readonly description = "glupo.armor.penitenceDescription";
  public readonly cost = 0;

  public readonly stats: Stats = {
    fortitude: 0,
    prudence: 3,
    temperance: 0,
    justice: 1,
  };

  public onPanic(store: GlupoStore) {
    store.game.sanityState.current = Math.min(
      store.game.sanityState.current + 20,
      store.stats!.maxSanity
    );
  }
}

class RedEyes implements Armor {
  public readonly id = ArmorIds.RedEyes;
  public readonly name = "glupo.armor.redEyes";
  public readonly image = "armor.red-eyes";
  public readonly description = "glupo.armor.redEyesDescription";
  public readonly cost = 350;

  public readonly stats: Stats = {
    fortitude: 3,
    prudence: 1,
    temperance: 4,
    justice: 0,
  };
}

class Harvest implements Armor {
  public readonly id = ArmorIds.Harvest;
  public readonly name = "glupo.armor.harvest";
  public readonly image = "armor.harvest";
  public readonly description = "glupo.armor.harvestDescription";
  public readonly cost = 1500;

  public readonly stats: Stats = {
    fortitude: 5,
    prudence: -999,
    temperance: 5,
    justice: 0,
  };
}

class Heaven implements Armor {
  public readonly id = ArmorIds.Heaven;
  public readonly name = "glupo.armor.heaven";
  public readonly image = "armor.heaven";
  public readonly description = "glupo.armor.heavenDescription";
  public readonly cost = 5000;

  public readonly stats: Stats = {
    fortitude: 4,
    prudence: 5,
    temperance: 6,
    justice: 3,
  };
}

class Smile implements Armor {
  public readonly id = ArmorIds.Smile;
  public readonly name = "glupo.armor.smile";
  public readonly image = "armor.smile";
  public readonly description = "glupo.armor.smileDescription";
  public readonly cost = 100000;

  public readonly stats: Stats = {
    fortitude: 6,
    prudence: 2,
    temperance: 2,
    justice: 2,
  };

  public onPanicEnd(store: GlupoStore) {
    store.addBonusStats({
      fortitude: 5,
      prudence: 0,
      temperance: 5,
      justice: 5,
    });

    setTimeout(() => {
      store.addBonusStats({
        fortitude: -5,
        prudence: 0,
        temperance: -5,
        justice: -5,
      });
    }, 5000);
  }
}

class Twilight implements Armor {
  public readonly id = ArmorIds.Twilight;
  public readonly name = "glupo.armor.twilight";
  public readonly image = "armor.twilight";
  public readonly description = "glupo.armor.twilightDescription";
  public readonly cost = 1000000;

  public readonly stats: Stats = {
    fortitude: 10,
    prudence: 10,
    temperance: 10,
    justice: 10,
  };

  public onPanic(store: GlupoStore) {
    const random = Math.random();

    if (random < 0.5) {
      store.game.sanityState.current = store.stats!.maxSanity;
    }
  }
}

export const armor = {
  [ArmorIds.Penitence]: new Penitence(),
  [ArmorIds.RedEyes]: new RedEyes(),
  [ArmorIds.Harvest]: new Harvest(),
  [ArmorIds.Heaven]: new Heaven(),
  [ArmorIds.Smile]: new Smile(),
  [ArmorIds.Twilight]: new Twilight(),
};
