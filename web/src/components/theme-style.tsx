import { getPlatformSettings } from "@/lib/platform";
import { isValidHexColor, shade } from "@/lib/color";

/**
 * Server component that injects a small inline <style> override for the platform's
 * brand colors (primary/accent/background), sourced from admin-configured
 * `platform_settings`. Falls back entirely to the static defaults in globals.css
 * when settings are missing or invalid — this only ever overrides `:root`
 * (light mode); `.dark` is left untouched.
 */
export async function ThemeStyle() {
  const settings = await getPlatformSettings();

  const primary = isValidHexColor(settings.primary_color) ? settings.primary_color : null;
  const accent = isValidHexColor(settings.accent_color) ? settings.accent_color : null;
  const background = isValidHexColor(settings.background_color) ? settings.background_color : null;

  if (!primary && !accent && !background) return null;

  const vars: string[] = [];
  if (primary) {
    vars.push(`--primary:${primary}`, `--primary-dark:${shade(primary, -12)}`, `--ring:${primary}`);
    // --primary-foreground intentionally left as-is: it's a fixed ink color chosen for
    // contrast against the default brand tan, not something safe to derive from an
    // arbitrary admin-picked color.
  }
  if (accent) {
    vars.push(`--accent:${accent}`, `--accent-dark:${shade(accent, -10)}`);
  }
  if (background) {
    vars.push(`--background:${background}`, `--card:${background}`, `--popover:${background}`);
  }

  return (
    <style
      id="platform-theme"
      // Safe: every value above passed isValidHexColor's strict #rrggbb check before interpolation.
      dangerouslySetInnerHTML={{ __html: `:root{${vars.join(";")}}` }}
    />
  );
}
