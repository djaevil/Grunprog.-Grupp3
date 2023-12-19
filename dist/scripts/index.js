import { generateGameBoard, drawGameBoard } from './gameBoard.js'
import { drawEnemies, enemySpawnTimer, updateEnemies } from './enemies.js'
import { clickTile } from './selectTile.js'
import { updateTowers, removeTower, spawnTower, upgradeTower, getTowerAtTile } from './towers.js'
import { updateBullets } from './bullets.js'
import { drawHitEffects, drawMessages } from './effects.js'
import { addScore, getHighestScore } from './scores.js'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// skärmen vid spelstart
const startScreen = document.getElementById('startScreen')
const startWithCurrentButton = document.getElementById('startWithCurrent') // denna namngivning gör det möjligen otydligt vad koden gör – ändra till t ex startWithCurrentBoard?
const generateNewButton = document.getElementById('generateNew') // se ovan – generateNewBoard?

//skärmen vid spelslut
const endScreen = document.getElementById('endScreen')
const finalScoreElement = document.getElementById('finalScoreValue')
const playAgainButton = document.getElementById('playAgain')
const finalEnemiesKilledElement = document.getElementById('finalEnemiesKilledValue')
const difficultyElement = document.getElementById('difficultyValue')
const previousBestElement = document.getElementById('previousBestValue')

const towerSpawn = document.getElementById('towerSpawn')
const towerUpgrade = document.getElementById('towerUpgrade')
const towerRemove = document.getElementById('towerRemove')

const playerHealthElement = document.getElementById('healthValue')
const playerMoneyElement = document.getElementById('moneyValue')
const enemiesKilledElement = document.getElementById('enemyKillValue')
const towerCostElement = document.getElementById('towerCostValue')
const towerUpgradeElement = document.getElementById('towerUpgradeValue')
const estimatedDifficultyElement = document.getElementById('estimatedDifficultyValue')

const totalTiles = 150
const windowWidth = window.innerWidth
const windowHeight = window.innerHeight
const windowSize = windowWidth * windowHeight
const tileSize = Math.floor(Math.sqrt(windowSize / totalTiles))
const tilesInWidth = Math.max(Math.floor(windowWidth / tileSize), 5)
const tilesInHeight = Math.max(Math.floor(windowHeight / tileSize), 7)

canvas.width = tilesInWidth * tileSize
canvas.height = tilesInHeight * tileSize

let game

//när HTML-dokumentet och alla JS-filer laddats: option att starta spelet
window.addEventListener('DOMContentLoaded', () => {
  startWithCurrentButton.addEventListener('click', () => {
    startGame()
  })

  generateNewButton.addEventListener('click', () => {
    game = null
    gameSetup()
  })

  // om game är null
  if (!game) {
    gameSetup()
  }
})

const gameSetup = () => {
  game = initializeGame(tileSize, canvas.width, canvas.height, canvas)

  game.tileSprite.src = './sprites/tile.png'
  game.borderSprite.src = './sprites/border.png'

  game.startNorthSprite.src = './sprites/start-north.png'
  game.startEastSprite.src = './sprites/start-east.png'
  game.startSouthSprite.src = './sprites/start-south.png'
  game.startWestSprite.src = './sprites/start-west.png'

  game.exitNorthSprite.src = './sprites/exit-north.png'
  game.exitEastSprite.src = './sprites/exit-east.png'
  game.exitSouthSprite.src = './sprites/exit-south.png'
  game.exitWestSprite.src = './sprites/exit-west.png'

  game.northEastSprite.src = './sprites/north-east.png'
  game.northWestSprite.src = './sprites/north-west.png'
  game.northSouthSprite.src = './sprites/north-south.png'
  game.southEastSprite.src = './sprites/south-east.png'
  game.southWestSprite.src = './sprites/south-west.png'
  game.westEastSprite.src = './sprites/west-east.png'

  game.skull1Sprite.src = './sprites/skull-1.png'
  game.skull2Sprite.src = './sprites/skull-2.png'
  game.skull3Sprite.src = './sprites/skull-3.png'
  game.skull4Sprite.src = './sprites/skull-4.png'

  game.tower1Sprite.src = './sprites/tower1.png'
  game.tower1Fire1Sprite.src = './sprites/tower1-fire1.png'
  game.tower1Fire2Sprite.src = './sprites/tower1-fire2.png'

  game.tower2Sprite.src = './sprites/tower2.png'
  game.tower2Fire1Sprite.src = './sprites/tower2-fire1.png'
  game.tower2Fire2Sprite.src = './sprites/tower2-fire2.png'

  game.coin1Sprite.src = './sprites/coin-1.png'
  game.flask1Sprite.src = './sprites/flask-1.png'

  game.arrow1Sprite.src = './sprites/arrow-1.png'
  game.arrow2Sprite.src = './sprites/arrow-2.png'
  game.arrow3Sprite.src = './sprites/arrow-3.png'
  game.arrow4Sprite.src = './sprites/arrow-4.png'
}

