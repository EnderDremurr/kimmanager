import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Armor, Weapon, Stats, HitParams, RiskLevel } from "./types";
import { loadImageAssets, type ImageAssets } from "./assets";
import { WeaponId, WeaponIds, weapons } from "./weapon";
import { ArmorId, ArmorIds, armor } from "./armor";
import { Game } from "./game";
import { load, Store } from "@tauri-apps/plugin-store";

type GameData = {
  selectedWeapon: WeaponId;
  selectedArmor: ArmorId;
  boughtWeapons: WeaponId[];
  boughtArmor: ArmorId[];
  riskLevel: RiskLevel;
  balance: number;
  baseStats: Stats;
};

const configVersion = 1;

const defaultGameData: GameData = {
  selectedWeapon: WeaponIds.Penitence,
  selectedArmor: ArmorIds.Penitence,
  boughtWeapons: [WeaponIds.Penitence],
  boughtArmor: [ArmorIds.Penitence],
  riskLevel: RiskLevel.Zayin,
  balance: 0,
  baseStats: {
    fortitude: 1,
    prudence: 1,
    temperance: 1,
    justice: 1,
  },
} as const;

export class GlupoStore {
  public selectedWeapon: Weapon = weapons[WeaponIds.Penitence];
  public selectedArmor: Armor = armor[ArmorIds.Penitence];
  public boughtWeapons: WeaponId[] = [WeaponIds.Penitence];
  public boughtArmor: ArmorId[] = [ArmorIds.Penitence];

  public baseStats: Stats | null = null;
  public riskLevel: RiskLevel | null = null;
  public balance: number = 0;

  public bonusStats: Stats = {
    fortitude: 0,
    prudence: 0,
    temperance: 0,
    justice: 0,
  };

  public isLoading: boolean = true;
  public error: string | null = null;

  public imageAssets: ImageAssets | null = null;
  public game: Game;
  public store: Store | null = null;

  constructor() {
    this.game = new Game(this);

    makeAutoObservable(
      this,
      {
        game: false,
      },
      { autoBind: true }
    );

    this.load();

    autorun(() => {
      if (this.store === null || this.error !== null) {
        return;
      }

      const gameData: GameData = {
        balance: this.balance,
        riskLevel: this.riskLevel ?? defaultGameData.riskLevel,
        baseStats: this.baseStats ?? defaultGameData.baseStats,
        selectedWeapon: this.selectedWeapon.id as WeaponId,
        selectedArmor: this.selectedArmor.id as ArmorId,
        boughtWeapons: this.boughtWeapons || defaultGameData.boughtWeapons,
        boughtArmor: this.boughtArmor || defaultGameData.boughtArmor,
      };

      this.store?.set("gameData", gameData);
    });
  }

