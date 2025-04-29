import { GlupoStore } from "./store";
import { Stats, Weapon, HitParams } from "./types";

export const WeaponIds = {
  Penitence: "weapon.penitence",
  RedEyes: "weapon.red-eyes",
  Harvest: "weapon.harvest",
  Heaven: "weapon.heaven",
  GoldRush: "weapon.gold-rush",
  Smile: "weapon.smile",
  Twilight: "weapon.twilight",
} as const;

export type WeaponId = (typeof WeaponIds)[keyof typeof WeaponIds];

class Penitence implements Weapon {
  public readonly id = WeaponIds.Penitence;
  public readonly name = "glupo.weapons.penitence";
  public readonly description = "glupo.weapons.penitenceDescription";
  public readonly image = "weapon.penitence";
  public readonly cooldown = 250;
  public readonly critMultiplier = 1.5;
  public readonly boxPrice = 1;
  public readonly cost = 0;

  public readonly stats: Stats = {
    fortitude: 0,
    prudence: 0,
    temperance: 0,
    justice: 0,
  };

  public onHit(store: GlupoStore, { isCritical }: HitParams) {
    if (isCritical) {
      store.game.changeSanity(+5);
    } else {
      store.game.changeSanity(-10);
    }
  }
}

class RedEyes implements Weapon {
  public readonly id = WeaponIds.RedEyes;
  public readonly name = "glupo.weapons.redEyes";
  public readonly description = "glupo.weapons.redEyesDescription";
  public readonly image = "weapon.red-eyes";
  public readonly cooldown = 200;
  public readonly critMultiplier = 1.5;
  public readonly boxPrice = 2;
  public readonly cost = 350;

  public readonly stats: Stats = {
    fortitude: 4,
    prudence: 0,
    temperance: 0,
    justice: 0,
  };

  private spiderCount = 0;

  public onHit(store: GlupoStore, { position }: HitParams) {
    const game = store.game;
    game.changeSanity(-10);

    if (Math.random() > 0.5 || this.spiderCount >= 3) {
      return;
    }

    this.spiderCount++;
    store.addBonusStats({
      temperance: 1,
    });

    game.particles.addParticle({
      x: position.x + Math.random() * 20 - 5,
      y: position.y + Math.random() * 20 - 5,
      asset: "ui.red-eyes-spider",
      timeLeft: Infinity,
      vx: 0,
      vy: 0,
      size: 40,
      opacity: 1,
      opacityDecay: 0.01,
      rotation: 0,
      hue: 0,
      gravity: 0,
      onDestroy: () => {
        this.spiderCount--;
        store.addBonusStats({
          temperance: -1,
        });
      },
    });
  }
}

class Harvest implements Weapon {
  public readonly id = WeaponIds.Harvest;
  public readonly name = "glupo.weapons.harvest";
  public readonly description = "glupo.weapons.harvestDescription";
  public readonly image = "weapon.harvest";
  public readonly cooldown = 600;
  public readonly critMultiplier = 10;
  public readonly boxPrice = 5;
  public readonly cost = 1500;

  public readonly stats: Stats = {
    fortitude: 0,
    prudence: 2,
    temperance: 0,
    justice: 0,
  };

  public onHit(store: GlupoStore, { position, isCritical }: HitParams) {
    const game = store.game;
    game.changeSanity(-10);

    let bonus = 0;
    if (store.playerStats!.prudence < 5) {
      bonus = 128;
    } else if (store.playerStats!.prudence === 0) {
      bonus = 256;
    }

    if (isCritical) {
      bonus = bonus * this.critMultiplier;
    }

    bonus = Math.floor(bonus / 2 + (Math.random() * bonus) / 2);

    store.addBalance(bonus);
    game.spawnBoxes(position, Math.ceil(bonus / 64), {
      size: 48,
      asset: "ui.box-harvest",
    });
  }
}

class Heaven implements Weapon {
  public readonly id = WeaponIds.Heaven;
  public readonly name = "glupo.weapons.heaven";
  public readonly description = "glupo.weapons.heavenDescription";
  public readonly image = "weapon.heaven";
  public readonly cooldown = 500;
  public readonly critMultiplier = 2;
  public readonly boxPrice = 10;
  public readonly cost = 10000;

