import { GlupoStore } from "./store";
import { ImageAssetId, ImageAssets } from "./assets";
import { randomRangeInt } from "./utils";

interface DrawProps {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  assets: ImageAssets;
  deltaTime: number;
}

interface Drawable {
  draw(props: DrawProps): void;
}

type GlupoData = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rotationVelocity: number;
  rotationDamping: number;
};

class Glupo implements Drawable {
  public data: GlupoData = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    rotationVelocity: 0,
    rotationDamping: 0.95,
  };

  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public draw(props: DrawProps) {
    const { ctx, canvas, assets } = props;

    ctx.save();

    let glupo = assets["glupo.idle"].img;
    const { maxSanity } = this.game.store.stats!;

    if (this.game.sanityState.current < maxSanity * 0.5) {
      glupo = assets["glupo.hurt"].img;
    }

    const glupoWidth = glupo.width;
    const glupoHeight = glupo.height;
    const glupoScale = 0.15;

    // Draw shadow ellipse under the character
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    const maxRotation = (10 * Math.PI) / 180;

    ctx.ellipse(
      0,
      (glupoHeight * glupoScale) / 2 - 20,
      (glupoWidth * glupoScale) / 2 +
        Math.abs(this.data.rotation / maxRotation) * 5,
      (glupoHeight * glupoScale) / 6,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    this.data.rotation += this.data.rotationVelocity;
    this.data.rotationVelocity *= this.data.rotationDamping;
    this.data.rotationVelocity -= this.data.rotation * 0.01;

    if (this.data.rotation > maxRotation) {
      this.data.rotation = maxRotation;
      this.data.rotationVelocity = -Math.abs(this.data.rotationVelocity) * 0.5;
    } else if (this.data.rotation < -maxRotation) {
      this.data.rotation = -maxRotation;
      this.data.rotationVelocity = Math.abs(this.data.rotationVelocity) * 0.5;
    }

    ctx.rotate(this.data.rotation);

    ctx.drawImage(
      glupo,
      (-glupoWidth * glupoScale) / 2,
      (-glupoHeight * glupoScale) / 2,
      glupoWidth * glupoScale,
      glupoHeight * glupoScale
    );

    this.data = {
      ...this.data,
      x: canvas.width / 2,
      y: canvas.height * 0.4,
      width: 150,
      height: 200,
    };

    ctx.restore();
  }

  public addVelocity(rv: number) {
    this.data.rotationVelocity += rv;
  }
}

type ParticleData = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityDecay: number;
  rotation: number;
  hue: number;
  asset: ImageAssetId;
  timeLeft: number;
  gravity: number;
  onDestroy?: (particle: ParticleData) => void;
};

class Particles implements Drawable {
  public particles: ParticleData[] = [];

  public draw(props: DrawProps) {
    const { ctx, canvas, assets, deltaTime } = props;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;

      particle.vy += particle.gravity;

      particle.rotation = Math.atan2(particle.vy, particle.vx);

      if (particle.x <= 0 || particle.x >= canvas.width - particle.size) {
        particle.vx = -particle.vx * 0.7;
        particle.x = particle.x <= 0 ? 0 : canvas.width - particle.size;
      }

      if (particle.y <= 0) {
        particle.vy = Math.abs(particle.vy) * 0.7;
        particle.y = 0;
      }

      if (particle.y >= canvas.height) {
        particle.onDestroy?.(particle);
        this.particles.splice(i, 1);
        continue;
      }

      particle.opacity -= particle.opacityDecay;
      if (particle.opacity <= 0) {
        particle.onDestroy?.(particle);
        this.particles.splice(i, 1);
        continue;
      }

      particle.timeLeft -= deltaTime;
      if (particle.timeLeft <= 0) {
        particle.onDestroy?.(particle);
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      // ctx.filter = `hue-rotate(48deg)`;
      ctx.drawImage(
        assets[particle.asset].img,
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size
      );
      ctx.restore();
    }
  }

  public addParticle(props: ParticleData) {
    this.particles.push(props);
  }
}

type WeaponData = {
  x: number;
  y: number;
  speed: number;
  angle: number;
  visible: boolean;
};

