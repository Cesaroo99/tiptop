export type Messages = {
  brand: { name: string; tagline: string };
  auth: {
    welcome: string;
    connect: string;
    rememberMe: string;
    login: string;
    orContinue: string;
    otpTitle: string;
    otpSent: string;
    verify: string;
    resendIn: string;
    resend: string;
    invalidPhone: string;
    invalidOtp: string;
    expiredOtp: string;
    lockedOtp: string;
    networkError: string;
    oauthSoon: string;
    oauthSoonBody: string;
  };
  nav: {
    home: string;
    mood: string;
    add: string;
    people: string;
    events: string;
  };
  home: {
    yourMood: string;
    emptyTitle: string;
    emptyBody: string;
    retry: string;
    locationFallback: string;
  };
  menu: {
    title: string;
    tickets: string;
    favorites: string;
    contacts: string;
    payments: string;
    settings: string;
    help: string;
    likes: string;
    perHour: string;
    perDay: string;
    perMonth: string;
    comingSoon: string;
  };
  settings: {
    title: string;
    darkMode: string;
    language: string;
    password: string;
    terms: string;
    logout: string;
    logoutConfirm: string;
    securityNote: string;
  };
  account: {
    title: string;
    firstName: string;
    lastName: string;
    profession: string;
    phone: string;
    username: string;
    save: string;
    saved: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    continue: string;
  };
  common: {
    close: string;
    back: string;
    loading: string;
    error: string;
    cancel: string;
    confirm: string;
    search: string;
    notifications: string;
    messages: string;
    apply: string;
    french: string;
    english: string;
    offline: string;
  };
  social: {
    publish: string;
    publication: string;
    saySomething: string;
    addImage: string;
    addLocation: string;
    comments: string;
    addComment: string;
    follow: string;
    following: string;
    unfollow: string;
    likePerson: string;
    unlike: string;
    transferTitle: string;
    transferBody: string;
    likeSelf: string;
    postsTab: string;
    emptyComments: string;
    emptySearch: string;
    people: string;
    publications: string;
    events: string;
    all: string;
    applySearch: string;
    markAllRead: string;
    notifNew: string;
    notifEarlier: string;
    notifLike: string;
    notifComment: string;
    notifFollow: string;
    emptyNotifs: string;
    chatLater: string;
    inviteLater: string;
    eventsLater: string;
    noImageHint: string;
    posted: string;
  };
};

export const fr: Messages = {
  brand: { name: "TipTop", tagline: "Sors. Rencontre. Vis." },
  auth: {
    welcome: "Bienvenue sur TipTop",
    connect: "Connectez-vous au compte",
    rememberMe: "Se souvenir de moi",
    login: "Se connecter",
    orContinue: "Ou se connecter avec",
    otpTitle: "OTP Code de vérification",
    otpSent: "Le code a été envoyé au {phone}",
    verify: "Vérifier",
    resendIn: "Renvoyez le code dans {seconds} s",
    resend: "Renvoyer le code",
    invalidPhone: "Numéro de téléphone invalide.",
    invalidOtp: "Code incorrect.",
    expiredOtp: "Ce code a expiré. Demande-en un nouveau.",
    lockedOtp: "Trop de tentatives. Demande un nouveau code.",
    networkError: "Réseau indisponible. Réessaie.",
    oauthSoon: "Bientôt disponible",
    oauthSoonBody: "La connexion sociale n’est pas encore active. Utilise ton numéro de téléphone.",
  },
  nav: {
    home: "Home",
    mood: "Mood",
    add: "Add post",
    people: "Amies",
    events: "Events",
  },
  home: {
    yourMood: "Votre mood !",
    emptyTitle: "Rien dans ta zone pour l’instant",
    emptyBody: "Quand des personnes publient ou créent une sortie près de toi, ça apparaîtra ici.",
    retry: "Réessayer",
    locationFallback: "Choisir une zone",
  },
  menu: {
    title: "Menu",
    tickets: "Les Tickets",
    favorites: "Mes Favoris",
    contacts: "Mes Contacts",
    payments: "Information de paiement",
    settings: "Paramètres",
    help: "Aide",
    likes: "Mes likes",
    perHour: "/heure",
    perDay: "/Jour",
    perMonth: "/Mois",
    comingSoon: "Cette section arrive dans une prochaine phase — le bouton n’invente pas de données.",
  },
  settings: {
    title: "Paramètres",
    darkMode: "Mode sombre",
    language: "Langue",
    password: "Changer le mot de passe",
    terms: "Conditions et règlements",
    logout: "Déconnexion",
    logoutConfirm: "Se déconnecter de TipTop ?",
    securityNote: "TipTop utilise un code OTP, pas de mot de passe. Tu peux gérer tes sessions ici plus tard.",
  },
  account: {
    title: "Mon compte",
    firstName: "Prénom",
    lastName: "Nom",
    profession: "Profession",
    phone: "Téléphone",
    username: "Identifiant",
    save: "Enregistrer les modifications",
    saved: "Modifications enregistrées",
  },
  onboarding: {
    title: "Complète ton profil",
    subtitle: "Les autres doivent pouvoir te reconnaître dans la vraie vie.",
    continue: "Entrer dans TipTop",
  },
  common: {
    close: "Fermer",
    back: "Retour",
    loading: "Chargement…",
    error: "Une erreur est survenue",
    cancel: "Annuler",
    confirm: "Confirmer",
    search: "Recherche",
    notifications: "Notifications",
    messages: "Messages",
    apply: "OK",
    french: "Français",
    english: "English",
    offline: "Connexion perdue",
  },
  social: {
    publish: "Publier",
    publication: "Publication",
    saySomething: "Dites quelque chose...",
    addImage: "Ajouter une image",
    addLocation: "Ajouter une localisation",
    comments: "Commentaires",
    addComment: "Ajouter un commentaire",
    follow: "Suivre",
    following: "Abonné",
    unfollow: "Ne plus suivre",
    likePerson: "Like (personne)",
    unlike: "Retirer le like",
    transferTitle: "Transférer ton like ?",
    transferBody: "Ton like quittera {name} pour cette personne. Un like ne peut être que chez une personne à la fois.",
    likeSelf: "Tu ne peux pas te liker.",
    postsTab: "Publications",
    emptyComments: "Aucun commentaire. Sois le premier.",
    emptySearch: "Aucun résultat dans ta recherche.",
    people: "Personnes",
    publications: "Publications",
    events: "Événements",
    all: "Tout",
    applySearch: "Appliquer la recherche",
    markAllRead: "Tout marquer comme lu",
    notifNew: "Nouveau",
    notifEarlier: "Plus tôt",
    notifLike: "a aimé ton profil",
    notifComment: "a commenté ta publication",
    notifFollow: "t’a suivi",
    emptyNotifs: "Pas encore de notifications.",
    chatLater: "La messagerie arrive en phase communication. Ce bouton n’ouvre pas une fausse conversation.",
    inviteLater: "Les invitations vers un événement arrivent avec le cœur « monde réel ».",
    eventsLater: "Les événements ne sont pas encore indexés.",
    noImageHint: "Visuel local de démo (stockage objet plus tard).",
    posted: "Publication envoyée",
  },
};

