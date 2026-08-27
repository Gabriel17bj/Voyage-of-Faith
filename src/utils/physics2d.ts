/**
 * 2D Physics Engine for PROMISE LAND : Voyage of Faith
 * Implements Rigidbody2D, BoxCollider2D, and Physics2D Layer Collision Matrix.
 */

export enum Physics2DLayer {
  Default = 'Default',
  Player = 'Player',
  Obstacle = 'Obstacle',
  WorldBoundary = 'WorldBoundary',
  Trigger = 'Trigger',
  Pet = 'Pet',
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CollisionInfo {
  collided: boolean;
  normal: Vector2; // Unit collision normal vector pointing away from collider
  penetration: number;
  collider: BoxCollider2D;
}

export interface RaycastHit {
  point: Vector2;
  normal: Vector2;
  distance: number;
  collider: BoxCollider2D;
}

/**
 * Layer Collision Matrix: Determines which layers interact with each other.
 */
export const Physics2DLayerMatrix: Record<Physics2DLayer, Physics2DLayer[]> = {
  [Physics2DLayer.Default]: [Physics2DLayer.Default, Physics2DLayer.Player, Physics2DLayer.Obstacle],
  [Physics2DLayer.Player]: [Physics2DLayer.Obstacle, Physics2DLayer.WorldBoundary, Physics2DLayer.Trigger],
  [Physics2DLayer.Obstacle]: [Physics2DLayer.Player, Physics2DLayer.Obstacle],
  [Physics2DLayer.WorldBoundary]: [Physics2DLayer.Player],
  [Physics2DLayer.Trigger]: [Physics2DLayer.Player],
  [Physics2DLayer.Pet]: [],
};

export function canLayersCollide(layerA: Physics2DLayer, layerB: Physics2DLayer): boolean {
  const allowed = Physics2DLayerMatrix[layerA];
  return allowed ? allowed.includes(layerB) : false;
}

/**
 * BoxCollider2D Component: Defines axis-aligned rectangular collision boundary.
 */
export class BoxCollider2D {
  public id: string;
  public offsetX: number;
  public offsetY: number;
  public width: number;
  public height: number;
  public isTrigger: boolean;
  public layer: Physics2DLayer;
  public tag?: string;
  public customData?: any;

  constructor(config: {
    id: string;
    offsetX?: number;
    offsetY?: number;
    width: number;
    height: number;
    isTrigger?: boolean;
    layer?: Physics2DLayer;
    tag?: string;
    customData?: any;
  }) {
    this.id = config.id;
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
    this.width = config.width;
    this.height = config.height;
    this.isTrigger = config.isTrigger ?? false;
    this.layer = config.layer ?? Physics2DLayer.Obstacle;
    this.tag = config.tag;
    this.customData = config.customData;
  }

  public getBounds(worldPos: Vector2): AABB {
    const centerX = worldPos.x + this.offsetX;
    const centerY = worldPos.y + this.offsetY;
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return {
      minX: centerX - halfW,
      maxX: centerX + halfW,
      minY: centerY - halfH,
      maxY: centerY + halfH,
    };
  }

  /**
   * Check intersection with another AABB and compute minimum penetration vector
   */
  public testCollision(myWorldPos: Vector2, other: BoxCollider2D, otherWorldPos: Vector2): CollisionInfo | null {
    if (!canLayersCollide(this.layer, other.layer)) {
      return null;
    }

    const b1 = this.getBounds(myWorldPos);
    const b2 = other.getBounds(otherWorldPos);

    // Overlap checks
    const overlapX1 = b1.maxX - b2.minX;
    const overlapX2 = b2.maxX - b1.minX;
    const overlapY1 = b1.maxY - b2.minY;
    const overlapY2 = b2.maxY - b1.minY;

    if (overlapX1 <= 0 || overlapX2 <= 0 || overlapY1 <= 0 || overlapY2 <= 0) {
      return null; // No overlap
    }

    // Determine the minimum overlap axis
    const minOverlapX = Math.min(overlapX1, overlapX2);
    const minOverlapY = Math.min(overlapY1, overlapY2);

    let normal: Vector2 = { x: 0, y: 0 };
    let penetration = 0;

    if (minOverlapX < minOverlapY) {
      penetration = minOverlapX;
      normal = overlapX1 < overlapX2 ? { x: -1, y: 0 } : { x: 1, y: 0 };
    } else {
      penetration = minOverlapY;
      normal = overlapY1 < overlapY2 ? { x: 0, y: -1 } : { x: 0, y: 1 };
    }

    return {
      collided: true,
      normal,
      penetration,
      collider: other,
    };
  }
}

/**
 * Rigidbody2D Component: Handles natural velocity, inertia, acceleration, and sliding collision physics.
 */
export class Rigidbody2D {
  public position: Vector2;
  public velocity: Vector2 = { x: 0, y: 0 };
  public mass: number = 1.0;
  public linearDrag: number = 0.82; // Friction factor per frame (0 = no friction, 1 = stop immediately)
  public maxSpeed: number = 5.0;
  public accelerationRate: number = 1.4; // Responsiveness
  public collider: BoxCollider2D;

