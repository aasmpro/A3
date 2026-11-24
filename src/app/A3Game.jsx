"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { toast } from "../components/ui/toast";
import { Pause } from "lucide-react";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Scoreboard } from "../components/ui/scoreboard";
import A3Menu, { PowerIcon, POWER_LABELS } from "./A3Menu";
import { paint } from "./a3Render.mjs";
import { canvasPalette } from "../utils/canvasPalette";
import { useReducedMotion } from "../utils/useReducedMotion";
import { useTheme } from "../utils/useTheme";
import { createGameAudio, GAME_MUTED_KEY } from "./a3GameAudio.mjs";
import {
  createGame,
  gameHud,
  moveShip,
  readBestScore,
  resizeGame,
  saveBestScore,
  stepGame,
  POWER_DURATION,
} from "./a3Game.mjs";

const GAME_INSTRUCTIONS = "Game started. Move with the left and right arrow keys, A and D, mouse movement, or touch dragging. Shooting is automatic.";

export default function A3Game() {
  const { theme, setTheme } = useTheme();
  const [isInstalled, setIsInstalled] = useState(true);
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const audioRef = useRef(null);
  const installPromptRef = useRef(null);
  const inputRef = useRef({ left: false, right: false, dragX: null });
  const touchDragRef = useRef(null);
  const lastMouseXRef = useRef(null);
  const pressedKeysRef = useRef(new Set());
  const themeRef = useRef(theme);
  const paletteRef = useRef(null);
  const motionRef = useRef(reducedMotion);
  const paintRef = useRef(null);
  const startLoopRef = useRef(null);
  const pauseLoopRef = useRef(null);
  const menuOpenRef = useRef(false);
  const [hud, setHud] = useState(() => gameHud(createGame(390, 844)));
  const [announcement, setAnnouncement] = useState("A3 menu. Choose Play to start.");
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  useLayoutEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const fullscreenApp = window.matchMedia("(display-mode: fullscreen)");
    const needsInstallAction = () => {
      const isMobile = window.matchMedia("(pointer: coarse)").matches;
      const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
      const root = document.documentElement;
      const canFullscreen = !isIPhone && document.fullscreenEnabled !== false
        && Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
      return isMobile && !canFullscreen;
    };
    const update = () => {
      setIsInstalled(Boolean(navigator.standalone || standalone.matches || fullscreenApp.matches));
      setShowInstall(needsInstallAction());
    };
    const onInstallPrompt = (event) => {
      if (!needsInstallAction()) return;
      event.preventDefault();
      installPromptRef.current = event;
    };
    const onInstalled = () => {
      installPromptRef.current = null;
      toast.add({ title: "A3 is installed. Open it from your Home Screen.", type: "success" });
    };
    standalone.addEventListener("change", update);
    fullscreenApp.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    update();
    return () => {
      standalone.removeEventListener("change", update);
      fullscreenApp.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const changeMenuOpen = useCallback((open) => {
    if (!open && gameRef.current?.gameOver) return;
    menuOpenRef.current = open;
    setMenuOpen(open);
    if (open) pauseLoopRef.current?.();
    else {
      if (!gameRef.current?.gameOver) {
        setAnnouncement(gameRef.current?.time === 0 ? GAME_INSTRUCTIONS : "Game resumed.");
      }
      startLoopRef.current?.();
    }
  }, []);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  async function installGame() {
    const prompt = installPromptRef.current;
    if (prompt) {
      installPromptRef.current = null;
      try {
        await prompt.prompt();
        return;
      } catch {
        // Use the browser's manual installation flow below.
      }
    }
    const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent);
    toast.add({ title: "Install A3", type: "info", timeout: 0, description: isAppleMobile
      ? "Tap Share → Add to Home Screen, then open A3 from its icon."
      : "Use your browser menu to add A3 to your Home Screen." });
  }

  function beginAudio() {
    void audioRef.current?.unlock();
  }

  function toggleSound() {
    const enabled = !soundOn;
    setSoundOn(enabled);
    audioRef.current?.setMuted(!enabled);
    if (enabled) beginAudio();
    try {
      if (enabled) localStorage.removeItem(GAME_MUTED_KEY);
      else localStorage.setItem(GAME_MUTED_KEY, "true");
    } catch {
      // Keep the current sound choice for this run.
    }
    setAnnouncement(`Game sounds ${enabled ? "on" : "off"}.`);
  }

  async function toggleFullscreen() {
    const root = document.documentElement;
    try {
      if (document.fullscreenElement === root || document.webkitFullscreenElement === root) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await document.webkitExitFullscreen();
      } else if (root.requestFullscreen && document.fullscreenEnabled !== false) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else {
        toast.add({ title: "This browser does not support fullscreen for this page.", type: "warning" });
      }
    } catch {
      if (window.matchMedia("(pointer: coarse)").matches) setShowInstall(true);
      toast.add({ title: "This browser could not enter fullscreen.", type: "error" });
    }
  }

  useLayoutEffect(() => {
    themeRef.current = theme;
    paletteRef.current = canvasPalette(theme);
    motionRef.current = reducedMotion;
    paintRef.current?.();
  }, [theme, reducedMotion]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
    if (!ctx) return;
    const fullscreenRoot = document.documentElement;
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === fullscreenRoot || document.webkitFullscreenElement === fullscreenRoot);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    onFullscreenChange();
    let frameId = 0;
    let lastFrame = performance.now();
    let lastHud = 0;
    let pixelRatio = 0;
    let storage;
    try { storage = window.localStorage; } catch { storage = null; }
    let savedMuted = false;
    try { savedMuted = storage?.getItem(GAME_MUTED_KEY) === "true"; } catch { /* Sound remains on for this run. */ }
    audioRef.current = createGameAudio(savedMuted);
    void audioRef.current.unlock();
    setSoundOn(!savedMuted);
    const best = readBestScore(storage);
    const game = createGame(Math.max(1, section.clientWidth), Math.max(1, section.clientHeight), best);
    gameRef.current = game;
    setHud(gameHud(game));

    function resize() {
      const width = Math.max(1, section.clientWidth);
      const height = Math.max(1, section.clientHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      if (width !== gameRef.current.width || height !== gameRef.current.height) {
        resizeGame(gameRef.current, width, height);
      }
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio) || ratio !== pixelRatio) {
        pixelRatio = ratio;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      paint(ctx, gameRef.current, themeRef.current, motionRef.current, paletteRef.current);
    }

    function frame(now) {
      frameId = 0;
      const current = gameRef.current;
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      const events = stepGame(current, dt, inputRef.current);
      const audio = audioRef.current;
      if (events.shotsFired) audio?.play("shot");
      if (events.raysDestroyed) audio?.play(events.blastHit ? "mega" : "hit");
      if (events.powerCollected) audio?.play("pickup");
      if (events.gameOver) audio?.play("gameOver");
      if (events.bestChanged) saveBestScore(storage, current.bestScore);
      if (events.gameOver) {
        setAnnouncement(`Game over. Score ${current.score}. Best ${current.bestScore}.`);
        changeMenuOpen(true);
      }
      else if (events.powerCollected) setAnnouncement(`${POWER_LABELS[events.powerCollected]} active for ${POWER_DURATION} seconds.`);
      paint(ctx, current, themeRef.current, motionRef.current, paletteRef.current);
      if (now - lastHud >= 100 || events.bestChanged || events.powerCollected || events.gameOver) {
        setHud(gameHud(current));
        lastHud = now;
      }
      if (!current.gameOver && !document.hidden && !menuOpenRef.current) frameId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (frameId || document.hidden || menuOpenRef.current || gameRef.current.gameOver) return;
      lastFrame = performance.now();
      frameId = requestAnimationFrame(frame);
    }

    function pauseLoop() {
      cancelAnimationFrame(frameId);
      frameId = 0;
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.dragX = null;
      touchDragRef.current = null;
      lastMouseXRef.current = null;
      pressedKeysRef.current.clear();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        pauseLoop();
      } else {
        startLoop();
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat || gameRef.current?.gameOver) return;
        if (menuOpenRef.current) void audioRef.current?.unlock();
        changeMenuOpen(!menuOpenRef.current);
        return;
      }
      if (menuOpenRef.current) return;
      const key = event.code === "KeyA" ? "a" : event.code === "KeyD" ? "d" : event.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        void audioRef.current?.unlock();
        inputRef.current.dragX = null;
        touchDragRef.current = null;
        lastMouseXRef.current = null;
        const firstPress = !pressedKeysRef.current.has(key);
        pressedKeysRef.current.add(key);
        const latest = Array.from(pressedKeysRef.current).at(-1);
        inputRef.current.left = latest === "arrowleft" || latest === "a";
        inputRef.current.right = latest === "arrowright" || latest === "d";
        if (firstPress && gameRef.current && !gameRef.current.gameOver) {
          moveShip(gameRef.current, inputRef.current.right ? 10 : -10);
          paintRef.current?.();
        }
      }
    }

    function onKeyUp(event) {
      const key = event.code === "KeyA" ? "a" : event.code === "KeyD" ? "d" : event.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(key)) {
        event.preventDefault();
        pressedKeysRef.current.delete(key);
        const latest = Array.from(pressedKeysRef.current).at(-1);
        inputRef.current.left = latest === "arrowleft" || latest === "a";
        inputRef.current.right = latest === "arrowright" || latest === "d";
      }
    }

    paintRef.current = resize;
    startLoopRef.current = startLoop;
    pauseLoopRef.current = pauseLoop;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(section);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    changeMenuOpen(true);
    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      if (document.fullscreenElement === fullscreenRoot && document.exitFullscreen) {
        void document.exitFullscreen().catch(() => {});
      } else if (document.webkitFullscreenElement === fullscreenRoot) {
        document.webkitExitFullscreen?.();
      }
      paintRef.current = null;
      startLoopRef.current = null;
      pauseLoopRef.current = null;
      audioRef.current?.close();
      audioRef.current = null;
      gameRef.current = null;
    };
  }, [changeMenuOpen]);

  function startTouch(event) {
    const touch = event.changedTouches[0];
    const game = gameRef.current;
    if (!touch || !game || hud.gameOver || menuOpenRef.current || touchDragRef.current) return;
    touchDragRef.current = { id: touch.identifier, startX: touch.clientX, shipX: game.shipX };
    lastMouseXRef.current = null;
    void audioRef.current?.unlock();
  }

  function updateTouch(event) {
    const drag = touchDragRef.current;
    if (!drag || hud.gameOver || menuOpenRef.current) return;
    const touch = Array.from(event.touches).find((item) => item.identifier === drag.id);
    if (touch) dragShipTo(drag.shipX + touch.clientX - drag.startX);
  }

  function endTouch(event) {
    const drag = touchDragRef.current;
    if (!drag || Array.from(event.touches).some((touch) => touch.identifier === drag.id)) return;
    touchDragRef.current = null;
    inputRef.current.dragX = null;
    void audioRef.current?.unlock();
  }

  function dragShipTo(x) {
    inputRef.current.dragX = x;
    const game = gameRef.current;
    if (!game || game.gameOver || inputRef.current.left || inputRef.current.right) return;
    moveShip(game, x - game.shipX);
    paintRef.current?.();
  }

  function moveMouse(event) {
    if (event.pointerType !== "mouse" || touchDragRef.current || hud.gameOver || menuOpenRef.current) return;
    const previousX = lastMouseXRef.current;
    lastMouseXRef.current = event.clientX;
    if (previousX === null) return;
    const game = gameRef.current;
    if (!game || game.gameOver) return;
    moveShip(game, event.clientX - previousX);
    paintRef.current?.();
  }

  function replay() {
    const current = gameRef.current;
    if (!current) return;
    gameRef.current = createGame(current.width, current.height, current.bestScore);
    inputRef.current = { left: false, right: false, dragX: null };
    touchDragRef.current = null;
    lastMouseXRef.current = null;
    pressedKeysRef.current.clear();
    setHud(gameHud(gameRef.current));
    beginAudio();
    paintRef.current?.();
    changeMenuOpen(false);
    setAnnouncement("New game started.");
  }

  function playFromMenu() {
    if (gameRef.current?.gameOver) replay();
    else {
      beginAudio();
      changeMenuOpen(false);
    }
  }


  return (
    <section className={`a3-game fixed inset-0 z-1 overflow-hidden bg-background text-foreground outline-none select-none${!menuOpen && !hud.gameOver ? " is-running" : ""}`} ref={sectionRef} tabIndex={-1} aria-label="A3 game">
      <div className="a3-game-canvas absolute inset-0 size-full overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className="block size-full touch-none"
          aria-label="Game field. Move the airplane with the left and right arrow keys, A and D, mouse movement, or touch dragging. Shooting is automatic."
          onTouchStart={startTouch}
          onTouchMove={updateTouch}
          onTouchEnd={endTouch}
          onTouchCancel={endTouch}
          onPointerMove={moveMouse}
          onPointerLeave={() => { lastMouseXRef.current = null; }}
          onPointerUp={(event) => {
            if (event.pointerType === "touch") void audioRef.current?.unlock();
          }}
        />
        <div aria-hidden="true"  className="scanlines" />
      </div>
      <div className="a3-game-hud pointer-events-none absolute top-5 right-6 left-6 z-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4 text-xs leading-normal max-[600px]:top-3 max-[600px]:right-4 max-[600px]:left-4 max-[600px]:gap-1">
        <div className="a3-game-status col-start-1">
          <Scoreboard variant="hud" className="a3-game-score" entries={[["Score", hud.score], ["Best", hud.bestScore]]} />
        </div>
        <div className="a3-game-powers col-start-2 flex justify-center gap-power-gap" role="group" aria-label="Active powers">
          {Object.entries(hud.powers).filter(([, seconds]) => seconds > 0).map(([type, seconds]) => (
            <PowerIcon key={type} type={type} seconds={seconds} />
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">{announcement}</p>
      <div className="a3-game-controls absolute top-5 right-6 z-2 flex gap-2 max-[600px]:top-3 max-[600px]:right-4">
        <Button variant="outline" size="pause"
          type="button"
          className="a3-game-control"
          aria-label="Pause"
          aria-keyshortcuts="Escape"
          title="Pause (Esc)"
          disabled={menuOpen}
          onClick={(event) => {
            event.currentTarget.blur();
            changeMenuOpen(true);
          }}
        >
          <Pause aria-hidden="true" className="size-[0.9375rem]" />
        </Button>
        <Dialog open={menuOpen} onOpenChange={changeMenuOpen}>
          <A3Menu
            hud={hud}
            soundOn={soundOn}
            isFullscreen={isFullscreen}
            isInstalled={isInstalled}
            showInstall={showInstall}
            theme={theme}
            playFromMenu={playFromMenu}
            toggleSound={toggleSound}
            toggleFullscreen={toggleFullscreen}
            installGame={installGame}
            toggleTheme={toggleTheme}
          />
        </Dialog>
      </div>
    </section>
  );
}
