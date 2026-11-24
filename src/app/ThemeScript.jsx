"use client";

import { useServerInsertedHTML } from "next/navigation";

const restoreTheme = `(()=>{let t='dark';try{if(localStorage.getItem('amiri-theme')==='light')t='light'}catch{}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t})()`;

export function ThemeScript() {
  // Insert only in the server response; client navigation must not render scripts.
  useServerInsertedHTML(() => (
    <script id="restore-theme" dangerouslySetInnerHTML={{ __html: restoreTheme }} />
  ));
  return null;
}
