import { probeHttp, probeTcp } from './supervisor.js';
import { WEEKS, type WeekId } from './weeks.js';

export type ProbeResult = {
  id: string;
  label: string;
  kind: 'http' | 'tcp';
  ok: boolean;
  detail: string;
};

export async function healthForWeek(weekId: WeekId): Promise<ProbeResult[]> {
  const week = WEEKS[weekId];
  const results: ProbeResult[] = [];

  for (const probe of week.probes) {
    if (probe.kind === 'tcp') {
      const [host, portStr] = probe.target.split(':');
      const ok = await probeTcp(host, Number(portStr));
      results.push({
        id: probe.id,
        label: probe.label,
        kind: 'tcp',
        ok,
        detail: ok ? 'open' : 'closed',
      });
    } else {
      const res = await probeHttp(probe.target);
      results.push({
        id: probe.id,
        label: probe.label,
        kind: 'http',
        ok: res.ok,
        detail: res.ok ? `HTTP ${res.status}` : res.error || `HTTP ${res.status ?? 'error'}`,
      });
    }
  }

  return results;
}
