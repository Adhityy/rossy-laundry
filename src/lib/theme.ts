// Runs before first paint: applies the stored theme to <html> so the page never
// flashes the wrong mode. Kept out of ThemeProvider (which is a client module) so
// the root layout can read it as a plain string on the server.
const STORAGE_KEY = "rossy-theme";

export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}document.documentElement.style.colorScheme=t;}catch(e){}})();`;
