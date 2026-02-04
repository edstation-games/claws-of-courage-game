let bgImage;
let tigerImage;
let tigerLeftImage;
let tigerRightImage;
let monsterImage;
let bossImage;
let punchSound;
let runningSound;

let tigerX;
let tigerY;
let tigerSpeed = 6;
let tigerScale = 0.3;
let facingRight = true;

// Jump mechanics
let groundY;
let jumpVelocity = 0;
let gravity = 0.9;
let jumpPower = 16;
let isJumping = false;

// Animation variables
let animationFrame = 0;
let animationSpeed = 0.4;
let isMoving = false;

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'shop', 'gameOver', 'tutorial'
let score = 0;
let health = 100;
let maxHealth = 100;
let coins = 0;
let wave = 1;
let enemiesKilled = 0;
let totalMonstersKilled = 0;
let enemiesInWave = 5;
let enemiesSpawned = 0;

// Health regeneration
let regenTimer = 0;
let regenInterval = 30; // 0.5 seconds at 60fps (faster regeneration)

// Combat system
let attackCooldown = 0;
let attackType = null; // 'light' or 'heavy'
let attackFrame = 0;
let comboCount = 0;
let comboTimer = 0;
let lastAttackTime = 0;

// Screen shake
let shakeX = 0;
let shakeY = 0;
let shakeIntensity = 0;

// Monsters
let monsters = [];
let monsterSpawnTimer = 0;

// Boss
let boss = null;
let bossActive = false;

// Particles
let particles = [];
let coinParticles = [];

// Camera
let cameraX = 0;
let cameraTargetX = 0;

// Upgrades
let upgrades = {
  damage: 1,
  speed: 1,
  health: 1,
  attackSpeed: 1,
  armor: 0
};

// Special weapons
let hasClawsOfCourage = false;
let rewardWave = 0;
let weaponLevel = 1; // Weapon level increases every 5 waves

// Power-ups
let powerUps = [];

// Visual effects
let hitStop = 0;
let slowMotion = 0;

// Tutorial
let tutorialScrollY = 0;
let tutorialMonsters = [];
let tutorialMonsterSpawnTimer = 0;

// Audio context (for browser audio restrictions)
let audioContextStarted = false;

function preload() {
  bgImage = loadImage('assets/bg.png');
  tigerLeftImage = loadImage('assets/left.png');
  tigerRightImage = loadImage('assets/right.png');
  monsterImage = loadImage('assets/monster.png');
  bossImage = loadImage('assets/boss.png');
  
  // Load sound with error handling
  try {
    punchSound = loadSound('assets/punch.mp3', 
      function() {
        console.log('Punch sound loaded successfully');
      },
      function(err) {
        console.error('Error loading punch sound:', err);
        punchSound = null;
      }
    );
  } catch(e) {
    console.error('Error initializing sound:', e);
    punchSound = null;
  }
  
  try {
    runningSound = loadSound('assets/running.mp3',
      function() {
        console.log('Running sound loaded successfully');
      },
      function(err) {
        console.error('Error loading running sound:', err);
        runningSound = null;
      }
    );
  } catch(e) {
    console.error('Error initializing running sound:', e);
    runningSound = null;
  }
  
  tigerImage = tigerRightImage;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  groundY = height * 0.85;
  tigerX = width / 2;
  tigerY = groundY;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  groundY = height * 0.85;
}

function startGame() {
  // Start audio context on game start (user interaction)
  if (!audioContextStarted && typeof getAudioContext !== 'undefined') {
    try {
      getAudioContext().resume();
      audioContextStarted = true;
    } catch(e) {
      // Audio context might already be started
    }
  }
  
  gameState = 'playing';
  score = 0;
  health = 100;
  maxHealth = 100;
  coins = 0;
  wave = 1;
  enemiesKilled = 0;
  totalMonstersKilled = 0;
  enemiesInWave = 5;
  enemiesSpawned = 0;
  monsters = [];
  particles = [];
  coinParticles = [];
  cameraX = 0;
  tigerX = width / 2;
  tigerY = groundY;
  jumpVelocity = 0;
  upgrades = {damage: 1, speed: 1, health: 1, attackSpeed: 1, armor: 0};
  powerUps = [];
  boss = null;
  bossActive = false;
  hasClawsOfCourage = false;
  rewardWave = 0;
  weaponLevel = 1;
  regenTimer = 0;
}

function startBossFight() {
  // Start game with boss immediately
  gameState = 'playing';
  score = 0;
  health = 100;
  maxHealth = 100;
  coins = 0;
  wave = 5; // Set to wave 5 (a boss wave)
  enemiesKilled = 0;
  totalMonstersKilled = 0;
  enemiesInWave = 1; // Boss wave only has the boss
  enemiesSpawned = 0;
  monsters = [];
  particles = [];
  coinParticles = [];
  cameraX = 0;
  tigerX = width / 2;
  tigerY = groundY;
  jumpVelocity = 0;
  upgrades = {damage: 1, speed: 1, health: 1, attackSpeed: 1, armor: 0};
  powerUps = [];
  boss = null;
  bossActive = false;
  hasClawsOfCourage = false;
  rewardWave = 0;
  weaponLevel = 1;
  regenTimer = 0;
  
  // Spawn boss immediately
  spawnBoss();
}

function spawnMonster() {
  let side = random() > 0.5 ? 'right' : 'left';
  let x = side === 'right' ? width + 100 + cameraX : -100 + cameraX;
  
  // Calculate tiger size (using collision size as reference: 35 radius = 70 diameter)
  // Tiger visual size is image.width * tigerScale (0.3), so we need to make monsters much bigger
  let tigerDiameter = 70; // tigerSize (35) * 2
  let monsterDiameter = tigerDiameter * 3.0; // Monsters are significantly bigger than the tiger (3x size)
  
  // Progressive difficulty scaling - waves get significantly harder
  let speedMultiplier = 2.5 + wave * 0.3; // Increased base speed from 1.5 to 2.5
  let healthMultiplier = 20 + wave * 8; // Increased from 5 to 8
  let sizeMultiplier = monsterDiameter; // Monsters are bigger than the tiger
  let damageMultiplier = 5 + floor(wave / 3); // Reduced damage - starts at 5, increases every 3 waves
  
  monsters.push({
    x: x,
    y: groundY, // Monsters are on the same level as the tiger
    speed: speedMultiplier,
    size: sizeMultiplier,
    health: healthMultiplier,
    maxHealth: healthMultiplier,
    damage: damageMultiplier,
    active: true,
    damageCooldown: 0,
    knockback: 0,
    color: color(200, 50, 50)
  });
  
  enemiesSpawned++;
}

function spawnBoss() {
  // Boss gets significantly stronger each wave - lots of health and high damage
  let bossWaveNumber = floor(wave / 5); // Which boss wave this is (1st, 2nd, 3rd, etc.)
  boss = {
    x: width / 2 + cameraX,
    y: groundY,
    speed: 2 + bossWaveNumber * 0.3,
    size: 350,
    health: 500 + bossWaveNumber * 200, // Much more health - starts at 500, increases by 200 per boss
    maxHealth: 500 + bossWaveNumber * 200,
    damage: 25 + bossWaveNumber * 10, // High damage - starts at 25, increases by 10 per boss
    active: true,
    damageCooldown: 0,
    knockback: 0,
    attackTimer: 0,
    attackCooldown: 180,
    direction: 1,
    color: color(150, 0, 0)
  };
  bossActive = true;
  addScreenShake(15);
}

function createParticles(x, y, color, count = 8, type = 'normal') {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-5, 5),
      vy: random(-8, -2),
      size: random(4, 12),
      color: color,
      life: 30 + random(20),
      type: type
    });
  }
}

