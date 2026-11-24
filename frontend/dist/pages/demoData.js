export const DEMO_ACCOUNTS = {
    police: { email: 'officer@demo.nextrace', name: 'Demo Officer', label: 'Police Officer' },
    investigator: {
        email: 'investigator@demo.nextrace',
        name: 'Demo Investigator',
        label: 'Digital Forensic Investigator',
    },
    admin: { email: 'admin@demo.nextrace', name: 'Demo Administrator', label: 'Administrator' },
};
export const DEMO_PASSWORD = 'Demo@12345';
export const AGENTS = [
    {
        key: 'SCOUT',
        title: 'Data collection',
        icon: 'search',
        description: 'Imports uploaded evidence, CSV/JSON datasets and network logs, and tracks every collection task.',
        status: 'Idle',
        progress: 100,
        last: 'Demo run 09:12',
    },
    {
        key: 'VERITY',
        title: 'Data verification',
        icon: 'check',
        description: 'Calculates SHA-256 hashes, flags duplicates, bad metadata and stale data, and explains each result.',
        status: 'Idle',
        progress: 100,
        last: 'Demo run 09:14',
    },
    {
        key: 'ARCHIVE',
        title: 'Records and custody',
        icon: 'db',
        description: 'Keeps a tamper-evident ledger of every action and filing, and takes in data from other sources so the other agents can use it.',
        status: 'Active',
        progress: 100,
        last: 'Ledger started',
    },
    {
        key: 'CIPHER',
        title: 'Forensic analysis',
        icon: 'brain',
        description: 'Analyses emails, URLs, IPs and logs, and separates facts from indicators and hypotheses.',
        status: 'Waiting for review',
        progress: 60,
        last: 'Demo run 09:20',
    },
    {
        key: 'CHRONICLE',
        title: 'Report generation',
        icon: 'file',
        description: 'Builds the inventory, timeline and findings into a report that an investigator must approve.',
        status: 'Not started',
        progress: 0,
        last: 'No runs yet',
    },
];
export const CASES = [
    ['NXT-2026-0001', 'Bank phishing email campaign', 'Phishing', 'Active', 'Demo Investigator'],
    [
        'NXT-2026-0002',
        'Marketplace payment fraud',
        'Online Financial Fraud',
        'Submitted',
        'Unassigned',
    ],
    [
        'NXT-2026-0003',
        'Unauthorised admin login',
        'Unauthorized Access',
        'Active',
        'Demo Investigator',
    ],
    [
        'NXT-2026-0004',
        'Fake profile harassment',
        'Cyber Harassment',
        'Completed',
        'Demo Investigator',
    ],
];
export const INCIDENT_TYPES = [
    'Phishing',
    'Online Financial Fraud',
    'Identity Theft',
    'Social Media Fraud',
    'Unauthorized Access',
    'Malware Incident',
    'Cyber Harassment',
    'Other Cybercrime',
];
export const VIEWS = {
    police: {
        title: 'Police officer dashboard',
        stats: [
            ['Total complaints', 128],
            ['Active investigations', 34],
            ['Submitted cases', 61],
            ['Completed cases', 47],
        ],
        trend: [
            ['Jul', 14],
            ['Aug', 19],
            ['Sep', 23],
            ['Oct', 31],
            ['Nov', 41],
        ],
        trendTitle: 'Complaints registered per month',
        feed: [
            ['New complaint registered', 'NXT-2026-0002 · 20 min ago'],
            ['Case assigned to investigator', 'NXT-2026-0001 · 2 h ago'],
            ['Report approved', 'NXT-2026-0004 · yesterday'],
        ],
        feedTitle: 'Recent activities',
        showAgents: false,
    },
    investigator: {
        title: 'Investigator dashboard',
        stats: [
            ['Assigned cases', 12],
            ['Evidence files', 86],
            ['Verified evidence', 64],
            ['Needs review', 9],
        ],
        trend: [
            ['Jul', 6],
            ['Aug', 9],
            ['Sep', 12],
            ['Oct', 15],
            ['Nov', 18],
        ],
        trendTitle: 'Suspicious indicators found per month',
        feed: [
            ['Finding: lookalike domain in email', 'Risk high · confidence 0.82 · NXT-2026-0001'],
            ['Hash mismatch needs human review', 'EV-0007 · NXT-2026-0003'],
            ['Login burst from one IP', 'Indicator · NXT-2026-0003'],
        ],
        feedTitle: 'Recent findings',
        showAgents: true,
    },
    admin: {
        title: 'Administrator dashboard',
        stats: [
            ['Total users', 42],
            ['Police officers', 25],
            ['Investigators', 14],
            ['Total cases', 128],
        ],
        trend: [
            ['Jul', 20],
            ['Aug', 24],
            ['Sep', 29],
            ['Oct', 33],
            ['Nov', 42],
        ],
        trendTitle: 'Registered users per month',
        feed: [
            ['User role changed', 'Demo Admin · today'],
            ['Case reassigned', 'NXT-2026-0003 · today'],
            ['Failed login (3 attempts)', 'Locked 15 min · yesterday'],
        ],
        feedTitle: 'Audit log',
        showAgents: true,
        showSources: true,
    },
};
/** [name, description, badge tone] */
export const SOURCES = [
    ['Demo dataset', 'Loaded', 'ok'],
    ['PhishTank', 'Not connected (live mode off)', 'warn'],
    ['OpenPhish', 'Not connected (live mode off)', 'warn'],
    ['CIC-IDS2017', 'Manual import only', 'info'],
];