const startGame = () => {
  game.started = true
  canvas.style.zIndex = '0'
  startScreen.style.display = 'none'

  requestAnimationFrame(() => {
    tick(ctx, game)
  })
}

const initializeGame = (tileSize, width, height, canvas) => {
  const gameBoard = generateGameBoard(tileSize, width, height)

  canvas.addEventListener('click', (event) => {
    game.clickedTile = clickTile(event, game, canvas)

    const tower = getTowerAtTile(game.clickedTile, game)

    //om tower inte redan står på klickad ruta: option att bekräfta placering av torn
    if (game.clickedTile && game.clickedTile.special === '') {
      towerSpawn.style.display = 'block'
      towerRemove.style.display = 'none'
      towerUpgrade.style.display = 'none'

      //om torn redan står på klickad ruta: options att ta bort alternativt uppgradera torn
    } else if (game.clickedTile && game.clickedTile.special === 'tower') {
      towerRemove.style.display = 'block'
      towerSpawn.style.display = 'none'
      if (tower.upgrade < 3) {
        towerUpgrade.style.display = 'block'
      }
      //vilka andra scenarion täcker nedanstående in?
    } else {
      towerSpawn.style.display = 'none'
    }
  })

  towerSpawn.addEventListener('click', () => {
    const clickedTile = clickTile(null, game, null)
    const tower = getTowerAtTile(clickedTile, game)

    // om torn inte är placerat på klickad tile och spelaren har tillräckligt med poäng för att placera ut torn
    if (!tower && game.playerMoney >= game.towerCost) {
      spawnTower(clickedTile, game)
      game.playerMoney -= game.towerCost
      game.towerCost *= 1.2
      game.towerCost = Math.floor(game.towerCost)
      towerSpawn.style.display = 'none'
    }
  })

  towerUpgrade.addEventListener('click', () => {
    const clickedTile = clickTile(null, game, null)
    const tower = getTowerAtTile(clickedTile, game)

    //om placerat torn inte är fullt uppgraderat och spelaren har tillräckligt med poäng för att uppgradera torn
    if (tower && tower.upgrade < 3 && game.playerMoney >= game.upgradeCost) {
      upgradeTower(tower, game)
      game.playerMoney -= game.upgradeCost
      game.upgradeCost *= 1.2
      game.upgradeCost = Math.floor(game.upgradeCost)
      towerRemove.style.display = 'none'
      towerUpgrade.style.display = 'none'
    }
  })

  towerRemove.addEventListener('click', () => {
    if (removeTower(clickTile(null, game, null), game)) {
      game.towerCost *= 0.8
      game.towerCost = Math.floor(game.towerCost)
      towerRemove.style.display = 'none'
      towerUpgrade.style.display = 'none'
    }
  })

  //pausar spelet när fönstret inte är i fokus
  window.addEventListener('blur', () => {
    game.isPaused = true
    document.body.classList.add('paused')
  })

  //starta spelet när fönstret är synligt för användaren
  window.addEventListener('focus', () => {
    game.isPaused = false
    document.body.classList.remove('paused')
  })

  //flyttade de två funktionerna ovan så funktionerna för window är samlade för sig och funktionerna för document för sig

  document.addEventListener('visibilitychange', () => {
    //när document återigen är synligt för användaren: starta spelet
    if (document.visibilityState === 'visible') {
      game.isPaused = false
      document.body.classList.remove('paused')
    } else {
      //när document är minimerat/i bakgrunden/på annat sätt inte synligt för användaren: pausa spelet
      game.isPaused = true
      document.body.classList.add('paused')
    }
  })

  requestAnimationFrame(() => {
    gameBoardTick(ctx, game)
  })

  let estimatedDifficulty, difficulty

  let pathLength = gameBoard.pathCoordinates.length

  // svårighetsgrad bestäms av banans längd
  if (pathLength <= 5) {
    estimatedDifficulty = 'Hyper Extreme'
    difficulty = 2.0
  } else if (pathLength <= 10) {
    estimatedDifficulty = 'Extreme'
    difficulty = 1.5
  } else if (pathLength <= 15) {
    estimatedDifficulty = 'Very Hard'
    difficulty = 1.25
  } else if (pathLength <= 25) {
    estimatedDifficulty = 'Medium'
    difficulty = 1.0
  } else if (pathLength <= 35) {
    estimatedDifficulty = 'Easy'
    difficulty = 0.75
  } else if (pathLength > 35) {
    estimatedDifficulty = 'Very Easy'
    difficulty = 0.5
  }

  estimatedDifficultyElement.textContent = estimatedDifficulty

  return {
    tileSize,
    width,
    height,
    allTiles: gameBoard.allTiles,
    startTile: gameBoard.startTile,
    exitTile: gameBoard.exitTile,

    path: gameBoard.pathCoordinates,
    allTileCoordinates: gameBoard.allTileCoordinates,

    enemies: [],
    enemySpawnTimer: 3,
    enemySpawnInterval: 3,
    enemyIntervalTimer: 5,
    enemiesKilled: 0,

    towers: [],
    towerCost: 10,
    upgradeCost: 10,
    bullets: [],
    hitEffects: [],
    messages: [],

    playerHealth: 15,
    playerMoney: 20,

    tileSprite: new Image(),
    borderSprite: new Image(),

    startNorthSprite: new Image(),
    startEastSprite: new Image(),
    startSouthSprite: new Image(),
    startWestSprite: new Image(),

    exitNorthSprite: new Image(),
    exitEastSprite: new Image(),
    exitSouthSprite: new Image(),
    exitWestSprite: new Image(),

    northEastSprite: new Image(),
    northWestSprite: new Image(),
    northSouthSprite: new Image(),
    southEastSprite: new Image(),
    southWestSprite: new Image(),
    westEastSprite: new Image(),

    skull1Sprite: new Image(),
    skull2Sprite: new Image(),
    skull3Sprite: new Image(),
    skull4Sprite: new Image(),

    tower1Sprite: new Image(),
    tower1Fire1Sprite: new Image(),
    tower1Fire2Sprite: new Image(),

    tower2Sprite: new Image(),
    tower2Fire1Sprite: new Image(),
    tower2Fire2Sprite: new Image(),

    coin1Sprite: new Image(),
    flask1Sprite: new Image(),

    arrow1Sprite: new Image(),
    arrow2Sprite: new Image(),
    arrow3Sprite: new Image(),
    arrow4Sprite: new Image(),

    isPaused: false,
    started: false,
    clickedTile: {},
    timer: 0,
    difficulty: difficulty,

    lastTick: Date.now(),
    deltaTime: 0
  }
}

