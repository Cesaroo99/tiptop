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
    wallet: string;
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
    notifInvite: string;
    notifTicket: string;
    notifPayment: string;
    notifMessage: string;
  };
  world: {
    available: string;
    unavailable: string;
    availableUntil: string;
    goAvailable: string;
    goHidden: string;
    ttlHint: string;
    zoneTitle: string;
    zoneBody: string;
    precision: string;
    precisionExact: string;
    precisionZone: string;
    precisionCity: string;
    precisionHidden: string;
    approximate: string;
    peopleTitle: string;
    peopleEmpty: string;
    peopleEmptyBody: string;
    invite: string;
    message: string;
    age: string;
    distance: string;
    nextPerson: string;
    eventsAll: string;
    eventsMine: string;
    eventsEmpty: string;
    eventsEmptyBody: string;
    createEvent: string;
    eventTitle: string;
    eventDescription: string;
    eventWhen: string;
    eventVenue: string;
    eventPrice: string;
    eventPriceHint: string;
    eventCapacity: string;
    eventMinAge: string;
    eventReserve: string;
    interested: string;
    notInterested: string;
    heartEvent: string;
    heartTransferTitle: string;
    heartTransferBody: string;
    free: string;
    paid: string;
    host: string;
    peopleLinked: string;
    bookLater: string;
    moodCreate: string;
    moodEmpty: string;
    moodEmptyBody: string;
    moodHours: string;
    moodVisibility: string;
    visZone: string;
    visFollowers: string;
    visEvent: string;
    moodExpired: string;
    composeType: string;
    typePost: string;
    typeEvent: string;
    typeMood: string;
    pickEvent: string;
    pickEventEmpty: string;
    pickPayer: string;
    payerFree: string;
    payerHost: string;
    payerGuest: string;
    payerHostLater: string;
    inviteSent: string;
    inviteReceived: string;
    inviteSentBox: string;
    accept: string;
    refuse: string;
    accepted: string;
    refused: string;
    expired: string;
    pending: string;
    paymentLater: string;
    ticketsLater: string;
    reservationsEmpty: string;
    invitationsEmpty: string;
    contactsEmpty: string;
    favoritesEmpty: string;
    tabTickets: string;
    tabInvites: string;
    tabReservations: string;
    sortie: string;
  };
  booking: {
    reserve: string;
    bookSelf: string;
    pay: string;
    paySuccess: string;
    paySuccessBody: string;
    payFail: string;
    payRetry: string;
    pendingPayment: string;
    card: string;
    orange: string;
    momo: string;
    addMethod: string;
    methodsEmpty: string;
    ticketActive: string;
    ticketConsumed: string;
    ticketQrLater: string;
    ticketQrHint: string;
    validateTicket: string;
    scanTitle: string;
    scanPaste: string;
    scanOk: string;
    alreadyConsumed: string;
    invalidQr: string;
    viewTicket: string;
    manageEvent: string;
    tabInterested: string;
    tabReserved: string;
    tabValidated: string;
    paidBadge: string;
    unpaidBadge: string;
    amount: string;
    mockHint: string;
    failDemo: string;
    awaiting: string;
    confirmed: string;
    past: string;
    seeTicket: string;
    full: string;
    ticketQrInactive: string;
    ticketsEmpty: string;
    hostPayPending: string;
    invitePayHost: string;
    methodsTitle: string;
    labelHint: string;
    entryClosed: string;
    notHost: string;
  };
  chat: {
    inbox: string;
    empty: string;
    emptyBody: string;
    newTitle: string;
    searchContact: string;
    send: string;
    placeholder: string;
    image: string;
    voice: string;
    voiceMock: string;
    typing: string;
    typingMany: string;
    online: string;
    members: string;
    channel: string;
    eventGroup: string;
    blocked: string;
    block: string;
    blockedPeer: string;
    you: string;
    pushTitle: string;
    pushHint: string;
    pushMessages: string;
    pushSocial: string;
    pushEvents: string;
    messageCta: string;
    livesIn: string;
    groupFromEvent: string;
  };
  wallet: {
    title: string;
    buyTitle: string;
    available: string;
    total: string;
    allocated: string;
    emptyAlloc: string;
    emptyHistory: string;
    history: string;
    packs: string;
    packLabel: string;
    buy: string;
    buyCta: string;
    buyInstead: string;
    needPack: string;
    needPackBody: string;
    success: string;
    successBody: string;
    seeWallet: string;
    mockHint: string;
    txPurchase: string;
    txAllocate: string;
    txRelease: string;
    paymentFailed: string;
    sourcePurchased: string;
    sourceFree: string;
    sourceBonus: string;
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
    wallet: "Portefeuille likes",
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
    chatLater: "Ouvre une vraie conversation — pas un faux chat.",
    inviteLater: "Les invitations vers un événement arrivent avec le cœur « monde réel ».",
    eventsLater: "Les événements ne sont pas encore indexés.",
    noImageHint: "Visuel local de démo (stockage objet plus tard).",
    posted: "Publication envoyée",
    notifInvite: "t’a invité à une sortie",
    notifTicket: "ticket mis à jour",
    notifPayment: "paiement mis à jour",
    notifMessage: "t’a écrit",
  },
  world: {
    available: "Disponible",
    unavailable: "Masqué",
    availableUntil: "Dispo jusqu’à {time}",
    goAvailable: "Je suis dispo",
    goHidden: "Masquer ma dispo",
    ttlHint: "Visible 4 heures, puis tu disparais du carousel.",
    zoneTitle: "Ta zone",
    zoneBody: "La zone filtre les personnes et les sorties près de toi. Le GPS propose, il ne force pas.",
    precision: "Précision de localisation",
    precisionExact: "Exacte",
    precisionZone: "Zone",
    precisionCity: "Ville",
    precisionHidden: "Masquée",
    approximate: "Zone approximative",
    peopleTitle: "Amies disponibles",
    peopleEmpty: "Personne dispo dans ta zone",
    peopleEmptyBody: "Déclare-toi disponible ou élargis ta zone. TipTop ne remplit pas ce carousel avec le monde entier.",
    invite: "Inviter",
    message: "Message",
    age: "{age} ans",
    distance: "{km} km",
    nextPerson: "Suivant",
    eventsAll: "Tous",
    eventsMine: "Mes événements",
    eventsEmpty: "Pas de sortie ici",
    eventsEmptyBody: "Crée une sortie ou change de zone. Pas de catalogue mondial.",
    createEvent: "Créer un événement",
    eventTitle: "Titre de la sortie",
    eventDescription: "Description",
    eventWhen: "Date et heure",
    eventVenue: "Lieu",
    eventPrice: "Prix (FCFA, 0 = gratuit)",
    eventPriceHint: "Un prix ouvre une réservation. Le paiement arrive en Phase 4.",
    eventCapacity: "Capacité (optionnel)",
    eventMinAge: "Âge minimum (ex. 18)",
    eventReserve: "Réservation obligatoire même si gratuit",
    interested: "Intéressé",
    notInterested: "Plus intéressé",
    heartEvent: "Coup de cœur",
    heartTransferTitle: "Changer de coup de cœur ?",
    heartTransferBody: "Ton coup de cœur quittera « {title} » pour cette sortie.",
    free: "Gratuit",
    paid: "{amount} FCFA",
    host: "Hôte",
    peopleLinked: "Personnes liées",
    bookLater: "Réserver et payer arrive en Phase 4. Ici tu peux t’intéresser, mettre un coup de cœur, ou inviter sur une sortie gratuite.",
    moodCreate: "Créer un mood",
    moodEmpty: "Aucun mood actif",
    moodEmptyBody: "Un mood dure 24 h max. Il montre ce qui se passe maintenant, pas un reel sans fin.",
    moodHours: "Durée (heures)",
    moodVisibility: "Visibilité",
    visZone: "Ma zone",
    visFollowers: "Abonnés",
    visEvent: "Participants d’un event",
    moodExpired: "Ce mood est terminé.",
    composeType: "Type",
    typePost: "Publication",
    typeEvent: "Événement",
    typeMood: "Mood",
    pickEvent: "Choisir une sortie",
    pickEventEmpty: "Aucune sortie pertinente pour cette personne (zone, âge, places, date).",
    pickPayer: "Qui paie ?",
    payerFree: "Gratuit — pas de paiement",
    payerHost: "Je paie (invitant)",
    payerGuest: "L’invité paie",
    payerHostLater: "Tu paies pour l’invité — checkout mock ensuite.",
    inviteSent: "Invitation envoyée",
    inviteReceived: "Invitations reçues",
    inviteSentBox: "Envoyées",
    accept: "Accepter",
    refuse: "Refuser",
    accepted: "Acceptée",
    refused: "Refusée",
    expired: "Expirée",
    pending: "En attente",
    paymentLater: "Cette sortie est payante — paie pour confirmer, ou attends que l’invitant paie.",
    ticketsLater: "Pas encore de ticket. Réserve une sortie pour en avoir un.",
    reservationsEmpty: "Pas encore de réservation.",
    invitationsEmpty: "Aucune invitation pour l’instant.",
    contactsEmpty: "Tes contacts apparaissent après une invitation acceptée.",
    favoritesEmpty: "Aucun coup de cœur. Le cœur sur un événement en crée un.",
    tabTickets: "Tickets",
    tabInvites: "Invitations",
    tabReservations: "Réservations",
    sortie: "Sortie",
  },
  booking: {
    reserve: "Réserver",
    bookSelf: "Réserver pour moi",
    pay: "Payer",
    paySuccess: "Paiement réussi",
    paySuccessBody: "Tes tickets sont prêts. Montre le QR à l’entrée.",
    payFail: "Paiement échoué. Réessaie ou change de moyen.",
    payRetry: "Réessayer",
    pendingPayment: "Paiement en attente…",
    card: "Carte bancaire",
    orange: "Orange Money",
    momo: "MTN MoMo",
    addMethod: "Ajouter un moyen",
    methodsEmpty: "Ajoute un moyen mock (aucun vrai débit).",
    ticketActive: "Ticket d’entrée",
    ticketConsumed: "Ticket consommé",
    ticketQrLater: "Le QR s’active 2 h avant l’entrée.",
    ticketQrHint: "L’organisateur colle ce code pour valider. Pas de faux scanner caméra.",
    validateTicket: "Valider ticket",
    scanTitle: "Valider une entrée",
    scanPaste: "Colle le code du ticket",
    scanOk: "Entrée validée",
    alreadyConsumed: "Déjà consommé",
    invalidQr: "Code invalide ou expiré",
    viewTicket: "Voir le ticket",
    manageEvent: "Gérer la sortie",
    tabInterested: "Intéressés",
    tabReserved: "Réservés",
    tabValidated: "Validés",
    paidBadge: "Payé",
    unpaidBadge: "Non payé",
    amount: "{amount} FCFA",
    mockHint: "Paiement mock : aucun argent réel. Échec volontaire pour tester.",
    failDemo: "Simuler un échec",
    awaiting: "En attente",
    confirmed: "Confirmé",
    past: "Passé",
    seeTicket: "Ouvrir le ticket",
    full: "Complet",
    ticketQrInactive: "QR inactif",
    ticketsEmpty: "Pas encore de ticket. Réserve une sortie pour en avoir un.",
    hostPayPending: "L’invitant n’a pas encore payé.",
    invitePayHost: "Tu paies pour l’invité. Checkout mock ensuite — aucun vrai débit.",
    methodsTitle: "Moyens de paiement",
    labelHint: "Libellé (ex. Visa •• 4242)",
    entryClosed: "Hors fenêtre d’entrée",
    notHost: "Seul l’organisateur peut valider.",
  },
  chat: {
    inbox: "Messages",
    empty: "Pas encore de conversation",
    emptyBody: "Écris à un contact, ou ouvre le groupe d’une sortie.",
    newTitle: "Nouvelle conversation",
    searchContact: "Chercher un contact",
    send: "Envoyer",
    placeholder: "Message",
    image: "Image",
    voice: "Vocale",
    voiceMock: "Message vocal (mock)",
    typing: "écrit…",
    typingMany: "{count} écrivent…",
    online: "En ligne",
    members: "Membres",
    channel: "# Général",
    eventGroup: "Groupe de la sortie",
    blocked: "Tu as bloqué cette personne.",
    block: "Bloquer",
    blockedPeer: "Conversation indisponible.",
    you: "Toi",
    pushTitle: "Notifications push",
    pushHint: "Provider no-op : on enregistre le jeton, on n’envoie rien de réel.",
    pushMessages: "Messages",
    pushSocial: "Social",
    pushEvents: "Sorties",
    messageCta: "Message",
    livesIn: "Vie à {place}",
    groupFromEvent: "Ouvrir le groupe",
  },
  wallet: {
    title: "Portefeuille likes",
    buyTitle: "Acheter des likes",
    available: "Disponibles",
    total: "Unités",
    allocated: "Posés",
    emptyAlloc: "Aucun like posé pour l’instant.",
    emptyHistory: "Pas encore d’historique.",
    history: "Historique",
    packs: "Packs",
    packLabel: "{units} likes",
    buy: "Acheter",
    buyCta: "Choisir un pack",
    buyInstead: "Ou acheter plus de likes",
    needPack: "Plus d’unité",
    needPackBody: "Tu n’as plus d’unité de like. Achète un pack mock — aucun vrai débit, ledger likes séparé du paiement.",
    success: "Likes ajoutés",
    successBody: "{units} unités sont dans ton portefeuille.",
    seeWallet: "Voir le portefeuille",
    mockHint: "Paiement mock : le ledger likes est séparé du XAF. Aucun argent réel.",
    txPurchase: "+{units} likes achetés",
    txAllocate: "Like posé sur {name}",
    txRelease: "Like retiré de {name}",
    paymentFailed: "Paiement échoué. Aucun like n’a été crédité.",
    sourcePurchased: "Acheté",
    sourceFree: "Inclus",
    sourceBonus: "Bonus certifié",
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
    wallet: "Like wallet",
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
    chatLater: "Opens a real conversation — not a fake chat.",
    inviteLater: "Invites to an event ship with the real-world core.",
    eventsLater: "Events are not indexed yet.",
    noImageHint: "Local demo visual (object storage later).",
    posted: "Post published",
    notifInvite: "invited you to a meetup",
    notifTicket: "ticket updated",
    notifPayment: "payment updated",
    notifMessage: "sent you a message",
  },
  world: {
    available: "Available",
    unavailable: "Hidden",
    availableUntil: "Available until {time}",
    goAvailable: "I'm available",
    goHidden: "Hide availability",
    ttlHint: "Visible for 4 hours, then you leave the carousel.",
    zoneTitle: "Your area",
    zoneBody: "The area filters people and meetups near you. GPS suggests, it does not force.",
    precision: "Location precision",
    precisionExact: "Exact",
    precisionZone: "Area",
    precisionCity: "City",
    precisionHidden: "Hidden",
    approximate: "Approximate area",
    peopleTitle: "People nearby",
    peopleEmpty: "Nobody available in your area",
    peopleEmptyBody: "Go available or widen your area. TipTop will not fill this with the whole world.",
    invite: "Invite",
    message: "Message",
    age: "{age} yrs",
    distance: "{km} km",
    nextPerson: "Next",
    eventsAll: "All",
    eventsMine: "My events",
    eventsEmpty: "No meetup here",
    eventsEmptyBody: "Create a meetup or change area. No global catalog.",
    createEvent: "Create an event",
    eventTitle: "Meetup title",
    eventDescription: "Description",
    eventWhen: "Date and time",
    eventVenue: "Venue",
    eventPrice: "Price (XAF, 0 = free)",
    eventPriceHint: "A price requires a reservation. Payment ships in Phase 4.",
    eventCapacity: "Capacity (optional)",
    eventMinAge: "Minimum age (e.g. 18)",
    eventReserve: "Require a reservation even if free",
    interested: "Interested",
    notInterested: "Not interested",
    heartEvent: "Favorite",
    heartTransferTitle: "Move your favorite?",
    heartTransferBody: "Your favorite will leave “{title}” for this meetup.",
    free: "Free",
    paid: "{amount} XAF",
    host: "Host",
    peopleLinked: "People",
    bookLater: "Booking and payment ship in Phase 4. You can mark interest, favorite, or invite to a free meetup.",
    moodCreate: "Create a mood",
    moodEmpty: "No active mood",
    moodEmptyBody: "A mood lasts 24h max. It shows what is happening now, not an endless reel.",
    moodHours: "Duration (hours)",
    moodVisibility: "Visibility",
    visZone: "My area",
    visFollowers: "Followers",
    visEvent: "Event guests",
    moodExpired: "This mood ended.",
    composeType: "Type",
    typePost: "Post",
    typeEvent: "Event",
    typeMood: "Mood",
    pickEvent: "Pick a meetup",
    pickEventEmpty: "No relevant meetup for this person (area, age, seats, date).",
    pickPayer: "Who pays?",
    payerFree: "Free — no payment",
    payerHost: "I pay (host)",
    payerGuest: "The guest pays",
    payerHostLater: "You pay for the guest — mock checkout next.",
    inviteSent: "Invite sent",
    inviteReceived: "Received invites",
    inviteSentBox: "Sent",
    accept: "Accept",
    refuse: "Decline",
    accepted: "Accepted",
    refused: "Declined",
    expired: "Expired",
    pending: "Pending",
    paymentLater: "This meetup is paid — pay to confirm, or wait for the host to pay.",
    ticketsLater: "No ticket yet. Book a meetup to get one.",
    reservationsEmpty: "No reservation yet.",
    invitationsEmpty: "No invitations yet.",
    contactsEmpty: "Contacts appear after an accepted invite.",
    favoritesEmpty: "No favorites. A heart on an event creates one.",
    tabTickets: "Tickets",
    tabInvites: "Invites",
    tabReservations: "Bookings",
    sortie: "Meetup",
  },
  booking: {
    reserve: "Book",
    bookSelf: "Book for myself",
    pay: "Pay",
    paySuccess: "Payment succeeded",
    paySuccessBody: "Your tickets are ready. Show the QR at the door.",
    payFail: "Payment failed. Retry or pick another method.",
    payRetry: "Retry",
    pendingPayment: "Payment pending…",
    card: "Card",
    orange: "Orange Money",
    momo: "MTN MoMo",
    addMethod: "Add a method",
    methodsEmpty: "Add a mock method (no real charge).",
    ticketActive: "Entry ticket",
    ticketConsumed: "Ticket used",
    ticketQrLater: "The QR turns on 2h before entry.",
    ticketQrHint: "The host pastes this code to validate. No fake camera scanner.",
    validateTicket: "Validate ticket",
    scanTitle: "Validate entry",
    scanPaste: "Paste the ticket code",
    scanOk: "Entry validated",
    alreadyConsumed: "Already used",
    invalidQr: "Invalid or expired code",
    viewTicket: "View ticket",
    manageEvent: "Manage meetup",
    tabInterested: "Interested",
    tabReserved: "Reserved",
    tabValidated: "Checked in",
    paidBadge: "Paid",
    unpaidBadge: "Unpaid",
    amount: "{amount} XAF",
    mockHint: "Mock payment: no real money. Optional fail to test errors.",
    failDemo: "Simulate a failure",
    awaiting: "Pending",
    confirmed: "Confirmed",
    past: "Past",
    seeTicket: "Open ticket",
    full: "Sold out",
    ticketQrInactive: "QR inactive",
    ticketsEmpty: "No ticket yet. Book a meetup to get one.",
    hostPayPending: "The host has not paid yet.",
    invitePayHost: "You pay for the guest. Mock checkout next — no real charge.",
    methodsTitle: "Payment methods",
    labelHint: "Label (e.g. Visa •• 4242)",
    entryClosed: "Outside entry window",
    notHost: "Only the host can validate.",
  },
  chat: {
    inbox: "Messages",
    empty: "No conversations yet",
    emptyBody: "Message a contact, or open a meetup group.",
    newTitle: "New conversation",
    searchContact: "Search a contact",
    send: "Send",
    placeholder: "Message",
    image: "Image",
    voice: "Voice",
    voiceMock: "Voice message (mock)",
    typing: "typing…",
    typingMany: "{count} typing…",
    online: "Online",
    members: "Members",
    channel: "# General",
    eventGroup: "Meetup group",
    blocked: "You blocked this person.",
    block: "Block",
    blockedPeer: "Conversation unavailable.",
    you: "You",
    pushTitle: "Push notifications",
    pushHint: "No-op provider: we store the token, we never send a real push.",
    pushMessages: "Messages",
    pushSocial: "Social",
    pushEvents: "Meetups",
    messageCta: "Message",
    livesIn: "Lives in {place}",
    groupFromEvent: "Open group",
  },
  wallet: {
    title: "Like wallet",
    buyTitle: "Buy likes",
    available: "Available",
    total: "Units",
    allocated: "Placed",
    emptyAlloc: "No like placed yet.",
    emptyHistory: "No history yet.",
    history: "History",
    packs: "Packs",
    packLabel: "{units} likes",
    buy: "Buy",
    buyCta: "Choose a pack",
    buyInstead: "Or buy more likes",
    needPack: "No units left",
    needPackBody: "You have no like units left. Buy a mock pack — no real charge, like ledger separate from payment.",
    success: "Likes added",
    successBody: "{units} units are in your wallet.",
    seeWallet: "See wallet",
    mockHint: "Mock payment: the like ledger is separate from XAF. No real money.",
    txPurchase: "+{units} likes purchased",
    txAllocate: "Like placed on {name}",
    txRelease: "Like removed from {name}",
    paymentFailed: "Payment failed. No like was credited.",
    sourcePurchased: "Purchased",
    sourceFree: "Included",
    sourceBonus: "Certified bonus",
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
