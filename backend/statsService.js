import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'badminton_community.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const NGINX_LOG_PATH = '/var/log/nginx/access.log';

/**
 * Calculate total size of a directory in bytes
 */
function getDirectorySizeBytes(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return 0;
    let totalSize = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          totalSize += getDirectorySizeBytes(fullPath);
        } else if (entry.isFile()) {
          totalSize += fs.statSync(fullPath).size;
        }
      } catch {
        // Skip unreadable files
      }
    }
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Parse Nginx access logs for real-time web traffic analytics
 */
function parseNginxTraffic() {
  const result = {
    isLiveLog: false,
    totalRequests: 0,
    uniqueVisitors: 0,
    todayRequests: 0,
    todayUniqueVisitors: 0,
    totalDataTransferredMb: '0.00',
    statusCodes: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    errorRatePercent: 0,
    topRoutes: [],
    deviceBreakdown: { desktop: 0, mobile: 0 }
  };

  try {
    if (!fs.existsSync(NGINX_LOG_PATH)) {
      // Local dev fallback
      return {
        ...result,
        totalRequests: 142,
        uniqueVisitors: 12,
        todayRequests: 45,
        todayUniqueVisitors: 6,
        totalDataTransferredMb: '4.85',
        statusCodes: { '2xx': 120, '3xx': 18, '4xx': 4, '5xx': 0 },
        errorRatePercent: 0,
        topRoutes: [
          { route: '/', count: 58 },
          { route: '/api/players', count: 32 },
          { route: '/api/trainers', count: 24 },
          { route: '/api/tournaments', count: 18 }
        ],
        deviceBreakdown: { desktop: 85, mobile: 57 }
      };
    }

    const content = fs.readFileSync(NGINX_LOG_PATH, 'utf8');
    const lines = content.trim().split('\n');
    result.isLiveLog = true;
    result.totalRequests = lines.length;

    const allIps = new Set();
    const todayIps = new Set();
    const now = new Date();
    // Nginx standard date format in log is e.g. 14/Sep/2026
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayStr = String(now.getUTCDate()).padStart(2, '0');
    const monthStr = months[now.getUTCMonth()];
    const yearStr = now.getUTCFullYear();
    const todayPrefix = `${dayStr}/${monthStr}/${yearStr}`;

    const routeCounts = {};
    let totalBytes = 0;
    let mobileCount = 0;
    let desktopCount = 0;

    // Standard Combined Log Format regex
    const logRegex = /^(\S+) \S+ \S+ \[([^:]+):[^\]]+\] "(\S+) ([^ "]+)[^"]*" (\d{3}) (\d+|-)(?: "[^"]*" "([^"]*)")?/;

    for (const line of lines) {
      const match = line.match(logRegex);
      if (!match) continue;

      const ip = match[1];
      const logDate = match[2];
      const route = match[4].split('?')[0]; // Strip query parameters
      const status = parseInt(match[5], 10);
      const bytes = match[6] === '-' ? 0 : parseInt(match[6], 10) || 0;
      const userAgent = match[7] || '';

      allIps.add(ip);
      totalBytes += bytes;

      if (logDate === todayPrefix) {
        result.todayRequests++;
        todayIps.add(ip);
      }

      // Status code categories
      if (status >= 200 && status < 300) result.statusCodes['2xx']++;
      else if (status >= 300 && status < 400) result.statusCodes['3xx']++;
      else if (status >= 400 && status < 500) result.statusCodes['4xx']++;
      else if (status >= 500) result.statusCodes['5xx']++;

      // Filter noise assets for top routes (static bundle hashes)
      if (!route.startsWith('/assets/') && !route.endsWith('.js') && !route.endsWith('.css') && !route.endsWith('.png') && !route.endsWith('.ico')) {
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      }

      // Device detection
      if (/Mobile|Android|iPhone|iPad|iPod|webOS/i.test(userAgent)) {
        mobileCount++;
      } else {
        desktopCount++;
      }
    }

    result.uniqueVisitors = allIps.size;
    result.todayUniqueVisitors = todayIps.size;
    result.totalDataTransferredMb = (totalBytes / (1024 * 1024)).toFixed(2);

    const errorCount = result.statusCodes['5xx'];
    result.errorRatePercent = result.totalRequests > 0
      ? Number(((errorCount / result.totalRequests) * 100).toFixed(1))
      : 0;

    result.topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([route, count]) => ({ route, count }));

    result.deviceBreakdown = {
      desktop: desktopCount,
      mobile: mobileCount
    };

    return result;
  } catch (err) {
    console.error('Error parsing Nginx traffic:', err);
    return result;
  }
}