  public readonly stats: Stats = {
    fortitude: 0,
    prudence: 0,
    temperance: 0,
    justice: 0,
  };

  public onHit(store: GlupoStore, { position, isCritical }: HitParams) {
    const game = store.game;
    const hitAngle = Math.abs(store.game.weapon.data.angle);

    game.changeSanity(-5);

    if (hitAngle > 0.05) {
      return;
    }

    let bonus;
    if (hitAngle < 0.01) {
      bonus = 4;
    } else if (hitAngle < 0.02) {
      bonus = 2;
    } else {
      bonus = 1;
    }

    store.addBoxes(bonus, isCritical ? 2 : 1);
    game.spawnBoxes(position, bonus, {
      size: isCritical ? 48 : 32,
      asset: "ui.heaven-bonus",
      gravity: 0.1,
    });
  }
}

class GoldRush implements Weapon {
  public readonly id = WeaponIds.GoldRush;
  public readonly name = "glupo.weapons.goldRush";
  public readonly description = "glupo.weapons.goldRushDescription";
  public readonly image = "weapon.gold-rush";
  public readonly cooldown = 100;
  public readonly critMultiplier = 3;
  public readonly boxPrice = 10;
  public readonly cost = 30000;

  public readonly stats: Stats = {
    fortitude: 4,
    prudence: 0,
    temperance: -2,
    justice: 0,
  };

  public onHit(store: GlupoStore, { isCritical }: HitParams) {
    const game = store.game;
    game.changeSanity(-1);

    if (isCritical) {
      game.changeSanity(-2);
    }
  }
}

class Smile implements Weapon {
  public readonly id = WeaponIds.Smile;
  public readonly name = "glupo.weapons.smile";
  public readonly description = "glupo.weapons.smileDescription";
  public readonly image = "weapon.smile";
  public readonly cooldown = 500;
  public readonly critMultiplier = 6;
  public readonly boxPrice = 100;
  public readonly cost = 100000;

  public readonly stats: Stats = {
    fortitude: 5,
    prudence: 0,
    temperance: 0,
    justice: 0,
  };

  public onHit(store: GlupoStore, { position }: HitParams) {
    const game = store.game;

    if (game.sanityState.current >= store.stats!.maxSanity / 2) {
      game.changeSanity(-25);
      return;
    }

    game.changeSanity(-5);
    let bonus = 5000;
    bonus = Math.floor(bonus / 2 + (Math.random() * bonus) / 2);

    game.spawnBoxes(position, Math.ceil(bonus / 1000), {
      size: 64,
    });
  }
}

class Twilight implements Weapon {
  public readonly id = WeaponIds.Twilight;
  public readonly name = "glupo.weapons.twilight";
  public readonly description = "glupo.weapons.twilightDescription";
  public readonly image = "weapon.twilight";
  public readonly cooldown = 250;
  public readonly critMultiplier = 5;
  public readonly boxPrice = 200;
  public readonly cost = 1000000;

  public readonly stats: Stats = {
    fortitude: 5,
    prudence: 5,
    temperance: 5,
    justice: 5,
  };

  public onHit(store: GlupoStore, { isCritical }: HitParams) {
    store.game.changeSanity(-10);

    if (isCritical) {
      store.addBonusStats({
        fortitude: 0,
        prudence: 0,
        temperance: 1,
        justice: 1,
      });

      setTimeout(() => {
        store.addBonusStats({
          fortitude: 0,
          prudence: 0,
          temperance: -1,
          justice: -1,
        });
      }, 2500);
    }
  }
}

export const weapons = {
  [WeaponIds.Penitence]: new Penitence(),
  [WeaponIds.RedEyes]: new RedEyes(),
  [WeaponIds.Harvest]: new Harvest(),
  [WeaponIds.Heaven]: new Heaven(),
  [WeaponIds.GoldRush]: new GoldRush(),
  [WeaponIds.Smile]: new Smile(),
  [WeaponIds.Twilight]: new Twilight(),
};
