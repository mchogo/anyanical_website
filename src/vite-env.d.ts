/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_CLIENT_ID?: string;
  readonly VITE_DISCORD_REDIRECT_URI?: string;
  readonly VITE_DISCORD_GUILD_ID?: string;
  readonly VITE_DISCORD_PREMIUM_ROLE_IDS?: string;
  readonly VITE_DISCORD_ADMIN_ROLE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