function createCoinParticle(x, y) {
  coinParticles.push({
    x: x,
    y: y,
    vx: random(-2, 2),
    vy: random(-10, -5),
    size: 15,
    life: 60,
    collected: false
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
  
  for (let i = coinParticles.length - 1; i >= 0; i--) {
    let cp = coinParticles[i];
    if (!cp.collected) {
      cp.vy += 0.4;
      cp.x += cp.vx;
      cp.y += cp.vy;
      
      let distance = dist(tigerX + cameraX, tigerY, cp.x, cp.y);
      if (distance < 40) {
        cp.collected = true;
        coins += 1;
        createParticles(cp.x, cp.y, color(255, 215, 0), 5);
      }
      
      if (cp.y > groundY + 50) {
        coinParticles.splice(i, 1);
      }
    } else {
      cp.life--;
      if (cp.life <= 0) {
        coinParticles.splice(i, 1);
      }
    }
  }
}

function updateBoss() {
  if (!boss || !boss.active || boss.health <= 0) return;
  
  // Boss movement - moves back and forth, then charges at player
  boss.attackTimer++;
  
  if (boss.attackTimer < 120) {
    // Move back and forth
    boss.x += boss.speed * boss.direction;
    if (boss.x > cameraX + width - 100 || boss.x < cameraX + 100) {
      boss.direction *= -1;
    }
  } else if (boss.attackTimer < 180) {
    // Charge at player
    let dir = boss.x > tigerX + cameraX ? -1 : 1;
    boss.x += boss.speed * 2.5 * dir;
  } else {
    boss.attackTimer = 0;
  }
  
  // Update damage cooldown
  if (boss.damageCooldown > 0) {
    boss.damageCooldown--;
  }
  
  // Check collision with player
  let distance = dist(tigerX + cameraX, tigerY, boss.x, boss.y);
  let tigerSize = 35;
  let bossSize = boss.size / 2;
  
      if (distance < tigerSize + bossSize && boss.damageCooldown === 0) {
        let damage = boss.damage - upgrades.armor; // Armor reduces boss damage too
        damage = max(1, damage); // Minimum 1 damage
        health -= damage;
        boss.damageCooldown = 90;
    addScreenShake(10);
    createParticles(tigerX + cameraX, tigerY, color(255, 0, 0), 15);
    
    // Strong knockback
    let knockDir = boss.x > tigerX + cameraX ? -1 : 1;
    tigerX += knockDir * 30;
    
    if (health <= 0) {
      health = 0;
      gameState = 'gameOver';
    }
  }
  
      // Check attack hit
      if (attackType && attackFrame < 15) {
        let attackRange = attackType === 'light' ? 70 : 100;
        let baseDamage = hasClawsOfCourage ? 20 : 10; // Claws of Courage boost
        let heavyBaseDamage = hasClawsOfCourage ? 50 : 25;
        // Weapon level multiplies base damage (level 1 = 1x, level 2 = 1.5x, level 3 = 2x, etc.)
        let weaponMultiplier = 1 + (weaponLevel - 1) * 0.5;
        let attackDamage = attackType === 'light' ? baseDamage * upgrades.damage * weaponMultiplier : heavyBaseDamage * upgrades.damage * weaponMultiplier;
        
        let distance = dist(tigerX + cameraX, tigerY, boss.x, boss.y);
    if (distance < attackRange) {
      boss.health -= attackDamage;
      boss.knockback = attackType === 'heavy' ? 10 : 5;
      addScreenShake(attackType === 'heavy' ? 12 : 6);
      createParticles(boss.x, boss.y, color(255, 100, 0), 20, 'hit');
      
      if (boss.health <= 0) {
        // Boss killed
        enemiesKilled++;
        totalMonstersKilled++;
        score += 500 + comboCount * 20;
        coins += 20 + wave * 5;
        comboCount++;
        comboTimer = 180;
        lastAttackTime = frameCount;
        
        createParticles(boss.x, boss.y, color(255, 215, 0), 50, 'kill');
        for (let i = 0; i < 10; i++) {
          createCoinParticle(boss.x, boss.y);
        }
        addScreenShake(20);
        
        // Guaranteed power-up drop
        powerUps.push({
          x: boss.x,
          y: boss.y,
          type: random(['health', 'speed', 'damage']),
          life: 600
        });
        
        boss.active = false;
        boss = null;
        bossActive = false;
        
        // Immediately show reward screen after boss is killed
        enemiesKilled = enemiesInWave; // Mark wave as complete
        // Weapon upgrade every 5 waves (boss waves)
        weaponLevel++;
        rewardWave = wave;
        gameState = 'reward';
        // On multiples of 10, also give armor/damage upgrade
        if (wave % 10 === 0) {
          // This will be handled in drawReward
        }
        
        // Heal between waves
        health = maxHealth;
      }
    }
  }
}

function updateMonsters() {
  for (let i = monsters.length - 1; i >= 0; i--) {
    let m = monsters[i];
    
    if (m.active && m.health > 0) {
      // Apply knockback
      if (m.knockback > 0) {
        let knockDir = m.x > tigerX + cameraX ? 1 : -1;
        m.x += knockDir * m.knockback;
        m.knockback *= 0.8;
        if (abs(m.knockback) < 0.5) m.knockback = 0;
      }
      
      // Move towards player
      if (m.knockback === 0) {
        let dir = m.x > tigerX + cameraX ? -1 : 1;
        m.x += m.speed * dir;
      }
      
      // Update damage cooldown
      if (m.damageCooldown > 0) {
        m.damageCooldown--;
      }
      
      // Check collision with player
      let distance = dist(tigerX + cameraX, tigerY, m.x, m.y);
      let tigerSize = 35;
      let monsterSize = m.size / 2;
      
      if (distance < tigerSize + monsterSize && m.damageCooldown === 0) {
        let damage = (m.damage || 8) - upgrades.armor; // Armor reduces damage
        damage = max(1, damage); // Minimum 1 damage
        health -= damage;
        m.damageCooldown = 60;
        addScreenShake(5);
        createParticles(tigerX + cameraX, tigerY, color(255, 0, 0), 10);
        
        // Knockback player
        let knockDir = m.x > tigerX + cameraX ? -1 : 1;
        tigerX += knockDir * 15;
        
        if (health <= 0) {
          health = 0;
          gameState = 'gameOver';
        }
      }
      
      // Check attack hit
      if (attackType && attackFrame < 15) {
        let attackRange = attackType === 'light' ? 70 : 100;
        let baseDamage = hasClawsOfCourage ? 20 : 10; // Claws of Courage boost
        let heavyBaseDamage = hasClawsOfCourage ? 50 : 25;
        // Weapon level multiplies base damage (level 1 = 1x, level 2 = 1.5x, level 3 = 2x, etc.)
        let weaponMultiplier = 1 + (weaponLevel - 1) * 0.5;
        let attackDamage = attackType === 'light' ? baseDamage * upgrades.damage * weaponMultiplier : heavyBaseDamage * upgrades.damage * weaponMultiplier;
        
        let distance = dist(tigerX + cameraX, tigerY, m.x, m.y);
        if (distance < attackRange) {
          m.health -= attackDamage;
          m.knockback = attackType === 'heavy' ? 15 : 8;
          addScreenShake(attackType === 'heavy' ? 8 : 4);
          createParticles(m.x, m.y, color(255, 100, 0), 12, 'hit');
          
          if (m.health <= 0) {
            // Monster killed
            enemiesKilled++;
            totalMonstersKilled++;
            score += 50 + comboCount * 5;
            coins += 2 + floor(wave / 3);
            comboCount++;
            comboTimer = 180;
            lastAttackTime = frameCount;
            
            createParticles(m.x, m.y, color(255, 215, 0), 20, 'kill');
            createCoinParticle(m.x, m.y);
            addScreenShake(10);
            // Removed hitStop to keep game flowing smoothly
            
            // Chance to drop power-up
            if (random() < 0.15) {
              powerUps.push({
                x: m.x,
                y: m.y,
                type: random(['health', 'speed', 'damage']),
                life: 600
              });
            }
            
            monsters.splice(i, 1);
            continue;
          }
        }
      }
      
      // Only remove monsters that are very far behind the player and moving away
      // Don't remove monsters that are ahead or close - let them chase
      let distanceFromPlayer = abs(m.x - (tigerX + cameraX));
      // Only remove if monster is more than 2000 pixels away from player
      // This prevents despawn issues while still cleaning up extremely far monsters
      if (distanceFromPlayer > 2000) {
        monsters.splice(i, 1);
      }
    }
  }
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let pu = powerUps[i];
    pu.life--;
    
    let distance = dist(tigerX + cameraX, tigerY, pu.x, pu.y);
    if (distance < 40) {
      // Collect power-up
      if (pu.type === 'health') {
        health = min(maxHealth, health + 30);
        createParticles(pu.x, pu.y, color(0, 255, 0), 15);
      } else if (pu.type === 'speed') {
        slowMotion = 180;
        createParticles(pu.x, pu.y, color(100, 200, 255), 15);
      } else if (pu.type === 'damage') {
        upgrades.damage += 0.5;
        createParticles(pu.x, pu.y, color(255, 100, 0), 15);
      }
      powerUps.splice(i, 1);
    } else if (pu.life <= 0) {
      powerUps.splice(i, 1);
    }
  }
}

function performAttack(type) {
  if (attackCooldown <= 0) {
    attackType = type;
    attackFrame = 0;
    // Increased heavy attack cooldown from 40 to 70
    attackCooldown = type === 'light' ? 15 / upgrades.attackSpeed : 70 / upgrades.attackSpeed;
    
    // Play punch sound
    playPunchSound();
    
    // Reset combo if too much time passed
    if (frameCount - lastAttackTime > 120) {
      comboCount = 0;
    }
  }
}

function playPunchSound() {
  // Start audio context on first user interaction (browser requirement)
  if (!audioContextStarted && typeof getAudioContext !== 'undefined') {
    try {
      getAudioContext().resume();
      audioContextStarted = true;
    } catch(e) {
      // Audio context might already be started
    }
  }
  
  // Play sound if loaded
  if (punchSound) {
    try {
      if (punchSound.isLoaded && punchSound.isLoaded()) {
        punchSound.play();
      } else if (punchSound.play) {
        // Try to play anyway if isLoaded() doesn't exist
        punchSound.play();
      }
  } catch(e) {
    console.log('Sound play error:', e);
    }
  }
}

function updateRunningSound() {
  if (!runningSound) return;
  let onGround = abs(tigerY - groundY) < 5;
  let shouldPlay = (gameState === 'playing' || gameState === 'tutorial') && isMoving && !isJumping && onGround;
  
  try {
    if (shouldPlay) {
      if (!runningSound.isPlaying()) {
        runningSound.setLoop(true);
        runningSound.play();
      }
    } else {
      if (runningSound.isPlaying()) {
        runningSound.stop();
      }
    }
  } catch(e) {
    // Ignore sound errors
  }
}

function updateAttack() {
  if (attackType) {
    attackFrame++;
    if (attackFrame >= 20) {
      attackType = null;
      attackFrame = 0;
    }
  }
  
  if (attackCooldown > 0) {
    attackCooldown--;
  }
  
  if (comboTimer > 0) {
    comboTimer--;
  } else {
    comboCount = 0;
  }
  
  if (hitStop > 0) {
    hitStop--;
  }
  
  if (slowMotion > 0) {
    slowMotion--;
  }
}

function addScreenShake(intensity) {
  shakeIntensity = max(shakeIntensity, intensity);
}

function updateScreenShake() {
  if (shakeIntensity > 0) {
    shakeX = random(-shakeIntensity, shakeIntensity);
    shakeY = random(-shakeIntensity, shakeIntensity);
    shakeIntensity *= 0.9;
    if (shakeIntensity < 0.1) {
      shakeIntensity = 0;
      shakeX = 0;
      shakeY = 0;
    }
  }
}

function updateWave() {
  // Check if it's a boss wave (every 5 waves: 5, 10, 15, 20, etc.)
  let isBossWave = wave % 5 === 0 && wave > 0;
  
  if (isBossWave && !bossActive && boss === null && enemiesSpawned === 0) {
    // Spawn boss at start of boss wave
    spawnBoss();
    enemiesInWave = 1; // Boss wave only has the boss
    enemiesSpawned = 1; // Mark that boss is spawned
  }
  
  if (isBossWave && bossActive) {
    // Boss wave - check if boss is dead
    // If boss is killed, the reward screen is already shown in updateBoss()
    // So we just mark the wave as complete
    if (!boss || (boss && boss.health <= 0)) {
      enemiesKilled = enemiesInWave;
      bossActive = false;
      boss = null;
    }
  }
  
  if (enemiesKilled >= enemiesInWave && gameState === 'playing') {
    // Wave complete - only proceed if we're still in playing state
    // (If boss was killed, gameState is already set to 'reward')
    wave++;
    enemiesKilled = 0;
    enemiesSpawned = 0;
    
    // Check if next wave is a boss wave
    let nextWaveIsBoss = wave % 5 === 0 && wave > 0;
    if (nextWaveIsBoss) {
      // Boss wave - only boss spawns
      enemiesInWave = 1;
    } else {
      // More enemies per wave as game progresses
      enemiesInWave = 5 + wave * 3; // Increased from 2 to 3
    }
    
    // Check for special rewards
    // Waves go on forever - no cap at 100
    if (wave === 100 && !hasClawsOfCourage) {
      hasClawsOfCourage = true;
      rewardWave = wave;
      gameState = 'reward';
    } else if ((wave - 1) % 5 === 0 && (wave - 1) > 0) {
      // Just completed a boss wave (wave was just incremented, so check wave-1)
      // Reward screen should have already been shown in updateBoss()
      // But if we reach here, it means it wasn't (non-boss enemy killed), so don't do anything
      // Actually, this case shouldn't happen for boss waves since boss is the only enemy
      gameState = 'shop';
    } else {
      gameState = 'shop';
    }
    
    health = maxHealth; // Heal between waves
    bossActive = false;
    boss = null;
  }
  
  // Spawn monsters - faster spawning as waves progress (but not during boss wave)
  if (gameState === 'playing' && !isBossWave && enemiesSpawned < enemiesInWave) {
    monsterSpawnTimer++;
    // Spawn rate decreases more aggressively (monsters spawn faster)
    let spawnRate = max(40, 120 - wave * 7); // Increased from 5 to 7, min from 60 to 40
    if (monsterSpawnTimer >= spawnRate) {
      spawnMonster();
      monsterSpawnTimer = 0;
    }
  }
}

function keyPressed() {
  if (gameState === 'menu') {
    if (key === ' ' || keyCode === ENTER) {
      startGame();
    } else if (key === 't' || key === 'T') {
      // Initialize tutorial
      tutorialScrollY = 0;
      tutorialMonsters = [];
      tutorialMonsterSpawnTimer = 0;
      tigerX = width * 0.75; // Position tiger in minigame area
      tigerY = groundY;
      jumpVelocity = 0;
      isJumping = false;
      health = maxHealth;
      attackCooldown = 0;
      attackType = null;
      attackFrame = 0;
      gameState = 'tutorial';
    } else if (key === 'b' || key === 'B') {
      // Start boss fight directly
      startBossFight();
    }
  } else if (gameState === 'tutorial') {
    if (key === ' ' || keyCode === ENTER) {
      // Start game from tutorial
      tutorialScrollY = 0;
      startGame();
    } else if (key === 'ESCAPE' || keyCode === ESC) {
      // Return to menu
      tutorialScrollY = 0;
      gameState = 'menu';
    } else if (keyCode === UP_ARROW || key === 'w' || key === 'W') {
      tutorialScrollY = max(0, tutorialScrollY - 40);
    } else if (keyCode === DOWN_ARROW || key === 's' || key === 'S') {
      tutorialScrollY += 40; // Allow scrolling down
    }
  } else if (gameState === 'gameOver') {
    if (key === 'r' || key === 'R') {
      gameState = 'menu';
    }
  } else if (gameState === 'shop') {
    if (key === ' ' || keyCode === ENTER) {
      gameState = 'playing';
    }
  } else if (gameState === 'reward') {
    if (key === ' ' || keyCode === ENTER) {
      // Increment wave when continuing from reward screen (boss was just defeated)
      wave++;
      enemiesKilled = 0;
      enemiesSpawned = 0;
      
      // Check if next wave is a boss wave
      let nextWaveIsBoss = wave % 5 === 0 && wave > 0;
      if (nextWaveIsBoss) {
        // Boss wave - only boss spawns
        enemiesInWave = 1;
      } else {
        // More enemies per wave as game progresses
        enemiesInWave = 5 + wave * 3; // Increased from 2 to 3
      }
      
      gameState = 'playing';
    }
  } else if (gameState === 'playing') {
    if (key === 'z' || key === 'Z' || key === 'k' || key === 'K') {
      performAttack('light');
    }
    if (key === 'x' || key === 'X' || key === 'l' || key === 'L') {
      performAttack('heavy');
    }
  }
}

function draw() {
  // Apply screen shake
  push();
  translate(shakeX, shakeY);
  
  // Draw background
  if (bgImage && bgImage.width > 0) {
    let bgOffset = (cameraX * 0.2) % bgImage.width;
    for (let i = -1; i <= width / bgImage.width + 2; i++) {
      image(bgImage, i * bgImage.width - bgOffset, 0, bgImage.width, height);
    }
  } else {
    // Gradient background
    for (let i = 0; i < height; i++) {
      let inter = map(i, 0, height, 0, 1);
      let c = lerpColor(color(100, 150, 200), color(50, 80, 120), inter);
      stroke(c);
      line(0, i, width, i);
    }
  }
  
  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'tutorial') {
    drawTutorial();
  } else if (gameState === 'playing') {
    updateGameplay();
    drawGameplay();
  } else if (gameState === 'shop') {
    drawShop();
  } else if (gameState === 'reward') {
    drawReward();
  } else if (gameState === 'gameOver') {
    drawGameOver();
  }
  
  updateRunningSound();
  
  pop();
}