class Weapon implements Drawable {
  public data: WeaponData = {
    x: 0,
    y: 0,
    speed: 0,
    angle: 0,
    visible: false,
  };

  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public draw(props: DrawProps) {
    const { ctx, canvas, assets } = props;

    if (!this.data.visible) {
      return;
    }

    ctx.save();

    const weapon = assets[this.game.store.selectedWeapon!.image].img;
    const weaponWidth = weapon.width;
    const weaponHeight = weapon.height;
    const weaponScale = 0.5;

    let x = this.data.x;
    let y = this.data.y;

    if (this.game.sanityState.isPanic) {
      x += 3 - Math.random() * 6;
      y += 3 - Math.random() * 6;
    }

    ctx.translate(x, y);

    const deltaAngle =
      Math.tanh(this.data.speed / (canvas.width * 0.05)) *
      ((15 * Math.PI) / 180);

    this.data.angle = deltaAngle;
    ctx.rotate(Math.PI / 2 - deltaAngle);

    ctx.drawImage(
      weapon,
      (-weaponWidth * weaponScale) / 2,
      (-weaponHeight * weaponScale) / 2,
      weaponWidth * weaponScale,
      weaponHeight * weaponScale
    );

    ctx.restore();
  }

  public setVisible(visible: boolean) {
    this.data.visible = visible;
  }

  public setPosition(x: number, y: number, speed: number) {
    this.data.x = x;
    this.data.y = y;
    this.data.speed = speed;
  }
}

interface SanityGaugeData {
  current: number;
}

class SanityGauge implements Drawable {
  public data: SanityGaugeData = { current: 0 };
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  private updateSanity() {
    const step = (this.game.sanityState.current - this.data.current) * 0.1;

    if (Math.abs(step) < 0.1) {
      this.data.current = this.game.sanityState.current;
    } else {
      this.data.current += step;
    }
  }

  public draw(props: DrawProps) {
    const { ctx, canvas } = props;
    this.updateSanity();

    ctx.save();

    const gaugeWidth = 24 + 4;
    const gaugeHeight = canvas.height * 0.6;

    let gaugeX = canvas.width - gaugeWidth - 12;
    let gaugeY = (canvas.height - gaugeHeight) / 2;

    if (this.game.sanityState.isPanic) {
      gaugeX += 2 - Math.random() * 4;
      gaugeY += 2 - Math.random() * 4;
    }

    const { maxSanity } = this.game.store.stats!;

    const fillPercentage = this.data.current / maxSanity;
    const fillHeight = gaugeHeight * fillPercentage;

    const gradient = ctx.createLinearGradient(
      gaugeX,
      gaugeY + gaugeHeight - fillHeight,
      gaugeX,
      gaugeY + gaugeHeight
    );

    if (this.game.sanityState.isPanic) {
      gradient.addColorStop(0, "rgba(255, 102, 0, 0.95)");
      gradient.addColorStop(1, "rgba(255, 60, 0, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(76, 146, 228, 0.95)");
      gradient.addColorStop(1, "rgba(76, 124, 228, 0.95)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
      gaugeX + 3,
      gaugeY + gaugeHeight - fillHeight,
      gaugeWidth - 6,
      fillHeight,
      5
    );
    ctx.fill();

    ctx.restore();
  }
}

type MouseData = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

export class Game {
  public store: GlupoStore;

  public mouse: MouseData = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
  };

  public lastTimestamp: number = 0;
  public lastHitTimestamp: number = 0;

  public glupo: Glupo;
  public particles: Particles;
  public weapon: Weapon;
  public sanityGauge: SanityGauge;

  public sanityState: {
    current: number;
    isPanic: boolean;
    restoreTimer: number | null;
  } = {
    current: 100,
    isPanic: false,
    restoreTimer: null,
  };

  constructor(store: GlupoStore) {
    this.store = store;

    this.glupo = new Glupo(this);
    this.particles = new Particles();
    this.weapon = new Weapon(this);
    this.sanityGauge = new SanityGauge(this);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.drawFrame = this.drawFrame.bind(this);
  }

  public handleMouseMove(element: HTMLCanvasElement, event: MouseEvent) {
    const cooldown =
      this.store.stats!.cooldown / this.store.stats!.cooldownModifier;

    const rect = element.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const dx = mouseX - this.mouse.x;
    const dy = mouseY - this.mouse.y;
    const mouseSpeed = Math.sqrt(dx * dx + dy * dy);

    const distance = Math.sqrt(
      (mouseX - this.glupo.data.x) ** 2 + (mouseY - this.glupo.data.y) ** 2
    );

    if (
      distance < Math.max(this.glupo.data.width, this.glupo.data.height) / 2 &&
      mouseSpeed > 20 &&
      Date.now() - this.lastHitTimestamp > cooldown
    ) {
      this.handleHit({ x: mouseX, y: mouseY });
    }

    this.mouse.x = mouseX;
    this.mouse.y = mouseY;
    this.mouse.dx = dx;
    this.mouse.dy = dy;

    this.weapon.setPosition(mouseX, mouseY, dx);
  }

