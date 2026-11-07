import { User } from './models/auth';
import { canBuyTickets, staffHome } from './roles';

describe('Roles', () => {
  const as = (role: User['role']) => ({ role }) as User;

  it('when the role is read, then only a visitor or a customer can buy tickets', () => {
    expect(canBuyTickets(null)).toBe(true);
    expect(canBuyTickets(as('Customer'))).toBe(true);
    expect(canBuyTickets(as('Cashier'))).toBe(false);
    expect(canBuyTickets(as('TicketInspector'))).toBe(false);
    expect(canBuyTickets(as('Manager'))).toBe(false);
  });

  it('when the cashier or the inspector is signed in, then their own page is their home', () => {
    expect(staffHome('Cashier')).toBe('/tracking');
    expect(staffHome('TicketInspector')).toBe('/ticket-check');
    expect(staffHome('Manager')).toBeNull();
    expect(staffHome('Customer')).toBeNull();
    expect(staffHome(undefined)).toBeNull();
  });
});
