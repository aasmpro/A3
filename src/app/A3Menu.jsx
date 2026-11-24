"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { Scoreboard } from "../components/ui/scoreboard";
import { Download, House, Maximize2, Minimize2, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { powerSidesRemaining, SHIP_HEIGHT } from "./a3Game.mjs";

export const POWER_LABELS = { triple: "Three Shots", blast: "Mega Shots", rapid: "Fast Shots" };
const POWER_GLYPHS = { triple: "3", blast: "*", rapid: "+" };
const PLANE_HALF_WIDTH = SHIP_HEIGHT / Math.sqrt(3);
const PLANE_POINTS = `0,${-SHIP_HEIGHT * 0.55} ${-PLANE_HALF_WIDTH},${SHIP_HEIGHT * 0.45} ${PLANE_HALF_WIDTH},${SHIP_HEIGHT * 0.45}`;
const POWER_VERTICES = ["18,2", "34,18", "18,34", "2,18", "18,2"];

export function PlaneIcon({ className }) {
  return (
    <svg className={`a3-game-plane block fill-current ${className}`} viewBox="-25 -25 50 50" aria-hidden="true">
      <polygon points={PLANE_POINTS} />
    </svg>
  );
}

export function PowerIcon({ type, seconds, decorative = false }) {
  const activeSides = powerSidesRemaining(seconds);
  return (
    <span
      className="a3-game-power-icon block size-8 [&_svg]:size-full [&_polygon]:fill-none [&_polyline]:fill-none [&_polygon]:stroke-current [&_polyline]:stroke-current [&_polygon]:stroke-[1.7] [&_polyline]:stroke-[1.7]"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `${POWER_LABELS[type]}, ${seconds} seconds remaining`}
      aria-hidden={decorative || undefined}
    >
      <svg className="block" viewBox="0 0 36 36" aria-hidden="true">
        <polygon className="is-spent opacity-25 stroke-muted-foreground!" points={POWER_VERTICES.slice(0, -1).join(" ")} />
        {activeSides === 4 ? (
          <polygon className="is-active" points={POWER_VERTICES.slice(0, -1).join(" ")} />
        ) : activeSides > 0 ? (
          <polyline className="is-active" points={POWER_VERTICES.slice(4 - activeSides).join(" ")} />
        ) : null}
        <text className="fill-current font-mono text-sm" x="18" y="19" textAnchor="middle" dominantBaseline="middle">{POWER_GLYPHS[type]}</text>
      </svg>
    </span>
  );
}

export default function A3Menu({
  hud, soundOn, isFullscreen, isInstalled, showInstall, theme,
  playFromMenu, toggleSound, toggleFullscreen, toggleTheme, installGame, homeHref = "https://amiri.cc/",
}) {
  return (
    <DialogContent
      variant="game"
      className="a3-game-menu-dialog"
      showCloseButton={false}
      initialFocus={false}
      finalFocus={false}
    >
      <DialogHeader className="a3-game-menu-header items-center gap-2 text-center">
        <PlaneIcon className="a3-game-menu-plane size-14" />
        <DialogTitle className="sr-only">Game menu</DialogTitle>
        {hud.score > 0 || hud.bestScore > 0 ? (
          <Scoreboard className="a3-game-menu-scores" entries={[
            ...(hud.score > 0 ? [["Score", hud.score]] : []),
            ...(hud.bestScore > 0 ? [["Best", hud.bestScore]] : []),
          ]} />
        ) : null}
        <DialogDescription variant="game">
          One chance! 10 pts/hit.
          <span className="a3-game-menu-movement [@media(pointer:coarse)]:hidden">
            <br />Move with Mouse/Keyboard, Esc for pause.
          </span>
        </DialogDescription>
      </DialogHeader>
      <ul className="a3-game-menu-powers my-2 grid grid-cols-3 gap-3 [&_li]:flex [&_li]:flex-col [&_li]:items-center [&_li]:gap-power-stack [&_li]:text-center [&_strong]:font-medium [&_p]:text-xs [&_p]:leading-power [&_p]:text-muted-foreground [&_.a3-game-power-icon]:size-11">
        <li><PowerIcon type="triple" seconds={5} decorative /><strong>Three Shots</strong><p>shoots 3 shots</p></li>
        <li><PowerIcon type="blast" seconds={5} decorative /><strong>Mega Shots</strong><p>20 pts/hit</p></li>
        <li><PowerIcon type="rapid" seconds={5} decorative /><strong>Fast Shots</strong><p>2x shooter speed</p></li>
      </ul>
      <Button size="play" type="button" className="a3-game-menu-play" aria-label="Play" onClick={playFromMenu}>
        <PlaneIcon className="a3-game-play-plane size-6 rotate-90" />
      </Button>
      <div className={`a3-game-menu-actions grid gap-4 ${isInstalled ? "is-installed grid-cols-2" : "grid-cols-4"}`}>
        {!isInstalled && (
          <Button variant="outline" size="toolbar" className="a3-game-menu-action" role="link" nativeButton={false} render={<Link href={homeHref} />} aria-label="Home" title="Home">
            <House aria-hidden="true" className="size-[1.125rem]" />
          </Button>
        )}
        <Button
          variant="outline"
          size="toolbar"
          type="button"
          className="a3-game-menu-action"
          aria-label="Game sounds"
          aria-pressed={soundOn}
          title={`Game sounds ${soundOn ? "on" : "off"}`}
          onClick={toggleSound}
        >
          {soundOn ? <Volume2 aria-hidden="true" className="size-[1.125rem]" /> : <VolumeX aria-hidden="true" className="size-[1.125rem]" />}
        </Button>
        <Button
          variant="outline"
          size="toolbar"
          type="button"
          className="a3-game-menu-action"
          aria-label="Toggle color theme"
          aria-pressed={theme === "light"}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun aria-hidden="true" className="size-[1.125rem]" /> : <Moon aria-hidden="true" className="size-[1.125rem]" />}
        </Button>
        {!isInstalled && (showInstall ? (
          <Button
            variant="outline"
            size="toolbar"
            type="button"
            className="a3-game-menu-action"
            aria-label="Install A3"
            title="Install A3"
            onClick={installGame}
          >
            <Download aria-hidden="true" className="size-[1.125rem]" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="toolbar"
            type="button"
            className="a3-game-menu-action"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" className="size-[1.125rem]" /> : <Maximize2 aria-hidden="true" className="size-[1.125rem]" />}
          </Button>
        ))}
      </div>
    </DialogContent>
  );
}
