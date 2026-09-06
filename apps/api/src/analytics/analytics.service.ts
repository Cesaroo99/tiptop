import { Injectable, Logger } from "@nestjs/common";
import { isAnalyticsEvent, type AnalyticsEventName } from "@tiptop/domain";

/** Journal structuré — remplaçable plus tard par un sink (Segment, etc.) sans changer les appels. */
@Injectable()
export class AnalyticsService {
  private readonly log = new Logger("analytics");

  track(name: AnalyticsEventName, input: { userId?: string; props?: Record<string, unknown> } = {}) {
    if (!isAnalyticsEvent(name)) return;
    this.log.log(
      JSON.stringify({
        event: name,
        userId: input.userId ?? null,
        at: new Date().toISOString(),
        ...(input.props ?? {}),
      }),
    );
  }
}