  public async load() {
    this.isLoading = true;
    this.error = null;

    try {
      await this.refresh();
    } catch (error) {
      console.error(error);
      runInAction(() => {
        this.error = `Failed to load game data: ${error}`;
        console.error(this.error);
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  public async refresh() {
    const assets = await loadImageAssets();
    const store = await load("glupo.json");

    let gameData = await store.get<GameData>("gameData");
    const version = await store.get<number>("configVersion");

    if (!gameData || version !== configVersion) {
      await store.set("gameData", defaultGameData);
      await store.set("configVersion", configVersion);
      gameData = defaultGameData;
    }

    runInAction(() => {
      this.imageAssets = assets;
      this.store = store;
      this.loadGameData(gameData);
    });
  }

  public loadGameData(gameData: GameData) {
    this.selectedWeapon = weapons[gameData.selectedWeapon];
    this.selectedArmor = armor[gameData.selectedArmor];

    this.boughtWeapons = gameData.boughtWeapons;
    this.boughtArmor = gameData.boughtArmor;

    this.riskLevel = gameData.riskLevel;
    this.balance = gameData.balance;

    this.baseStats = gameData.baseStats;
  }

  public processHit(params: HitParams) {
    if (this.selectedArmor !== null) {
      this.selectedArmor.onHit?.(this, params);
    }

    if (this.selectedWeapon !== null) {
      this.selectedWeapon.onHit?.(this, params);
    }
  }

  public processPanic() {
    if (this.selectedArmor !== null) {
      this.selectedArmor.onPanic?.(this);
    }

    if (this.selectedWeapon !== null) {
      this.selectedWeapon.onPanic?.(this);
    }
  }

  public processPanicEnd() {
    if (this.selectedArmor !== null) {
      this.selectedArmor.onPanicEnd?.(this);
    }

    if (this.selectedWeapon !== null) {
      this.selectedWeapon.onPanicEnd?.(this);
    }
  }

  public addBalance(amount: number) {
    this.balance += amount;

    if (this.balance >= this.maxBalance) {
      this.balance = this.maxBalance;
    }
  }

  public addBoxes(amount: number, multiplier: number = 1) {
    const boxPrice = this.stats?.boxPrice ?? 1;
    const total = Math.floor(amount * multiplier * boxPrice);
    this.addBalance(total);
  }

  public addBonusStats(stats: Partial<Stats>) {
    Object.entries(stats).forEach(([key, value]) => {
      this.bonusStats[key as keyof Stats] += value;
    });
  }

  public get maxBalance() {
    return this.riskBalanceLimits[this.riskLevel ?? RiskLevel.Zayin];
  }

  public get isFullBalance() {
    return this.balance === this.maxBalance;
  }

  public get playerStats() {
    if (this.baseStats === null) {
      return null;
    }

    const stats = { ...this.baseStats };

    if (this.selectedWeapon !== null) {
      Object.entries(this.selectedWeapon.stats).forEach(([key, value]) => {
        stats[key as keyof Stats] += value;
      });
    }

    if (this.selectedArmor !== null) {
      Object.entries(this.selectedArmor.stats).forEach(([key, value]) => {
        stats[key as keyof Stats] += value;
      });
    }

    Object.entries(this.bonusStats).forEach(([key, value]) => {
      stats[key as keyof Stats] += value;
    });

    for (const key in stats) {
      stats[key as keyof Stats] = Math.max(stats[key as keyof Stats], 0);
    }

    return stats;
  }

  public get stats() {
    const stats = this.playerStats;

    if (stats === null) {
      return null;
    }

    // Fortitude
    const minBoxes = Math.floor(stats.fortitude / 2) + 1;
    const maxBoxes = Math.floor(stats.fortitude * 2) + 1;

    // Prudence
    const maxSanity = 40 + stats.prudence * 10;
    const regenerationDelay = 2500 / (1 + 0.3 * stats.prudence);
    const panicRestoreDelay = 500 / (stats.prudence > 0 ? stats.prudence : 1);

    // Temperance
    let criticalChance = 0;
    for (let current = stats.temperance; current > 0; current--) {
      let step = 5;

      if (criticalChance + step > 50) {
        step /= 2;
      }

      if (criticalChance + step > 75) {
        step /= 2;
      }

      if (criticalChance + step > 90) {
        step /= 2;
      }

      if (criticalChance + step > 95) {
        criticalChance = 95;
        break;
      }

      criticalChance += step;
    }

    criticalChance = criticalChance / 100;
    const criticalMultiplier = this.selectedWeapon?.critMultiplier ?? 2;

    // Justice
    const cooldownModifier = 1 + stats.justice * 0.1;
    const cooldown = this.selectedWeapon?.cooldown ?? 250;
    const realCooldown = cooldown / cooldownModifier;

    // Extra
    const boxPrice = this.selectedWeapon?.boxPrice ?? 1;

    return {
      // Fortitude
      minBoxes,
      maxBoxes,

      // Prudence
      maxSanity,
      regenerationDelay,
      panicRestoreDelay,

      // Temperance
      criticalChance,
      criticalMultiplier,

      // Justice
      cooldownModifier,
      cooldown,
      realCooldown,

      // Extra
      boxPrice,
    };
  }

  public get statsLevelsCost() {
    return [0, 100, 300, 1500, 10000, 30000, 100000, 250000, 1000000, 2500000];
  }

  public get maxStats() {
    return {
      fortitude: this.statsLevelsCost.length,
      prudence: this.statsLevelsCost.length,
      temperance: this.statsLevelsCost.length,
      justice: this.statsLevelsCost.length,
    };
  }

  public get statsUpgradeCost() {
    return {
      fortitude: this.statsLevelsCost[this.baseStats?.fortitude ?? 0] ?? null,
      prudence: this.statsLevelsCost[this.baseStats?.prudence ?? 0] ?? null,
      temperance: this.statsLevelsCost[this.baseStats?.temperance ?? 0] ?? null,
      justice: this.statsLevelsCost[this.baseStats?.justice ?? 0] ?? null,
    };
  }

  public get canUpgradeStats() {
    const stats = this.playerStats;
    const upgradeCosts = this.statsUpgradeCost;

    if (stats === null) {
      return {
        fortitude: false,
        prudence: false,
        temperance: false,
        justice: false,
      };
    }

    return {
      fortitude:
        upgradeCosts.fortitude !== null &&
        this.balance >= upgradeCosts.fortitude,
      prudence:
        upgradeCosts.prudence !== null && this.balance >= upgradeCosts.prudence,
      temperance:
        upgradeCosts.temperance !== null &&
        this.balance >= upgradeCosts.temperance,
      justice:
        upgradeCosts.justice !== null && this.balance >= upgradeCosts.justice,
    };
  }

  public upgradeStats(stat: keyof Stats) {
    const stats = this.playerStats;
    const upgradeCosts = this.statsUpgradeCost;

    if (
      stats === null ||
      upgradeCosts[stat] === null ||
      this.baseStats === null
    ) {
      return;
    }

    if (this.balance < upgradeCosts[stat]) {
      return;
    }

    this.balance -= upgradeCosts[stat];
    this.baseStats[stat] += 1;
  }

  public get riskBalanceLimits() {
    return {
      [RiskLevel.Zayin]: 200,
      [RiskLevel.Teth]: 3000,
      [RiskLevel.He]: 50000,
      [RiskLevel.Waw]: 500000,
      [RiskLevel.Aleph]: Infinity,
    };
  }

  public get riskUpgradeCost() {
    return {
      [RiskLevel.Zayin]: 200,
      [RiskLevel.Teth]: 3000,
      [RiskLevel.He]: 50000,
      [RiskLevel.Waw]: 500000,
      [RiskLevel.Aleph]: null,
    }[this.riskLevel ?? RiskLevel.Zayin];
  }

  public get canUpgradeRisk() {
    return (
      this.riskUpgradeCost !== null && this.balance >= this.riskUpgradeCost
    );
  }

  public get nextRiskLevel() {
    return {
      [RiskLevel.Zayin]: RiskLevel.Teth,
      [RiskLevel.Teth]: RiskLevel.He,
      [RiskLevel.He]: RiskLevel.Waw,
      [RiskLevel.Waw]: RiskLevel.Aleph,
      [RiskLevel.Aleph]: null,
    }[this.riskLevel ?? RiskLevel.Zayin];
  }

  public upgradeRisk() {
    if (this.riskLevel === null || this.riskUpgradeCost === null) {
      return;
    }

    if (this.balance < this.riskUpgradeCost) {
      return;
    }

    this.balance -= this.riskUpgradeCost;
    this.riskLevel = this.nextRiskLevel;
  }

  public get weaponsShop() {
    const orderedWeapons = Object.values(weapons).sort(
      (a, b) => a.cost - b.cost
    );

    return orderedWeapons.map((weapon) => ({
      ...weapon,
      isBought: this.boughtWeapons.includes(weapon.id),
      isSelected: this.selectedWeapon?.id === weapon.id,
    }));
  }

  public get armorShop() {
    const orderedArmor = Object.values(armor).sort((a, b) => a.cost - b.cost);

    return orderedArmor.map((armor) => ({
      ...armor,
      isBought: this.boughtArmor.includes(armor.id),
      isSelected: this.selectedArmor?.id === armor.id,
    }));
  }

  public selectWeapon(weaponId: WeaponId) {
    if (this.boughtWeapons.includes(weaponId)) {
      this.selectedWeapon = weapons[weaponId];
    }
  }

  public buyWeapon(weaponId: WeaponId) {
    if (this.boughtWeapons.includes(weaponId)) {
      return;
    }

    if (this.balance < weapons[weaponId].cost) {
      return;
    }

    this.balance -= weapons[weaponId].cost;
    this.boughtWeapons.push(weaponId);
    this.selectedWeapon = weapons[weaponId];
  }

  public selectArmor(armorId: ArmorId) {
    if (this.boughtArmor.includes(armorId)) {
      this.selectedArmor = armor[armorId];
    }
  }

  public buyArmor(armorId: ArmorId) {
    if (this.boughtArmor.includes(armorId)) {
      return;
    }

    if (this.balance < armor[armorId].cost) {
      return;
    }

    this.balance -= armor[armorId].cost;
    this.boughtArmor.push(armorId);
    this.selectedArmor = armor[armorId];
  }

  public cheat() {
    if (!import.meta.env.DEV) {
      return;
    }

    this.balance = isFinite(this.maxBalance)
      ? this.maxBalance
      : this.balance + 1000000;
  }

  public get resetCost() {
    return 25_000_000;
  }

  public reset() {
    if (this.balance < this.resetCost) {
      return;
    }

    this.balance -= this.resetCost;
    this.loadGameData(defaultGameData);
  }
}
