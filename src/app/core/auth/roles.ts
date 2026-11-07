import { User } from './models/auth';

/** Who may buy a ticket: a visitor (who signs in as a customer to pay) or a customer. */
export function canBuyTickets(user: User | null): boolean {
  throw new Error(`Step 23b: ${user?.role}`);
}

/** The page a staff member works on, instead of the public pages; null for the others. */
export function staffHome(role: User['role'] | undefined): string | null {
  throw new Error(`Step 23b: ${role}`);
}
