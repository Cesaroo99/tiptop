-- TipTop Intelligence Engine

CREATE TYPE "PreferenceSignalKind" AS ENUM (
  'VIEW_LONG', 'SAVED', 'SHARED', 'FAVORITED', 'CLICK_BOOK', 'BOOKED', 'ATTENDED',
  'INVITED', 'POSITIVE_FEEDBACK', 'REPEAT_CATEGORY', 'IGNORED', 'LEFT_QUICK',
  'NOT_INTERESTED', 'CANCELLED', 'NO_SHOW', 'REC_IGNORED'
);

CREATE TYPE "ExperiencePlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "RecFeedbackKind" AS ENUM ('LIKE', 'NOT_INTERESTED', 'HIDE_TYPE', 'WHY');
CREATE TYPE "AgentSuggestionKind" AS ENUM ('DAILY', 'WEEKEND', 'TONIGHT', 'SOCIAL', 'NEW');
CREATE TYPE "MissionKind" AS ENUM ('WEEKEND', 'SOCIAL', 'DISCOVERY', 'FIRST_TIME');
CREATE TYPE "ExperienceMood" AS ENUM ('LOVED', 'GOOD', 'OK', 'DISLIKED');

CREATE TABLE "AiConsent" (
  "userId" TEXT NOT NULL,
  "personalizedRecs" BOOLEAN NOT NULL DEFAULT true,
  "useHistory" BOOLEAN NOT NULL DEFAULT true,
  "socialMatch" BOOLEAN NOT NULL DEFAULT false,
  "agentEnabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiConsent_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "UserPreferenceProfile" (
  "userId" TEXT NOT NULL,
  "categoryScores" JSONB NOT NULL,
  "dislikedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "typicalBudgetXaf" INTEGER,
  "maxBudgetXaf" INTEGER,
  "preferredHours" JSONB,
  "preferredDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "idealDurationMin" INTEGER,
  "maxDistanceKm" DOUBLE PRECISION,
  "spontaneity" DOUBLE PRECISION,
  "groupPreference" TEXT,
  "preferredGroupSize" INTEGER,
  "meetNewPeople" BOOLEAN,
  "vibeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPreferenceProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "PreferenceSignal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "PreferenceSignalKind" NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "category" TEXT,
  "eventId" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PreferenceSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperienceRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "parsed" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperienceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperiencePlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestId" TEXT,
  "title" TEXT NOT NULL,
  "status" "ExperiencePlanStatus" NOT NULL DEFAULT 'DRAFT',
  "surprise" BOOLEAN NOT NULL DEFAULT false,
  "totalCostXaf" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExperiencePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperiencePlanStep" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "venue" TEXT,
  "city" TEXT,
  "zone" TEXT,
  "eventId" TEXT,
  "costXaf" INTEGER NOT NULL DEFAULT 0,
  "travelMin" INTEGER NOT NULL DEFAULT 0,
  "revealed" BOOLEAN NOT NULL DEFAULT true,
  "bookable" BOOLEAN NOT NULL DEFAULT false,
  "hint" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  CONSTRAINT "ExperiencePlanStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperienceRecommendation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT,
  "planId" TEXT,
  "reasonKey" TEXT NOT NULL,
  "reasonParams" JSONB,
  "score" DOUBLE PRECISION NOT NULL,
  "category" TEXT,
  "dayKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperienceRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recommendationId" TEXT,
  "eventId" TEXT,
  "kind" "RecFeedbackKind" NOT NULL,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialActivityMatch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "peerId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "eventId" TEXT,
  "score" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialActivityMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityGroup" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "zone" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "eventId" TEXT,
  "conversationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentSuggestion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "AgentSuggestionKind" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "eventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "planId" TEXT,
  "fromAgent" BOOLEAN NOT NULL DEFAULT true,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserWorldProgress" (
  "userId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserWorldProgress_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "CityDiscoveryProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "percent" INTEGER NOT NULL DEFAULT 0,
  "categoriesTried" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "venuesCount" INTEGER NOT NULL DEFAULT 0,
  "attendedCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CityDiscoveryProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryDiscoveryProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "discovered" BOOLEAN NOT NULL DEFAULT false,
  "firstAt" TIMESTAMP(3),
  CONSTRAINT "CategoryDiscoveryProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Achievement" (
  "id" TEXT NOT NULL,
  "titleKey" TEXT NOT NULL,
  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAchievement" (
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

CREATE TABLE "UserMission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "MissionKind" NOT NULL,
  "weekKey" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "UserMission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperienceFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT,
  "planId" TEXT,
  "mood" "ExperienceMood" NOT NULL,
  "comment" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperienceFeedback_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiConsent" ADD CONSTRAINT "AiConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPreferenceProfile" ADD CONSTRAINT "UserPreferenceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreferenceSignal" ADD CONSTRAINT "PreferenceSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperienceRequest" ADD CONSTRAINT "ExperienceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperiencePlan" ADD CONSTRAINT "ExperiencePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperiencePlan" ADD CONSTRAINT "ExperiencePlan_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExperienceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExperiencePlanStep" ADD CONSTRAINT "ExperiencePlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ExperiencePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperienceRecommendation" ADD CONSTRAINT "ExperienceRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperienceRecommendation" ADD CONSTRAINT "ExperienceRecommendation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ExperiencePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "ExperienceRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialActivityMatch" ADD CONSTRAINT "SocialActivityMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialActivityMatch" ADD CONSTRAINT "SocialActivityMatch_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityGroup" ADD CONSTRAINT "ActivityGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentSuggestion" ADD CONSTRAINT "AgentSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserWorldProgress" ADD CONSTRAINT "UserWorldProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CityDiscoveryProgress" ADD CONSTRAINT "CityDiscoveryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryDiscoveryProgress" ADD CONSTRAINT "CategoryDiscoveryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperienceFeedback" ADD CONSTRAINT "ExperienceFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PreferenceSignal_userId_createdAt_idx" ON "PreferenceSignal"("userId", "createdAt");
CREATE INDEX "PreferenceSignal_userId_category_idx" ON "PreferenceSignal"("userId", "category");
CREATE INDEX "ExperienceRequest_userId_createdAt_idx" ON "ExperienceRequest"("userId", "createdAt");
CREATE INDEX "ExperiencePlan_userId_createdAt_idx" ON "ExperiencePlan"("userId", "createdAt");
CREATE INDEX "ExperiencePlanStep_planId_order_idx" ON "ExperiencePlanStep"("planId", "order");
CREATE INDEX "ExperienceRecommendation_userId_dayKey_idx" ON "ExperienceRecommendation"("userId", "dayKey");
CREATE INDEX "RecommendationFeedback_userId_createdAt_idx" ON "RecommendationFeedback"("userId", "createdAt");
CREATE INDEX "SocialActivityMatch_userId_category_createdAt_idx" ON "SocialActivityMatch"("userId", "category", "createdAt");
CREATE INDEX "ActivityGroup_creatorId_createdAt_idx" ON "ActivityGroup"("creatorId", "createdAt");
CREATE INDEX "ActivityGroup_eventId_idx" ON "ActivityGroup"("eventId");
CREATE INDEX "AgentSuggestion_userId_createdAt_idx" ON "AgentSuggestion"("userId", "createdAt");
CREATE UNIQUE INDEX "CityDiscoveryProgress_userId_city_key" ON "CityDiscoveryProgress"("userId", "city");
CREATE UNIQUE INDEX "CategoryDiscoveryProgress_userId_category_key" ON "CategoryDiscoveryProgress"("userId", "category");
CREATE UNIQUE INDEX "UserMission_userId_kind_weekKey_key" ON "UserMission"("userId", "kind", "weekKey");
CREATE INDEX "UserMission_userId_weekKey_idx" ON "UserMission"("userId", "weekKey");
CREATE INDEX "ExperienceFeedback_userId_createdAt_idx" ON "ExperienceFeedback"("userId", "createdAt");

INSERT INTO "Achievement" ("id", "titleKey") VALUES
  ('FIRST_TIME', 'firstTime'),
  ('LOCAL_EXPLORER', 'localExplorer'),
  ('SOCIAL_FIRST', 'socialFirst')
ON CONFLICT ("id") DO NOTHING;