  public handleMouseEnter() {
    this.weapon.setVisible(true);
  }

  public handleMouseLeft() {
    this.weapon.setVisible(false);
  }

  public spawnBoxes(
    position: { x: number; y: number },
    count: number,
    params: Partial<ParticleData> = {}
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 15;

      this.particles.addParticle({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 10,
        size: 32,
        opacity: 1,
        opacityDecay: 0.005,
        rotation: 0,
        hue: 0,
        asset: "ui.box",
        timeLeft: Infinity,
        gravity: 0.4,
        ...params,
      });
    }
  }

  public handleHit(position: { x: number; y: number }) {
    if (this.sanityState.isPanic) {
      return;
    }

    this.lastHitTimestamp = Date.now();
    const stats = this.store.stats!;

    let count = randomRangeInt(stats.minBoxes, stats.maxBoxes);

    const isCritical = Math.random() < stats.criticalChance;
    const multiplier = isCritical ? stats.criticalMultiplier : 1;

    this.store.addBoxes(count, multiplier);

    let boxesPerSecond = Math.floor(
      ((1000 / stats.realCooldown) * (stats.minBoxes + stats.maxBoxes)) / 2
    );

    let boxAsset: ImageAssetId = "ui.box";
    if (boxesPerSecond > 128) {
      boxAsset = "ui.box-white";
      count = Math.ceil(count / 4);
    } else if (boxesPerSecond > 64) {
      boxAsset = "ui.box-red";
      count = Math.ceil(count / 3);
    } else if (boxesPerSecond > 32) {
      boxAsset = "ui.box-blue";
      count = Math.ceil(count / 2);
    }

    boxesPerSecond = Math.max(100, boxesPerSecond);

    this.spawnBoxes(position, count, {
      size: (isCritical ? 48 : 32) + Math.log2(stats.boxPrice + 1) * 4,
      asset: boxAsset,
    });

    this.particles.addParticle({
      x: position.x,
      y: position.y,
      vx: 0,
      vy: 0,
      size: isCritical ? 64 : 24,
      opacity: 1,
      opacityDecay: 0.005,
      rotation: 0,
      hue: 0,
      asset: isCritical ? "ui.hit-critical" : "ui.hit-basic",
      timeLeft: 1000,
      gravity: 0,
    });

    this.glupo.addVelocity(Math.random() * 0.2 - 0.1);
    this.store.processHit({ isCritical, position });
  }

  public changeSanity(amount: number) {
    if (this.sanityState.isPanic) {
      return;
    }

    this.sanityState.current += amount;

    const { maxSanity, panicRestoreDelay, regenerationDelay } =
      this.store.stats!;

    if (this.sanityState.current <= 0) {
      this.sanityState.current = 0;
      this.sanityState.isPanic = true;

      if (this.sanityState.restoreTimer !== null) {
        clearTimeout(this.sanityState.restoreTimer);
      }

      this.store.processPanic();

      const processPanicStep = () => {
        this.sanityState.current += 1;

        const target = this.store.stats?.maxSanity ?? maxSanity;

        if (this.sanityState.current >= target) {
          this.sanityState.isPanic = false;
          this.sanityState.restoreTimer = null;
          this.sanityState.current = target;
          this.store.processPanicEnd();
        } else {
          setTimeout(processPanicStep, this.store.stats!.panicRestoreDelay);
        }
      };

      setTimeout(processPanicStep, panicRestoreDelay);
      return;
    }

    if (this.sanityState.current > maxSanity) {
      this.sanityState.current = maxSanity;
    }

    if (this.sanityState.current === maxSanity) {
      return;
    }

    if (this.sanityState.restoreTimer !== null) {
      clearTimeout(this.sanityState.restoreTimer);
    }

    this.sanityState.restoreTimer = setTimeout(() => {
      this.sanityState.current = maxSanity;
    }, regenerationDelay);
  }

  public drawFrame(canvas: HTMLCanvasElement, timestamp: number) {
    if (this.store.isLoading) {
      return;
    }

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    const deltaTime = timestamp - this.lastTimestamp;

    const ctx = canvas.getContext("2d");
    const assets = this.store.imageAssets!;

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawProps = { ctx, canvas, assets, deltaTime };

    this.glupo.draw(drawProps);
    this.particles.draw(drawProps);
    this.weapon.draw(drawProps);
    this.sanityGauge.draw(drawProps);

    this.lastTimestamp = timestamp;
  }
}