/**
 * Get comprehensive hardware, Oracle Free Tier utilization, and traffic metrics
 */
export function getSystemAndTrafficStats(db) {
  // 1. Memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Number(((usedMem / totalMem) * 100).toFixed(1));
  const procMem = process.memoryUsage();

  // 2. CPU & Load
  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Arm Neoverse-N1 (Ampere A1)';
  const cpuCores = cpus ? cpus.length : 1;
  const loadAvg = os.loadavg(); // [1m, 5m, 15m]
  const cpuLoadPercent = Number(Math.min(100, (loadAvg[0] / cpuCores) * 100).toFixed(1));

  // 3. Disk Space via statfsSync
  let totalDiskBytes = 47 * 1024 * 1024 * 1024; // Fallback ~47 GB
  let freeDiskBytes = 43 * 1024 * 1024 * 1024;
  let usedDiskBytes = totalDiskBytes - freeDiskBytes;
  let diskUsagePercent = 8.5;

  try {
    if (typeof fs.statfsSync === 'function') {
      const statfs = fs.statfsSync('/');
      totalDiskBytes = statfs.blocks * statfs.bsize;
      freeDiskBytes = statfs.bavail * statfs.bsize;
      usedDiskBytes = totalDiskBytes - freeDiskBytes;
      diskUsagePercent = Number(((usedDiskBytes / totalDiskBytes) * 100).toFixed(1));
    }
  } catch {
    // Keep fallback
  }

  // 4. Application Storage Sizes
  let dbSizeBytes = 0;
  try {
    if (fs.existsSync(DB_PATH)) {
      dbSizeBytes = fs.statSync(DB_PATH).size;
    }
  } catch {}

  const uploadsSizeBytes = getDirectorySizeBytes(UPLOADS_DIR);

  // 5. Oracle Always Free Tier Quotas & Specs
  // Oracle Ampere A1 Free Tier allowance: 4 OCPUs, 24 GB RAM, 200 GB Storage, 10 TB Egress / month
  const totalDiskGb = Number((totalDiskBytes / (1024 * 1024 * 1024)).toFixed(1));
  const usedDiskGb = Number((usedDiskBytes / (1024 * 1024 * 1024)).toFixed(1));
  const freeDiskGb = Number((freeDiskBytes / (1024 * 1024 * 1024)).toFixed(1));

  const totalRamGb = Number((totalMem / (1024 * 1024 * 1024)).toFixed(1));
  const usedRamGb = Number((usedMem / (1024 * 1024 * 1024)).toFixed(2));
  const freeRamGb = Number((freeMem / (1024 * 1024 * 1024)).toFixed(2));

  // 6. Traffic from Nginx
  const traffic = parseNginxTraffic();
  const transferredGb = Number((parseFloat(traffic.totalDataTransferredMb) / 1024).toFixed(3));

  // 7. Database Counts
  let dbCounts = {
    playersApproved: 0,
    playersPending: 0,
    trainersApproved: 0,
    trainersPending: 0,
    servicesApproved: 0,
    servicesPending: 0,
    inquiriesTotal: 0,
    inquiriesPending: 0,
    tournamentsCount: 0,
    resultsCount: 0,
  };

  try {
    if (db) {
      dbCounts.playersApproved = db.prepare("SELECT COUNT(*) as c FROM players WHERE status = 'approved'").get()?.c || 0;
      dbCounts.playersPending = db.prepare("SELECT COUNT(*) as c FROM players WHERE status = 'pending'").get()?.c || 0;
      dbCounts.trainersApproved = db.prepare("SELECT COUNT(*) as c FROM trainers WHERE status = 'approved'").get()?.c || 0;
      dbCounts.trainersPending = db.prepare("SELECT COUNT(*) as c FROM trainers WHERE status = 'pending'").get()?.c || 0;
      try {
        dbCounts.servicesApproved = db.prepare("SELECT COUNT(*) as c FROM equipment_services WHERE status = 'approved'").get()?.c || 0;
        dbCounts.servicesPending = db.prepare("SELECT COUNT(*) as c FROM equipment_services WHERE status = 'pending'").get()?.c || 0;
      } catch {}
      try {
        dbCounts.inquiriesTotal = db.prepare("SELECT COUNT(*) as c FROM contact_inquiries").get()?.c || 0;
        dbCounts.inquiriesPending = db.prepare("SELECT COUNT(*) as c FROM contact_inquiries WHERE status = 'pending' OR status = 'pending_forward'").get()?.c || 0;
      } catch {}
      dbCounts.tournamentsCount = db.prepare("SELECT COUNT(*) as c FROM tournaments").get()?.c || 0;
      dbCounts.resultsCount = db.prepare("SELECT COUNT(*) as c FROM tournament_results").get()?.c || 0;
    }
  } catch (err) {
    console.error('Error fetching database counts for stats:', err);
  }

  return {
    timestamp: new Date().toISOString(),
    system: {
      hostname: os.hostname(),
      platform: `${os.platform()} (${os.arch()})`,
      kernelRelease: os.release(),
      nodeVersion: process.version,
      cpuModel,
      cpuCores,
      cpuLoad1m: Number(loadAvg[0].toFixed(2)),
      cpuLoad5m: Number(loadAvg[1].toFixed(2)),
      cpuLoad15m: Number(loadAvg[2].toFixed(2)),
      cpuLoadPercent,
      totalMemBytes: totalMem,
      usedMemBytes: usedMem,
      freeMemBytes: freeMem,
      totalRamGb,
      usedRamGb,
      freeRamGb,
      memUsagePercent,
      processMemRssMb: Number((procMem.rss / (1024 * 1024)).toFixed(1)),
      processMemHeapUsedMb: Number((procMem.heapUsed / (1024 * 1024)).toFixed(1)),
      totalDiskGb,
      usedDiskGb,
      freeDiskGb,
      diskUsagePercent,
      dbSizeKb: Number((dbSizeBytes / 1024).toFixed(1)),
      uploadsSizeMb: Number((uploadsSizeBytes / (1024 * 1024)).toFixed(2)),
      systemUptimeSeconds: Math.floor(os.uptime()),
      processUptimeSeconds: Math.floor(process.uptime()),
    },
    oracleFreeTier: {
      shape: 'VM.Standard.A1.Flex (Ampere ARM)',
      pricingModel: 'Oracle Cloud Always Free (0.00 €)',
      monthlyCostEur: 0.00,
      statusBadge: '100% Always Free Tier Active',
      // CPU limits & remaining
      cpuAssignedOcpu: cpuCores,
      cpuFreeTierPoolOcpu: 4,
      cpuRemainingFreeOcpu: Math.max(0, 4 - cpuCores),
      // RAM limits & remaining
      ramAssignedGb: totalRamGb,
      ramFreeTierPoolGb: 24,
      ramRemainingFreeGb: Math.max(0, Number((24 - totalRamGb).toFixed(1))),
      // Disk limits & remaining (Oracle provides 200 GB total free boot/block storage)
      diskAssignedGb: totalDiskGb,
      diskFreeTierPoolGb: 200,
      diskRemainingFreeGb: Math.max(0, Number((200 - totalDiskGb).toFixed(1))),
      // Bandwidth limits & remaining (10 TB free per month)
      bandwidthMonthlyFreePoolGb: 10000,
      bandwidthUsedGb: transferredGb,
      bandwidthRemainingGb: Math.max(0, Number((10000 - transferredGb).toFixed(2))),
      bandwidthPercentUsed: Number(((transferredGb / 10000) * 100).toFixed(4)),
    },
    traffic,
    database: dbCounts
  };
}
