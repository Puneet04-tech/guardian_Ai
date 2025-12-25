import { BugAlert, CostItem, Decision, LineageLink, LineageNode } from './types';

export const MOCK_BUGS: BugAlert[] = [
  {
    id: 'b1',
    file: 'src/users/user-service.ts',
    line: 145,
    severity: 'CRITICAL',
    message: 'Missing null check on user.email',
    pattern: 'Null Pointer Dereference'
  },
  {
    id: 'b2',
    file: 'src/payments/processor.ts',
    line: 23,
    severity: 'HIGH',
    message: 'Race condition in payment status update',
    pattern: 'Concurrency Violation'
  },
  {
    id: 'b3',
    file: 'src/components/Table.tsx',
    line: 88,
    severity: 'MEDIUM',
    message: 'Array index used as key prop',
    pattern: 'React Anti-pattern'
  }
];

export const MOCK_COSTS: CostItem[] = [
  { name: 'Database Queries', current: 5000, optimized: 200 },
  { name: 'Compute (EC2)', current: 1200, optimized: 950 },
  { name: 'Data Transfer', current: 800, optimized: 300 },
  { name: 'Storage', current: 150, optimized: 50 },
];

export const MOCK_DECISIONS: Decision[] = [
  { id: 'd1', date: '2023-10-15', title: 'Migrate to Async/Await', type: 'Performance', author: 'Sarah J.' },
  { id: 'd2', date: '2023-09-22', title: 'Implement JWT Auth', type: 'Security', author: 'Mike T.' },
  { id: 'd3', date: '2023-08-10', title: 'Introduce Redis Caching', type: 'Reliability', author: 'Alex C.' },
];

export const LINEAGE_NODES: LineageNode[] = [
  { id: 'users.email', group: 1, label: 'users.email (DB)' },
  { id: 'orders.amount', group: 1, label: 'orders.amount (DB)' },
  { id: 'GET /users', group: 2, label: 'GET /users (API)' },
  { id: 'POST /pay', group: 2, label: 'POST /pay (API)' },
  { id: 'AuthService', group: 3, label: 'AuthService' },
  { id: 'EmailService', group: 3, label: 'EmailService' },
  { id: 'PaymentService', group: 3, label: 'PaymentService' },
  { id: 'Dashboard', group: 4, label: 'Dashboard (UI)' },
  { id: 'Checkout', group: 4, label: 'Checkout (UI)' },
];

export const LINEAGE_LINKS: LineageLink[] = [
  { source: 'users.email', target: 'GET /users', value: 1 },
  { source: 'GET /users', target: 'AuthService', value: 1 },
  { source: 'AuthService', target: 'Dashboard', value: 1 },
  { source: 'users.email', target: 'EmailService', value: 1 },
  { source: 'orders.amount', target: 'POST /pay', value: 1 },
  { source: 'POST /pay', target: 'PaymentService', value: 1 },
  { source: 'PaymentService', target: 'Checkout', value: 1 },
];