function updateGameplay() {
  // Update hit stop counter but don't pause the game
  if (hitStop > 0) {
    hitStop--;
  }
  
  let timeScale = slowMotion > 0 ? 0.3 : 1.0;
  
  isMoving = false;
  
  // Movement with boundaries - update facing direction based on movement
  let minCameraX = 0;
  let maxCameraX = 3000; // Maximum distance player can travel right
  
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    facingRight = false; // Face left when moving left
    isMoving = true;
    
    if (cameraX > minCameraX) {
      // Can scroll left
      if (tigerX <= width * 0.3) {
        let moveAmount = tigerSpeed * upgrades.speed * timeScale;
        cameraX = max(minCameraX, cameraX - moveAmount);
        tigerX = width * 0.3;
      } else {
        tigerX -= tigerSpeed * upgrades.speed * timeScale;
      }
    } else {
      // At left boundary - allow movement within screen
      tigerX -= tigerSpeed * upgrades.speed * timeScale;
      tigerX = max(50, tigerX); // Keep 50px margin from left edge
    }
  }
  
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    facingRight = true; // Face right when moving right
    isMoving = true;
    
    if (cameraX < maxCameraX) {
      // Can scroll right
      if (tigerX >= width * 0.7) {
        let moveAmount = tigerSpeed * upgrades.speed * timeScale;
        cameraX = min(maxCameraX, cameraX + moveAmount);
        tigerX = width * 0.7;
      } else {
        tigerX += tigerSpeed * upgrades.speed * timeScale;
      }
    } else {
      // At right boundary - allow movement within screen
      tigerX += tigerSpeed * upgrades.speed * timeScale;
      tigerX = min(width - 50, tigerX); // Keep 50px margin from right edge
    }
  }
  
  // Animation
  if (isMoving && !isJumping) {
    animationFrame += animationSpeed * timeScale;
    if (animationFrame >= TWO_PI) {
      animationFrame = 0;
    }
  } else {
    animationFrame = 0;
  }
  
  // Tiger sprite - always face the direction of movement
  if (facingRight) {
    tigerImage = tigerRightImage;
  } else {
    tigerImage = tigerLeftImage;
  }
  
  // Jump
  if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && !isJumping && abs(tigerY - groundY) < 2) {
    jumpVelocity = -jumpPower;
    isJumping = true;
  }
  
  // Physics
  tigerY += jumpVelocity * timeScale;
  jumpVelocity += gravity * timeScale;
  
  if (tigerY >= groundY) {
    tigerY = groundY;
    jumpVelocity = 0;
    isJumping = false;
  }
  
  // Keep tiger within screen bounds (with margin for boundaries)
  if (cameraX <= 0) {
    tigerX = constrain(tigerX, 50, width);
  } else if (cameraX >= 3000) {
    tigerX = constrain(tigerX, 0, width - 50);
  } else {
    tigerX = constrain(tigerX, 0, width);
  }
  
    // Update systems
    if (timeScale >= 1.0) {
      updateWave();
      if (bossActive && boss) {
        updateBoss();
      } else {
        updateMonsters();
      }
      updatePowerUps();
    } else {
      // Slow motion updates
      if (frameCount % 3 === 0) {
        if (bossActive && boss) {
          updateBoss();
        } else {
          updateMonsters();
        }
        updatePowerUps();
      }
    }
  
  updateAttack();
  updateParticles();
  updateScreenShake();
  
  // Health regeneration - 1 HP per second
  if (health < maxHealth && gameState === 'playing') {
    regenTimer++;
    if (regenTimer >= regenInterval) {
      health = min(maxHealth, health + 1);
      regenTimer = 0;
    }
  } else {
    regenTimer = 0;
  }
}

