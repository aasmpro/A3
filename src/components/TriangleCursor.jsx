"use client";

import { useEffect, useRef } from "react";

const clickable = 'a[href], button:not(:disabled), input:is([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"]):not(:disabled), select:not(:disabled), summary, label, [role="button"]:not([aria-disabled="true"]), [role="link"], [role="tab"]:not([aria-disabled="true"]), [role="menuitem"]:not([aria-disabled="true"])';

export function TriangleCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const root = document.documentElement;
    const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let mouseActive = false;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function update(x = lastX, y = lastY) {
      const target = document.elementFromPoint(x, y);
      const hidden = !finePointer.matches || !mouseActive || !target;
      root.toggleAttribute("data-triangle-cursor", !hidden);
      cursor.hidden = Boolean(hidden);
      if (hidden) return;

      cursor.dataset.state = target.closest(clickable) ? "filled" : "outline";
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    }

    function move(event) {
      if (event.pointerType !== "mouse") {
        mouseActive = false;
        update();
        return;
      }
      mouseActive = true;
      lastX = event.clientX;
      lastY = event.clientY;
      update();
    }

    function endDrag() {
      dragging = false;
      update();
    }

    function startDrag(event) {
      dragging = true;
      mouseActive = true;
      lastX = event.clientX;
      lastY = event.clientY;
      update();
    }

    function dragOver(event) {
      mouseActive = true;
      lastX = event.clientX;
      lastY = event.clientY;
      update();
    }

    function leave(event) {
      // A removed control or a portaled menu can also produce a null relatedTarget.
      if (!dragging && !event.relatedTarget && event.target === root) {
        mouseActive = false;
        endDrag();
      }
    }

    function reset() {
      mouseActive = false;
      dragging = false;
      update();
    }

    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerover", move, true);
    document.addEventListener("dragstart", startDrag, true);
    document.addEventListener("dragenter", dragOver, true);
    document.addEventListener("dragover", dragOver, true);
    document.addEventListener("dragend", endDrag, true);
    document.addEventListener("drop", endDrag, true);
    document.addEventListener("pointerout", leave, true);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    finePointer.addEventListener("change", reset);

    return () => {
      root.removeAttribute("data-triangle-cursor");
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerover", move, true);
      document.removeEventListener("dragstart", startDrag, true);
      document.removeEventListener("dragenter", dragOver, true);
      document.removeEventListener("dragover", dragOver, true);
      document.removeEventListener("dragend", endDrag, true);
      document.removeEventListener("drop", endDrag, true);
      document.removeEventListener("pointerout", leave, true);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      finePointer.removeEventListener("change", reset);
    };
  }, []);

  return (
    <span ref={cursorRef} className="triangle-cursor" data-state="outline" aria-hidden="true" hidden>
      <svg viewBox="0 0 256 256" focusable="false">
        <path className="triangle-cursor-outline" d="M128 32 238.851252 224H17.148748Z M128 67.555556 208.059237 206.222222H47.940763Z" fill="currentColor" fillRule="evenodd" />
        <path className="triangle-cursor-filled" d="M128 32 238.851252 224H17.148748Z" fill="currentColor" />
      </svg>
    </span>
  );
}
