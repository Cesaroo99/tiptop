import type { NotifItem } from "./api";

export type NotifAction =
  | { kind: "href"; href: string }
  | { kind: "event-invite"; id: string }
  | { kind: "social-invite"; id: string };

export function notifAction(n: NotifItem): NotifAction {
  if (n.type === "INVITE" && n.entityId) return { kind: "event-invite", id: n.entityId };
  if (n.type === "SOCIAL_INVITE" && n.entityId && n.entityType !== "social_invite_accepted") {
    return { kind: "social-invite", id: n.entityId };
  }
  if (n.type === "SOCIAL_INVITE") return { kind: "href", href: "/invitations" };
  if (n.type === "WISH_OFFER") return { kind: "href", href: "/wishes" };
  if (n.type === "LIKE_MILESTONE") return { kind: "href", href: "/likes" };
  if (n.type === "MESSAGE" && n.entityId) return { kind: "href", href: `/messages/${n.entityId}` };
  if (n.type === "REVIEW" && n.entityId) return { kind: "href", href: `/events/${n.entityId}` };
  if (n.type === "EVENT_UPDATE" && n.entityId) return { kind: "href", href: `/events/${n.entityId}` };
  if (n.type === "TICKET" && n.entityId) return { kind: "href", href: `/tickets/${n.entityId}` };
  if (n.type === "PAYMENT" && n.entityType === "like_purchase") return { kind: "href", href: "/likes" };
  if (n.type === "PAYMENT") return { kind: "href", href: "/tickets" };
  if (n.type === "TICKET") return { kind: "href", href: "/tickets" };
  if (n.type === "COMMENT" && n.entityType === "mood" && n.entityId) {
    return { kind: "href", href: `/mood?start=${n.entityId}` };
  }
  if (n.type === "COMMENT" && n.entityId) return { kind: "href", href: `/posts/${n.entityId}` };
  if (n.type === "LIKE") {
    if (n.entityType === "post" && n.entityId) return { kind: "href", href: `/posts/${n.entityId}` };
    if (n.entityType === "mood" && n.entityId) return { kind: "href", href: `/mood?start=${n.entityId}` };
    if (n.entityType === "comment_post" && n.entityId) return { kind: "href", href: `/posts/${n.entityId}` };
    if (n.entityType === "comment_mood" && n.entityId) return { kind: "href", href: `/mood?start=${n.entityId}` };
    if (n.entityType === "wish") return { kind: "href", href: "/wishes" };
    if (n.entityType === "user" && n.actor) return { kind: "href", href: `/u/${n.actor.username}` };
  }
  if (n.type === "FOLLOW" && n.actor) return { kind: "href", href: `/u/${n.actor.username}` };
  if (n.actor) return { kind: "href", href: `/u/${n.actor.username}` };
  return { kind: "href", href: "/" };
}

export function notifLabel(
  n: NotifItem,
  messages: {
    brand: { name: string };
    social: {
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
      notifCommentMood: string;
      notifCommentMoodMany: string;
      notifFollow: string;
      notifWish: string;
      notifMilestone: string;
      notifSocialInvite: string;
      notifSocialInviteAccepted: string;
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
    };
  },
) {
  const name = n.actor ? `${n.actor.firstName} ${n.actor.lastName}` : messages.brand.name;
  const many = (n.count ?? 1) > 1;
  if (n.type === "LIKE") {
    if (n.entityType === "post") {
      return many
        ? messages.social.notifLikePostMany.replace("{name}", name)
        : `${name} ${messages.social.notifLikePost}`;
    }
    if (n.entityType === "mood") {
      return many
        ? messages.social.notifLikeMoodMany.replace("{name}", name)
        : `${name} ${messages.social.notifLikeMood}`;
    }
    if (n.entityType === "comment" || n.entityType === "comment_post" || n.entityType === "comment_mood") {
      return many
        ? messages.social.notifLikeCommentMany.replace("{name}", name)
        : `${name} ${messages.social.notifLikeComment}`;
    }
    if (n.entityType === "wish") {
      return many
        ? messages.social.notifLikeWishMany.replace("{name}", name)
        : `${name} ${messages.social.notifLikeWish}`;
    }
    return many
      ? messages.social.notifLikeProfileMany.replace("{name}", name)
      : `${name} ${messages.social.notifLikeProfile}`;
  }
  if (n.type === "WISH_OFFER") return `${name} ${messages.social.notifWish}`;
  if (n.type === "LIKE_MILESTONE") return messages.social.notifMilestone;
  if (n.type === "COMMENT") {
    if (n.entityType === "mood") {
      return many
        ? messages.social.notifCommentMoodMany.replace("{name}", name)
        : `${name} ${messages.social.notifCommentMood}`;
    }
    return many
      ? messages.social.notifCommentMany.replace("{name}", name)
      : `${name} ${messages.social.notifComment}`;
  }
  if (n.type === "SOCIAL_INVITE") {
    return `${name} ${n.entityType === "social_invite_accepted" ? messages.social.notifSocialInviteAccepted : messages.social.notifSocialInvite}`;
  }
  if (n.type === "INVITE") return `${name} ${messages.social.notifInvite}`;
  if (n.type === "TICKET") return `${name} ${messages.social.notifTicket}`;
  if (n.type === "PAYMENT") {
    if (n.entityType === "refund_partial") return messages.social.notifPaymentRefundPartial;
    return n.entityType === "refund" ? messages.social.notifPaymentRefund : `${name} ${messages.social.notifPayment}`;
  }
  if (n.type === "MESSAGE") return `${name} ${messages.social.notifMessage}`;
  if (n.type === "REVIEW") return `${name} ${messages.social.notifReview}`;
  if (n.type === "EVENT_UPDATE") {
    if (n.entityType === "event_cancelled") return messages.social.notifEventCancelled;
    if (n.entityType === "event_time_changed") return messages.social.notifEventTimeChanged;
    if (n.entityType === "event_place_changed") return messages.social.notifEventPlaceChanged;
    if (n.entityType === "event_group_invite") {
      return `${name} ${messages.social.notifGroupInvite}`;
    }
    return messages.social.notifEventUpdate;
  }
  return `${name} ${messages.social.notifFollow}`;
}