function drawGameplay() {
  // Draw ground
  fill(100, 80, 60);
  noStroke();
  rect(0, groundY, width, height - groundY);
  
  // Draw boundary walls
  let minCameraX = 0;
  let maxCameraX = 3000;
  
  // Left boundary wall
  if (cameraX <= minCameraX + 100) {
    push();
    let wallAlpha = map(cameraX, minCameraX, minCameraX + 100, 200, 0);
    fill(150, 150, 150, wallAlpha);
    stroke(100, 100, 100, wallAlpha);
    strokeWeight(3);
    rect(0, 0, 20, height);
    // Wall pattern
    for (let i = 0; i < height; i += 40) {
      fill(100, 100, 100, wallAlpha);
      rect(5, i, 10, 20);
    }
    pop();
  }
  
  // Right boundary wall
  if (cameraX >= maxCameraX - 100) {
    push();
    let wallAlpha = map(cameraX, maxCameraX - 100, maxCameraX, 0, 200);
    fill(150, 150, 150, wallAlpha);
    stroke(100, 100, 100, wallAlpha);
    strokeWeight(3);
    rect(width - 20, 0, 20, height);
    // Wall pattern
    for (let i = 0; i < height; i += 40) {
      fill(100, 100, 100, wallAlpha);
      rect(width - 15, i, 10, 20);
    }
    pop();
  }
  
  // Draw boss
  if (bossActive && boss && boss.active && boss.health > 0) {
    push();
    let screenX = boss.x - cameraX;
    
    if (screenX > -200 && screenX < width + 200) {
      imageMode(CENTER);
      if (bossImage && bossImage.width > 0) {
        let pulse = sin(frameCount * 0.1) * 5;
        let bossY = boss.y + pulse;
        
        // Boss glow effect
        fill(255, 0, 0, 50);
        noStroke();
        circle(screenX, bossY, boss.size + 20);
        
        if (boss.damageCooldown > 0) {
          tint(255, 100, 100);
        } else {
          noTint();
        }
        
        image(bossImage, screenX, bossY, boss.size, boss.size);
        noTint();
        
        // Boss health bar
        let barWidth = 150;
        let barHeight = 12;
        let healthPercent = boss.health / boss.maxHealth;
        fill(50, 0, 0);
        stroke(255, 0, 0);
        strokeWeight(3);
        rect(screenX - barWidth/2, bossY - boss.size/2 - 30, barWidth, barHeight);
        fill(lerpColor(color(255, 0, 0), color(0, 255, 0), healthPercent));
        noStroke();
        rect(screenX - barWidth/2 + 2, bossY - boss.size/2 - 28, (barWidth - 4) * healthPercent, barHeight - 4);
        
        // Boss label
        fill(255, 0, 0);
        textSize(24);
        textAlign(CENTER);
        textStyle(BOLD);
        text('BOSS', screenX, bossY - boss.size/2 - 50);
      }
      imageMode(CORNER);
    }
    pop();
  }
  
  // Draw monsters
  for (let m of monsters) {
    if (m.active && m.health > 0) {
      push();
      let screenX = m.x - cameraX;
      
      if (screenX > -100 && screenX < width + 100) {
        imageMode(CENTER);
        if (monsterImage && monsterImage.width > 0) {
          let bounceY = m.y + sin(frameCount * 0.15) * 3;
          
          if (m.damageCooldown > 0) {
            tint(255, 150, 150);
          } else {
            noTint();
          }
          
          image(monsterImage, screenX, bounceY, m.size, m.size);
          noTint();
          
          // Health bar
          let barWidth = 50;
          let barHeight = 6;
          let healthPercent = m.health / m.maxHealth;
          fill(50, 0, 0);
          rect(screenX - barWidth/2, bounceY - 35, barWidth, barHeight);
          fill(lerpColor(color(255, 0, 0), color(0, 255, 0), healthPercent));
          rect(screenX - barWidth/2, bounceY - 35, barWidth * healthPercent, barHeight);
        }
        imageMode(CORNER);
      }
      pop();
    }
  }
  
  // Draw power-ups
  for (let pu of powerUps) {
    push();
    let screenX = pu.x - cameraX;
    let pulse = sin(frameCount * 0.2) * 5;
    
    if (pu.type === 'health') {
      fill(0, 255, 0);
    } else if (pu.type === 'speed') {
      fill(100, 200, 255);
    } else {
      fill(255, 100, 0);
    }
    
    noStroke();
    circle(screenX, pu.y, 20 + pulse);
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text(pu.type === 'health' ? 'H' : pu.type === 'speed' ? 'S' : 'D', screenX, pu.y + 5);
    pop();
  }
  
  // Draw attack effect
  if (attackType) {
    push();
    let screenX = tigerX;
    let alpha = map(attackFrame, 0, 20, 150, 0);
    let size = attackType === 'light' ? 70 : 100;
    size *= map(attackFrame, 0, 20, 1, 0.5);
    
    if (attackType === 'light') {
      fill(255, 255, 100, alpha);
      stroke(255, 200, 0, alpha);
    } else {
      fill(255, 50, 50, alpha);
      stroke(255, 0, 0, alpha);
    }
    strokeWeight(4);
    circle(screenX, tigerY, size);
    pop();
  }
  
  // Draw particles
  for (let p of particles) {
    push();
    let screenX = p.x - cameraX;
    fill(red(p.color), green(p.color), blue(p.color), map(p.life, 0, 50, 0, 255));
    noStroke();
    circle(screenX, p.y, p.size);
    pop();
  }
  
  // Draw coin particles
  for (let cp of coinParticles) {
    push();
    let screenX = cp.x - cameraX;
    if (!cp.collected) {
      fill(255, 215, 0);
      stroke(255, 180, 0);
      strokeWeight(2);
      circle(screenX, cp.y, cp.size);
      fill(255, 255, 0);
      noStroke();
      circle(screenX, cp.y, cp.size * 0.6);
    }
    pop();
  }
  
  // Draw tiger - always face the direction of movement
  // Use left image as base and flip when facing right
  if (tigerLeftImage && tigerLeftImage.width > 0) {
    imageMode(CENTER);
    let tigerWidth = tigerLeftImage.width * tigerScale;
    let tigerHeight = tigerLeftImage.height * tigerScale;
    
    let animOffset = 0;
    if (isMoving && !isJumping) {
      animOffset = sin(animationFrame) * 4;
    }
    
    push();
    translate(tigerX, tigerY + animOffset);
    
    // Flip horizontally when facing right
    if (facingRight) {
      scale(-1, 1);
    }
    
    if (attackType && attackFrame < 5) {
      let rotAmount = attackType === 'heavy' ? -0.3 : -0.1;
      rotate(rotAmount);
    }
    
    // Always use left-facing image as base
    image(tigerLeftImage, 0, 0, tigerWidth, tigerHeight);
    pop();
  } else if (tigerLeftImage && tigerLeftImage.width > 0) {
    // Fallback: use left image as base and flip when facing right
    imageMode(CENTER);
    let tigerWidth = tigerLeftImage.width * tigerScale;
    let tigerHeight = tigerLeftImage.height * tigerScale;
    
    let animOffset = 0;
    if (isMoving && !isJumping) {
      animOffset = sin(animationFrame) * 4;
    }
    
    push();
    translate(tigerX, tigerY + animOffset);
    
    // Flip horizontally when facing right
    if (facingRight) {
      scale(-1, 1);
    }
    
    if (attackType && attackFrame < 5) {
      let rotAmount = attackType === 'heavy' ? -0.3 : -0.1;
      rotate(rotAmount);
    }
    
    image(tigerLeftImage, 0, 0, tigerWidth, tigerHeight);
    pop();
  } else {
    fill(255, 165, 0);
    circle(tigerX, tigerY, 40);
  }
  
  imageMode(CORNER);
  
  // Draw UI
  drawGameUI();
}