  constructor(initialPos: Vector2, colliderConfig?: Partial<BoxCollider2D>) {
    this.position = { ...initialPos };
    this.collider = new BoxCollider2D({
      id: 'player_collider',
      offsetX: 0,
      offsetY: 8, // Collision box placed at feet
      width: 28,
      height: 20,
      layer: Physics2DLayer.Player,
      isTrigger: false,
      ...colliderConfig,
    });
  }

  /**
   * Applies an input force vector to velocity
   */
  public addInputMovement(inputVector: Vector2, isDashing: boolean) {
    const targetSpeed = isDashing ? 7.8 : 4.8;
    const inputLength = Math.sqrt(inputVector.x * inputVector.x + inputVector.y * inputVector.y);

    if (inputLength > 0.001) {
      const normX = inputVector.x / inputLength;
      const normY = inputVector.y / inputLength;
      const targetVx = normX * targetSpeed;
      const targetVy = normY * targetSpeed;

      // Smooth acceleration towards target velocity
      this.velocity.x += (targetVx - this.velocity.x) * this.accelerationRate * 0.45;
      this.velocity.y += (targetVy - this.velocity.y) * this.accelerationRate * 0.45;
    } else {
      // Natural inertia deceleration (damping)
      this.velocity.x *= this.linearDrag;
      this.velocity.y *= this.linearDrag;

      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.y) < 0.01) this.velocity.y = 0;
    }
  }

  /**
   * Integrated Physics Update: Resolves collisions with obstacles using sliding physics
   */
  public updatePhysics(
    staticColliders: { collider: BoxCollider2D; position: Vector2 }[],
    worldBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): {
    newPos: Vector2;
    activeTriggers: BoxCollider2D[];
    hasCollided: boolean;
  } {
    const activeTriggers: BoxCollider2D[] = [];
    let hasCollided = false;

    // 1. Move on X axis first and resolve X collisions (allows continuous sliding!)
    let nextX = this.position.x + this.velocity.x;
    let tempPos: Vector2 = { x: nextX, y: this.position.y };

    for (const item of staticColliders) {
      const col = this.collider.testCollision(tempPos, item.collider, item.position);
      if (col && col.collided) {
        if (item.collider.isTrigger) {
          activeTriggers.push(item.collider);
        } else {
          // Solid obstacle: push back along X
          hasCollided = true;
          nextX += col.normal.x * col.penetration;
          this.velocity.x = 0;
        }
      }
    }

    // World X boundary clamping
    const playerBoundsX = this.collider.getBounds({ x: nextX, y: this.position.y });
    if (playerBoundsX.minX < worldBounds.minX) {
      nextX += worldBounds.minX - playerBoundsX.minX;
      this.velocity.x = 0;
      hasCollided = true;
    } else if (playerBoundsX.maxX > worldBounds.maxX) {
      nextX -= playerBoundsX.maxX - worldBounds.maxX;
      this.velocity.x = 0;
      hasCollided = true;
    }

    // 2. Move on Y axis and resolve Y collisions
    let nextY = this.position.y + this.velocity.y;
    tempPos = { x: nextX, y: nextY };

    for (const item of staticColliders) {
      const col = this.collider.testCollision(tempPos, item.collider, item.position);
      if (col && col.collided) {
        if (item.collider.isTrigger) {
          if (!activeTriggers.includes(item.collider)) {
            activeTriggers.push(item.collider);
          }
        } else {
          // Solid obstacle: push back along Y
          hasCollided = true;
          nextY += col.normal.y * col.penetration;
          this.velocity.y = 0;
        }
      }
    }

    // World Y boundary clamping
    const playerBoundsY = this.collider.getBounds({ x: nextX, y: nextY });
    if (playerBoundsY.minY < worldBounds.minY) {
      nextY += worldBounds.minY - playerBoundsY.minY;
      this.velocity.y = 0;
      hasCollided = true;
    } else if (playerBoundsY.maxY > worldBounds.maxY) {
      nextY -= playerBoundsY.maxY - worldBounds.maxY;
      this.velocity.y = 0;
      hasCollided = true;
    }

    this.position.x = nextX;
    this.position.y = nextY;

    return {
      newPos: { ...this.position },
      activeTriggers,
      hasCollided,
    };
  }

  public teleport(pos: Vector2) {
    this.position = { ...pos };
    this.velocity = { x: 0, y: 0 };
  }
}

/**
 * Footstep and Ripple Particles Physics
 */
export interface PhysicsParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  type: 'dust' | 'ripple' | 'dash';
}
