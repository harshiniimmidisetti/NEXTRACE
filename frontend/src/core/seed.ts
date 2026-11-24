/** Synthetic demo dataset. IPs use RFC 5737 ranges and domains use `.example`. */
import type { Evidence } from '../types.js';

/** What the backup log looked like when its hash was recorded (before it was altered). */
const ORIGINAL_BACKUP = `2026-11-16T09:41:02Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:42:31Z INFO auth login ok user=admin ip=203.0.113.45
2026-11-16T09:44:05Z WARN data export user=admin rows=12000 ip=203.0.113.45`;

export const SEED_EVIDENCE: readonly Evidence[] = [
  {
    id: 'EV-0001',
    name: 'phishing_email.eml',
    type: 'EML',
    source: 'Complainant mailbox export',
    uploadedBy: 'Demo Officer',
    uploaded: '2026-11-16',
    content: `From: "SecureBank Alerts" <alerts@securebank-verify.example>
To: customer@mail.example
Date: Mon, 16 Nov 2026 09:02:11 +0000
Subject: Urgent: verify your account within 24 hours
X-Originating-IP: 203.0.113.45

Dear customer, we detected unusual activity. Verify now:
http://securebank-verify.example/login?id=4471
If you do not act, your account will be suspended.`,
  },
  {
    id: 'EV-0002',
    name: 'reported_urls.csv',
    type: 'CSV',
    source: 'Complaint intake form',
    uploadedBy: 'Demo Officer',
    uploaded: '2026-11-16',
    content: `url,first_seen,source
http://securebank-verify.example/login?id=4471,2026-11-16T09:05:00Z,user-report
https://www.securebank.example/help,2026-11-16T09:06:00Z,user-report`,
  },
  {
    id: 'EV-0003',
    name: 'server_auth.log',
    type: 'LOG',
    source: 'Bank web server export',
    uploadedBy: 'Demo Investigator',
    uploaded: '2026-11-17',
    content: `2026-11-16T09:30:12Z INFO auth login ok user=priya ip=198.51.100.20
2026-11-16T09:41:02Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:41:20Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:41:38Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:41:55Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:42:10Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:42:31Z INFO auth login ok user=admin ip=203.0.113.45
2026-11-16T09:44:05Z WARN data export user=admin rows=12000 ip=203.0.113.45
2026-11-16T09:50:00Z INFO auth login ok user=ravi ip=198.51.100.31`,
  },
  {
    id: 'EV-0004',
    name: 'network_events.json',
    type: 'JSON',
    source: '',
    uploadedBy: 'Demo Investigator',
    uploaded: '2026-11-17',
    content: JSON.stringify(
      [
        {
          time: '2026-11-16T09:12:40Z',
          src: '198.51.100.77',
          dst: '203.0.113.45',
          port: 443,
          note: 'workstation connected to sender IP',
        },
        {
          time: '2026-11-16T09:44:30Z',
          src: '203.0.113.45',
          dst: '198.51.100.5',
          port: 22,
          note: 'outbound transfer after export',
        },
      ],
      null,
      1,
    ),
  },
  {
    id: 'EV-0005',
    name: 'auth_backup.log',
    type: 'LOG',
    source: 'Backup server copy',
    uploadedBy: 'Demo Investigator',
    uploaded: '2026-11-17',
    recordedFrom: ORIGINAL_BACKUP,
    content: `2026-11-16T09:42:31Z INFO auth login ok user=admin ip=203.0.113.45
2026-11-16T09:41:02Z WARN auth failed user=admin ip=203.0.113.45
2026-11-16T09:44:05Z WARN data export user=admin rows=2 ip=203.0.113.45`,
  },
];