function drawGameUI() {
  push();
  // Top bar
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, 100);
  
  // Health bar
  let barX = 20;
  let barY = 20;
  let barWidth = 300;
  let barHeight = 30;
  let healthPercent = health / maxHealth;
  
  fill(50, 0, 0);
  stroke(255, 0, 0);
  strokeWeight(2);
  rect(barX, barY, barWidth, barHeight);
  
  fill(lerpColor(color(255, 0, 0), color(0, 255, 0), healthPercent));
  noStroke();
  rect(barX + 2, barY + 2, (barWidth - 4) * healthPercent, barHeight - 4);
  
  fill(255);
  textSize(18);
  textAlign(LEFT);
  text(`HP: ${floor(health)}/${maxHealth}`, barX, barY - 5);
  
  // Score and coins
  fill(255, 255, 0);
  textSize(24);
  text(`Score: ${score}`, barX, barY + 60);
  
  fill(255, 215, 0);
  textSize(20);
  text(`Coins: ${coins}`, barX + 200, barY + 60);
  
  // Wave
  fill(255);
  textSize(28);
  textAlign(RIGHT);
  textStyle(BOLD);
  if (bossActive && boss) {
    fill(255, 0, 0);
    text(`BOSS WAVE ${wave}`, width - 20, barY + 35);
  } else {
    text(`Wave ${wave}`, width - 20, barY + 35);
  }
  
  // Combo
  if (comboCount > 1) {
    fill(255, 200, 0);
    textSize(32);
    textAlign(CENTER);
    textStyle(BOLD);
    let comboAlpha = map(comboTimer, 0, 180, 0, 255);
    fill(255, 200, 0, comboAlpha);
    text(`${comboCount}x COMBO!`, width / 2, 150);
  }
  
  // Controls hint
  fill(200, 200, 200, 150);
  textSize(14);
  textAlign(RIGHT);
  textStyle(NORMAL);
  text('Z/K: Light Attack | X/L: Heavy Attack', width - 20, height - 20);
  
  // Attack cooldown indicators
  let lightReady = attackCooldown <= 0 && !attackType;
  let heavyReady = attackCooldown <= 0 && !attackType;
  
  fill(lightReady ? 100 : 50);
  rect(width - 200, height - 60, 80, 30);
  fill(255);
  textSize(14);
  textAlign(CENTER);
  text(`Z/K: ${lightReady ? 'READY' : ceil(attackCooldown/60) + 's'}`, width - 160, height - 40);
  
  fill(heavyReady ? 100 : 50);
  rect(width - 110, height - 60, 90, 30);
  fill(255);
  text(`X/L: ${heavyReady ? 'READY' : ceil(attackCooldown/60) + 's'}`, width - 65, height - 40);
  
  pop();
}

