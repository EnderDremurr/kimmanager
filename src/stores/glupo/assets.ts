import WeaponPenitence from "@/assets/icons/glupo/weapons/penitence.webp";
import WeaponRedEyes from "@/assets/icons/glupo/weapons/red-eyes.webp";
import WeaponHarvest from "@/assets/icons/glupo/weapons/harvest.webp";
import WeaponHeaven from "@/assets/icons/glupo/weapons/heaven.webp";
import WeaponGoldRush from "@/assets/icons/glupo/weapons/gold-rush.webp";
import WeaponSmile from "@/assets/icons/glupo/weapons/smile.webp";
import WeaponTwilight from "@/assets/icons/glupo/weapons/twilight.webp";

import ArmorPenitence from "@/assets/icons/glupo/armor/penitence.webp";
import ArmorRedEyes from "@/assets/icons/glupo/armor/red-eyes.webp";
import ArmorHarvest from "@/assets/icons/glupo/armor/harvest.webp";
import ArmorHeaven from "@/assets/icons/glupo/armor/heaven.webp";
import ArmorSmile from "@/assets/icons/glupo/armor/smile.webp";
import ArmorTwilight from "@/assets/icons/glupo/armor/twilight.webp";

import GlupoIdle from "@/assets/icons/glupo/glupo/idle.webp";
import GlupoHurt from "@/assets/icons/glupo/glupo/hurt.webp";

import UiBox from "@/assets/icons/glupo/ui/box.webp";
import UiBoxBlue from "@/assets/icons/glupo/ui/box-blue.webp";
import UiBoxRed from "@/assets/icons/glupo/ui/box-red.webp";
import UiBoxWhite from "@/assets/icons/glupo/ui/box-white.webp";

import UiBoxHarvest from "@/assets/icons/glupo/ui/box-harvest.webp";
import UiRedEyesSpider from "@/assets/icons/glupo/ui/red-eyes-spider.webp";
import UiHeavenBonus from "@/assets/icons/glupo/ui/heaven-bonus.webp";

import UiHitBasic from "@/assets/icons/glupo/ui/hit-basic.webp";
import UiHitCritical from "@/assets/icons/glupo/ui/hit-critical.webp";

import UiRiskZayin from "@/assets/icons/glupo/ui/risk-zayin.webp";
import UiRiskTeth from "@/assets/icons/glupo/ui/risk-teth.webp";
import UiRiskHe from "@/assets/icons/glupo/ui/risk-he.webp";
import UiRiskWaw from "@/assets/icons/glupo/ui/risk-waw.webp";
import UiRiskAleph from "@/assets/icons/glupo/ui/risk-aleph.webp";


const imageAssets = {
  // Weapons
  "weapon.penitence": WeaponPenitence,
  "weapon.red-eyes": WeaponRedEyes,
  "weapon.harvest": WeaponHarvest,
  "weapon.heaven": WeaponHeaven,
  "weapon.gold-rush": WeaponGoldRush,
  "weapon.smile": WeaponSmile,
  "weapon.twilight": WeaponTwilight,

  // Armor
  "armor.penitence": ArmorPenitence,
  "armor.red-eyes": ArmorRedEyes,
  "armor.harvest": ArmorHarvest,
  "armor.heaven": ArmorHeaven,
  "armor.smile": ArmorSmile,
  "armor.twilight": ArmorTwilight,

  // Glupo
  "glupo.idle": GlupoIdle,
  "glupo.hurt": GlupoHurt,

  // UI
  "ui.box": UiBox,
  "ui.box-blue": UiBoxBlue,
  "ui.box-red": UiBoxRed,
  "ui.box-white": UiBoxWhite,

  // Extra particles
  "ui.box-harvest": UiBoxHarvest,
  "ui.red-eyes-spider": UiRedEyesSpider,
  "ui.heaven-bonus": UiHeavenBonus,

  "ui.hit-basic": UiHitBasic,
  "ui.hit-critical": UiHitCritical,

  "ui.risk.zayin": UiRiskZayin,
  "ui.risk.teth": UiRiskTeth,
  "ui.risk.he": UiRiskHe,
  "ui.risk.waw": UiRiskWaw,
  "ui.risk.aleph": UiRiskAleph,
} as const;

export type ImageAssetId = keyof typeof imageAssets;
export type ImageAssets = Record<ImageAssetId, { src: string; img: HTMLImageElement }>;

export const loadImageAssets = async (): Promise<ImageAssets> => {
  const assets = await Promise.all(Object.entries(imageAssets).map(async ([key, value]) => {
    const image = new Image();
    
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => {
        console.error(`Failed to load image: ${value}`);
        reject(new Error(`Failed to load image: ${value}`));
      };
      image.src = value;
    });

    return [key, { src: value, img: image }];
  }));

  return Object.fromEntries(assets) as ImageAssets;
};
