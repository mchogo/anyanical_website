import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const DISCORD_API_URL = 'https://discord.com/api/v10';
const SESSION_STORAGE_KEY = 'wmb.discord.session';
const OAUTH_STATE_STORAGE_KEY = 'wmb.discord.oauthState';
const SIGNOUT_EVENT = 'wmb:auth:signout';
const ROLE_REFRESH_INTERVAL = 30 * 60_000;
const BASE_OAUTH_SCOPES = ['identify'];
const MEMBER_OAUTH_SCOPES = ['guilds.members.read'];

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
};

export type DiscordGuildMember = {
  user?: DiscordUser;
  nick: string | null;
  avatar: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
};

export type DiscordAuthSession = {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  scope: string;
  user: DiscordUser;
  guildMember: DiscordGuildMember | null;
  guildMemberCheckedAt?: number;
};

type PendingOAuthState = {
  state: string;
  returnRoute: string;
  createdAt: number;
};

type LoginResult =
  | { status: 'idle' }
  | { status: 'success'; returnRoute: string }
  | { status: 'error'; message: string };

const getDiscordClientId = () => import.meta.env.VITE_DISCORD_CLIENT_ID ?? '';

const getDiscordGuildId = () => import.meta.env.VITE_DISCORD_GUILD_ID ?? '';

const getDiscordRedirectUri = () =>
  import.meta.env.VITE_DISCORD_REDIRECT_URI ??
  `${window.location.origin}${window.location.pathname}`;

const parseRoleIds = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((roleId) => roleId.trim())
    .filter(Boolean);

const getPremiumRoleIds = () =>
  parseRoleIds(import.meta.env.VITE_DISCORD_PREMIUM_ROLE_IDS);

const getAdminRoleIds = () => parseRoleIds(import.meta.env.VITE_DISCORD_ADMIN_ROLE_IDS);

const getOAuthScopes = () =>
  getDiscordGuildId()
    ? [...BASE_OAUTH_SCOPES, ...MEMBER_OAUTH_SCOPES]
    : BASE_OAUTH_SCOPES;

