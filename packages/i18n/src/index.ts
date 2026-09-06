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
    oauthUsePhone: string;
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
    yourStatus: string;
    emptyTitle: string;
    emptyBody: string;
    retry: string;
    locationFallback: string;
    outNow: string;
    outNowEmpty: string;
    seeAll: string;
    needHint: string;
    feedHintFollowed: string;
    feedHintLocal: string;
    feedHintAlive: string;
    justAvailable: string;
    justAvailableBody: string;
  };
  need: {
    title: string;
    searchPlaceholder: string;
    nearby: string;
    cheapest: string;
    allKinds: string;
    product: string;
    service: string;
    empty: string;
    emptyBody: string;
    listOffer: string;
    myOffers: string;
    goThere: string;
    seller: string;
    createTitle: string;
    titlePlaceholder: string;
    pricePlaceholder: string;
    shopName: string;
    sellerPerson: string;
    sellerShop: string;
    sellerBusiness: string;
    listed: string;
    hide: string;
    directions: string;
    maxKm: string;
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
    offers: string;
    wallet: string;
    perHour: string;
    perDay: string;
    perMonth: string;
    comingSoon: string;
    admin: string;
    newBadge: string;
    downloadApk: string;
  };
  settings: {
    title: string;
    darkMode: string;
    language: string;
    currency: string;
    currencyHint: string;
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
    status: string;
    statusHint: string;
    edit: string;
    bio: string;
    bioHint: string;
    website: string;
    websiteHint: string;
    interests: string;
    interestsHint: string;
    birthDate: string;
    country: string;
    avatar: string;
    cover: string;
    phoneLocked: string;
    location: string;
    changeZone: string;
    blocked: string;
    blockedEmpty: string;
    unblock: string;
    viewPublic: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    continue: string;
    skip: string;
    next: string;
    getStarted: string;
    slide1Title: string;
    slide1Body: string;
    slide2Title: string;
    slide2Body: string;
    slide3Title: string;
    slide3Body: string;
    slide4Title: string;
    slide4Body: string;
    interestsTitle: string;
    interestsHint: string;
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
    shares: string;
    addComment: string;
    reply: string;
    replyTo: string;
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
    likeDockOn: string;
    likeDockAria: string;
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
    searchSuggestions: string;
    searchAround: string;
    markAllRead: string;
    notifNew: string;
    notifEarlier: string;
    notifLike: string;
    notifLikeProfile: string;
    notifLikePost: string;
    notifLikeMood: string;
    notifLikeComment: string;
    notifLikeWish: string;
    notifLikePostMany: string;
    notifLikeMoodMany: string;
    notifLikeCommentMany: string;
    notifLikeWishMany: string;
    notifLikeProfileMany: string;
    notifComment: string;
    notifCommentMany: string;
    notifCommentMoodMany: string;
    notifCommentMood: string;
    notifFollow: string;
    notifInviteConsult: string;
    notifInviteTitle: string;
    notifInviteSeeEvent: string;
    notifInviteExpired: string;
    searchNotifs: string;
    emptyNotifs: string;
    chatLater: string;
    inviteLater: string;
    eventsLater: string;
    noImageHint: string;
    seeMore: string;
    seeLess: string;
    posted: string;
    notifInvite: string;
    notifTicket: string;
    notifPayment: string;
    notifPaymentRefund: string;
    notifPaymentRefundPartial: string;
    notifMessage: string;
    notifReview: string;
    notifEventUpdate: string;
    notifEventCancelled: string;
    notifEventTimeChanged: string;
    notifEventPlaceChanged: string;
    notifGroupInvite: string;
    share: string;
    copied: string;
    copyLink: string;
    moreOptions: string;
    blockUser: string;
    deletePost: string;
    deletePostConfirm: string;
    deletePostLinkedToEvent: string;
    postDeleted: string;
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
    perHour: string;
    perDay: string;
    perMonth: string;
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
    consultTitle: string;
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
    unsure: string;
    availableUntil: string;
    goAvailable: string;
    goHidden: string;
    goUnsure: string;
    myStatus: string;
    seeProfile: string;
    locating: string;
    geoDenied: string;
    retryGeo: string;
    ttlHint: string;
    zoneTitle: string;
    zoneBody: string;
    useCurrentLocation: string;
    currentLocation: string;
    locationFixed: string;
    locationLiveHint: string;
    locationFixedHint: string;
    fromYou: string;
    goThere: string;
    precision: string;
    precisionExact: string;
    precisionZone: string;
    precisionCity: string;
    precisionHidden: string;
    approximate: string;
    peopleTitle: string;
    peopleNearby: string;
    peopleAvailableAround: string;
    peopleFriendsAvailable: string;
    peopleEmpty: string;
    peopleEmptyBody: string;
    peopleFriends: string;
    peopleAround: string;
    peopleLater: string;
    peopleFriendsEmpty: string;
    peopleAroundEmpty: string;
    peopleLaterEmpty: string;
    circleFriend: string;
    circleAround: string;
    circleLater: string;
    invite: string;
    inviteJoin: string;
    previousPerson: string;
    passPerson: string;
    filters: string;
    filtersActive: string;
    applyFilters: string;
    clearFilters: string;
    presenceAll: string;
    presenceFilter: string;
    onlyAvailable: string;
    maxDistance: string;
    minAge: string;
    maxAge: string;
    professionFilter: string;
    message: string;
    saveForLater: string;
    savedForLater: string;
    removeFromLater: string;
    addFriend: string;
    addedFriend: string;
    age: string;
    distance: string;
    nextPerson: string;
    eventsAll: string;
    eventsMine: string;
    eventsEmpty: string;
    eventsEmptyBody: string;
    eventsManageEmptyBody: string;
    eventsCreatedTitle: string;
    eventsAttendingTitle: string;
    eventsInvitesShortcut: string;
    eventPublished: string;
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
    allowGroups: string;
    allowGroupsHint: string;
    enableGroups: string;
    groupsTitle: string;
    groupsEmpty: string;
    createGroup: string;
    groupNamePlaceholder: string;
    inviteToGroup: string;
    acceptGroup: string;
    declineGroup: string;
    leaveGroup: string;
    makeAdmin: string;
    removeAdmin: string;
    groupAdmin: string;
    groupHost: string;
    membersCount: string;
    openGroupChat: string;
    groupCandidatesEmpty: string;
    groupInvited: string;
    deleteGroup: string;
    paymentHold: string;
    paymentFirst: string;
    paymentRequired: string;
    paymentHoldHint: string;
    paymentFirstHint: string;
    paymentRequiredHint: string;
    interested: string;
    notInterested: string;
    heartEvent: string;
    heartTransferTitle: string;
    heartTransferBody: string;
    free: string;
    paid: string;
    host: string;
    peopleLinked: string;
    peopleLinkedNamed: string;
    peopleLinkedEmpty: string;
    peopleHiddenHint: string;
    peopleOnlyYou: string;
    showParticipation: string;
    hideParticipation: string;
    bookLater: string;
    moodCreate: string;
    moodCreateShort: string;
    statusCreate: string;
    statusCameraHint: string;
    moodInterest: string;
    moodPermanentHint: string;
    statusFriendsHint: string;
    moodVideoRequired: string;
    videoTypeNotAllowed: string;
    visPublic: string;
    typeStatus: string;
    moodMore: string;
    moodActions: string;
    moodAudioOriginal: string;
    moodAudioNamed: string;
    moodCommentsEmpty: string;
    moodRetake: string;
    moodAddText: string;
    moodAddSound: string;
    moodSoundTitle: string;
    moodSoundOriginal: string;
    moodSoundOff: string;
    moodSoundPulse: string;
    moodSoundNight: string;
    moodSoundGlow: string;
    moodFlip: string;
    moodStopRecord: string;
    moodCameraDenied: string;
    moodCameraHint: string;
    moodPlay: string;
    moodPause: string;
    moodEmpty: string;
    moodEmptyBody: string;
    moodHours: string;
    moodVisibility: string;
    visZone: string;
    visFollowers: string;
    moodLinkEventNone: string;
    moodCompanionNone: string;
    moodWith: string;
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
    typeOffer: string;
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
    eventInLabel: string;
    inviteNamed: string;
    seeAll: string;
    eventsInterested: string;
    eventsLinked: string;
    eventsLinkedNamed: string;
    eventsPaneInterested: string;
    eventsPaneLinked: string;
    eventsPaneWishes: string;
    organizedBy: string;
    myWantedEvent: string;
    theirWantedEvent: string;
    createWanted: string;
    createWantedHint: string;
    wantedTitlePlaceholder: string;
    wantedDate: string;
    wantedCity: string;
    wantedSave: string;
    wantedEmpty: string;
    wantedEmptySelf: string;
    moreAbout: string;
    profileOffer: string;
    profileMyWishes: string;
    showOnProfile: string;
    hideOnProfile: string;
    participantsCount: string;
    participantsCountOne: string;
    interestedBadge: string;
    recurrenceLabel: string;
    recurrenceNone: string;
    recurrenceDaily: string;
    recurrenceWeekly: string;
    recurrenceMonthly: string;
    recurrenceHint: string;
    recursDaily: string;
    recursWeekly: string;
    recursMonthly: string;
    nextDates: string;
    formatAfterwork: string;
    formatBrunch: string;
    formatClub: string;
    formatDaily: string;
    countryCM: string;
    moreActions: string;
    askFriend: string;
    reservationsCount: string;
    seatsLeft: string;
    seatsLeftOne: string;
    seatsFull: string;
    interestedCount: string;
    friendsGoing: string;
    friendsGoingOne: string;
    networkGoing: string;
    networkGoingOne: string;
    whySharedInterests: string;
    whySharedInterestsOne: string;
    whyNearbyAvailable: string;
    whyMood: string;
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
    moodAddPlace: string;
    moodAddPlaceHint: string;
    moodPlaceName: string;
    moodPlaceAddress: string;
    moodPlaceSearch: string;
    moodUseMyLocation: string;
    moodLocating: string;
    moodLocationDenied: string;
    moodLocationUnavailable: string;
    moodLocationClear: string;
    moodOpenMap: string;
    moodDirections: string;
    moodPlaceSheetTitle: string;
    moodGeocodeEmpty: string;
  };
  booking: {
    reserve: string;
    bookSelf: string;
    bookEventTitle: string;
    forMyself: string;
    inviteFriends: string;
    inviteSearch: string;
    inviteCircleFriends: string;
    inviteCircleNearby: string;
    inviteCircleLater: string;
    friendsEmpty: string;
    nearbyEmpty: string;
    laterEmpty: string;
    saveForLater: string;
    savedForLater: string;
    removeFromLater: string;
    browseList: string;
    browseCards: string;
    browseHint: string;
    continueConfirm: string;
    backToPeople: string;
    pickForSeat: string;
    pickedForSeat: string;
    nextProfile: string;
    skipProfile: string;
    intentPayNow: string;
    intentPayNowHint: string;
    intentWaitAccept: string;
    intentWaitAcceptHint: string;
    intentGuestPays: string;
    intentGuestPaysHint: string;
    payFirstNotice: string;
    payRequiredNotice: string;
    holdWaitNotice: string;
    waitNoHoldNotice: string;
    waitNotAllowed: string;
    payAcceptedSeat: string;
    waitPayPendingHint: string;
    waitAcceptCta: string;
    guestPaysCta: string;
    invitesSent: string;
    awaitingHostPay: string;
    goToPayment: string;
    bookTotal: string;
    bookPickSomeone: string;
    seatsPicking: string;
    bookAlready: string;
    bookAlreadyOthers: string;
    reserveOthers: string;
    bookHost: string;
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
    tabAllNamed: string;
    tabInterestedNamed: string;
    tabReservedNamed: string;
    tabValidatedNamed: string;
    scanCameraHint: string;
    scanCameraDenied: string;
    scanNext: string;
    hostPeopleEmpty: string;
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
    searchInbox: string;
    send: string;
    placeholder: string;
    image: string;
    attach: string;
    emoji: string;
    voice: string;
    voiceMock: string;
    typing: string;
    typingMany: string;
    typingOthers: string;
    online: string;
    onlineOf: string;
    members: string;
    hostBadge: string;
    yesterday: string;
    seeProfile: string;
    seeEvent: string;
    menu: string;
    attachTooBig: string;
    file: string;
    sticker: string;
    inviteCard: string;
    recording: string;
    stopRecord: string;
    cancelRecord: string;
    lastSeenJustNow: string;
    lastSeenMinutes: string;
    lastSeenHours: string;
    lastSeenDay: string;
    home: string;
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
    moods: string;
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
    refundedPartial: string;
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
    monetization: string;
    platformFee: string;
    platformFeeHint: string;
    platformFeeSaved: string;
    platformFeeInvalid: string;
    ticketVsFee: string;
    saveFee: string;
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
    oauthSoonBody: "Google, Facebook et Apple arrivent. En attendant, ton numéro ouvre TipTop en quelques secondes.",
    oauthUsePhone: "Continuer avec mon numéro",
  },
  nav: {
    home: "Home",
    mood: "Mood",
    add: "Add post",
    people: "Amies",
    events: "Events",
  },
  home: {
    yourMood: "Ton statut",
    yourStatus: "Ton statut",
    emptyTitle: "Rien dans ta zone pour l’instant",
    emptyBody: "Quand des personnes publient ou créent une sortie près de toi, ça apparaîtra ici.",
    retry: "Réessayer",
    locationFallback: "Choisir une zone",
    outNow: "Dehors maintenant",
    outNowEmpty: "Personne de dispo autour de toi. Déclare-toi disponible pour apparaître ici.",
    seeAll: "Voir",
    needHint: "Pain, pressing, coiffeur…",
    feedHintFollowed: "Vient de publier · tu la suis",
    feedHintLocal: "Près de toi",
    feedHintAlive: "Beaucoup de vie en ce moment",
    justAvailable: "{name} est dispo",
    justAvailableBody: "Propose-lui une sortie.",
  },
  need: {
    title: "Autour de moi",
    searchPlaceholder: "Tu cherches quoi ?",
    nearby: "Les plus proches",
    cheapest: "Les moins chers",
    allKinds: "Tout",
    product: "Produit",
    service: "Service",
    empty: "Rien autour de toi pour ça",
    emptyBody: "Change de mot, élargis la distance, ou publie l’offre si tu l’as.",
    listOffer: "Publier une offre",
    myOffers: "Mes offres",
    goThere: "Y aller",
    seller: "Proposé par",
    createTitle: "Publier une offre",
    titlePlaceholder: "Ex. Pain chaud, pressing, tresses",
    pricePlaceholder: "Prix ({currency})",
    shopName: "Nom de la boutique (optionnel)",
    sellerPerson: "Particulier",
    sellerShop: "Boutique",
    sellerBusiness: "Entreprise",
    listed: "Offre publiée",
    hide: "Retirer l’offre",
    directions: "Itinéraire",
    maxKm: "Max km",
  },
  menu: {
    title: "Menu",
    tickets: "Les Tickets",
    favorites: "Mes Favoris",
    contacts: "Mes Contacts",
    payments: "Information de paiement",
    settings: "Paramètres",
    help: "Aide",
    likes: "Ma vie",
    ranking: "Classement",
    wishes: "Mes envies",
    invitations: "Mes rencontres",
    offers: "Mes offres",
    wallet: "Ma vie",
    perHour: "cette heure",
    perDay: "aujourd’hui",
    perMonth: "ce mois",
    comingSoon: "Cette section arrive dans une prochaine phase — le bouton n’invente pas de données.",
    admin: "Back-office",
    newBadge: "NEW",
    downloadApk: "Télécharger l’APK",
  },
  settings: {
    title: "Paramètres",
    darkMode: "Mode sombre",
    language: "Langue",
    currency: "Devise",
    currencyHint: "Les prix s’affichent dans ta monnaie. L’organisateur encaisse dans la sienne.",
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
    status: "Ton état",
    statusHint: "Tu le choisis ici. Les autres le voient sur ton profil et autour d’elles — elles ne peuvent pas le changer.",
    edit: "Modifier",
    bio: "À propos de toi",
    bioHint: "Quelques mots pour que les autres te reconnaissent IRL.",
    website: "Site ou réseau",
    websiteHint: "Sans https:// — exemple : tiptop.cm",
    interests: "Centres d’intérêt",
    interestsHint: "On t’en montrera les moods publics.",
    birthDate: "Date de naissance",
    country: "Pays",
    avatar: "Photo de profil",
    cover: "Photo de couverture",
    phoneLocked: "Le numéro se change uniquement par un nouvel OTP.",
    location: "Ta zone",
    changeZone: "Changer de zone",
    blocked: "Personnes bloquées",
    blockedEmpty: "Tu n’as bloqué personne.",
    unblock: "Débloquer",
    viewPublic: "Voir mon profil public",
  },
  onboarding: {
    title: "Complète ton profil",
    subtitle: "Les autres doivent pouvoir te reconnaître dans la vraie vie.",
    continue: "Entrer dans TipTop",
    skip: "Passer",
    next: "Suivant",
    getStarted: "C'est parti",
    slide1Title: "Du virtuel au réel",
    slide1Body: "TipTop n'est pas un réseau social de plus. C'est l'application qui t'aide à transformer une interaction en écran en vraie rencontre.",
    slide2Title: "Découvre ce qui se passe autour de toi",
    slide2Body: "Événements, personnes disponibles, sorties du moment : découvre ce qui t'entoure, où que tu sois.",
    slide3Title: "Partage ce que tu vis, maintenant",
    slide3Body: "Avec Mood, montre en direct où tu es et ce que tu fais — et donne envie à d'autres de te rejoindre.",
    slide4Title: "Invite, réserve, vis l'expérience",
    slide4Body: "Une vie, une invitation, une réservation : chaque interaction sur TipTop peut se terminer par une vraie rencontre.",
    interestsTitle: "Tes centres d’intérêt",
    interestsHint: "Les moods publics suivent ce que tu aimes.",
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
    shares: "Partages",
    addComment: "Ajouter un commentaire",
    reply: "Répondre",
    replyTo: "Répondre à {name}",
    follow: "Suivre",
    following: "Abonné",
    unfollow: "Ne plus suivre",
    likePerson: "Poser ma vie",
    unlike: "Retirer ma vie",
    transferTitle: "Déplacer ta vie ?",
    transferBody: "Tu n’as qu’une vie. Elle quittera {name} pour aller chez cette personne.",
    likeSelf: "Tu ne peux pas te donner ta vie.",
    likePlace: "Poser ma vie",
    likeHere: "Ma vie est ici",
    likePlacedOn: "Ta vie est chez {name}",
    likeIdle: "Ta vie n’est posée sur personne pour l’instant.",
    likeDockOn: "{duration} · {label}",
    likeDockAria: "Ta vie tourne depuis {duration} sur {label}",
    likeExplain: "Chacun n’a qu’une vie. Tu la poses sur une personne, une publication, un mood ou un commentaire. Si tu la poses ailleurs, elle se déplace.",
    likesNow: "{n} vies maintenant",
    likeReceivedTitle: "Qui lui a posé sa vie",
    likeGivenTitle: "Sa vie est chez",
    likeEmptyReceived: "Personne n’a encore posé sa vie ici.",
    likeProduction: "Capital de vie",
    perHourLong: "cette heure",
    perDayLong: "aujourd’hui",
    perMonthLong: "ce mois",
    perSecond: "/seconde",
    likeMeterHint: "Le capital, c’est le temps de vie reçu sur les contenus et interactions éligibles — pas un compteur de cœurs.",
    likeMeterHintSelf: "Ton capital, c’est le temps de vie reçu sur tes contenus éligibles. Il continue de grandir tant que des vies restent posées.",
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
    searchSuggestions: "Suggestions près de toi",
    searchAround: "Autour de {place}",
    markAllRead: "Tout marquer comme lu",
    notifNew: "Nouveau",
    notifEarlier: "Plus tôt",
    notifLike: "t’a posé sa vie",
    notifLikeProfile: "t’a posé sa vie",
    notifLikePost: "t’a posé sa vie sur ta publication",
    notifLikeMood: "t’a posé sa vie sur ton mood",
    notifLikeComment: "t’a posé sa vie sur ton commentaire",
    notifLikeWish: "t’a posé sa vie sur ton envie",
    notifLikePostMany: "{name} et d’autres ont posé leur vie sur ta publication",
    notifLikeMoodMany: "{name} et d’autres ont posé leur vie sur ton mood",
    notifLikeCommentMany: "{name} et d’autres ont posé leur vie sur ton commentaire",
    notifLikeWishMany: "{name} et d’autres ont posé leur vie sur ton envie",
    notifLikeProfileMany: "{name} et d’autres ont posé leur vie",
    notifComment: "a commenté ta publication",
    notifCommentMany: "{name} et d’autres ont commenté ta publication",
    notifCommentMoodMany: "{name} et d’autres ont commenté ton mood",
    notifCommentMood: "a commenté ton mood",
    notifFollow: "t’a suivi",
    notifInviteConsult: "Consulter l’invitation",
    notifInviteTitle: "Invitation",
    notifInviteSeeEvent: "Voir la sortie",
    notifInviteExpired: "Cette invitation n’est plus valable.",
    searchNotifs: "Rechercher une notification",
    emptyNotifs: "Pas encore de notifications.",
    chatLater: "Ouvre une vraie conversation — pas un faux chat.",
    inviteLater: "Les invitations vers un événement arrivent avec le cœur « monde réel ».",
    eventsLater: "Les événements ne sont pas encore indexés.",
    noImageHint: "Visuel local de démo (stockage objet plus tard).",
    seeMore: "Voir plus",
    seeLess: "Voir moins",
    posted: "Publication envoyée",
    notifInvite: "t’a invité à une sortie",
    notifTicket: "ticket mis à jour",
    notifPayment: "paiement mis à jour",
    notifPaymentRefund: "Ton paiement a été remboursé.",
    notifPaymentRefundPartial: "Ton paiement a été remboursé partiellement.",
    notifMessage: "t’a écrit",
    notifReview: "a laissé un avis sur ta sortie",
    notifEventUpdate: "Un événement auquel tu participes a été mis à jour.",
    notifEventCancelled: "Un événement auquel tu participes a été annulé.",
    notifEventTimeChanged: "L'heure d'un événement auquel tu participes a changé.",
    notifEventPlaceChanged: "Le lieu d'un événement auquel tu participes a changé.",
    notifGroupInvite: "t’invite dans un groupe de cette sortie",
    share: "Partager",
    copied: "Lien copié",
    copyLink: "Copier le lien",
    moreOptions: "Plus d'options",
    blockUser: "Bloquer cette personne",
    deletePost: "Supprimer la publication",
    deletePostConfirm: "Cette publication sera définitivement supprimée. Cette action est irréversible.",
    deletePostLinkedToEvent: "Cette publication est liée à un événement — gère-la depuis l'écran de gestion de l'événement.",
    postDeleted: "Cette publication a été supprimée.",
    justNow: "À l’instant",
    minutesAgo: "Il y a {n} min",
    hoursAgo: "Il y a {n} heures",
    daysAgo: "Il y a {n} j",
    moodsTab: "Moods",
    ofLikes: "de vie",
    notifWish: "propose de t’offrir une envie",
    notifMilestone: "Nouveau palier de vie",
    notifSocialInvite: "t’a proposé une sortie",
    notifSocialInviteAccepted: "a accepté ta sortie",
    transferGeneric: "Ta vie quittera sa cible actuelle pour aller ici.",
    wishesLabel: "Envies",
    moodsLabel: "Mood",
  },
  likeTime: {
    capital: "Temps de vie",
    weekPlus: "+ {duration} cette semaine",
    lastMilestone: "{label} atteint le {date}",
    noMilestone: "Aucun palier encore",
    ranking: "Top temps de vie",
    rankingAll: "Tout",
    rankingWeek: "Cette semaine",
    rankingMonth: "Ce mois",
    close: "Fermer",
    historyTitle: "Périodes reçues",
    activeNow: "en cours",
    ofDuration: "{duration} de vie",
    perHour: "/H",
    perDay: "/J",
    perMonth: "/M",
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
    consultTitle: "Proposition de sortie",
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
    unavailable: "Indisponible",
    unsure: "Je ne sais pas",
    availableUntil: "Dispo jusqu’à {time}",
    goAvailable: "Je suis dispo",
    goHidden: "Indisponible",
    goUnsure: "Je ne sais pas",
    myStatus: "Ton état",
    seeProfile: "Voir le profil",
    locating: "Distance depuis ta position…",
    geoDenied: "Distance depuis ta zone — active le GPS pour plus de précision",
    retryGeo: "Activer le GPS",
    ttlHint: "Visible 4 heures, puis tu disparais du carousel.",
    zoneTitle: "Ta zone",
    zoneBody: "La zone filtre les personnes et les sorties près de toi. Le GPS propose, il ne force pas.",
    useCurrentLocation: "Utiliser ma position actuelle",
    currentLocation: "Position actuelle",
    locationFixed: "Position figée",
    locationLiveHint: "Les distances utilisent ta position réelle.",
    locationFixedHint: "Les distances utilisent l’endroit que tu as choisi.",
    fromYou: "de toi",
    goThere: "S’y rendre",
    precision: "Précision de localisation",
    precisionExact: "Exacte",
    precisionZone: "Zone",
    precisionCity: "Ville",
    precisionHidden: "Masquée",
    approximate: "Zone approximative",
    peopleTitle: "Autour de moi",
    peopleNearby: "Autour de moi",
    peopleAvailableAround: "Disponibles autour",
    peopleFriendsAvailable: "Amies disponibles",
    peopleEmpty: "Personne ici",
    peopleEmptyBody: "Élargis tes filtres ou change d’onglet. TipTop ne remplit pas ce carousel avec le monde entier.",
    peopleFriends: "Amies",
    peopleAround: "Autour",
    peopleLater: "Mis de côté",
    peopleFriendsEmpty: "Tes amies apparaissent après une invitation acceptée.",
    peopleAroundEmpty: "Personne autour de toi dans cette zone.",
    peopleLaterEmpty: "Personne de côté. Tu peux y poser quelqu’un pour plus tard.",
    circleFriend: "Amie",
    circleAround: "Autour",
    circleLater: "De côté",
    invite: "Inviter",
    inviteJoin: "Inviter à me rejoindre",
    previousPerson: "Précédent",
    passPerson: "Passer",
    filters: "Filtres",
    filtersActive: "Filtres · {n}",
    applyFilters: "Appliquer",
    clearFilters: "Effacer",
    presenceAll: "Tous les états",
    presenceFilter: "État",
    onlyAvailable: "Disponibles seulement",
    maxDistance: "Distance max (km)",
    minAge: "Âge min",
    maxAge: "Âge max",
    professionFilter: "Profession",
    message: "Message",
    saveForLater: "Plus tard",
    savedForLater: "Mis de côté",
    removeFromLater: "Retirer",
    addFriend: "Ajouter comme amie",
    addedFriend: "Déjà amie",
    age: "{age} ans",
    distance: "{km} km",
    nextPerson: "Suivant",
    eventsAll: "Tous",
    eventsMine: "Mes événements",
    eventsEmpty: "Pas de sortie ici",
    eventsEmptyBody: "Crée une sortie ou change de zone. Pas de catalogue mondial.",
    eventsManageEmptyBody: "Tu n'as encore créé ni rejoint aucun événement. Découvre-en dans le fil d'accueil, ou crée le tien.",
    eventsCreatedTitle: "Créés par moi",
    eventsAttendingTitle: "J'y participe",
    eventsInvitesShortcut: "Mes invitations",
    eventPublished: "Publié",
    createEvent: "Créer un événement",
    eventTitle: "Titre de la sortie",
    eventDescription: "Description",
    eventWhen: "Date et heure",
    eventVenue: "Lieu",
    eventPrice: "Prix ({currency}, 0 = gratuit)",
    eventPriceHint: "Un prix ouvre une réservation. Le paiement arrive en Phase 4.",
    eventCapacity: "Capacité (optionnel)",
    eventMinAge: "Âge minimum (ex. 18)",
    eventReserve: "Réservation obligatoire même si gratuit",
    allowGroups: "Autoriser les groupes de participants",
    allowGroupsHint: "Les gens peuvent former une équipe pour cette sortie. Toi tu l’administres, et tu peux ajouter d’autres admins.",
    enableGroups: "Activer les groupes",
    groupsTitle: "Groupes",
    groupsEmpty: "Pas encore de groupe pour cette sortie.",
    createGroup: "Créer un groupe",
    groupNamePlaceholder: "Ex. Table 4, Voiture A",
    inviteToGroup: "Inviter",
    acceptGroup: "Rejoindre",
    declineGroup: "Refuser",
    leaveGroup: "Quitter",
    makeAdmin: "Ajouter comme admin",
    removeAdmin: "Retirer l’admin",
    groupAdmin: "Admin",
    groupHost: "Créateur",
    membersCount: "{n} membres",
    openGroupChat: "Ouvrir le groupe",
    groupCandidatesEmpty: "Personne à inviter pour l’instant.",
    groupInvited: "Invité",
    deleteGroup: "Supprimer le groupe",
    paymentHold: "On peut tenir une place en attente de paiement",
    paymentFirst: "Pas de réservation sans paiement",
    paymentRequired: "Il faut payer tout de suite pour réserver",
    paymentHoldHint: "Une place peut être calée, puis payée. Si quelqu’un refuse, elle se libère.",
    paymentFirstHint: "Aucune place n’est calée tant que le paiement n’est pas passé. On peut quand même inviter et attendre.",
    paymentRequiredHint: "Pas d’invitation « ils acceptent puis je paie ». Soit tu paies maintenant, soit chacun paie sa place.",
    interested: "Intéressé",
    notInterested: "Plus intéressé",
    heartEvent: "Coup de cœur",
    heartTransferTitle: "Changer de coup de cœur ?",
    heartTransferBody: "Ton coup de cœur quittera « {title} » pour cette sortie.",
    free: "Gratuit",
    paid: "{amount}",
    host: "Hôte",
    peopleLinked: "Personnes liées",
    peopleLinkedNamed: "Personnes liées à l’événement ({n})",
    peopleLinkedEmpty: "Personne n’a encore accepté d’apparaître ici.",
    peopleHiddenHint: "Ta participation est masquée. Les autres ne te voient pas dans cette liste.",
    peopleOnlyYou: "Toi seulement",
    showParticipation: "Afficher ma participation",
    hideParticipation: "Masquer ma participation",
    bookLater: "Réserver et payer arrive en Phase 4. Ici tu peux t’intéresser, mettre un coup de cœur, ou inviter sur une sortie gratuite.",
    moodCreate: "Créer un mood",
    moodCreateShort: "Créer",
    statusCreate: "Créer un statut",
    statusCameraHint: "Visible 24 h, uniquement tes ami·es.",
    moodInterest: "Centre d’intérêt",
    moodPermanentHint: "Vidéo pérenne, publique selon tes centres d’intérêt.",
    statusFriendsHint: "Statut 24 h — seulement tes ami·es.",
    moodVideoRequired: "Un mood est une vidéo. Filme, importe ou choisis un modèle.",
    videoTypeNotAllowed: "Ce format vidéo n’est pas accepté. Essaie un MP4 ou WebM.",
    visPublic: "Public",
    typeStatus: "Statut",
    moodMore: "Plus",
    moodActions: "Autres actions",
    moodAudioOriginal: "Audio • Original",
    moodAudioNamed: "Audio • {name}",
    moodCommentsEmpty: "Sois le premier à commenter.",
    moodRetake: "Reprendre",
    moodAddText: "Texte",
    moodAddSound: "Son",
    moodSoundTitle: "Choisir un son",
    moodSoundOriginal: "Son original",
    moodSoundOff: "Sans son",
    moodSoundPulse: "Pulse Yaoundé",
    moodSoundNight: "Nuit douce",
    moodSoundGlow: "Glow",
    moodFlip: "Retourner",
    moodStopRecord: "Stop",
    moodCameraDenied: "Caméra indisponible. Importe une vidéo ou choisis un modèle.",
    moodCameraHint: "Filme, puis ajoute un son, un lieu ou du texte.",
    moodPlay: "Lire",
    moodPause: "Mettre en pause",
    moodEmpty: "Aucun mood public",
    moodEmptyBody: "Un mood est une vidéo pérenne. Tu vois celles de tout le monde selon tes centres d’intérêt.",
    moodHours: "Durée (heures)",
    moodVisibility: "Visibilité",
    visZone: "Ma zone",
    visFollowers: "Abonnés",
    moodLinkEventNone: "Associer à un événement (optionnel)",
    moodCompanionNone: "Avec qui es-tu ? (optionnel)",
    moodWith: "Avec {name}",
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
    typeOffer: "Offre",
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
    eventInLabel: "Événement dans :",
    inviteNamed: "+ Inviter {name}",
    seeAll: "Tous voir",
    eventsInterested: "Événements qui m’intéressent",
    eventsLinked: "{n} événement(s) lié(s)",
    eventsLinkedNamed: "{n} événement(s) lié(s) à {name}",
    eventsPaneInterested: "Intéressé",
    eventsPaneLinked: "Liés",
    eventsPaneWishes: "Envies",
    organizedBy: "Par {name}",
    myWantedEvent: "Ton envie",
    theirWantedEvent: "Envie de {name}",
    createWanted: "Créer une envie d’événement",
    createWantedHint: "Un événement que tu veux, même s’il n’existe pas encore ailleurs.",
    wantedTitlePlaceholder: "Ex. brunch jazz à Bastos",
    wantedDate: "Quand",
    wantedCity: "Ville",
    wantedSave: "Ajouter",
    wantedEmpty: "Aucun événement ici pour l’instant.",
    wantedEmptySelf: "Marque un événement ou crée une envie.",
    moreAbout: "Plus d’infos à propos de {name}",
    profileOffer: "À offrir à {name}",
    profileMyWishes: "Tes envies",
    showOnProfile: "Visible sur mon profil",
    hideOnProfile: "Masqué du profil",
    participantsCount: "{n} participants",
    participantsCountOne: "1 participant",
    interestedBadge: "Intéressé",
    recurrenceLabel: "Cette sortie se répète",
    recurrenceNone: "Une seule date",
    recurrenceDaily: "Tous les jours",
    recurrenceWeekly: "Toutes les semaines",
    recurrenceMonthly: "Tous les mois",
    recurrenceHint: "On crée les prochaines dates pour toi. Même lieu, même prix, même règles.",
    recursDaily: "Tous les jours",
    recursWeekly: "Toutes les semaines",
    recursMonthly: "Tous les mois",
    nextDates: "Prochaines dates",
    formatAfterwork: "Afterwork",
    formatBrunch: "Brunch",
    formatClub: "Soirée club",
    formatDaily: "Tous les jours",
    countryCM: "Cameroun",
    moreActions: "Plus",
    askFriend: "Amie",
    reservationsCount: "Réservations",
    seatsLeft: "{count} places restantes",
    seatsLeftOne: "1 place restante",
    seatsFull: "Complet",
    interestedCount: "Intéressés",
    friendsGoing: "{count} amies participent",
    friendsGoingOne: "1 amie participe",
    networkGoing: "{count} personnes de ton réseau y vont",
    networkGoingOne: "1 personne de ton réseau y va",
    whySharedInterests: "{count} centres d’intérêt en commun",
    whySharedInterestsOne: "1 centre d’intérêt en commun",
    whyNearbyAvailable: "Disponible près de toi",
    whyMood: "Mood en cours près de tes goûts",
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
    moodAddPlace: "Ajouter un lieu",
    moodAddPlaceHint: "Optionnel. Seulement si tu veux montrer où tu es — tu peux taper l’adresse ou te géolocaliser.",
    moodPlaceName: "Nom du lieu",
    moodPlaceAddress: "Adresse",
    moodPlaceSearch: "Rechercher un lieu ou une adresse",
    moodUseMyLocation: "Me géolocaliser",
    moodLocating: "Localisation en cours…",
    moodLocationDenied: "Localisation refusée. Tu peux saisir l’adresse à la main.",
    moodLocationUnavailable: "Impossible de te localiser. Saisis l’adresse à la main.",
    moodLocationClear: "Retirer le lieu",
    moodOpenMap: "Voir sur la carte",
    moodDirections: "Y aller",
    moodPlaceSheetTitle: "Lieu",
    moodGeocodeEmpty: "Aucun lieu trouvé. Tu peux quand même enregistrer cette adresse.",
  },
  booking: {
    reserve: "Réserver",
    bookSelf: "Réserver pour moi",
    bookEventTitle: "Réserver l'évènement",
    forMyself: "Pour moi même",
    inviteFriends: "Inviter des amis",
    inviteSearch: "Rechercher quelqu’un",
    inviteCircleFriends: "Amis",
    inviteCircleNearby: "Autour",
    inviteCircleLater: "Plus tard",
    friendsEmpty: "Pas encore d’amis ici. Accepte une invitation, ou parcours Autour.",
    nearbyEmpty: "Personne d’autre autour pour l’instant.",
    laterEmpty: "Personne de côté. Sur Autour, mets de côté ceux que tu veux inviter plus tard.",
    saveForLater: "Mettre de côté",
    savedForLater: "Mis de côté",
    removeFromLater: "Retirer",
    browseList: "Liste",
    browseCards: "Cartes",
    browseHint: "Défile les profils comme sur Amis, puis cale la place.",
    continueConfirm: "Continuer",
    backToPeople: "Retour aux profils",
    pickForSeat: "Choisir pour cette place",
    pickedForSeat: "Choisi",
    nextProfile: "Profil suivant",
    skipProfile: "Passer",
    intentPayNow: "Je paie maintenant",
    intentPayNowHint: "Les places sont calées tout de suite. Pas besoin qu’ils acceptent.",
    intentWaitAccept: "Ils acceptent, puis je paie",
    intentWaitAcceptHint: "On envoie l’invitation. Tu paies seulement ceux qui disent oui.",
    intentGuestPays: "Chacun paie sa place",
    intentGuestPaysHint: "Ils acceptent, puis ils règlent leur entrée.",
    payFirstNotice: "Cet événement ne cale une place qu’après paiement.",
    payRequiredNotice: "Ici, pas de réservation sans payer maintenant. Tu ne peux pas attendre leur oui.",
    holdWaitNotice: "La place est tenue tout de suite. Tu paies seulement s’ils disent oui. S’ils refusent, elle se libère.",
    waitNoHoldNotice: "On envoie l’invitation sans caler la place. Elle n’est prise qu’après paiement.",
    waitNotAllowed: "Cet événement n’autorise pas d’attendre l’acceptation avant de payer.",
    payAcceptedSeat: "Payer la place",
    waitPayPendingHint: "En attente de leur oui. Tu paieras ensuite.",
    waitAcceptCta: "Inviter et attendre",
    guestPaysCta: "Envoyer l’invitation",
    invitesSent: "Invitations envoyées. On attend leur réponse.",
    awaitingHostPay: "Accepté. L’invitant doit encore payer la place.",
    goToPayment: "Passer au paiement",
    bookTotal: "Total · {amount}",
    bookPickSomeone: "Coche-toi ou au moins un ami.",
    seatsPicking: "{count} places restantes pour ce choix.",
    bookAlready: "Tu as déjà une place pour cette sortie.",
    bookAlreadyOthers: "Tu as déjà une place. Tu peux encore réserver pour quelqu’un d’autre.",
    reserveOthers: "Réserver pour un autre",
    bookHost: "C’est ta sortie — tu la gères, tu ne la réserves pas.",
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
    ticketQrLater: "Le QR s’affiche dès que ton billet est confirmé.",
    ticketQrHint: "Présente ce QR à l’entrée. L’organisateur le scanne pour valider.",
    validateTicket: "Valider ticket",
    tabAllNamed: "Tout ({n})",
    tabInterestedNamed: "Intéressés ({n})",
    tabReservedNamed: "Réservés ({n})",
    tabValidatedNamed: "Validés ({n})",
    scanCameraHint: "Cadre le QR du ticket dans le viseur.",
    scanCameraDenied: "Caméra indisponible. Colle le code du ticket.",
    scanNext: "Scanner le suivant",
    hostPeopleEmpty: "Personne dans cet onglet pour l’instant.",
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
    amount: "{amount}",
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
    likes: "Chacun a une vie personnelle transférable, plus des unités achetées. La valeur, c’est le temps pendant lequel une vie reste posée — pas un compteur. Le profil agrège ce temps sans double comptage.",
    reviews: "Après une sortie vécue (ticket validé), tu peux laisser un avis texte 24 h après la fin.",
    contact: "Support démo : memolicesar1@gmail.com — aucun ticket inventé.",
  },
  chat: {
    inbox: "Mes messages",
    empty: "Pas encore de conversation",
    emptyBody: "Écris à un contact, ou ouvre le groupe d’une sortie.",
    newTitle: "Nouvelle conversation",
    searchContact: "Chercher un contact",
    searchInbox: "Rechercher une conversation",
    send: "Envoyer",
    placeholder: "Écrire un message",
    image: "Image",
    attach: "Joindre une image",
    emoji: "Emoji",
    voice: "Vocale",
    voiceMock: "Message vocal",
    typing: "écrit…",
    typingMany: "{count} écrivent…",
    typingOthers: "+{count} autres écrivent",
    online: "En ligne",
    onlineOf: "{online} en ligne, sur {total} personnes",
    members: "personnes",
    hostBadge: "hôte",
    yesterday: "Hier",
    seeProfile: "Voir le profil",
    seeEvent: "Voir la sortie",
    menu: "Options",
    attachTooBig: "Cette pièce jointe est trop lourde.",
    file: "Fichier",
    sticker: "Stickers",
    inviteCard: "Invitation",
    recording: "Enregistrement…",
    stopRecord: "Envoyer le vocal",
    cancelRecord: "Annuler",
    lastSeenJustNow: "Vu à l’instant",
    lastSeenMinutes: "Vu il y a {n} min",
    lastSeenHours: "Vu il y a {n} h",
    lastSeenDay: "Vu {day}",
    home: "Accueil",
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
    title: "Ma vie",
    buyTitle: "Acheter de la vie",
    available: "Libre",
    total: "Ta vie",
    allocated: "Posée",
    emptyAlloc: "Ta vie n’est posée sur personne pour l’instant.",
    emptyHistory: "Pas encore d’historique.",
    history: "Historique",
    packs: "Packs mock",
    packLabel: "{units} vies",
    buy: "Acheter",
    buyCta: "Choisir un pack",
    buyInstead: "Un pack ajoute des unités à poser. Le temps de vie n’est créé que si elles restent attribuées.",
    needPack: "Plus d’unité libre",
    needPackBody: "Toutes tes unités sont posées. Déplace-en une, ou achète un pack pour en poser une de plus.",
    success: "Vie ajoutée",
    successBody: "{units} unité(s) d’attribution ajoutée(s). Le temps de vie naîtra seulement quand tu les poseras.",
    seeWallet: "Voir ma vie",
    mockHint: "Paiement mock : le ledger vie est séparé du XAF. Aucun argent réel.",
    txPurchase: "+{units} vies achetées (ledger mock)",
    txAllocate: "Vie posée sur {name}",
    txRelease: "Vie retirée de {name}",
    paymentFailed: "Paiement échoué. Aucune vie n’a été créditée.",
    payments: "Paiements packs",
    credited: "Crédité",
    notCredited: "Non crédité",
    sourcePurchased: "Acheté",
    sourceFree: "Inclus",
    sourceBonus: "Bonus certifié",
    oneLikeHint: "Tu as une vie personnelle, plus d’unités si tu en as acheté. Le temps de vie ne naît que lorsqu’une unité reste posée.",
    extraUnits: "{n} unité(s) libre(s) sur {total}",
    placedTitle: "Ta vie",
    receivedTitle: "Qui t’a posé sa vie",
    productionTitle: "Ce que tu produis",
    packsNote: "Acheter un pack ajoute des unités d’attribution. Ça ne crée pas de temps de vie : le temps naît seulement quand une unité reste posée.",
  },
  admin: {
    title: "Back-office",
    home: "Vue d’ensemble",
    users: "Utilisateurs",
    posts: "Contenus",
    moods: "Moods",
    events: "Sorties",
    payments: "Paiements",
    likes: "Anomalies vie",
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
    refundedPartial: "Remboursé partiellement",
    mockRefundHint: "Remboursement mock du ledger XAF. Les vies déjà créditées restent.",
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
    monetization: "Monétisation",
    platformFee: "Commission TipTop",
    platformFeeHint: "Phase initiale : 0 %. Les organisateurs ne paient rien. Les billets payants restent dus par l’utilisateur.",
    platformFeeSaved: "Commission enregistrée.",
    platformFeeInvalid: "Pourcentage invalide (0–100).",
    ticketVsFee: "Le prix du billet, les frais du prestataire de paiement et la commission TipTop sont trois montants distincts.",
    saveFee: "Enregistrer",
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
    oauthSoonBody: "Google, Facebook and Apple are coming. For now, your phone number opens TipTop in seconds.",
    oauthUsePhone: "Continue with my number",
  },
  nav: {
    home: "Home",
    mood: "Mood",
    add: "Add post",
    people: "People",
    events: "Events",
  },
  home: {
    yourMood: "Your status",
    yourStatus: "Your status",
    emptyTitle: "Nothing in your area yet",
    emptyBody: "When people post or create a meetup near you, it will show up here.",
    retry: "Retry",
    locationFallback: "Choose an area",
    outNow: "Out now",
    outNowEmpty: "Nobody available around you. Go available to show up here.",
    seeAll: "See all",
    needHint: "Bread, laundry, haircut…",
    feedHintFollowed: "Just posted · you follow them",
    feedHintLocal: "Near you",
    feedHintAlive: "A lot of life right now",
    justAvailable: "{name} is available",
    justAvailableBody: "Invite them out.",
  },
  need: {
    title: "Around me",
    searchPlaceholder: "What do you need?",
    nearby: "Nearest",
    cheapest: "Cheapest",
    allKinds: "All",
    product: "Product",
    service: "Service",
    empty: "Nothing around you for that",
    emptyBody: "Try another word, widen the distance, or list it if you have it.",
    listOffer: "List an offer",
    myOffers: "My offers",
    goThere: "Go there",
    seller: "Offered by",
    createTitle: "List an offer",
    titlePlaceholder: "e.g. Fresh bread, laundry, braids",
    pricePlaceholder: "Price ({currency})",
    shopName: "Shop name (optional)",
    sellerPerson: "Individual",
    sellerShop: "Shop",
    sellerBusiness: "Business",
    listed: "Offer published",
    hide: "Remove offer",
    directions: "Directions",
    maxKm: "Max km",
  },
  menu: {
    title: "Menu",
    tickets: "Tickets",
    favorites: "Favorites",
    contacts: "Contacts",
    payments: "Payment information",
    settings: "Settings",
    help: "Help",
    likes: "My life",
    ranking: "Ranking",
    wishes: "My wishes",
    invitations: "My meetups",
    offers: "My offers",
    wallet: "My life",
    perHour: "this hour",
    perDay: "today",
    perMonth: "this month",
    comingSoon: "This section ships in a later phase — the button does not invent data.",
    admin: "Back office",
    newBadge: "NEW",
    downloadApk: "Download the APK",
  },
  settings: {
    title: "Settings",
    darkMode: "Dark mode",
    language: "Language",
    currency: "Currency",
    currencyHint: "Prices show in your currency. The host is paid in theirs.",
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
    status: "Your status",
    statusHint: "You set it here. Others see it on your profile and around them — they cannot change it.",
    edit: "Edit",
    bio: "About you",
    bioHint: "A few words so people can recognize you in real life.",
    website: "Website or social",
    websiteHint: "Without https:// — example: tiptop.cm",
    interests: "Interests",
    interestsHint: "We’ll show you public moods that match.",
    birthDate: "Date of birth",
    country: "Country",
    avatar: "Profile photo",
    cover: "Cover photo",
    phoneLocked: "The number can only change through a new OTP login.",
    location: "Your area",
    changeZone: "Change area",
    blocked: "Blocked people",
    blockedEmpty: "You haven’t blocked anyone.",
    unblock: "Unblock",
    viewPublic: "View my public profile",
  },
  onboarding: {
    title: "Complete your profile",
    subtitle: "People should be able to recognize you in real life.",
    continue: "Enter TipTop",
    skip: "Skip",
    next: "Next",
    getStarted: "Get started",
    slide1Title: "From virtual to real",
    slide1Body: "TipTop isn't just another social network. It's the app that helps turn an on-screen interaction into a real meetup.",
    slide2Title: "Discover what's happening around you",
    slide2Body: "Events, available people, meetups happening now: discover what surrounds you, wherever you are.",
    slide3Title: "Share what you're living, right now",
    slide3Body: "With Mood, show live where you are and what you're doing — and make others want to join you.",
    slide4Title: "Invite, book, live the experience",
    slide4Body: "A life, an invitation, a reservation: every interaction on TipTop can end in a real meetup.",
    interestsTitle: "Your interests",
    interestsHint: "Public moods follow what you like.",
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
    shares: "Shares",
    addComment: "Add a comment",
    reply: "Reply",
    replyTo: "Reply to {name}",
    follow: "Follow",
    following: "Following",
    unfollow: "Unfollow",
    likePerson: "Place my life",
    unlike: "Remove my life",
    transferTitle: "Move your life?",
    transferBody: "You only have one life. It will leave {name} to sit with this person.",
    likeSelf: "You cannot give life to yourself.",
    likePlace: "Place my life",
    likeHere: "My life is here",
    likePlacedOn: "Your life is with {name}",
    likeIdle: "Your life is not placed on anyone yet.",
    likeDockOn: "{duration} · {label}",
    likeDockAria: "Your life has been running for {duration} on {label}",
    likeExplain: "Everyone has one life. You place it on a person, a post, a mood or a comment. Place it elsewhere and it moves.",
    likesNow: "{n} lives now",
    likeReceivedTitle: "Who placed their life here",
    likeGivenTitle: "Their life is with",
    likeEmptyReceived: "Nobody has placed their life here yet.",
    likeProduction: "Life capital",
    perHourLong: "this hour",
    perDayLong: "today",
    perMonthLong: "this month",
    perSecond: "/second",
    likeMeterHint: "The capital is received life-time on eligible content — not a heart counter.",
    likeMeterHintSelf: "Your capital is received life-time on your eligible content. It keeps growing while lives stay placed.",
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
    searchSuggestions: "Suggestions near you",
    searchAround: "Around {place}",
    markAllRead: "Mark all as read",
    notifNew: "New",
    notifEarlier: "Earlier",
    notifLike: "placed their life on you",
    notifLikeProfile: "placed their life on you",
    notifLikePost: "placed their life on your post",
    notifLikeMood: "placed their life on your mood",
    notifLikeComment: "placed their life on your comment",
    notifLikeWish: "placed their life on your wish",
    notifLikePostMany: "{name} and others placed their life on your post",
    notifLikeMoodMany: "{name} and others placed their life on your mood",
    notifLikeCommentMany: "{name} and others placed their life on your comment",
    notifLikeWishMany: "{name} and others placed their life on your wish",
    notifLikeProfileMany: "{name} and others placed their life on you",
    notifComment: "commented on your post",
    notifCommentMany: "{name} and others commented on your post",
    notifCommentMoodMany: "{name} and others commented on your mood",
    notifCommentMood: "commented on your mood",
    notifFollow: "followed you",
    notifInviteConsult: "View invitation",
    notifInviteTitle: "Invitation",
    notifInviteSeeEvent: "See the event",
    notifInviteExpired: "This invitation is no longer valid.",
    searchNotifs: "Search notifications",
    emptyNotifs: "No notifications yet.",
    chatLater: "Opens a real conversation — not a fake chat.",
    inviteLater: "Invites to an event ship with the real-world core.",
    eventsLater: "Events are not indexed yet.",
    noImageHint: "Local demo visual (object storage later).",
    seeMore: "See more",
    seeLess: "See less",
    posted: "Post published",
    notifInvite: "invited you to a meetup",
    notifTicket: "ticket updated",
    notifPayment: "payment updated",
    notifPaymentRefund: "Your payment was refunded.",
    notifPaymentRefundPartial: "Your payment was partially refunded.",
    notifMessage: "sent you a message",
    notifReview: "left a review on your meetup",
    notifEventUpdate: "An event you're part of was updated.",
    notifEventCancelled: "An event you're part of was cancelled.",
    notifEventTimeChanged: "The time of an event you're part of changed.",
    notifEventPlaceChanged: "The place of an event you're part of changed.",
    notifGroupInvite: "invited you to a group for this meetup",
    share: "Share",
    copied: "Link copied",
    copyLink: "Copy link",
    moreOptions: "More options",
    blockUser: "Block this person",
    deletePost: "Delete post",
    deletePostConfirm: "This post will be permanently deleted. This action cannot be undone.",
    deletePostLinkedToEvent: "This post is linked to an event — manage it from the event's management screen.",
    postDeleted: "This post has been deleted.",
    justNow: "Just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} hours ago",
    daysAgo: "{n} d ago",
    moodsTab: "Moods",
    ofLikes: "of life",
    notifWish: "offers to fulfill a wish",
    notifMilestone: "New life milestone",
    notifSocialInvite: "proposed an outing",
    notifSocialInviteAccepted: "accepted your outing",
    transferGeneric: "Your life will leave its current target to go here.",
    wishesLabel: "Wishes",
    moodsLabel: "Mood",
  },
  likeTime: {
    capital: "Life time",
    weekPlus: "+ {duration} this week",
    lastMilestone: "{label} reached on {date}",
    noMilestone: "No milestone yet",
    ranking: "Top life time",
    rankingAll: "All time",
    rankingWeek: "This week",
    rankingMonth: "This month",
    close: "Close",
    historyTitle: "Received periods",
    activeNow: "active",
    ofDuration: "{duration} of life",
    perHour: "/H",
    perDay: "/D",
    perMonth: "/M",
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
    consultTitle: "Outing proposal",
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
    unavailable: "Unavailable",
    unsure: "I don't know",
    availableUntil: "Available until {time}",
    goAvailable: "I'm available",
    goHidden: "Unavailable",
    goUnsure: "I don't know",
    myStatus: "My status",
    seeProfile: "View profile",
    locating: "Distance from your position…",
    geoDenied: "Distance from your area — turn on GPS for a better reading",
    retryGeo: "Enable GPS",
    ttlHint: "Visible for 4 hours, then you leave the carousel.",
    zoneTitle: "Your area",
    zoneBody: "The area filters people and meetups near you. GPS suggests, it does not force.",
    useCurrentLocation: "Use my current location",
    currentLocation: "Current location",
    locationFixed: "Pinned location",
    locationLiveHint: "Distances use your real position.",
    locationFixedHint: "Distances use the place you chose.",
    fromYou: "from you",
    goThere: "Get directions",
    precision: "Location precision",
    precisionExact: "Exact",
    precisionZone: "Area",
    precisionCity: "City",
    precisionHidden: "Hidden",
    approximate: "Approximate area",
    peopleTitle: "Around me",
    peopleNearby: "Around me",
    peopleAvailableAround: "Available around",
    peopleFriendsAvailable: "Available friends",
    peopleEmpty: "Nobody here",
    peopleFriends: "Friends",
    peopleAround: "Nearby",
    peopleLater: "Saved",
    peopleFriendsEmpty: "Friends appear after an accepted invite.",
    peopleAroundEmpty: "Nobody around you in this area.",
    peopleLaterEmpty: "Nobody saved. You can set someone aside for later.",
    circleFriend: "Friend",
    circleAround: "Nearby",
    circleLater: "Saved",
    peopleEmptyBody: "Widen your filters or switch tab. TipTop will not fill this with the whole world.",
    invite: "Invite",
    inviteJoin: "Invite to join me",
    previousPerson: "Previous",
    passPerson: "Skip",
    filters: "Filters",
    filtersActive: "Filters · {n}",
    applyFilters: "Apply",
    clearFilters: "Clear",
    presenceAll: "All statuses",
    presenceFilter: "Status",
    onlyAvailable: "Available only",
    maxDistance: "Max distance (km)",
    minAge: "Min age",
    maxAge: "Max age",
    professionFilter: "Profession",
    message: "Message",
    saveForLater: "Later",
    savedForLater: "Saved for later",
    removeFromLater: "Remove",
    addFriend: "Add as friend",
    addedFriend: "Already a friend",
    age: "{age} yrs",
    distance: "{km} km",
    nextPerson: "Next",
    eventsAll: "All",
    eventsMine: "My events",
    eventsEmpty: "No meetup here",
    eventsEmptyBody: "Create a meetup or change area. No global catalog.",
    eventsManageEmptyBody: "You haven't created or joined any event yet. Discover some in the home feed, or create your own.",
    eventsCreatedTitle: "Created by me",
    eventsAttendingTitle: "I'm attending",
    eventsInvitesShortcut: "My invitations",
    eventPublished: "Published",
    createEvent: "Create an event",
    eventTitle: "Meetup title",
    eventDescription: "Description",
    eventWhen: "Date and time",
    eventVenue: "Venue",
    eventPrice: "Price ({currency}, 0 = free)",
    eventPriceHint: "A price requires a reservation. Payment ships in Phase 4.",
    eventCapacity: "Capacity (optional)",
    eventMinAge: "Minimum age (e.g. 18)",
    eventReserve: "Require a reservation even if free",
    allowGroups: "Allow participant groups",
    allowGroupsHint: "People can form a crew for this meetup. You administer it, and you can add other admins.",
    enableGroups: "Enable groups",
    groupsTitle: "Groups",
    groupsEmpty: "No group for this meetup yet.",
    createGroup: "Create a group",
    groupNamePlaceholder: "e.g. Table 4, Car A",
    inviteToGroup: "Invite",
    acceptGroup: "Join",
    declineGroup: "Decline",
    leaveGroup: "Leave",
    makeAdmin: "Make admin",
    removeAdmin: "Remove admin",
    groupAdmin: "Admin",
    groupHost: "Creator",
    membersCount: "{n} members",
    openGroupChat: "Open group",
    groupCandidatesEmpty: "Nobody to invite yet.",
    groupInvited: "Invited",
    deleteGroup: "Delete group",
    paymentHold: "Seats can be held pending payment",
    paymentFirst: "No reservation without payment",
    paymentRequired: "Pay now to book — no waiting",
    paymentHoldHint: "A seat can be held, then paid. If someone declines, it is released.",
    paymentFirstHint: "No seat is held until payment succeeds. You can still invite and wait.",
    paymentRequiredHint: "No “they accept then I pay”. Either you pay now, or each guest pays their seat.",
    interested: "Interested",
    notInterested: "Not interested",
    heartEvent: "Favorite",
    heartTransferTitle: "Move your favorite?",
    heartTransferBody: "Your favorite will leave “{title}” for this meetup.",
    free: "Free",
    paid: "{amount}",
    host: "Host",
    peopleLinked: "People",
    peopleLinkedNamed: "People linked to the event ({n})",
    peopleLinkedEmpty: "Nobody has chosen to appear here yet.",
    peopleHiddenHint: "Your attendance is hidden. Others cannot see you in this list.",
    peopleOnlyYou: "Only you",
    showParticipation: "Show my attendance",
    hideParticipation: "Hide my attendance",
    bookLater: "Booking and payment ship in Phase 4. You can mark interest, favorite, or invite to a free meetup.",
    moodCreate: "Create a mood",
    moodCreateShort: "Create",
    statusCreate: "Create a status",
    statusCameraHint: "Visible 24h, friends only.",
    moodInterest: "Interest",
    moodPermanentHint: "A lasting public video, ranked by interests.",
    statusFriendsHint: "24h status — friends only.",
    moodVideoRequired: "A mood is a video. Film, import or pick a template.",
    videoTypeNotAllowed: "This video format is not supported. Try MP4 or WebM.",
    visPublic: "Public",
    typeStatus: "Status",
    moodMore: "More",
    moodActions: "More actions",
    moodAudioOriginal: "Audio • Original",
    moodAudioNamed: "Audio • {name}",
    moodCommentsEmpty: "Be the first to comment.",
    moodRetake: "Retake",
    moodAddText: "Text",
    moodAddSound: "Sound",
    moodSoundTitle: "Pick a sound",
    moodSoundOriginal: "Original sound",
    moodSoundOff: "No sound",
    moodSoundPulse: "Pulse Yaoundé",
    moodSoundNight: "Soft night",
    moodSoundGlow: "Glow",
    moodFlip: "Flip",
    moodStopRecord: "Stop",
    moodCameraDenied: "Camera unavailable. Import a video or pick a template.",
    moodCameraHint: "Film, then add a sound, a place or some text.",
    moodPlay: "Play",
    moodPause: "Pause",
    moodEmpty: "No public mood",
    moodEmptyBody: "A mood is a lasting video. You see everyone’s public videos by interest.",
    moodHours: "Duration (hours)",
    moodVisibility: "Visibility",
    visZone: "My area",
    visFollowers: "Followers",
    moodLinkEventNone: "Link to an event (optional)",
    moodCompanionNone: "Who are you with? (optional)",
    moodWith: "With {name}",
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
    typeOffer: "Offer",
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
    eventInLabel: "Event in:",
    inviteNamed: "+ Invite {name}",
    seeAll: "See all",
    eventsInterested: "Events I’m interested in",
    eventsLinked: "{n} linked event(s)",
    eventsLinkedNamed: "{n} event(s) linked to {name}",
    eventsPaneInterested: "Interested",
    eventsPaneLinked: "Linked",
    eventsPaneWishes: "Wishes",
    organizedBy: "By {name}",
    myWantedEvent: "Your wish",
    theirWantedEvent: "{name}’s wish",
    createWanted: "Create an event you want",
    createWantedHint: "An event you want, even if nobody else created it yet.",
    wantedTitlePlaceholder: "e.g. jazz brunch in Bastos",
    wantedDate: "When",
    wantedCity: "City",
    wantedSave: "Add",
    wantedEmpty: "No events here yet.",
    wantedEmptySelf: "Mark an event or create a wish.",
    moreAbout: "More about {name}",
    profileOffer: "To offer {name}",
    profileMyWishes: "Your wishes",
    showOnProfile: "Visible on my profile",
    hideOnProfile: "Hidden from profile",
    participantsCount: "{n} participants",
    participantsCountOne: "1 participant",
    interestedBadge: "Interested",
    recurrenceLabel: "This meetup repeats",
    recurrenceNone: "One date only",
    recurrenceDaily: "Every day",
    recurrenceWeekly: "Every week",
    recurrenceMonthly: "Every month",
    recurrenceHint: "We create the next dates for you. Same place, same price, same rules.",
    recursDaily: "Every day",
    recursWeekly: "Every week",
    recursMonthly: "Every month",
    nextDates: "Upcoming dates",
    formatAfterwork: "Afterwork",
    formatBrunch: "Brunch",
    formatClub: "Club night",
    formatDaily: "Every day",
    countryCM: "Cameroon",
    moreActions: "More",
    askFriend: "Friend",
    reservationsCount: "Bookings",
    seatsLeft: "{count} seats left",
    seatsLeftOne: "1 seat left",
    seatsFull: "Sold out",
    interestedCount: "Interested",
    friendsGoing: "{count} friends are going",
    friendsGoingOne: "1 friend is going",
    networkGoing: "{count} people in your network are going",
    networkGoingOne: "1 person in your network is going",
    whySharedInterests: "{count} interests in common",
    whySharedInterestsOne: "1 interest in common",
    whyNearbyAvailable: "Available near you",
    whyMood: "A mood matching your tastes",
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
    moodAddPlace: "Add a place",
    moodAddPlaceHint: "Optional. Only if you want to show where you are — type an address or use your location.",
    moodPlaceName: "Place name",
    moodPlaceAddress: "Address",
    moodPlaceSearch: "Search a place or address",
    moodUseMyLocation: "Use my location",
    moodLocating: "Finding you…",
    moodLocationDenied: "Location denied. You can type the address instead.",
    moodLocationUnavailable: "Could not find you. Type the address instead.",
    moodLocationClear: "Remove place",
    moodOpenMap: "See on the map",
    moodDirections: "Directions",
    moodPlaceSheetTitle: "Place",
    moodGeocodeEmpty: "No place found. You can still save this address.",
  },
  booking: {
    reserve: "Book",
    bookSelf: "Book for myself",
    bookEventTitle: "Book the event",
    forMyself: "For myself",
    inviteFriends: "Invite friends",
    inviteSearch: "Search someone",
    inviteCircleFriends: "Friends",
    inviteCircleNearby: "Around",
    inviteCircleLater: "Later",
    friendsEmpty: "No friends yet. Accept an invite, or browse Around.",
    nearbyEmpty: "Nobody else around right now.",
    laterEmpty: "Nobody set aside. On Around, save people you want to invite later.",
    saveForLater: "Save for later",
    savedForLater: "Saved",
    removeFromLater: "Remove",
    browseList: "List",
    browseCards: "Cards",
    browseHint: "Swipe profiles like on People, then lock the seat.",
    continueConfirm: "Continue",
    backToPeople: "Back to profiles",
    pickForSeat: "Pick for this seat",
    pickedForSeat: "Picked",
    nextProfile: "Next profile",
    skipProfile: "Skip",
    intentPayNow: "I pay now",
    intentPayNowHint: "Seats are held right away. They don’t need to accept first.",
    intentWaitAccept: "They accept, then I pay",
    intentWaitAcceptHint: "We send the invite. You only pay for people who say yes.",
    intentGuestPays: "Each pays their seat",
    intentGuestPaysHint: "They accept, then they pay their own entry.",
    payFirstNotice: "This event only holds a seat after payment.",
    payRequiredNotice: "This event does not allow booking without paying now. You can’t wait for a yes.",
    holdWaitNotice: "The seat is held right away. You only pay if they say yes. If they decline, it is released.",
    waitNoHoldNotice: "We send the invite without holding a seat. The seat is taken only after payment.",
    waitNotAllowed: "This event does not allow waiting for an accept before paying.",
    payAcceptedSeat: "Pay the seat",
    waitPayPendingHint: "Waiting for their yes. You pay after that.",
    waitAcceptCta: "Invite and wait",
    guestPaysCta: "Send the invite",
    invitesSent: "Invites sent. Waiting for their reply.",
    awaitingHostPay: "Accepted. The inviter still has to pay the seat.",
    goToPayment: "Continue to payment",
    bookTotal: "Total · {amount}",
    bookPickSomeone: "Select yourself or at least one friend.",
    seatsPicking: "{count} seats left for this pick.",
    bookAlready: "You already have a seat for this meetup.",
    bookAlreadyOthers: "You already have a seat. You can still book for someone else.",
    reserveOthers: "Book for someone else",
    bookHost: "This is your meetup — you manage it, you don’t book it.",
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
    ticketQrLater: "The QR appears as soon as your ticket is confirmed.",
    ticketQrHint: "Show this QR at the door. The host scans it to validate.",
    validateTicket: "Validate ticket",
    tabAllNamed: "All ({n})",
    tabInterestedNamed: "Interested ({n})",
    tabReservedNamed: "Reserved ({n})",
    tabValidatedNamed: "Checked in ({n})",
    scanCameraHint: "Line up the ticket QR in the viewfinder.",
    scanCameraDenied: "Camera unavailable. Paste the ticket code.",
    scanNext: "Scan next",
    hostPeopleEmpty: "Nobody in this tab yet.",
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
    amount: "{amount}",
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
    likes: "Everyone has a transferable personal life, plus purchased units. Value is the time a life stays placed — not a counter. A profile aggregates that time without double-counting.",
    reviews: "After a meetup you attended (validated ticket), you can leave a text review 24h after it ends.",
    contact: "Demo support: memolicesar1@gmail.com — no invented tickets.",
  },
  chat: {
    inbox: "My messages",
    empty: "No conversations yet",
    emptyBody: "Message a contact, or open a meetup group.",
    newTitle: "New conversation",
    searchContact: "Search a contact",
    searchInbox: "Search a conversation",
    send: "Send",
    placeholder: "Write a message",
    image: "Image",
    attach: "Attach an image",
    emoji: "Emoji",
    voice: "Voice",
    voiceMock: "Voice message",
    typing: "typing…",
    typingMany: "{count} typing…",
    typingOthers: "+{count} others typing",
    online: "Online",
    onlineOf: "{online} online, of {total} people",
    members: "people",
    hostBadge: "host",
    yesterday: "Yesterday",
    seeProfile: "See profile",
    seeEvent: "See the event",
    menu: "Options",
    attachTooBig: "This attachment is too large.",
    file: "File",
    sticker: "Stickers",
    inviteCard: "Invitation",
    recording: "Recording…",
    stopRecord: "Send voice",
    cancelRecord: "Cancel",
    lastSeenJustNow: "Seen just now",
    lastSeenMinutes: "Seen {n} min ago",
    lastSeenHours: "Seen {n} h ago",
    lastSeenDay: "Seen {day}",
    home: "Home",
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
    title: "My life",
    buyTitle: "Buy life",
    available: "Free",
    total: "Your life",
    allocated: "Placed",
    emptyAlloc: "Your life is not placed on anyone yet.",
    emptyHistory: "No history yet.",
    history: "History",
    packs: "Mock packs",
    packLabel: "{units} lives",
    buy: "Buy",
    buyCta: "Choose a pack",
    buyInstead: "A pack adds units to place. Life-time is only created while they stay attributed.",
    needPack: "No free unit",
    needPackBody: "All your units are placed. Move one, or buy a pack to place an extra one.",
    success: "Life added",
    successBody: "{units} attribution unit(s) added. Life-time starts only when you place them.",
    seeWallet: "See my life",
    mockHint: "Mock payment: the life ledger is separate from XAF. No real money.",
    txPurchase: "+{units} lives purchased (mock ledger)",
    txAllocate: "Life placed on {name}",
    txRelease: "Life removed from {name}",
    paymentFailed: "Payment failed. No life was credited.",
    payments: "Pack payments",
    credited: "Credited",
    notCredited: "Not credited",
    sourcePurchased: "Purchased",
    sourceFree: "Included",
    sourceBonus: "Certified bonus",
    oneLikeHint: "You have a personal life, plus extra units if you bought some. Life-time is only created while a unit stays placed.",
    extraUnits: "{n} free unit(s) of {total}",
    placedTitle: "Your life",
    receivedTitle: "Who placed their life on you",
    productionTitle: "What you produce",
    packsNote: "Buying a pack adds attribution units. It does not mint received life-time: time starts only when a unit stays placed.",
  },
  admin: {
    title: "Back office",
    home: "Overview",
    users: "Users",
    posts: "Content",
    moods: "Moods",
    events: "Meetups",
    payments: "Payments",
    likes: "Life anomalies",
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
    refundedPartial: "Partially refunded",
    mockRefundHint: "Mock XAF ledger refund. Already credited life units stay.",
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
    monetization: "Monetization",
    platformFee: "TipTop commission",
    platformFeeHint: "Initial phase: 0%. Hosts pay nothing. Paid tickets are still charged to the guest.",
    platformFeeSaved: "Commission saved.",
    platformFeeInvalid: "Invalid percentage (0–100).",
    ticketVsFee: "Ticket price, payment-provider fees, and TipTop commission are three distinct amounts.",
    saveFee: "Save",
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