function drawReward() {
  push();
  fill(0, 0, 0, 200);
  noStroke();
  rect(0, 0, width, height);
  
  fill(255, 215, 0);
  textSize(48);
  textAlign(CENTER);
  textStyle(BOLD);
  text('REWARD!', width / 2, 150);
  
  if (rewardWave === 100 && hasClawsOfCourage) {
    fill(255, 200, 0);
    textSize(64);
    text('CLAWS OF COURAGE!', width / 2, 250);
    
    fill(255);
    textSize(24);
    textStyle(NORMAL);
    text('You have unlocked the legendary Claws of Courage!', width / 2, 320);
    text('Light Attack: 20 damage | Heavy Attack: 50 damage', width / 2, 360);
    text('Double damage output!', width / 2, 400);
  } else if (rewardWave % 5 === 0) {
    // Weapon upgrade every 5 waves
    if (rewardWave % 10 === 0 && rewardWave > 0) {
      // Multiples of 10: Show both weapon and armor/damage upgrade
      fill(255);
      textSize(36);
      text(`Wave ${rewardWave} Boss Defeated!`, width / 2, 200);
      
      // Weapon upgrade display
      let weaponMultiplier = 1 + (weaponLevel - 1) * 0.5;
      fill(255, 100, 100);
      textSize(28);
      text(`Weapon Level ${weaponLevel}!`, width / 2, 260);
      fill(255);
      textSize(18);
      text(`Weapon damage multiplier: ${weaponMultiplier.toFixed(1)}x`, width / 2, 290);
      
      // Also give armor or damage upgrade
      let rewardType = (rewardWave / 10) % 2 === 1 ? 'armor' : 'weapon';
      if (rewardType === 'armor') {
        upgrades.armor += 2;
        fill(100, 200, 255);
        textSize(28);
        text('+2 Armor!', width / 2, 330);
        fill(255);
        textSize(18);
        text('Reduces incoming damage', width / 2, 360);
      } else {
        upgrades.damage += 0.5;
        fill(255, 100, 100);
        textSize(28);
        text('+0.5x Damage!', width / 2, 330);
        fill(255);
        textSize(18);
        text('Increases attack power', width / 2, 360);
      }
    } else {
      // Just weapon upgrade (multiples of 5 but not 10) - Boss wave reward
      fill(255, 150, 0);
      textSize(36);
      text(`Wave ${rewardWave} Boss Defeated!`, width / 2, 250);
      
      let weaponMultiplier = 1 + (weaponLevel - 1) * 0.5;
      fill(255, 100, 100);
      textSize(32);
      text(`Weapon Level ${weaponLevel}!`, width / 2, 320);
      fill(255);
      textSize(20);
      text(`Weapon damage multiplier: ${weaponMultiplier.toFixed(1)}x`, width / 2, 360);
      text('Increased base attack damage!', width / 2, 390);
    }
  } else if (rewardWave % 10 === 0) {
    fill(255);
    textSize(36);
    text(`Wave ${rewardWave} Reward!`, width / 2, 250);
    
    // Alternate between armor and weapon upgrade every 10 waves
    // Waves 10, 30, 50, 70, 90 = armor
    // Waves 20, 40, 60, 80 = weapon
    let rewardType = (rewardWave / 10) % 2 === 1 ? 'armor' : 'weapon';
    
    if (rewardType === 'armor') {
      upgrades.armor += 2;
      fill(100, 200, 255);
      textSize(32);
      text('+2 Armor!', width / 2, 320);
      fill(255);
      textSize(20);
      text('Reduces incoming damage', width / 2, 360);
    } else {
      upgrades.damage += 0.5;
      fill(255, 100, 100);
      textSize(32);
      text('+0.5x Damage!', width / 2, 320);
      fill(255);
      textSize(20);
      text('Increases attack power', width / 2, 360);
    }
  }
  
  fill(100, 255, 100);
  stroke(200);
  strokeWeight(3);
  rect(width / 2 - 150, height - 150, 300, 60);
  fill(255);
  textSize(28);
  text('Continue (SPACE)', width / 2, height - 115);
  
  pop();
}

function drawShop() {
  push();
  fill(0, 0, 0, 200);
  noStroke();
  rect(0, 0, width, height);
  
  fill(255, 255, 0);
  textSize(48);
  textAlign(CENTER);
  textStyle(BOLD);
  text(`Wave ${wave} Complete!`, width / 2, 100);
  
  fill(255, 215, 0);
  textSize(32);
  text(`Coins: ${coins}`, width / 2, 150);
  
  fill(255);
  textSize(24);
  text('UPGRADES', width / 2, 220);
  
  let upgradesList = [
    {name: 'Damage', key: 'damage', cost: 50 + upgrades.damage * 25, value: upgrades.damage},
    {name: 'Speed', key: 'speed', cost: 40 + upgrades.speed * 20, value: upgrades.speed},
    {name: 'Max Health', key: 'health', cost: 60 + upgrades.health * 30, value: upgrades.health},
    {name: 'Attack Speed', key: 'attackSpeed', cost: 45 + upgrades.attackSpeed * 22, value: upgrades.attackSpeed}
  ];
  
  let startY = 280;
  for (let i = 0; i < upgradesList.length; i++) {
    let upg = upgradesList[i];
    let y = startY + i * 80;
    
    let canAfford = coins >= upg.cost;
    
    fill(canAfford ? 50 : 30);
    stroke(canAfford ? 200 : 100);
    strokeWeight(2);
    rect(width / 2 - 300, y - 30, 600, 60);
    
    fill(255);
    textSize(20);
    textAlign(LEFT);
    text(`${upg.name}: ${upg.value.toFixed(1)}x`, width / 2 - 280, y);
    
    fill(canAfford ? 255 : 150);
    textAlign(RIGHT);
    text(`$${upg.cost}`, width / 2 + 280, y);
    
    if (canAfford && mouseX > width / 2 - 300 && mouseX < width / 2 + 300 &&
        mouseY > y - 30 && mouseY < y + 30) {
      fill(100, 255, 100, 100);
      rect(width / 2 - 300, y - 30, 600, 60);
    }
  }
  
  fill(100, 255, 100);
  stroke(200);
  strokeWeight(3);
  rect(width / 2 - 150, height - 100, 300, 60);
  fill(255);
  textSize(28);
  textAlign(CENTER);
  text('Continue (SPACE)', width / 2, height - 65);
  
  pop();
}

function mousePressed() {
  if (gameState === 'menu') {
    // Check if Start button is clicked
    if (mouseX > width / 2 - 150 && mouseX < width / 2 + 150 &&
        mouseY > height / 2 + 50 && mouseY < height / 2 + 110) {
      startGame();
    }
    // Check if Tutorial button is clicked
    else if (mouseX > width / 2 - 150 && mouseX < width / 2 + 150 &&
             mouseY > height / 2 + 130 && mouseY < height / 2 + 180) {
      // Initialize tutorial
      tutorialScrollY = 0;
      tutorialMonsters = [];
      tutorialMonsterSpawnTimer = 0;
      tigerX = width * 0.75; // Position tiger in minigame area
      tigerY = groundY;
      jumpVelocity = 0;
      isJumping = false;
      health = maxHealth;
      attackCooldown = 0;
      attackType = null;
      attackFrame = 0;
      gameState = 'tutorial';
    }
    // Check if Boss Fight button is clicked
    else if (mouseX > width / 2 - 150 && mouseX < width / 2 + 150 &&
             mouseY > height / 2 + 200 && mouseY < height / 2 + 250) {
      startBossFight();
    }
  } else if (gameState === 'shop') {
    let upgradesList = [
      {key: 'damage', cost: 50 + upgrades.damage * 25},
      {key: 'speed', cost: 40 + upgrades.speed * 20},
      {key: 'health', cost: 60 + upgrades.health * 30},
      {key: 'attackSpeed', cost: 45 + upgrades.attackSpeed * 22}
    ];
    
    let startY = 280;
    for (let i = 0; i < upgradesList.length; i++) {
      let upg = upgradesList[i];
      let y = startY + i * 80;
      
      if (mouseX > width / 2 - 300 && mouseX < width / 2 + 300 &&
          mouseY > y - 30 && mouseY < y + 30 && coins >= upg.cost) {
        coins -= upg.cost;
        upgrades[upg.key] += 0.2;
        maxHealth = 100 * upgrades.health;
        health = maxHealth;
      }
    }
  }
}

function drawMenu() {
  push();
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);
  
  fill(255, 200, 0);
  textSize(72);
  textAlign(CENTER);
  textStyle(BOLD);
  text('CLAWS OF COURAGE', width / 2, height / 2 - 100);
  
  fill(255);
  textSize(24);
  textStyle(NORMAL);
  text('A fast-paced action combat game', width / 2, height / 2 - 30);
  
  fill(100, 255, 100);
  stroke(200);
  strokeWeight(3);
  rect(width / 2 - 150, height / 2 + 50, 300, 60);
  fill(255);
  textSize(28);
  text('Press SPACE to Start', width / 2, height / 2 + 85);
  
  fill(100, 200, 255);
  stroke(200);
  strokeWeight(2);
  rect(width / 2 - 150, height / 2 + 130, 300, 50);
  fill(255);
  textSize(22);
  text('Press T for Tutorial', width / 2, height / 2 + 160);
  
  // Boss Fight button
  fill(255, 100, 100);
  stroke(200);
  strokeWeight(2);
  rect(width / 2 - 150, height / 2 + 200, 300, 50);
  fill(255);
  textSize(22);
  text('Fight Boss (Click or Press B)', width / 2, height / 2 + 230);
  
  fill(200);
  textSize(16);
  text('Z/K: Light Attack | X/L: Heavy Attack | Arrows/WASD: Move | Up/W: Jump', width / 2, height / 2 + 280);
  
  pop();
}

