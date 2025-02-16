export const useReferrer = () => {
  const REFERRER_KEY = "signup_referrer";

  const setReferrer = (referrer: string) => {
    if (referrer) {
      localStorage.setItem(REFERRER_KEY, referrer);
    }
  };

  const getReferrer = () => {
    return localStorage.getItem(REFERRER_KEY);
  };

  const clearReferrer = () => {
    localStorage.removeItem(REFERRER_KEY);
  };

  return {
    setReferrer,
    getReferrer,
    clearReferrer,
  };
};
