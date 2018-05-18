import * as Phaser from "phaser";

export enum LevelBannerType {
    Success = 0,
    Failure = 1
}

export class LevelBanner extends Phaser.GameObjects.Container {
    public bannerType: LevelBannerType;
    public banner: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, type: LevelBannerType) {
        super(scene);

        this.bannerType = type;
        this.banner = scene.make.image({
            key: "banners",
            frame: type,
            alpha: 0,
            scale: 0
        });
        this.add(this.banner);
    }

    public begin() {
        this.scene.tweens.add({
            targets: this.banner,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 1000,
            ease: 'Elastic',
            easeParams: [1.1, 0.5]
        });
    }
}