function updateTutorial() {
  // Tutorial minigame - infinite health tiger
  let tutorialMinigameWidth = width * 0.45;
  let tutorialMinigameX = width * 0.55;
  
  // Initialize tiger position if needed
  if (tigerX < tutorialMinigameX - tutorialMinigameWidth/2 || tigerX > tutorialMinigameX + tutorialMinigameWidth/2) {
    tigerX = tutorialMinigameX;
  }
  
  isMoving = false;
  
  // Movement controls for tutorial minigame
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    facingRight = false;
    isMoving = true;
    tigerX = constrain(tigerX - tigerSpeed, tutorialMinigameX - tutorialMinigameWidth/2 + 50, tutorialMinigameX + tutorialMinigameWidth/2 - 50);
  }
  
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    facingRight = true;
    isMoving = true;
    tigerX = constrain(tigerX + tigerSpeed, tutorialMinigameX - tutorialMinigameWidth/2 + 50, tutorialMinigameX + tutorialMinigameWidth/2 - 50);
  }
  
  // Animation
  if (isMoving && !isJumping) {
    animationFrame += animationSpeed;
    if (animationFrame >= TWO_PI) {
      animationFrame = 0;
    }
  } else {
    animationFrame = 0;
  }
  
  // Tiger sprite direction
  if (facingRight) {
    tigerImage = tigerRightImage;
  } else {
    tigerImage = tigerLeftImage;
  }
  
  // Jump
  if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && !isJumping && abs(tigerY - groundY) < 2) {
    jumpVelocity = -jumpPower;
    isJumping = true;
  }
  
  // Physics
  tigerY += jumpVelocity;
  jumpVelocity += gravity;
  
  if (tigerY >= groundY) {
    tigerY = groundY;
    jumpVelocity = 0;
    isJumping = false;
  }
  
  // Update attack
  if (attackType) {
    attackFrame++;
    if (attackFrame >= 20) {
      attackType = null;
      attackFrame = 0;
    }
  }
  
  if (attackCooldown > 0) {
    attackCooldown--;
  }
  
  // Spawn tutorial monsters
  tutorialMonsterSpawnTimer++;
  if (tutorialMonsterSpawnTimer >= 180 && tutorialMonsters.length < 3) {
    let side = random() > 0.5 ? 'right' : 'left';
    let x = side === 'right' ? tutorialMinigameX + tutorialMinigameWidth/2 - 50 : tutorialMinigameX - tutorialMinigameWidth/2 + 50;
    
    let tigerDiameter = 70;
    let monsterDiameter = tigerDiameter * 3.0;
    
    tutorialMonsters.push({
      x: x,
      y: groundY,
      speed: 2,
      size: monsterDiameter,
      health: 50,
      maxHealth: 50,
      damage: 5,
      active: true,
      damageCooldown: 0,
      knockback: 0,
      color: color(200, 50, 50)
    });
    tutorialMonsterSpawnTimer = 0;
  }
  
  // Update tutorial monsters
  for (let i = tutorialMonsters.length - 1; i >= 0; i--) {
    let m = tutorialMonsters[i];
    
    if (m.active && m.health > 0) {
      // Apply knockback
      if (m.knockback > 0) {
        let knockDir = m.x > tigerX ? 1 : -1;
        m.x += knockDir * m.knockback;
        m.knockback *= 0.8;
        if (abs(m.knockback) < 0.5) m.knockback = 0;
      }
      
      // Move towards player
      if (m.knockback === 0) {
        let dir = m.x > tigerX ? -1 : 1;
        m.x += m.speed * dir;
      }
      
      // Update damage cooldown
      if (m.damageCooldown > 0) {
        m.damageCooldown--;
      }
      
      // Check collision with player (but don't damage - infinite health!)
      let distance = dist(tigerX, tigerY, m.x, m.y);
      let tigerSize = 35;
      let monsterSize = m.size / 2;
      
      if (distance < tigerSize + monsterSize && m.damageCooldown === 0) {
        // No damage in tutorial - just visual feedback
        m.damageCooldown = 60;
        createParticles(tigerX, tigerY, color(255, 255, 0), 10); // Yellow particles instead of red
        
        // Knockback player
        let knockDir = m.x > tigerX ? -1 : 1;
        tigerX += knockDir * 15;
        tigerX = constrain(tigerX, tutorialMinigameX - tutorialMinigameWidth/2 + 50, tutorialMinigameX + tutorialMinigameWidth/2 - 50);
      }
      
      // Check attack hit
      if (attackType && attackFrame < 15) {
        let attackRange = attackType === 'light' ? 70 : 100;
        let baseDamage = 10;
        let heavyBaseDamage = 25;
        let attackDamage = attackType === 'light' ? baseDamage : heavyBaseDamage;
        
        let distance = dist(tigerX, tigerY, m.x, m.y);
        if (distance < attackRange) {
          m.health -= attackDamage;
          m.knockback = attackType === 'heavy' ? 15 : 8;
          createParticles(m.x, m.y, color(255, 100, 0), 12, 'hit');
          
          if (m.health <= 0) {
            // Monster killed
            createParticles(m.x, m.y, color(255, 215, 0), 20, 'kill');
            tutorialMonsters.splice(i, 1);
            continue;
          }
        }
      }
      
      // Remove monsters that go too far
      if (m.x < tutorialMinigameX - tutorialMinigameWidth/2 - 100 || m.x > tutorialMinigameX + tutorialMinigameWidth/2 + 100) {
        tutorialMonsters.splice(i, 1);
      }
    }
  }
  
  // Update particles
  updateParticles();
  
  // Keep health at max (infinite health)
  health = maxHealth;
}

