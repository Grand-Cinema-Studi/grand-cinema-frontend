import { User } from './models/auth';

/** The staff pages, by role: the cashier and the inspector work there, not on the public pages. */
const STAFF_HOMES: Partial<Record<User['role'], string>> = {
  Cashier: '/tracking',
  TicketInspector: '/ticket-check',
};

/** Who may buy a ticket: a visitor (who signs in as a customer to pay) or a customer. The API agrees (403). */
export function canBuyTickets(user: User | null): boolean {
  return user === null || user.role === 'Customer';
}

/** The page a staff member works on, instead of the public pages; null for the others. */
export function staffHome(role: User['role'] | undefined): string | null {
  return (role && STAFF_HOMES[role]) ?? null;
}
