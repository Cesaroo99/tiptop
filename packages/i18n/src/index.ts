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
    ranking: string;
    wishes: string;
    invitations: string;
    wallet: string;
    perHour: string;
    perDay: string;
    perMonth: string;
    comingSoon: string;
    admin: string;
    newBadge: string;
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
    likePlace: string;
    likeHere: string;
    likePlacedOn: string;
    likeIdle: string;
    likeExplain: string;
    likesNow: string;
    likeReceivedTitle: string;
    likeGivenTitle: string;
    likeEmptyReceived: string;
    likeProduction: string;
    perHourLong: string;
    perDayLong: string;
    perMonthLong: string;
    perSecond: string;
    likeMeterHint: string;
    likeMeterHintSelf: string;
    followers: string;
    followingCount: string;
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
    notifPaymentRefund: string;
    notifMessage: string;
    notifReview: string;
    notifEventUpdate: string;
    notifEventCancelled: string;
    notifEventTimeChanged: string;
    notifEventPlaceChanged: string;
    share: string;
    copied: string;
    copyLink: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    moodsTab: string;
    ofLikes: string;
    notifWish: string;
    notifMilestone: string;
    notifSocialInvite: string;
    notifSocialInviteAccepted: string;
    transferGeneric: string;
    wishesLabel: string;
    moodsLabel: string;
  };
  likeTime: {
    capital: string;
    weekPlus: string;
    lastMilestone: string;
    noMilestone: string;
    ranking: string;
    rankingAll: string;
    rankingWeek: string;
    rankingMonth: string;
    close: string;
    historyTitle: string;
    activeNow: string;
    ofDuration: string;
  };
  socialInvite: {
    modalTitle: string;
    contextRestaurant: string;
    contextCafe: string;
    contextActivity: string;
    contextMeetup: string;
    contextWish: string;
    labelPlaceholder: string;
    messagePlaceholder: string;
    send: string;
    sent: string;
    pageTitle: string;
    receivedTab: string;
    sentTab: string;
    empty: string;
    emptySent: string;
    accept: string;
    refuse: string;
    accepted: string;
    refused: string;
    expired: string;
    statusSent: string;
    openChat: string;
    rateLimited: string;
    alreadyPending: string;
    proposeOuting: string;
    joinNow: string;
  };
  wishes: {
    title: string;
    tab: string;
    add: string;
    offer: string;
    inviteOut: string;
    empty: string;
    emptyPublic: string;
    titleField: string;
    category: string;
    description: string;
    price: string;
    city: string;
    visibility: string;
    priority: string;
    save: string;
    delete: string;
    sent: string;
    accept: string;
    refuse: string;
    url: string;
    catEVENT: string;
    catPRODUCT: string;
    catRESTAURANT: string;
    catACTIVITY: string;
    catTRAVEL: string;
    catEXPERIENCE: string;
    catGIFT: string;
    catSERVICE: string;
    catPLACE: string;
    catSPORT: string;
    catLEISURE: string;
    catOTHER: string;
    visPUBLIC: string;
    visFOLLOWERS: string;
    visPRIVATE: string;
    prioLOW: string;
    prioMEDIUM: string;
    prioHIGH: string;
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
    peopleNearby: string;
    peopleEmpty: string;
    peopleEmptyBody: string;
    invite: string;
    inviteJoin: string;
    previousPerson: string;
    passPerson: string;
    filters: string;
    onlyAvailable: string;
    maxDistance: string;
    minAge: string;
    maxAge: string;
    professionFilter: string;
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
    moodLinkEventNone: string;
    moodPickVideo: string;
    moodAddVideo: string;
    videoRecord: string;
    videoImport: string;
    videoHint: string;
    videoTypeError: string;
    videoTooLarge: string;
    videoTooLong: string;
    videoUploading: string;
    videoUploadError: string;
    visEvent: string;
    moodExpired: string;
    activityPlaceholder: string;
    moodAvailableFor: string;
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
    eventIn: string;
    inviteNamed: string;
    seeAll: string;
    eventsInterested: string;
    eventsLinked: string;
    moreAbout: string;
    reservationsCount: string;
    interestedCount: string;
    livesAt: string;
    ongoingBadge: string;
    endedBadge: string;
    startingSoonBadge: string;
    cancelledBadge: string;
    cancelledBody: string;
    manageOverview: string;
    manageEdit: string;
    manageCancel: string;
    manageCancelConfirm: string;
    manageDuplicate: string;
    manageDuplicatePrompt: string;
    manageStats: string;
    myEventsInterested: string;
    myEventsSaved: string;
    myEventsReserved: string;
    myEventsPast: string;
    myEventsCreated: string;
    eventMoodsTitle: string;
    eventMoodsEmpty: string;
    seeEventFromMood: string;
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
    ageRestrictedNotice: string;
    ageRestrictedError: string;
  };
  reviews: {
    title: string;
    empty: string;
    write: string;
    bodyPlaceholder: string;
    send: string;
    sent: string;
    already: string;
    notYet: string;
    pending: string;
    ratingHint: string;
  };
  helpPage: {
    lead: string;
    otp: string;
    live: string;
    pay: string;
    likes: string;
    reviews: string;
    contact: string;
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
    pushInvitations: string;
    pushMood: string;
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
    payments: string;
    credited: string;
    notCredited: string;
    sourcePurchased: string;
    sourceFree: string;
    sourceBonus: string;
    oneLikeHint: string;
    extraUnits: string;
    placedTitle: string;
    receivedTitle: string;
    productionTitle: string;
    packsNote: string;
  };
  admin: {
    title: string;
    home: string;
    users: string;
    posts: string;
    events: string;
    payments: string;
    likes: string;
    reports: string;
    forbidden: string;
    forbiddenBody: string;
    usersCount: string;
    blockedCount: string;
    postsCount: string;
    hiddenCount: string;
    eventsCount: string;
    paymentsCount: string;
    openReports: string;
    search: string;
    certify: string;
    uncertify: string;
    block: string;
    unblock: string;
    hide: string;
    unhide: string;
    cancelEvent: string;
    refund: string;
    refunded: string;
    mockRefundHint: string;
    anomalyBurst: string;
    anomalyBalance: string;
    anomalyUnused: string;
    noAnomalies: string;
    report: string;
    reportTitle: string;
    reportBody: string;
    reportSent: string;
    reasonSpam: string;
    reasonAbuse: string;
    reasonFake: string;
    reasonOther: string;
    sendReport: string;
    dismiss: string;
    dismissed: string;
    actioned: string;
    open: string;
    hidden: string;
    empty: string;
    roleAdmin: string;
    roleMod: string;
    statusActive: string;
    statusBlocked: string;
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
    likes: "Mon like",
    ranking: "Classement",
    wishes: "Mes envies",
    invitations: "Mes rencontres",
    wallet: "Mon like",
    perHour: "cette heure",
    perDay: "aujourd’hui",
    perMonth: "ce mois",
    comingSoon: "Cette section arrive dans une prochaine phase — le bouton n’invente pas de données.",
    admin: "Back-office",
    newBadge: "NEW",
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
    likePerson: "Poser mon like",
    unlike: "Retirer mon like",
    transferTitle: "Déplacer ton like ?",
    transferBody: "Tu n’as qu’un like. Il quittera {name} pour aller chez cette personne.",
    likeSelf: "Tu ne peux pas te liker.",
    likePlace: "Poser mon like",
    likeHere: "Mon like est ici",
    likePlacedOn: "Ton like est chez {name}",
    likeIdle: "Ton like n’est posé sur personne pour l’instant.",
    likeExplain: "Chacun n’a qu’un like. Tu le poses sur une personne. Si tu en likes une autre, il se déplace.",
    likesNow: "{n} likes maintenant",
    likeReceivedTitle: "Qui lui a posé son like",
    likeGivenTitle: "Son like est chez",
    likeEmptyReceived: "Personne n’a encore posé son like ici.",
    likeProduction: "Capital de likes",
    perHourLong: "cette heure",
    perDayLong: "aujourd’hui",
    perMonthLong: "ce mois",
    perSecond: "/seconde",
    likeMeterHint: "Le capital, c’est le temps de likes reçu sur les contenus et interactions éligibles — pas un compteur de cœurs.",
    likeMeterHintSelf: "Ton capital, c’est le temps de likes reçu sur tes contenus éligibles. Il continue de grandir tant que des likes restent posés.",
    followers: "abonnés",
    followingCount: "abonnements",
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
    notifPaymentRefund: "Ton paiement a été remboursé.",
    notifMessage: "t’a écrit",
    notifReview: "a laissé un avis sur ta sortie",
    notifEventUpdate: "Un événement auquel tu participes a été mis à jour.",
    notifEventCancelled: "Un événement auquel tu participes a été annulé.",
    notifEventTimeChanged: "L'heure d'un événement auquel tu participes a changé.",
    notifEventPlaceChanged: "Le lieu d'un événement auquel tu participes a changé.",
    share: "Partager",
    copied: "Lien copié",
    copyLink: "Copier le lien",
    justNow: "À l’instant",
    minutesAgo: "Il y a {n} min",
    hoursAgo: "Il y a {n} heures",
    daysAgo: "Il y a {n} j",
    moodsTab: "Moods",
    ofLikes: "de likes",
    notifWish: "propose de t’offrir une envie",
    notifMilestone: "Nouveau palier de likes",
    notifSocialInvite: "t’a proposé une sortie",
    notifSocialInviteAccepted: "a accepté ta sortie",
    transferGeneric: "Ton like quittera sa cible actuelle pour aller ici.",
    wishesLabel: "Envies",
    moodsLabel: "Mood",
  },
  likeTime: {
    capital: "Temps de likes",
    weekPlus: "+ {duration} cette semaine",
    lastMilestone: "{label} atteint le {date}",
    noMilestone: "Aucun palier encore",
    ranking: "Top temps de likes",
    rankingAll: "Tout",
    rankingWeek: "Cette semaine",
    rankingMonth: "Ce mois",
    close: "Fermer",
    historyTitle: "Périodes reçues",
    activeNow: "en cours",
    ofDuration: "{duration} de likes",
  },
  socialInvite: {
    modalTitle: "Proposer une sortie",
    contextRestaurant: "Restaurant",
    contextCafe: "Café",
    contextActivity: "Activité",
    contextMeetup: "Me rejoindre",
    contextWish: "Envie",
    labelPlaceholder: "Où, quoi ? (ex. Sushi House)",
    messagePlaceholder: "Ajouter un message (facultatif)",
    send: "Envoyer l’invitation",
    sent: "Invitation envoyée.",
    pageTitle: "Mes rencontres",
    receivedTab: "Reçues",
    sentTab: "Envoyées",
    empty: "Aucune invitation reçue pour l’instant.",
    emptySent: "Tu n’as encore proposé aucune sortie.",
    accept: "Accepter",
    refuse: "Refuser",
    accepted: "Acceptée",
    refused: "Refusée",
    expired: "Expirée",
    statusSent: "En attente",
    openChat: "Ouvrir la conversation",
    rateLimited: "Trop d’invitations envoyées aujourd’hui. Réessaie demain.",
    alreadyPending: "Une invitation est déjà en attente avec cette personne.",
    proposeOuting: "Proposer une sortie",
    joinNow: "Rejoindre",
  },
  wishes: {
    title: "Mes envies",
    tab: "Envies",
    add: "Ajouter une envie",
    offer: "Proposer de l’offrir",
    inviteOut: "Je t’invite",
    empty: "Pas encore d’envie. Ajoute ce qui te ferait plaisir.",
    emptyPublic: "Aucune envie visible.",
    titleField: "Titre",
    category: "Catégorie",
    description: "Description",
    price: "Prix estimé (FCFA)",
    city: "Lieu",
    visibility: "Visibilité",
    priority: "Priorité",
    save: "Enregistrer",
    delete: "Supprimer",
    sent: "Proposition envoyée.",
    accept: "Accepter",
    refuse: "Refuser",
    url: "Lien (facultatif)",
    catEVENT: "Événement",
    catPRODUCT: "Produit",
    catRESTAURANT: "Restaurant",
    catACTIVITY: "Activité",
    catTRAVEL: "Voyage",
    catEXPERIENCE: "Expérience",
    catGIFT: "Cadeau",
    catSERVICE: "Service",
    catPLACE: "Lieu",
    catSPORT: "Sport",
    catLEISURE: "Loisir",
    catOTHER: "Autre",
    visPUBLIC: "Public",
    visFOLLOWERS: "Abonnés",
    visPRIVATE: "Privé",
    prioLOW: "Basse",
    prioMEDIUM: "Moyenne",
    prioHIGH: "Haute",
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
    peopleTitle: "Personnes autour de moi",
    peopleNearby: "Personnes autour de moi",
    peopleEmpty: "Personne dans ta zone",
    peopleEmptyBody: "Élargis tes filtres ou déclare-toi disponible. TipTop ne remplit pas ce carousel avec le monde entier.",
    invite: "Inviter",
    inviteJoin: "Inviter à me rejoindre",
    previousPerson: "Précédent",
    passPerson: "Passer",
    filters: "Filtres",
    onlyAvailable: "Disponibles seulement",
    maxDistance: "Distance max (km)",
    minAge: "Âge min",
    maxAge: "Âge max",
    professionFilter: "Profession",
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
    moodLinkEventNone: "Associer à un événement (optionnel)",
    moodPickVideo: "Ou choisis un modèle",
    moodAddVideo: "Vidéo (optionnel)",
    videoRecord: "Filmer",
    videoImport: "Importer",
    videoHint: "Vidéo courte, {seconds} secondes maximum.",
    videoTypeError: "Ce fichier n'est pas une vidéo.",
    videoTooLarge: "Cette vidéo est trop volumineuse (60 Mo maximum).",
    videoTooLong: "Cette vidéo dépasse {seconds} secondes. Choisis un extrait plus court.",
    videoUploading: "Envoi en cours… {pct}%",
    videoUploadError: "L'envoi de la vidéo a échoué. Réessaie.",
    visEvent: "Participants d’un event",
    moodExpired: "Ce mood est terminé.",
    activityPlaceholder: "Que fais-tu en ce moment ? (ex. 🍣 Restaurant japonais)",
    moodAvailableFor: "Disponible {duration}",
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
    eventIn: "Événement dans : {when}",
    inviteNamed: "+ Inviter {name}",
    seeAll: "Tous voir",
    eventsInterested: "Événements qui m’intéressent",
    eventsLinked: "{n} événement(s) lié(s)",
    moreAbout: "Plus d’infos à propos de {name}",
    reservationsCount: "Réservations",
    interestedCount: "Intéressés",
    livesAt: "Vie à {place}",
    ongoingBadge: "En cours",
    endedBadge: "Terminé",
    startingSoonBadge: "Commence bientôt",
    cancelledBadge: "Annulé",
    cancelledBody: "Cet événement a été annulé par l’organisateur. Les personnes intéressées ont été prévenues.",
    manageOverview: "Vue générale",
    manageEdit: "Modifier",
    manageCancel: "Annuler l’événement",
    manageCancelConfirm: "Toutes les personnes intéressées et les porteurs de billet seront prévenus. Cette action est irréversible.",
    manageDuplicate: "Dupliquer",
    manageDuplicatePrompt: "Choisis une nouvelle date pour la copie de cet événement.",
    manageStats: "Statistiques",
    myEventsInterested: "Intéressé(e)",
    myEventsSaved: "Coups de cœur",
    myEventsReserved: "Réservés",
    myEventsPast: "Passés",
    myEventsCreated: "Créés",
    eventMoodsTitle: "Moods de cet événement",
    eventMoodsEmpty: "Aucun mood pour cet événement pour l’instant.",
    seeEventFromMood: "Voir l’événement",
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
    ageRestrictedNotice: "Cet événement est réservé aux personnes de {age} ans et plus. Ta date de naissance renseignée sera vérifiée.",
    ageRestrictedError: "Tu ne remplis pas la condition d’âge minimum pour cet événement.",
  },
  reviews: {
    title: "Avis",
    empty: "Pas encore d’avis. On écrit après la sortie, pas pendant le scroll.",
    write: "Laisser un avis",
    bodyPlaceholder: "Comment s’est passée la sortie ?",
    send: "Publier l’avis",
    sent: "Merci. Ton avis aide les suivants à sortir.",
    already: "Tu as déjà laissé un avis.",
    notYet: "L’avis s’ouvre 24 h après la fin, si tu y étais (ticket validé).",
    pending: "Avis à laisser",
    ratingHint: "La note sur 5 est interne — elle n’est pas affichée.",
  },
  helpPage: {
    lead: "TipTop sert à sortir, rencontrer et vivre des expériences réelles — pas à scroller.",
    otp: "Connexion : numéro camerounais + OTP. En développement, le code mock est 1234.",
    live: "Disponibilité, découverte, invitations, chat et tickets sont branchés. Le Message depuis Amies ouvre une vraie conversation.",
    pay: "Paiements (tickets, packs mock) : Card / Orange Money / MTN. Aucun vrai débit.",
    likes: "Chacun a un like personnel transférable, plus des unités achetées. La valeur, c’est le temps pendant lequel un like reste posé — pas un compteur. Le profil agrège ce temps sans double comptage.",
    reviews: "Après une sortie vécue (ticket validé), tu peux laisser un avis texte 24 h après la fin.",
    contact: "Support démo : memolicesar1@gmail.com — aucun ticket inventé.",
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
    pushInvitations: "Invitations",
    pushMood: "Mood",
    messageCta: "Message",
    livesIn: "Vie à {place}",
    groupFromEvent: "Ouvrir le groupe",
  },
  wallet: {
    title: "Mon like",
    buyTitle: "Acheter des likes",
    available: "Libre",
    total: "Ton like",
    allocated: "Posé",
    emptyAlloc: "Ton like n’est posé sur personne pour l’instant.",
    emptyHistory: "Pas encore d’historique.",
    history: "Historique",
    packs: "Packs mock",
    packLabel: "{units} likes",
    buy: "Acheter",
    buyCta: "Choisir un pack",
    buyInstead: "Un pack ajoute des unités à poser. Le temps de likes n’est créé que si elles restent attribuées.",
    needPack: "Plus d’unité libre",
    needPackBody: "Toutes tes unités sont posées. Déplace-en une, ou achète un pack pour en poser une de plus.",
    success: "Likes ajoutés",
    successBody: "{units} unité(s) d’attribution ajoutée(s). Le temps de likes naîtra seulement quand tu les poseras.",
    seeWallet: "Voir mon like",
    mockHint: "Paiement mock : le ledger likes est séparé du XAF. Aucun argent réel.",
    txPurchase: "+{units} likes achetés (ledger mock)",
    txAllocate: "Like posé sur {name}",
    txRelease: "Like retiré de {name}",
    paymentFailed: "Paiement échoué. Aucun like n’a été crédité.",
    payments: "Paiements packs",
    credited: "Crédité",
    notCredited: "Non crédité",
    sourcePurchased: "Acheté",
    sourceFree: "Inclus",
    sourceBonus: "Bonus certifié",
    oneLikeHint: "Tu as un like personnel, plus d’unités si tu en as acheté. Le temps de likes ne naît que lorsqu’une unité reste posée.",
    extraUnits: "{n} unité(s) libre(s) sur {total}",
    placedTitle: "Ton like",
    receivedTitle: "Qui t’a posé son like",
    productionTitle: "Ce que tu produis",
    packsNote: "Acheter un pack ajoute des unités d’attribution. Ça ne crée pas de temps de likes : le temps naît seulement quand une unité reste posée.",
  },
  admin: {
    title: "Back-office",
    home: "Vue d’ensemble",
    users: "Utilisateurs",
    posts: "Contenus",
    events: "Sorties",
    payments: "Paiements",
    likes: "Anomalies likes",
    reports: "Signalements",
    forbidden: "Accès refusé",
    forbiddenBody: "Le back-office est réservé à l’équipe TipTop.",
    usersCount: "Comptes",
    blockedCount: "Bloqués",
    postsCount: "Publications",
    hiddenCount: "Masquées",
    eventsCount: "Sorties publiées",
    paymentsCount: "Paiements OK",
    openReports: "Signalements ouverts",
    search: "Chercher un compte",
    certify: "Certifier",
    uncertify: "Retirer la certif",
    block: "Bloquer",
    unblock: "Débloquer",
    hide: "Masquer",
    unhide: "Rétablir",
    cancelEvent: "Annuler la sortie",
    refund: "Rembourser (mock)",
    refunded: "Remboursé",
    mockRefundHint: "Remboursement mock du ledger XAF. Les likes déjà crédités restent.",
    anomalyBurst: "Rafale d’allocations",
    anomalyBalance: "Solde élevé",
    anomalyUnused: "Packs non utilisés",
    noAnomalies: "Aucune anomalie pour l’instant.",
    report: "Signaler",
    reportTitle: "Signaler",
    reportBody: "Explique brièvement. L’équipe TipTop verra le signalement.",
    reportSent: "Signalement envoyé.",
    reasonSpam: "Spam",
    reasonAbuse: "Abus",
    reasonFake: "Faux compte / contenu",
    reasonOther: "Autre",
    sendReport: "Envoyer",
    dismiss: "Classer",
    dismissed: "Classé",
    actioned: "Traité",
    open: "Ouvert",
    hidden: "Masqué",
    empty: "Rien à afficher.",
    roleAdmin: "Admin",
    roleMod: "Modération",
    statusActive: "Actif",
    statusBlocked: "Bloqué",
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
    likes: "My like",
    ranking: "Ranking",
    wishes: "My wishes",
    invitations: "My meetups",
    wallet: "My like",
    perHour: "this hour",
    perDay: "today",
    perMonth: "this month",
    comingSoon: "This section ships in a later phase — the button does not invent data.",
    admin: "Back office",
    newBadge: "NEW",
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
    likePerson: "Place my like",
    unlike: "Remove my like",
    transferTitle: "Move your like?",
    transferBody: "You only have one like. It will leave {name} to sit with this person.",
    likeSelf: "You cannot like yourself.",
    likePlace: "Place my like",
    likeHere: "My like is here",
    likePlacedOn: "Your like is with {name}",
    likeIdle: "Your like is not placed on anyone yet.",
    likeExplain: "Everyone has one like. You place it on a person. Like someone else and it moves.",
    likesNow: "{n} likes now",
    likeReceivedTitle: "Who placed their like here",
    likeGivenTitle: "Their like is with",
    likeEmptyReceived: "Nobody has placed their like here yet.",
    likeProduction: "Like capital",
    perHourLong: "this hour",
    perDayLong: "today",
    perMonthLong: "this month",
    perSecond: "/second",
    likeMeterHint: "The capital is received like-time on eligible content — not a heart counter.",
    likeMeterHintSelf: "Your capital is received like-time on your eligible content. It keeps growing while likes stay placed.",
    followers: "followers",
    followingCount: "following",
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
    notifPaymentRefund: "Your payment was refunded.",
    notifMessage: "sent you a message",
    notifReview: "left a review on your meetup",
    notifEventUpdate: "An event you're part of was updated.",
    notifEventCancelled: "An event you're part of was cancelled.",
    notifEventTimeChanged: "The time of an event you're part of changed.",
    notifEventPlaceChanged: "The place of an event you're part of changed.",
    share: "Share",
    copied: "Link copied",
    copyLink: "Copy link",
    justNow: "Just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} hours ago",
    daysAgo: "{n} d ago",
    moodsTab: "Moods",
    ofLikes: "of likes",
    notifWish: "offers to fulfill a wish",
    notifMilestone: "New like-time milestone",
    notifSocialInvite: "proposed an outing",
    notifSocialInviteAccepted: "accepted your outing",
    transferGeneric: "Your like will leave its current target to go here.",
    wishesLabel: "Wishes",
    moodsLabel: "Mood",
  },
  likeTime: {
    capital: "Like time",
    weekPlus: "+ {duration} this week",
    lastMilestone: "{label} reached on {date}",
    noMilestone: "No milestone yet",
    ranking: "Top like time",
    rankingAll: "All time",
    rankingWeek: "This week",
    rankingMonth: "This month",
    close: "Close",
    historyTitle: "Received periods",
    activeNow: "active",
    ofDuration: "{duration} of likes",
  },
  socialInvite: {
    modalTitle: "Propose an outing",
    contextRestaurant: "Restaurant",
    contextCafe: "Coffee",
    contextActivity: "Activity",
    contextMeetup: "Join me",
    contextWish: "Wish",
    labelPlaceholder: "Where, what? (e.g. Sushi House)",
    messagePlaceholder: "Add a message (optional)",
    send: "Send invitation",
    sent: "Invitation sent.",
    pageTitle: "My meetups",
    receivedTab: "Received",
    sentTab: "Sent",
    empty: "No invitations received yet.",
    emptySent: "You haven't proposed an outing yet.",
    accept: "Accept",
    refuse: "Decline",
    accepted: "Accepted",
    refused: "Declined",
    expired: "Expired",
    statusSent: "Pending",
    openChat: "Open the conversation",
    rateLimited: "Too many invitations sent today. Try again tomorrow.",
    alreadyPending: "An invitation is already pending with this person.",
    proposeOuting: "Propose an outing",
    joinNow: "Join",
  },
  wishes: {
    title: "My wishes",
    tab: "Wishes",
    add: "Add a wish",
    offer: "Offer this",
    inviteOut: "I'll take you",
    empty: "No wishes yet. Add something that would make you happy.",
    emptyPublic: "No visible wishes.",
    titleField: "Title",
    category: "Category",
    description: "Description",
    price: "Estimated price (XAF)",
    city: "Place",
    visibility: "Visibility",
    priority: "Priority",
    save: "Save",
    delete: "Delete",
    sent: "Offer sent.",
    accept: "Accept",
    refuse: "Decline",
    url: "Link (optional)",
    catEVENT: "Event",
    catPRODUCT: "Product",
    catRESTAURANT: "Restaurant",
    catACTIVITY: "Activity",
    catTRAVEL: "Travel",
    catEXPERIENCE: "Experience",
    catGIFT: "Gift",
    catSERVICE: "Service",
    catPLACE: "Place",
    catSPORT: "Sport",
    catLEISURE: "Leisure",
    catOTHER: "Other",
    visPUBLIC: "Public",
    visFOLLOWERS: "Followers",
    visPRIVATE: "Private",
    prioLOW: "Low",
    prioMEDIUM: "Medium",
    prioHIGH: "High",
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
    peopleNearby: "People nearby",
    peopleEmpty: "Nobody in your area",
    peopleEmptyBody: "Widen your filters or go available. TipTop will not fill this with the whole world.",
    invite: "Invite",
    inviteJoin: "Invite to join me",
    previousPerson: "Previous",
    passPerson: "Skip",
    filters: "Filters",
    onlyAvailable: "Available only",
    maxDistance: "Max distance (km)",
    minAge: "Min age",
    maxAge: "Max age",
    professionFilter: "Profession",
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
    moodLinkEventNone: "Link to an event (optional)",
    moodPickVideo: "Or pick a template",
    moodAddVideo: "Video (optional)",
    videoRecord: "Record",
    videoImport: "Import",
    videoHint: "Short video, {seconds} seconds max.",
    videoTypeError: "This file is not a video.",
    videoTooLarge: "This video is too large (60 MB max).",
    videoTooLong: "This video is longer than {seconds} seconds. Pick a shorter clip.",
    videoUploading: "Uploading… {pct}%",
    videoUploadError: "The video upload failed. Please try again.",
    visEvent: "Event guests",
    moodExpired: "This mood ended.",
    activityPlaceholder: "What are you up to right now? (e.g. 🍣 Sushi place)",
    moodAvailableFor: "Available {duration}",
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
    eventIn: "Event in: {when}",
    inviteNamed: "+ Invite {name}",
    seeAll: "See all",
    eventsInterested: "Events I’m interested in",
    eventsLinked: "{n} linked event(s)",
    moreAbout: "More about {name}",
    reservationsCount: "Bookings",
    interestedCount: "Interested",
    livesAt: "Lives in {place}",
    ongoingBadge: "Ongoing",
    endedBadge: "Ended",
    startingSoonBadge: "Starting soon",
    cancelledBadge: "Cancelled",
    cancelledBody: "This event was cancelled by the organizer. Interested people have been notified.",
    manageOverview: "Overview",
    manageEdit: "Edit",
    manageCancel: "Cancel event",
    manageCancelConfirm: "All interested people and ticket holders will be notified. This action cannot be undone.",
    manageDuplicate: "Duplicate",
    manageDuplicatePrompt: "Pick a new date for the copy of this event.",
    manageStats: "Stats",
    myEventsInterested: "Interested",
    myEventsSaved: "Favorites",
    myEventsReserved: "Reserved",
    myEventsPast: "Past",
    myEventsCreated: "Created",
    eventMoodsTitle: "Moods from this event",
    eventMoodsEmpty: "No mood for this event yet.",
    seeEventFromMood: "See the event",
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
    ageRestrictedNotice: "This event is restricted to people aged {age} and over. Your registered birth date will be checked.",
    ageRestrictedError: "You don't meet the minimum age requirement for this event.",
  },
  reviews: {
    title: "Reviews",
    empty: "No reviews yet. We write after the meetup, not while scrolling.",
    write: "Leave a review",
    bodyPlaceholder: "How was the meetup?",
    send: "Publish review",
    sent: "Thanks. Your review helps the next people go out.",
    already: "You already left a review.",
    notYet: "Reviews open 24h after the meetup ends, if you were there (validated ticket).",
    pending: "Reviews to write",
    ratingHint: "The 1–5 score is internal — it is not shown.",
  },
  helpPage: {
    lead: "TipTop is for going out, meeting people, and living real experiences — not for scrolling.",
    otp: "Sign-in: Cameroon number + OTP. In development the mock code is 1234.",
    live: "Availability, discovery, invites, chat and tickets are wired. Message from People opens a real conversation.",
    pay: "Payments (tickets, mock packs): Card / Orange Money / MTN. No real charge.",
    likes: "Everyone has a transferable personal like, plus purchased units. Value is the time a like stays placed — not a counter. A profile aggregates that time without double-counting.",
    reviews: "After a meetup you attended (validated ticket), you can leave a text review 24h after it ends.",
    contact: "Demo support: memolicesar1@gmail.com — no invented tickets.",
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
    pushInvitations: "Invitations",
    pushMood: "Mood",
    messageCta: "Message",
    livesIn: "Lives in {place}",
    groupFromEvent: "Open group",
  },
  wallet: {
    title: "My like",
    buyTitle: "Buy likes",
    available: "Free",
    total: "Your like",
    allocated: "Placed",
    emptyAlloc: "Your like is not placed on anyone yet.",
    emptyHistory: "No history yet.",
    history: "History",
    packs: "Mock packs",
    packLabel: "{units} likes",
    buy: "Buy",
    buyCta: "Choose a pack",
    buyInstead: "A pack adds units to place. Like-time is only created while they stay attributed.",
    needPack: "No free unit",
    needPackBody: "All your units are placed. Move one, or buy a pack to place an extra one.",
    success: "Likes added",
    successBody: "{units} attribution unit(s) added. Like-time starts only when you place them.",
    seeWallet: "See my like",
    mockHint: "Mock payment: the like ledger is separate from XAF. No real money.",
    txPurchase: "+{units} likes purchased (mock ledger)",
    txAllocate: "Like placed on {name}",
    txRelease: "Like removed from {name}",
    paymentFailed: "Payment failed. No like was credited.",
    payments: "Pack payments",
    credited: "Credited",
    notCredited: "Not credited",
    sourcePurchased: "Purchased",
    sourceFree: "Included",
    sourceBonus: "Certified bonus",
    oneLikeHint: "You have a personal like, plus extra units if you bought some. Like-time is only created while a unit stays placed.",
    extraUnits: "{n} free unit(s) of {total}",
    placedTitle: "Your like",
    receivedTitle: "Who placed their like on you",
    productionTitle: "What you produce",
    packsNote: "Buying a pack adds attribution units. It does not mint received like-time: time starts only when a unit stays placed.",
  },
  admin: {
    title: "Back office",
    home: "Overview",
    users: "Users",
    posts: "Content",
    events: "Meetups",
    payments: "Payments",
    likes: "Like anomalies",
    reports: "Reports",
    forbidden: "Access denied",
    forbiddenBody: "The back office is for the TipTop team only.",
    usersCount: "Accounts",
    blockedCount: "Blocked",
    postsCount: "Posts",
    hiddenCount: "Hidden",
    eventsCount: "Published meetups",
    paymentsCount: "Successful payments",
    openReports: "Open reports",
    search: "Search an account",
    certify: "Certify",
    uncertify: "Remove certif",
    block: "Block",
    unblock: "Unblock",
    hide: "Hide",
    unhide: "Restore",
    cancelEvent: "Cancel meetup",
    refund: "Refund (mock)",
    refunded: "Refunded",
    mockRefundHint: "Mock XAF ledger refund. Already credited likes stay.",
    anomalyBurst: "Allocation burst",
    anomalyBalance: "High balance",
    anomalyUnused: "Unused packs",
    noAnomalies: "No anomalies right now.",
    report: "Report",
    reportTitle: "Report",
    reportBody: "Short note. The TipTop team will see this report.",
    reportSent: "Report sent.",
    reasonSpam: "Spam",
    reasonAbuse: "Abuse",
    reasonFake: "Fake account / content",
    reasonOther: "Other",
    sendReport: "Send",
    dismiss: "Dismiss",
    dismissed: "Dismissed",
    actioned: "Actioned",
    open: "Open",
    hidden: "Hidden",
    empty: "Nothing to show.",
    roleAdmin: "Admin",
    roleMod: "Moderation",
    statusActive: "Active",
    statusBlocked: "Blocked",
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