function drawTutorial() {
  // Background
  fill(0, 0, 0, 220);
  noStroke();
  rect(0, 0, width, height);
  
  // Title
  fill(255, 200, 0);
  textSize(56);
  textAlign(CENTER);
  textStyle(BOLD);
  text('HOW TO PLAY', width / 2, 50);
  
  // Main tutorial area - centered and wider
  let tutorialWidth = min(width - 80, 900);
  let tutorialX = width / 2;
  
  // Tutorial background box
  fill(30, 30, 40, 240);
  stroke(150, 150, 150);
  strokeWeight(2);
  rect(tutorialX - tutorialWidth/2, 90, tutorialWidth, height - 150);
  
  // Scrollable tutorial content
  push();
  clip(tutorialX - tutorialWidth/2 + 20, 110, tutorialWidth - 40, height - 170);
  translate(0, -tutorialScrollY);
  
  let startY = 120;
  let lineHeight = 28;
  let currentY = startY;
  let leftMargin = tutorialX - tutorialWidth/2 + 40;
  
  // Welcome message
  fill(255, 255, 100);
  textSize(24);
  textStyle(BOLD);
  textAlign(CENTER);
  text('Welcome to Claws of Courage!', tutorialX, currentY);
  currentY += 40;
  
  // Section 1: Objective
  fill(255, 150, 0);
  textSize(26);
  textStyle(BOLD);
  textAlign(LEFT);
  text('🎯 OBJECTIVE', leftMargin, currentY);
  currentY += 38;
  
  fill(255, 255, 255);
  textSize(18);
  textStyle(NORMAL);
  textAlign(LEFT);
  text('Your goal is to survive as many waves of monsters as possible!', leftMargin, currentY);
  currentY += lineHeight + 5;
  text('Each wave gets progressively harder with more enemies, more health, and higher damage.', leftMargin, currentY);
  currentY += lineHeight + 5;
  text('Survive long enough and face powerful bosses every 5 waves!', leftMargin, currentY);
  currentY += 50;
  
  // Section 2: Controls
  fill(255, 150, 0);
  textSize(26);
  textStyle(BOLD);
  text('⌨️ CONTROLS - LEARN THESE FIRST!', leftMargin, currentY);
  currentY += 38;
  
  fill(100, 255, 200);
  textSize(20);
  textStyle(BOLD);
  text('MOVEMENT:', leftMargin, currentY);
  currentY += lineHeight + 8;
  fill(255, 255, 255);
  textSize(18);
  textStyle(NORMAL);
  text('• LEFT/RIGHT Arrow Keys or A/D keys → Move left and right', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  text('• UP Arrow or W key → Jump over enemies and attacks', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  text('• You can move while jumping to dodge attacks!', leftMargin + 20, currentY);
  currentY += 35;
  
  fill(255, 150, 150);
  textSize(20);
  textStyle(BOLD);
  text('COMBAT:', leftMargin, currentY);
  currentY += lineHeight + 8;
  fill(255, 255, 255);
  textSize(18);
  textStyle(NORMAL);
  text('• Z or K → LIGHT ATTACK (fast, quick cooldown, lower damage)', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  text('• X or L → HEAVY ATTACK (slow, long cooldown, HIGH damage)', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  fill(255, 255, 100);
  text('• Chain attacks together quickly for COMBO bonuses!', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  fill(255, 255, 255);
  text('• Attack range is shown by the circular effect when you attack', leftMargin + 20, currentY);
  currentY += 50;
  
  // Section 3: Combat Tips
  fill(255, 150, 0);
  textSize(26);
  textStyle(BOLD);
  text('⚔️ COMBAT STRATEGY', leftMargin, currentY);
  currentY += 38;
  
  fill(255, 255, 255);
  textSize(18);
  textAlign(LEFT);
  fill(255, 100, 100);
  text('⚠️ WARNING: Monsters are 3x BIGGER than you!', leftMargin, currentY);
  currentY += lineHeight + 8;
  fill(255, 255, 255);
  text('• Monsters will charge at you from both sides - watch your flanks!', leftMargin, currentY);
  currentY += lineHeight + 5;
  text('• Use light attacks for quick hits, heavy attacks for finishing blows', leftMargin, currentY);
  currentY += lineHeight + 5;
  text('• Your health regenerates 1 HP per 0.5 seconds - use this to your advantage', leftMargin, currentY);
  currentY += lineHeight + 5;
  text('• Each monster has a health bar above them - keep attacking to reduce it!', leftMargin, currentY);
  currentY += lineHeight + 5;
  fill(255, 200, 100);
  text('• Tip: Attack from a distance, then move away before they hit you!', leftMargin, currentY);
  currentY += 50;
  
  // Section 4: Waves & Progression
  fill(255, 150, 0);
  textSize(26);
  textStyle(BOLD);
  text('🌊 WAVES & PROGRESSION', leftMargin, currentY);
  currentY += 38;
  
  fill(255, 255, 255);
  textSize(18);
  text('• Defeat ALL monsters in a wave to advance to the next wave', leftMargin, currentY);
  currentY += lineHeight + 5;
  fill(255, 100, 100);
  textSize(20);
  textStyle(BOLD);
  text('• Every 5 waves (wave 5, 10, 15, 20...) = BOSS FIGHT!', leftMargin, currentY);
  currentY += lineHeight + 8;
  fill(255, 100, 100);
  textSize(18);
  textStyle(NORMAL);
  text('  Bosses have MASSIVE health pools and deal HIGH damage!', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  fill(255, 255, 255);
  text('  Beat bosses to get powerful weapon upgrades!', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  fill(255, 255, 255);
  text('• After each wave completes, you\'ll visit the SHOP', leftMargin, currentY);
  currentY += lineHeight + 5;
  fill(255, 200, 100);
  text('• Every 5 waves, you automatically get a WEAPON LEVEL UP', leftMargin, currentY);
  currentY += lineHeight + 5;
  fill(255, 255, 255);
  text('  Weapon levels multiply your base damage (level 2 = 1.5x, level 3 = 2x, etc.)', leftMargin + 20, currentY);
  currentY += 50;
  
  // Section 5: Shop & Upgrades
  fill(255, 150, 0);
  textSize(26);
  textStyle(BOLD);
  text('💰 SHOP & UPGRADES', leftMargin, currentY);
  currentY += 38;
  
  fill(255, 255, 255);
  textSize(18);
  text('• Earn COINS by defeating monsters (each monster drops 2+ coins)', leftMargin, currentY);
  currentY += lineHeight + 5;
  text('• Between waves, spend your coins in the SHOP to power up:', leftMargin, currentY);
  currentY += lineHeight + 8;
  fill(255, 200, 150);
  text('  💪 Damage: Multiplies your attack power (most important!)', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  text('  🏃 Speed: Makes you move faster (great for dodging)', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  text('  ❤️ Max Health: Increases your total HP pool', leftMargin + 20, currentY);
  currentY += lineHeight + 5;
  text('  ⚡ Attack Speed: Reduces attack cooldowns', leftMargin + 20, currentY);
  currentY += lineHeight + 8;
  fill(255, 255, 255);
  text('• Click on upgrade buttons in the shop to purchase them', leftMargin, currentY);
  currentY += lineHeight + 5;
  fill(255, 200, 100);
  text('• Strategic tip: Focus on Damage first, then Speed, then Health!', leftMargin, currentY);
  currentY += 50;
  
  // Final section: Ready to play
  fill(100, 255, 100);
  textSize(26);
  textStyle(BOLD);
  textAlign(CENTER);
  text('✅ YOU\'RE READY TO PLAY!', tutorialX, currentY);
  currentY += 40;
  fill(255, 255, 255);
  textSize(18);
  textStyle(NORMAL);
  text('Remember: Movement → Attack → Dodge → Repeat!', tutorialX, currentY);
  currentY += lineHeight + 5;
  fill(255, 200, 100);
  text('Good luck, and may your claws strike true! 🐅', tutorialX, currentY);
  
  pop(); // End translate and clip
  
  // Scroll indicator
  fill(255, 255, 255, 180);
  noStroke();
  textSize(14);
  textAlign(CENTER);
  if (tutorialScrollY > 0) {
    triangle(tutorialX + tutorialWidth/2 - 40, 100, tutorialX + tutorialWidth/2 - 30, 110, tutorialX + tutorialWidth/2 - 20, 100);
    text('↑ Scroll up', tutorialX + tutorialWidth/2 - 30, 130);
  }
  if (tutorialScrollY < 600) { // Adjust based on content
    triangle(tutorialX + tutorialWidth/2 - 40, height - 100, tutorialX + tutorialWidth/2 - 30, height - 110, tutorialX + tutorialWidth/2 - 20, height - 100);
    text('↓ Scroll down', tutorialX + tutorialWidth/2 - 30, height - 80);
  }
  
  // Scroll instructions at bottom
  fill(200, 200, 255);
  textSize(16);
  textAlign(CENTER);
  text('Use ↑↓ Arrow Keys or W/S to scroll through this tutorial', tutorialX, height - 140);
  
  // Bottom button
  fill(100, 255, 100);
  stroke(200);
  strokeWeight(3);
  rect(width / 2 - 180, height - 60, 360, 45);
  fill(255);
  textSize(22);
  textAlign(CENTER);
  textStyle(BOLD);
  text('Press SPACE to Start Playing!', width / 2, height - 30);
}

function drawGameOver() {
  push();
  fill(0, 0, 0, 230);
  noStroke();
  rect(0, 0, width, height);
  
  fill(255, 0, 0);
  textAlign(CENTER);
  textSize(64);
  textStyle(BOLD);
  text('GAME OVER', width / 2, height / 2 - 100);
  
  fill(255, 255, 0);
  textSize(36);
  text(`Final Score: ${score}`, width / 2, height / 2 - 60);
  
  fill(255);
  textSize(28);
  text(`Waves Survived: ${max(0, wave - 1)}`, width / 2, height / 2 - 10);
  
  fill(200, 255, 200);
  textSize(28);
  text(`Monsters Killed: ${totalMonstersKilled}`, width / 2, height / 2 + 40);
  
  fill(200);
  textSize(20);
  text('Press R to Return to Menu', width / 2, height / 2 + 100);
  
  pop();
}
