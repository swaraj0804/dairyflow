import { pgTable, text, boolean, doublePrecision, varchar, serial, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  farmName: varchar('farm_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  password: varchar('password', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
  index('users_uid_idx').on(table.uid),
]);

export const customers = pgTable('customers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  milkType: varchar('milk_type', { length: 20 }).notNull(), // 'Cow' | 'Buffalo'
  shift: varchar('shift', { length: 20 }).notNull(), // 'Morning' | 'Evening'
  litres: doublePrecision('litres').notNull().default(0),
  price: doublePrecision('price').notNull().default(0),
}, (table) => [
  index('customers_user_id_idx').on(table.userId),
]);

export const dailyFinance = pgTable('daily_finance', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  date: varchar('date', { length: 20 }).notNull(),
  customerId: varchar('customer_id', { length: 50 }).notNull().references(() => customers.id),
  amount: doublePrecision('amount').notNull(),
  confirmed: boolean('confirmed').notNull().default(false),
}, (table) => [
  index('daily_finance_user_id_idx').on(table.userId),
  index('daily_finance_date_idx').on(table.date),
  index('daily_finance_user_date_idx').on(table.userId, table.date),
  index('daily_finance_customer_id_idx').on(table.customerId),
]);

export const milkInward = pgTable('milk_inward', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  date: varchar('date', { length: 20 }).notNull(),
  shift: varchar('shift', { length: 20 }).notNull(), // 'Morning' | 'Evening'
  litres: doublePrecision('litres').notNull(),
  temp: doublePrecision('temp').notNull(),
  snf: doublePrecision('snf').notNull(),
  rate: doublePrecision('rate').notNull(),
  fat: doublePrecision('fat').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
}, (table) => [
  index('milk_inward_user_id_idx').on(table.userId),
  index('milk_inward_date_idx').on(table.date),
  index('milk_inward_user_date_idx').on(table.userId, table.date),
]);

export const expenses = pgTable('expenses', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  date: varchar('date', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  price: doublePrecision('price').notNull(),
}, (table) => [
  index('expenses_user_id_idx').on(table.userId),
  index('expenses_date_idx').on(table.date),
  index('expenses_user_date_idx').on(table.userId, table.date),
]);
