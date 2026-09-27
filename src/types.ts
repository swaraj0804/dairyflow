export type User = {
  id?: number;
  uid?: string;
  name: string;
  farmName: string;
  email?: string;
  phone?: string;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  milkType: 'Cow' | 'Buffalo';
  shift: 'Morning' | 'Evening';
  litres: number;
  price: number;
};

export type DailyFinanceEntry = {
  id: string;
  date: string;
  customerId: string;
  amount: number;
  confirmed: boolean;
  _synced?: boolean;
};

export type MilkInwardEntry = {
  id: string;
  date: string;
  shift: 'Morning' | 'Evening';
  litres: number;
  temp: number;
  snf: number;
  rate: number;
  fat: number;
  totalAmount: number;
  _synced?: boolean;
  _offlineCreated?: boolean;
};

export type ExpenseEntry = {
  id: string;
  date: string;
  name: string;
  price: number;
  _synced?: boolean;
  _offlineCreated?: boolean;
};