const encodeRandomState = () => {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const readJson = <T>(key: string): T | null => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const isSessionValid = (session: DiscordAuthSession | null) =>
  Boolean(session && session.expiresAt > Date.now() + 30_000);

const getStoredSession = () => {
  const session = readJson<DiscordAuthSession>(SESSION_STORAGE_KEY);
  return isSessionValid(session) ? session : null;
};

const getDisplayName = (user: DiscordUser) =>
  user.global_name?.trim() || user.username || `User ${user.id}`;

const getAvatarUrl = (user: DiscordUser) => {
  if (!user.avatar) {
    return null;
  }

  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
};

const memberHasAnyRole = (
  member: DiscordGuildMember | null,
  roleIds: readonly string[],
) => roleIds.some((roleId) => member?.roles.includes(roleId));

const getRoleAccess = (member: DiscordGuildMember | null) => {
  if (memberHasAnyRole(member, getAdminRoleIds())) {
    return 'admin';
  }

  if (memberHasAnyRole(member, getPremiumRoleIds())) {
    return 'premium';
  }

  if (member) {
    return 'member';
  }

  return 'guest';
};

const parseOAuthHash = (hash: string) => {
  const normalizedHash = hash.replace(/^#/, '');
  const oauthParamsStart = normalizedHash.search(/(?:^|[#&])(?:access_token|error)=/);

  if (oauthParamsStart === -1) {
    return null;
  }

  return new URLSearchParams(normalizedHash.slice(oauthParamsStart).replace(/^[#&]/, ''));
};

export const isDiscordOAuthRedirect = (route: string) =>
  /(?:^|[#&])(?:access_token|error)=/.test(route);

export const useDiscordAuth = () => {
  const [session, setSession] = useState<DiscordAuthSession | null>(() =>
    getStoredSession(),
  );
  const sessionRef = useRef(session);

  const isConfigured = Boolean(getDiscordClientId());

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!isSessionValid(session)) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
    }
  }, [session]);

  // Sync signout across multiple hook instances (e.g. nav + calendar)
  useEffect(() => {
    const handleSignout = () => setSession(null);
    window.addEventListener(SIGNOUT_EVENT, handleSignout);
    return () => window.removeEventListener(SIGNOUT_EVENT, handleSignout);
  }, []);

  const signIn = useCallback((returnRoute = window.location.hash || '#/home') => {
    const clientId = getDiscordClientId();

    if (!clientId) {
      throw new Error('VITE_DISCORD_CLIENT_ID is not configured.');
    }

    const pendingState: PendingOAuthState = {
      state: encodeRandomState(),
      returnRoute,
      createdAt: Date.now(),
    };

    writeJson(OAUTH_STATE_STORAGE_KEY, pendingState);

    const params = new URLSearchParams({
      response_type: 'token',
      client_id: clientId,
      redirect_uri: getDiscordRedirectUri(),
      scope: getOAuthScopes().join(' '),
      state: pendingState.state,
      prompt: 'consent',
    });

    window.location.assign(`${DISCORD_AUTHORIZE_URL}?${params.toString()}`);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
    setSession(null);
    window.dispatchEvent(new Event(SIGNOUT_EVENT));
  }, []);

  const refreshRoles = useCallback(async (): Promise<void> => {
    const sess = sessionRef.current;
    if (!sess?.accessToken) return;
    const guildId = getDiscordGuildId();
    if (!guildId) return;
    try {
      const res = await fetch(`${DISCORD_API_URL}/users/@me/guilds/${guildId}/member`, {
        headers: { Authorization: `${sess.tokenType} ${sess.accessToken}` },
      });
      if (!res.ok) return;
      const guildMember = (await res.json()) as DiscordGuildMember;
      const updated: DiscordAuthSession = {
        ...sess,
        guildMember,
        guildMemberCheckedAt: Date.now(),
      };
      writeJson(SESSION_STORAGE_KEY, updated);
      setSession(updated);
    } catch {
      // silently fail
    }
  }, []);

  const completeLoginFromRedirect = useCallback(async (): Promise<LoginResult> => {
    const params = parseOAuthHash(window.location.hash);

    if (!params) {
      return { status: 'idle' };
    }

    const error = params.get('error');
    if (error) {
      window.localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
      return {
        status: 'error',
        message: params.get('error_description') ?? `Discord認証に失敗しました: ${error}`,
      };
    }

    const pendingState = readJson<PendingOAuthState>(OAUTH_STATE_STORAGE_KEY);
    const returnedState = params.get('state');

    if (!pendingState && isSessionValid(getStoredSession())) {
      return {
        status: 'success',
        returnRoute: '#/home',
      };
    }

    if (
      !pendingState ||
      !returnedState ||
      pendingState.state !== returnedState ||
      Date.now() - pendingState.createdAt > 10 * 60_000
    ) {
      window.localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
      return {
        status: 'error',
        message: 'Discord認証の確認値が一致しません。もう一度ログインしてください。',
      };
    }

    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type') ?? 'Bearer';
    const expiresIn = Number(params.get('expires_in') ?? '0');
    const scope = params.get('scope') ?? getOAuthScopes().join(' ');

    if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      return {
        status: 'error',
        message: 'Discordからログイントークンを取得できませんでした。',
      };
    }

    const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Discordユーザー情報を取得できませんでした。',
      };
    }

    const user = (await response.json()) as DiscordUser;
    const guildId = getDiscordGuildId();
    let guildMember: DiscordGuildMember | null = null;

    if (guildId) {
      const memberResponse = await fetch(
        `${DISCORD_API_URL}/users/@me/guilds/${guildId}/member`,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        },
      );

      if (memberResponse.ok) {
        guildMember = (await memberResponse.json()) as DiscordGuildMember;
      }
    }

    const nextSession: DiscordAuthSession = {
      accessToken,
      tokenType,
      expiresAt: Date.now() + expiresIn * 1_000,
      scope,
      user,
      guildMember,
    };

    writeJson(SESSION_STORAGE_KEY, nextSession);
    window.localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
    setSession(nextSession);

    return {
      status: 'success',
      returnRoute: pendingState.returnRoute || '#/home',
    };
  }, []);

  // Auto-refresh roles on visibility restore or every 30 min
  useEffect(() => {
    const maybeRefresh = () => {
      const sess = sessionRef.current;
      if (!sess?.accessToken) return;
      const checkedAt = sess.guildMemberCheckedAt ?? 0;
      if (Date.now() - checkedAt > ROLE_REFRESH_INTERVAL) {
        void refreshRoles();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) maybeRefresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const timerId = setInterval(maybeRefresh, ROLE_REFRESH_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timerId);
    };
  }, [refreshRoles]);

  return useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isConfigured,
      signIn,
      signOut,
      refreshRoles,
      completeLoginFromRedirect,
      getDisplayName,
      getAvatarUrl,
      hasRole: (roleId: string) => Boolean(session?.guildMember?.roles.includes(roleId)),
      hasAnyRole: (roleIds: readonly string[]) =>
        memberHasAnyRole(session?.guildMember ?? null, roleIds),
      roleAccess: getRoleAccess(session?.guildMember ?? null),
      canAccessPremium: ['admin', 'premium'].includes(
        getRoleAccess(session?.guildMember ?? null),
      ),
      isGuildMember: Boolean(session?.guildMember),
    }),
    [completeLoginFromRedirect, isConfigured, refreshRoles, session, signIn, signOut],
  );
};
