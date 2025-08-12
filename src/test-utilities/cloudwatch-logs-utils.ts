import { CloudWatchLogsClient, FilterLogEventsCommand, FilteredLogEvent } from "@aws-sdk/client-cloudwatch-logs";

export interface CloudWatchLogFilter {
    filterPattern: string;
    startTime: number;
}

export class CloudWatchLogsHelper {
  private logsClient: CloudWatchLogsClient;

  constructor(region: string = 'eu-north-1') {
    this.logsClient = new CloudWatchLogsClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    });
  }
 
  async getLogEvents(lambdaFunction: string, filter: CloudWatchLogFilter): Promise<FilteredLogEvent[]> {
    
    const startTime = filter.startTime
    const timeoutMs = 30 * 1000;

    while (Date.now() - startTime < timeoutMs) {
      const endTime = Date.now();
      const command = new FilterLogEventsCommand({
        logGroupName: `/aws/lambda/${lambdaFunction}`,
        filterPattern: filter.filterPattern,
        startTime: filter.startTime,
        endTime: endTime
      });
      
      const response = await this.logsClient.send(command);
      const events = response.events || [];

      if (events.length > 0) {
        return events;
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If no events found after timeout, return empty array
    return [];
  }
}