const gameBoardTick = (ctx, game, counter = 0, limit = 500) => {
  if (counter > limit) {
    return
  }

  drawGameBoard(ctx, game)

  requestAnimationFrame(() => {
    gameBoardTick(ctx, game, counter + 1, limit)
  })
}

const tick = (ctx, game) => {
  if (game.playerHealth > 0) {
    let currentTick = Date.now()
    game.deltaTime = (currentTick - game.lastTick) / 1000
    game.lastTick = currentTick
    if (!game.isPaused) {
      game.timer += game.deltaTime
      ctx.clearRect(0, 0, game.width, game.height)

      drawGameBoard(ctx, game)
      drawEnemies(ctx, game)
      drawHitEffects(ctx, game)
      drawMessages(ctx, game)

      updateEnemies(game)
      updateTowers(game)
      updateBullets(game)
      enemySpawnTimer(game)

      playerHealthElement.textContent = game.playerHealth
      playerMoneyElement.textContent = game.playerMoney
      towerCostElement.textContent = game.towerCost
      towerUpgradeElement.textContent = game.upgradeCost
      enemiesKilledElement.textContent = game.enemiesKilled

      towerSpawn.disabled = game.playerMoney < game.towerCost
      towerUpgrade.disabled = game.playerMoney < game.upgradeCost
    }

    requestAnimationFrame(() => {
      tick(ctx, game)
    })
  } else {
    gameOver()
  }
}

const gameOver = () => {
  let score = Math.floor(game.enemiesKilled * game.difficulty)
  let previousBest = getHighestScore()

  endScreen.style.display = 'flex'
  canvas.style.zIndex = '1'

  finalEnemiesKilledElement.textContent = game.enemiesKilled
  difficultyElement.textContent = game.difficulty
  finalScoreElement.textContent = score

  previousBestElement.textContent = previousBest ? previousBest.playerScore : 'No previous score'

  addScore(game.difficulty, game.enemiesKilled, score)

  playAgainButton.addEventListener('click', () => {
    endScreen.style.display = 'none'
    startScreen.style.display = 'flex'
    gameSetup()
  })
}