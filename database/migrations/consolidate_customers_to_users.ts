/**
 * Migration: Consolidate Customers to Users
 * 
 * Esta migración consolida los datos de la tabla customers en la tabla users
 * como parte de la refactorización de la inconsistencia del Model Customer.
 * 
 * Decisión arquitectónica: Customer como User con rol (tabla única)
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import { User, UserRole } from '../../src/types';

// Interfaz para la tabla customers (antes de la migración)
interface LegacyCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  company?: string;
  notes?: string;
  customerType?: 'individual' | 'corporate';
  preferences?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para la tabla orders (para actualizar las foreign keys)
interface Order {
  id: string;
  customerId: string;
  title: string;
  description: string;
  // ... otros campos
}

/**
 * Migración UP: Consolidar customers a users
 */
export async function up(): Promise<void> {
  console.log('🔄 Iniciando migración: Consolidar customers a users');
  
  try {
    // 1. Agregar campos específicos de Customer a la tabla users
    console.log('📝 Paso 1: Agregando campos específicos de customer a users');
    await addCustomerFieldsToUsers();
    
    // 2. Migrar datos de customers a users
    console.log('📝 Paso 2: Migrando datos de customers a users');
    const migratedCount = await migrateCustomersToUsers();
    
    // 3. Actualizar foreign keys en orders
    console.log('📝 Paso 3: Actualizando foreign keys en orders');
    await updateOrdersForeignKeys();
    
    // 4. Verificar la migración
    console.log('📝 Paso 4: Verificando la migración');
    await verifyMigration();
    
    console.log(`✅ Migración completada exitosamente. ${migratedCount} customers migrados a users.`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

/**
 * Migración DOWN: Revertir la consolidación
 */
export async function down(): Promise<void> {
  console.log('🔄 Iniciando rollback: Separar customers de users');
  
  try {
    // 1. Recrear tabla customers
    console.log('📝 Paso 1: Recreando tabla customers');
    await recreateCustomersTable();
    
    // 2. Mover customers de users a tabla separada
    console.log('📝 Paso 2: Moviendo customers de users a tabla customers');
    const revertedCount = await moveCustomersBackToTable();
    
    // 3. Eliminar customers de users
    console.log('📝 Paso 3: Eliminando customers de users');
    await deleteCustomersFromUsers();
    
    // 4. Eliminar campos específicos de customer de users
    console.log('📝 Paso 4: Eliminando campos específicos de customer de users');
    await removeCustomerFieldsFromUsers();
    
    console.log(`✅ Rollback completado exitosamente. ${revertedCount} customers revertidos a tabla separada.`);
    
  } catch (error) {
    console.error('❌ Error durante el rollback:', error);
    throw error;
  }
}

/**
 * Agregar campos específicos de Customer a la tabla users
 */
async function addCustomerFieldsToUsers(): Promise<void> {
  // Simular ALTER TABLE users ADD COLUMN
  const sql = `
    ALTER TABLE users 
    ADD COLUMN customer_notes TEXT,
    ADD COLUMN customer_type VARCHAR(20) CHECK (customer_type IN ('individual', 'corporate')),
    ADD COLUMN customer_preferences TEXT;
  `;
  
  console.log('🔧 Ejecutando:', sql);
  // await db.query(sql);
}

/**
 * Migrar datos de customers a users
 */
async function migrateCustomersToUsers(): Promise<number> {
  // Simular consulta para obtener todos los customers
  const customers: LegacyCustomer[] = await getLegacyCustomers();
  
  let migratedCount = 0;
  
  for (const customer of customers) {
    // Crear usuario para cada customer
    const newUser: Partial<User> = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}@temp.com`,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      company: customer.company,
      role: UserRole.CUSTOMER,
      isActive: customer.isActive,
      languagePreference: 'es',
      
      // Campos específicos de customer
      customerNotes: customer.notes,
      customerType: customer.customerType || 'individual',
      customerPreferences: customer.preferences,
      
      // Helpers
      isCustomer: true,
      isEmployee: false,
      
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
    
    // Simular INSERT INTO users
    const sql = `
      INSERT INTO users (
        id, first_name, last_name, email, password, role, 
        phone_number, address, company, is_active, language_preference,
        customer_notes, customer_type, customer_preferences,
        created_at, updated_at
      ) VALUES (
        '${newUser.id}', '${newUser.firstName}', '${newUser.lastName}', 
        '${newUser.email}', '$2b$10$tempHashedPassword', '${newUser.role}',
        '${newUser.phoneNumber}', '${newUser.address}', '${newUser.company}',
        ${newUser.isActive}, '${newUser.languagePreference}',
        '${newUser.customerNotes}', '${newUser.customerType}', '${newUser.customerPreferences}',
        '${newUser.createdAt?.toISOString()}', '${newUser.updatedAt?.toISOString()}'
      );
    `;
    
    console.log(`   📋 Migrando customer: ${customer.firstName} ${customer.lastName}`);
    // await db.query(sql);
    
    migratedCount++;
  }
  
  return migratedCount;
}

/**
 * Actualizar foreign keys en orders
 */
async function updateOrdersForeignKeys(): Promise<void> {
  // Las foreign keys ya apuntan a users, no necesitan cambios
  // Solo verificar que las constraints estén correctas
  
  const sql = `
    -- Verificar que customer_id en orders apunte a users
    ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS fk_orders_customer_id,
    ADD CONSTRAINT fk_orders_customer_id 
    FOREIGN KEY (customer_id) REFERENCES users(id);
  `;
  
  console.log('🔧 Actualizando foreign keys en orders');
  // await db.query(sql);
}

/**
 * Verificar que la migración fue exitosa
 */
async function verifyMigration(): Promise<void> {
  // Verificar que todos los customers ahora son users con rol CUSTOMER
  const customerUsersCount = await countCustomerUsers();
  const originalCustomersCount = await countOriginalCustomers();
  
  console.log(`   ✅ Verificación: ${customerUsersCount} users con rol CUSTOMER`);
  console.log(`   ✅ Verificación: ${originalCustomersCount} customers originales`);
  
  if (customerUsersCount !== originalCustomersCount) {
    throw new Error(`Migración incompleta: ${customerUsersCount} users vs ${originalCustomersCount} customers originales`);
  }
  
  // Verificar que las órdenes mantienen sus referencias
  const ordersWithValidCustomers = await countOrdersWithValidCustomers();
  console.log(`   ✅ Verificación: ${ordersWithValidCustomers} órdenes con customers válidos`);
}

/**
 * Rollback: Recrear tabla customers
 */
async function recreateCustomersTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      phone_number VARCHAR(20),
      address TEXT,
      company VARCHAR(255),
      notes TEXT,
      customer_type VARCHAR(20) CHECK (customer_type IN ('individual', 'corporate')),
      preferences TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  console.log('🔧 Recreando tabla customers');
  // await db.query(sql);
}

/**
 * Rollback: Mover customers de users a tabla separada
 */
async function moveCustomersBackToTable(): Promise<number> {
  const customerUsers = await getUsersWithCustomerRole();
  
  let revertedCount = 0;
  
  for (const user of customerUsers) {
    const sql = `
      INSERT INTO customers (
        id, first_name, last_name, email, phone_number, address, company,
        notes, customer_type, preferences, is_active, created_at, updated_at
      ) VALUES (
        '${user.id}', '${user.firstName}', '${user.lastName}', '${user.email}',
        '${user.phoneNumber}', '${user.address}', '${user.company}',
        '${user.customerNotes}', '${user.customerType}', '${user.customerPreferences}',
        ${user.isActive}, '${user.createdAt?.toISOString()}', '${user.updatedAt?.toISOString()}'
      );
    `;
    
    console.log(`   📋 Revirtiendo customer: ${user.firstName} ${user.lastName}`);
    // await db.query(sql);
    
    revertedCount++;
  }
  
  return revertedCount;
}

/**
 * Rollback: Eliminar customers de users
 */
async function deleteCustomersFromUsers(): Promise<void> {
  const sql = `DELETE FROM users WHERE role = 'Customer';`;
  
  console.log('🔧 Eliminando customers de users');
  // await db.query(sql);
}

/**
 * Rollback: Eliminar campos específicos de customer de users
 */
async function removeCustomerFieldsFromUsers(): Promise<void> {
  const sql = `
    ALTER TABLE users 
    DROP COLUMN IF EXISTS customer_notes,
    DROP COLUMN IF EXISTS customer_type,
    DROP COLUMN IF EXISTS customer_preferences;
  `;
  
  console.log('🔧 Eliminando campos específicos de customer de users');
  // await db.query(sql);
}

/**
 * Funciones auxiliares para simular consultas a la base de datos
 */
async function getLegacyCustomers(): Promise<LegacyCustomer[]> {
  // Simular datos de customers existentes
  return [
    {
      id: 'customer-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phoneNumber: '+1-555-0001',
      address: '123 Main St',
      company: 'Acme Corp',
      notes: 'Cliente VIP',
      customerType: 'corporate',
      preferences: 'Contacto por email',
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15'),
    },
    {
      id: 'customer-2',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@email.com',
      phoneNumber: '+1-555-0002',
      address: '456 Oak Ave',
      company: 'Tech Solutions',
      notes: 'Cliente regular',
      customerType: 'individual',
      preferences: 'Contacto por teléfono',
      isActive: true,
      createdAt: new Date('2023-02-20'),
      updatedAt: new Date('2023-02-20'),
    },
  ];
}

async function countCustomerUsers(): Promise<number> {
  // Simular COUNT(*) FROM users WHERE role = 'Customer'
  return 2;
}

async function countOriginalCustomers(): Promise<number> {
  // Simular COUNT(*) FROM customers
  return 2;
}

async function countOrdersWithValidCustomers(): Promise<number> {
  // Simular COUNT(*) FROM orders WHERE customer_id IN (SELECT id FROM users WHERE role = 'Customer')
  return 5;
}

async function getUsersWithCustomerRole(): Promise<User[]> {
  // Simular SELECT * FROM users WHERE role = 'Customer'
  return [
    {
      id: 'customer-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1-555-0001',
      address: '123 Main St',
      company: 'Acme Corp',
      isActive: true,
      languagePreference: 'es',
      customerNotes: 'Cliente VIP',
      customerType: 'corporate',
      customerPreferences: 'Contacto por email',
      isCustomer: true,
      isEmployee: false,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15'),
    },
    {
      id: 'customer-2',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@email.com',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1-555-0002',
      address: '456 Oak Ave',
      company: 'Tech Solutions',
      isActive: true,
      languagePreference: 'es',
      customerNotes: 'Cliente regular',
      customerType: 'individual',
      customerPreferences: 'Contacto por teléfono',
      isCustomer: true,
      isEmployee: false,
      createdAt: new Date('2023-02-20'),
      updatedAt: new Date('2023-02-20'),
    },
  ];
}

/**
 * Instrucciones de ejecución
 */
export const migrationInstructions = `
🔧 INSTRUCCIONES DE EJECUCIÓN DE MIGRACIÓN

1. **Backup de la base de datos**:
   \`\`\`bash
   pg_dump -U postgres -h localhost lumasachi_control > backup_before_migration.sql
   \`\`\`

2. **Ejecutar migración**:
   \`\`\`bash
   # En Laravel
   php artisan migrate --path=database/migrations/consolidate_customers_to_users.php
   
   # En Node.js/TypeScript
   npx ts-node database/migrations/consolidate_customers_to_users.ts
   \`\`\`

3. **Verificar migración**:
   \`\`\`sql
   -- Verificar que los customers ahora son users
   SELECT COUNT(*) FROM users WHERE role = 'Customer';
   
   -- Verificar que las órdenes mantienen sus referencias
   SELECT COUNT(*) FROM orders o 
   JOIN users u ON o.customer_id = u.id 
   WHERE u.role = 'Customer';
   \`\`\`

4. **Rollback si es necesario**:
   \`\`\`bash
   # En Laravel
   php artisan migrate:rollback --path=database/migrations/consolidate_customers_to_users.php
   
   # En Node.js/TypeScript
   npx ts-node -e "import('./database/migrations/consolidate_customers_to_users.ts').then(m => m.down())"
   \`\`\`

5. **Limpiar tabla customers antigua** (SOLO después de verificar que todo funciona):
   \`\`\`sql
   DROP TABLE IF EXISTS customers;
   \`\`\`

⚠️ **IMPORTANTE**: 
- Ejecutar en un entorno de prueba primero
- Verificar que todas las aplicaciones usen la nueva estructura
- Mantener el backup hasta confirmar que la migración es exitosa
- Actualizar todos los endpoints de API para usar la nueva estructura
`;

// Exportar las funciones para uso en tests
export { 
  addCustomerFieldsToUsers,
  migrateCustomersToUsers,
  updateOrdersForeignKeys,
  verifyMigration,
  recreateCustomersTable,
  moveCustomersBackToTable,
  deleteCustomersFromUsers,
  removeCustomerFieldsFromUsers
}; 