export const en: Messages = {
  brand: { name: "TipTop", tagline: "Go out. Meet. Live." },
  auth: {
    welcome: "Welcome to TipTop",
    connect: "Sign in to your account",
    rememberMe: "Remember me",
    login: "Log in",
    orContinue: "Or continue with",
    otpTitle: "OTP verification code",
    otpSent: "The code was sent to {phone}",
    verify: "Verify",
    resendIn: "Resend the code in {seconds}s",
    resend: "Resend code",
    invalidPhone: "Invalid phone number.",
    invalidOtp: "Incorrect code.",
    expiredOtp: "This code expired. Request a new one.",
    lockedOtp: "Too many attempts. Request a new code.",
    networkError: "Network unavailable. Try again.",
    oauthSoon: "Coming soon",
    oauthSoonBody: "Social login is not available yet. Use your phone number.",
  },
  nav: {
    home: "Home",
    mood: "Mood",
    add: "Add post",
    people: "People",
    events: "Events",
  },
  home: {
    yourMood: "Your mood!",
    emptyTitle: "Nothing in your area yet",
    emptyBody: "When people post or create a meetup near you, it will show up here.",
    retry: "Retry",
    locationFallback: "Choose an area",
  },
  menu: {
    title: "Menu",
    tickets: "Tickets",
    favorites: "Favorites",
    contacts: "Contacts",
    payments: "Payment information",
    settings: "Settings",
    help: "Help",
    likes: "My likes",
    perHour: "/hour",
    perDay: "/Day",
    perMonth: "/Month",
    comingSoon: "This section ships in a later phase — the button does not invent data.",
  },
  settings: {
    title: "Settings",
    darkMode: "Dark mode",
    language: "Language",
    password: "Change password",
    terms: "Terms and policies",
    logout: "Log out",
    logoutConfirm: "Log out of TipTop?",
    securityNote: "TipTop uses OTP codes, not passwords. Session management will live here later.",
  },
  account: {
    title: "My account",
    firstName: "First name",
    lastName: "Last name",
    profession: "Profession",
    phone: "Phone",
    username: "Username",
    save: "Save changes",
    saved: "Changes saved",
  },
  onboarding: {
    title: "Complete your profile",
    subtitle: "People should be able to recognize you in real life.",
    continue: "Enter TipTop",
  },
  common: {
    close: "Close",
    back: "Back",
    loading: "Loading…",
    error: "Something went wrong",
    cancel: "Cancel",
    confirm: "Confirm",
    search: "Search",
    notifications: "Notifications",
    messages: "Messages",
    apply: "OK",
    french: "Français",
    english: "English",
    offline: "You are offline",
  },
  social: {
    publish: "Publish",
    publication: "Post",
    saySomething: "Say something...",
    addImage: "Add an image",
    addLocation: "Add a location",
    comments: "Comments",
    addComment: "Add a comment",
    follow: "Follow",
    following: "Following",
    unfollow: "Unfollow",
    likePerson: "Like (person)",
    unlike: "Remove like",
    transferTitle: "Move your like?",
    transferBody: "Your like will leave {name} for this person. A like can only sit with one person at a time.",
    likeSelf: "You cannot like yourself.",
    postsTab: "Posts",
    emptyComments: "No comments yet. Be the first.",
    emptySearch: "No results for this search.",
    people: "People",
    publications: "Posts",
    events: "Events",
    all: "All",
    applySearch: "Apply search",
    markAllRead: "Mark all as read",
    notifNew: "New",
    notifEarlier: "Earlier",
    notifLike: "liked your profile",
    notifComment: "commented on your post",
    notifFollow: "followed you",
    emptyNotifs: "No notifications yet.",
    chatLater: "Messaging ships in the communication phase. This is not a fake chat.",
    inviteLater: "Invites to an event ship with the real-world core.",
    eventsLater: "Events are not indexed yet.",
    noImageHint: "Local demo visual (object storage later).",
    posted: "Post published",
  },
};

export const dictionaries = { fr, en } as const;
export type Locale = keyof typeof dictionaries;

export function t(dict: Messages, path: string, vars?: Record<string, string | number>): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null || !(p in cur)) return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (typeof cur !== "string") return path;
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
