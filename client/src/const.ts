export const APP_TITLE = "Mighty Sky";
export const APP_LOGO = "/logo.svg"; // or the correct path to your logo

export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  const redirectUri =
    import.meta.env.VITE_OAUTH_REDIRECT_URI ??
    `${window.location.origin}/api/oauth/callback`;

  const state = btoa(redirectUri);

  const base = oauthPortalUrl.replace(/\/$/, "");
  const url = new URL(`${base}/app-auth`);

  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
