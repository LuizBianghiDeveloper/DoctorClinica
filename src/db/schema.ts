import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const appointmentTypesTable = pgTable("appointment_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  durationInMinutes: integer("duration_in_minutes").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const appointmentTypesTableRelations = relations(
  appointmentTypesTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentTypesTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const revenueGoalPeriodEnum = pgEnum("revenue_goal_period", [
  "monthly",
  "quarterly",
  "yearly",
]);

export const revenueGoalsTable = pgTable("revenue_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  periodType: revenueGoalPeriodEnum("period_type").notNull(),
  periodRef: text("period_ref").notNull(),
  targetInCents: integer("target_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const revenueGoalsTableRelations = relations(
  revenueGoalsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [revenueGoalsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const contractTemplatesTable = pgTable("contract_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const contractTemplatesTableRelations = relations(
  contractTemplatesTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [contractTemplatesTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const roomTypeEnum = pgEnum("room_type", ["room", "equipment"]);

export const roomsTable = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: roomTypeEnum("type").default("room").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const roomsTableRelations = relations(roomsTable, ({ one, many }) => ({
  clinic: one(clinicsTable, {
    fields: [roomsTable.clinicId],
    references: [clinicsTable.id],
  }),
  appointments: many(appointmentsTable),
}));

export const clinicsTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  appointments: many(appointmentsTable),
  appointmentTypes: many(appointmentTypesTable),
  revenueGoals: many(revenueGoalsTable),
  contractTemplates: many(contractTemplatesTable),
  rooms: many(roomsTable),
  usersToClinics: many(usersToClinicsTable),
}));

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  // Legado: usado como fallback quando não há registros em doctor_availability
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  commissionPercent: integer("commission_percent"), // 0-100, null = sem comissão
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const doctorSpecialtiesTable = pgTable("doctor_specialties", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  specialty: text("specialty").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorSpecialtiesTableRelations = relations(
  doctorSpecialtiesTable,
  ({ one }) => ({
    doctor: one(doctorsTable, {
      fields: [doctorSpecialtiesTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);

// Horário disponível por dia da semana (0=domingo, 1=segunda, ..., 6=sábado)
export const doctorAvailabilityTable = pgTable("doctor_availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  weekDay: integer("week_day").notNull(), // 0-6
  fromTime: time("from_time").notNull(),
  toTime: time("to_time").notNull(),
});

export const doctorAvailabilityTableRelations = relations(
  doctorAvailabilityTable,
  ({ one }) => ({
    doctor: one(doctorsTable, {
      fields: [doctorAvailabilityTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);

export const doctorTimeBlockTypeEnum = pgEnum("doctor_time_block_type", [
  "interval",
  "lunch",
  "day_off",
]);

export const doctorTimeBlocksTable = pgTable("doctor_time_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  type: doctorTimeBlockTypeEnum("type").notNull(),
  weekDay: integer("week_day"),
  blockDate: date("block_date"),
  fromTime: time("from_time").notNull(),
  toTime: time("to_time").notNull(),
});

export const doctorTimeBlocksTableRelations = relations(
  doctorTimeBlocksTable,
  ({ one }) => ({
    doctor: one(doctorsTable, {
      fields: [doctorTimeBlocksTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);

export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    availability: many(doctorAvailabilityTable),
    timeBlocks: many(doctorTimeBlocksTable),
    specialties: many(doctorSpecialtiesTable),
  }),
);

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  birthDate: date("birth_date"),
  rg: text("rg"),
  cpf: text("cpf"),
  photoUrl: text("photo_url"),
  allergiesRestrictions: text("allergies_restrictions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sex: patientSexEnum("sex").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientsTableRelations = relations(
  patientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "completed",
  "no_show",
  "cancelled",
]);

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  status: appointmentStatusEnum("status").default("completed").notNull(),
  appointmentTypeId: uuid("appointment_type_id").references(
    () => appointmentTypesTable.id,
    { onDelete: "set null" },
  ),
  roomId: uuid("room_id").references(() => roomsTable.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
    appointmentType: one(appointmentTypesTable, {
      fields: [appointmentsTable.appointmentTypeId],
      references: [appointmentTypesTable.id],
    }),
    room: one(roomsTable, {
      fields: [appointmentsTable.roomId],
      references: [roomsTable.id],
    }),
  }),
);

export const auditLogTable = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogTableRelations = relations(auditLogTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [auditLogTable.clinicId],
    references: [clinicsTable.id],
  }),
  user: one(usersTable, {
    fields: [auditLogTable.userId],
    references: [usersTable.id],
  }),
}));
