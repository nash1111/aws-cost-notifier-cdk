import { CostExplorer } from '@aws-sdk/client-cost-explorer';
import * as https from 'https';

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL!;

export const handler = async (): Promise<void> => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

  const ce = new CostExplorer({ region: 'us-east-1' });
  const resp = await ce.getCostAndUsage({
    TimePeriod: { Start: start, End: end },
    Granularity: 'MONTHLY',
    Metrics: ['UnblendedCost']
  });

  const amount = resp.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount;
  const cost = parseFloat(amount || '0').toFixed(2);
  const message = `Total cost for this month is $${cost} USD`;

  await postToSlack(message);
};

function postToSlack(text: string): Promise<void> {
  const data = JSON.stringify({ text });

  return new Promise((resolve, reject) => {
    const req = https.request(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      res.on('data', () => { /* consume */ });
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
