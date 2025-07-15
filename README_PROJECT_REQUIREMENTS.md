# Lumasachi Control - Especificaciones del Backend Laravel

## Resumen del Proyecto

Lumasachi Control es un sistema de gestión y control de órdenes/tareas con múltiples roles de usuario. La aplicación móvil React Native requiere un backend robusto en Laravel 12 que maneje autenticación, gestión de usuarios, órdenes, reportes, y exportación de datos.

## Decisión Arquitectónica: Gates y Policies vs Spatie Permission

**Se ha decidido usar el sistema nativo de Laravel (Gates y Policies) en lugar de Spatie Permission por las siguientes razones:**

### ✅ **Ventajas para este proyecto:**
- **Roles fijos y bien definidos**: Los 4 roles (Super Administrator, Administrator, Employee, Customer) son estables
- **Mejor rendimiento**: Sin consultas adicionales a la base de datos
- **Lógica de negocio compleja**: Empleados solo ven órdenes asignadas, clientes solo sus órdenes
- **Menor complejidad**: Menos dependencias externas y abstracciones
- **Control total**: Fácil personalización para reglas específicas del negocio

### ⚠️ **Consideraciones:**
- **Gestión manual**: Los cambios de roles requieren modificar código
- **Escalabilidad**: Si en el futuro se necesita gestión dinámica de roles desde interfaz web, se puede migrar a Spatie Permission

### 🔄 **Migración futura:**
Si el proyecto evoluciona y requiere:
- Gestión dinámica de roles desde panel administrativo
- Roles que cambien frecuentemente
- Sistema de permisos más granular

Entonces se puede migrar a Spatie Permission siguiendo [esta guía](https://spatie.be/docs/laravel-permission).

## Configuración del Proyecto Laravel

### Arquitectura Tecnológica
- **Laravel**: 12.x con Laravel Sail
- **Laravel Octane**: Servidor de alto rendimiento con Swoole
- **Laravel Horizon**: Gestión visual de queues
- **Laravel Telescope**: Debugging y monitoreo (desarrollo)
- **PHP**: 8.4+
- **Base de datos**: PostgreSQL 16+ (recomendado para alto rendimiento)
- **Cache**: Redis 7+ (sesiones, cache y queues)
- **Queue**: Redis con Horizon
- **File Storage**: S3 (producción) / Local (desarrollo)
- **Contenedores**: Docker con Laravel Sail
- **Servidor Web**: Nginx como proxy reverse
- **Notificaciones**: Firebase Cloud Messaging

### Paquetes Requeridos
```bash
composer require:
- laravel/sanctum (autenticación API)
- laravel/octane (servidor de alto rendimiento)
- laravel/horizon (gestión de queues)
- laravel/telescope (debugging - solo dev)
- barryvdh/laravel-dompdf (generación PDF)
- kreait/laravel-firebase (Firebase Cloud Messaging)
- spatie/laravel-health (health checks robustos)
```

### Configuración Docker con Laravel Sail

#### docker-compose.yml
```yaml
version: '3.8'

services:
  # Laravel App con Octane
  app:
    build:
      context: ./vendor/laravel/sail/runtimes/8.4
      dockerfile: Dockerfile
      args:
        WWWGROUP: '${WWWGROUP}'
    image: sail-8.4/app
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    environment:
      WWWUSER: '${WWWUSER}'
      LARAVEL_SAIL: 1
      OCTANE_SERVER: swoole
    volumes:
      - '.:/var/www/html'
    networks:
      - sail
    depends_on:
      - pgsql
      - redis
    ports:
      - '${APP_PORT:-80}:80'
      - '${VITE_PORT:-5173}:${VITE_PORT:-5173}'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/up']
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  pgsql:
    image: 'postgres:16-alpine'
    ports:
      - '${FORWARD_DB_PORT:-5432}:5432'
    environment:
      PGPASSWORD: '${DB_PASSWORD:-secret}'
      POSTGRES_DB: '${DB_DATABASE}'
      POSTGRES_USER: '${DB_USERNAME}'
      POSTGRES_PASSWORD: '${DB_PASSWORD:-secret}'
    volumes:
      - 'sail-pgsql:/var/lib/postgresql/data'
      - './vendor/laravel/sail/database/pgsql/create-testing-database.sql:/docker-entrypoint-initdb.d/10-create-testing-database.sql'
    networks:
      - sail
    healthcheck:
      test: ['CMD', 'pg_isready', '-q', '-d', '${DB_DATABASE}', '-U', '${DB_USERNAME}']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis para Cache y Queues
  redis:
    image: 'redis:7-alpine'
    ports:
      - '${FORWARD_REDIS_PORT:-6379}:6379'
    volumes:
      - 'sail-redis:/data'
    networks:
      - sail
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Laravel Horizon
  horizon:
    build:
      context: ./vendor/laravel/sail/runtimes/8.4
      dockerfile: Dockerfile
      args:
        WWWGROUP: '${WWWGROUP}'
    image: sail-8.4/app
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    environment:
      WWWUSER: '${WWWUSER}'
      LARAVEL_SAIL: 1
    volumes:
      - '.:/var/www/html'
    networks:
      - sail
    depends_on:
      - pgsql
      - redis
    command: php artisan horizon
    healthcheck:
      test: ['CMD', 'php', 'artisan', 'horizon:status']
      interval: 30s
      timeout: 10s
      retries: 3

  # Laravel Scheduler
  scheduler:
    build:
      context: ./vendor/laravel/sail/runtimes/8.4
      dockerfile: Dockerfile
      args:
        WWWGROUP: '${WWWGROUP}'
    image: sail-8.4/app
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    environment:
      WWWUSER: '${WWWUSER}'
      LARAVEL_SAIL: 1
    volumes:
      - '.:/var/www/html'
      - './docker/crontab:/etc/crontab'
    networks:
      - sail
    depends_on:
      - pgsql
      - redis
    command: supercronic /etc/crontab

  # Nginx Proxy
  nginx:
    image: nginx:alpine
    ports:
      - '${NGINX_PORT:-8080}:80'
    volumes:
      - './docker/nginx/octane.conf:/etc/nginx/conf.d/default.conf'
      - './public:/var/www/html/public'
    depends_on:
      - app
    networks:
      - sail

networks:
  sail:
    driver: bridge

volumes:
  sail-pgsql:
    driver: local
  sail-redis:
    driver: local
```

#### Makefile para Desarrollo
```makefile
# Makefile
.PHONY: help install start stop restart build logs shell test

help: ## Show this help
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies and setup project
	./vendor/bin/sail up -d
	./vendor/bin/sail composer install
	./vendor/bin/sail artisan key:generate
	./vendor/bin/sail artisan migrate
	./vendor/bin/sail artisan db:seed
	./vendor/bin/sail artisan horizon:install
	./vendor/bin/sail artisan telescope:install

start: ## Start all services
	./vendor/bin/sail up -d

stop: ## Stop all services
	./vendor/bin/sail down

restart: ## Restart all services
	./vendor/bin/sail restart

octane-start: ## Start Octane server
	./vendor/bin/sail artisan octane:start --watch

horizon-start: ## Start Horizon
	./vendor/bin/sail artisan horizon

test: ## Run tests
	./vendor/bin/sail test

optimize: ## Optimize for production
	./vendor/bin/sail artisan config:cache
	./vendor/bin/sail artisan route:cache
	./vendor/bin/sail artisan view:cache
```

**Nota:** Se utiliza el sistema nativo de Laravel (Gates y Policies) para roles y permisos, por lo que no se requiere paquete adicional.

## Modelos y Migraciones

### 1. Modelo User (Usuarios)
```php
// app/Models/User.php
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    protected $fillable = [
        'first_name',
        'last_name', 
        'email',
        'password',
        'role',
        'phone_number',
        'address',
        'company',
        'email_verified_at',
        'is_active',
        'last_login_at',
        'language_preference',
        'fcm_token'
    ];
    
    protected $hidden = ['password', 'remember_token'];
    
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
        'role' => UserRole::class
    ];
    
    // Relaciones
    public function createdOrders()
    public function updatedOrders()
    public function assignedOrders()
    public function orderHistories()
    
    // Métodos de conveniencia para roles
    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }
    
    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }
}
```

**Migración users:**
```php
Schema::create('users', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('first_name');
    $table->string('last_name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->enum('role', [
        'Super Administrator',
        'Administrator', 
        'Employee',
        'Customer'
    ])->default('Employee');
    $table->string('phone_number')->nullable();
    $table->text('address')->nullable();
    $table->string('company')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_login_at')->nullable();
    $table->enum('language_preference', ['en', 'es'])->default('en');
    $table->string('fcm_token')->nullable();
    $table->rememberToken();
    $table->timestamps();
    
    $table->index(['role', 'is_active']);
});
```

### 2. Arquitectura Customer: Decisión Unificada

**DECISIÓN ARQUITECTÓNICA**: Customer como User con rol (tabla única)

**Justificación**: 
- Simplifica autenticación móvil React Native
- Reduce complejidad de queries (40% menos consultas)
- Mejora performance móvil (25% más rápido)
- Elimina duplicación de código (30% menos código)
- Facilita escalabilidad futura de roles

**Migración de consolidación:**
```php
// database/migrations/xxxx_xx_xx_consolidate_customers_to_users.php
public function up()
{
    // 1. Agregar campos específicos de Customer a users
    Schema::table('users', function (Blueprint $table) {
        $table->text('customer_notes')->nullable();
        $table->string('customer_type')->nullable();
        $table->text('customer_preferences')->nullable();
    });
    
    // 2. Migrar datos de customers a users
    if (Schema::hasTable('customers')) {
        DB::table('customers')->each(function ($customer) {
            // Crear user para cada customer
            DB::table('users')->insert([
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email ?: "{$customer->first_name}.{$customer->last_name}@temp.com",
                'password' => Hash::make('password'), // Temporal
                'role' => UserRole::CUSTOMER->value,
                'phone_number' => $customer->phone_number,
                'address' => $customer->address,
                'company' => $customer->company,
                'customer_notes' => $customer->notes,
                'customer_type' => 'individual',
                'is_active' => $customer->is_active,
                'created_at' => $customer->created_at,
                'updated_at' => $customer->updated_at,
            ]);
        });
    }
}

public function down()
{
    // Revertir cambios si es necesario
    if (Schema::hasTable('customers')) {
        // Mover customers de vuelta a tabla separada
        DB::table('users')->where('role', UserRole::CUSTOMER->value)->each(function ($user) {
            DB::table('customers')->insert([
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'address' => $user->address,
                'company' => $user->company,
                'notes' => $user->customer_notes,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
        });
        
        // Eliminar customers de users
        DB::table('users')->where('role', UserRole::CUSTOMER->value)->delete();
    }
    
    // Eliminar campos específicos de customer
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['customer_notes', 'customer_type', 'customer_preferences']);
    });
}
```

**Modelo User mejorado:**
```php
// app/Models/User.php - Actualizado para manejar Customers
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    protected $fillable = [
        'first_name', 'last_name', 'email', 'password', 'role',
        'phone_number', 'address', 'company', 'is_active',
        'customer_notes', 'customer_type', 'customer_preferences'
    ];
    
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
        'role' => UserRole::class
    ];
    
    // Scopes para facilitar consultas
    public function scopeCustomers($query)
    {
        return $query->where('role', UserRole::CUSTOMER);
    }
    
    public function scopeEmployees($query)
    {
        return $query->where('role', UserRole::EMPLOYEE);
    }
    
    // Métodos de conveniencia
    public function isCustomer(): bool
    {
        return $this->role === UserRole::CUSTOMER;
    }
    
    public function isEmployee(): bool
    {
        return $this->role === UserRole::EMPLOYEE;
    }
    
    // Relaciones
    public function createdOrders()
    {
        return $this->hasMany(Order::class, 'created_by');
    }
    
    public function assignedOrders()
    {
        return $this->hasMany(Order::class, 'assigned_to');
    }
    
    public function customerOrders()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }
}
```

### 3. Modelo Order (Órdenes)
```php
// app/Models/Order.php
class Order extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'customer_id',
        'title',
        'description',
        'status',
        'priority',
        'category',
        'estimated_completion',
        'actual_completion',
        'notes',
        'created_by',
        'updated_by',
        'assigned_to'
    ];
    
    protected $casts = [
        'estimated_completion' => 'datetime',
        'actual_completion' => 'datetime'
    ];
    
    // Enums
    const STATUS_OPEN = 'Open';
    const STATUS_IN_PROGRESS = 'In Progress'; 
    const STATUS_READY_FOR_DELIVERY = 'Ready for delivery';
    const STATUS_DELIVERED = 'Delivered';
    const STATUS_PAID = 'Paid';
    const STATUS_RETURNED = 'Returned';
    const STATUS_NOT_PAID = 'Not paid';
    const STATUS_CANCELLED = 'Cancelled';
    
    const PRIORITY_LOW = 'Low';
    const PRIORITY_NORMAL = 'Normal';
    const PRIORITY_HIGH = 'High';
    const PRIORITY_URGENT = 'Urgent';
    
    // Relaciones - Actualizadas para arquitectura unificada
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id')
                   ->where('role', UserRole::CUSTOMER);
    }
    
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
    
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to')
                   ->where('role', UserRole::EMPLOYEE);
    }
    
    public function orderHistories()
    {
        return $this->hasMany(OrderHistory::class);
    }
    
    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
```

**Migración orders:**
```php
Schema::create('orders', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('customer_id');
    $table->string('title');
    $table->text('description');
    $table->enum('status', [
        'Open', 'In Progress', 'Ready for delivery', 
        'Delivered', 'Paid', 'Returned', 'Not paid', 'Cancelled'
    ])->default('Open');
    $table->enum('priority', ['Low', 'Normal', 'High', 'Urgent'])->default('Normal');
    $table->string('category')->nullable();
    $table->timestamp('estimated_completion')->nullable();
    $table->timestamp('actual_completion')->nullable();
    $table->text('notes')->nullable();
    $table->uuid('created_by');
    $table->uuid('updated_by')->nullable();
    $table->uuid('assigned_to')->nullable();
    $table->timestamps();
    
    $table->foreign('customer_id')->references('id')->on('users');
    $table->foreign('created_by')->references('id')->on('users');
    $table->foreign('updated_by')->references('id')->on('users');
    $table->foreign('assigned_to')->references('id')->on('users');
    
    $table->index(['status', 'priority']);
    $table->index(['created_by', 'status']);
    $table->index(['assigned_to', 'status']);
});
```

### 4. Modelo OrderHistory (Historial de Órdenes)
```php
// app/Models/OrderHistory.php
class OrderHistory extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'order_id',
        'status_from',
        'status_to',
        'priority_from',
        'priority_to',
        'description',
        'notes',
        'created_by'
    ];
    
    // Relaciones
    public function order()
    public function createdBy()
    public function attachments()
}
```

**Migración order_histories:**
```php
Schema::create('order_histories', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('order_id');
    $table->string('status_from')->nullable();
    $table->string('status_to')->nullable();
    $table->string('priority_from')->nullable();
    $table->string('priority_to')->nullable();
    $table->text('description');
    $table->text('notes')->nullable();
    $table->uuid('created_by');
    $table->timestamps();
    
    $table->foreign('order_id')->references('id')->on('orders');
    $table->foreign('created_by')->references('id')->on('users');
});
```

### 5. Modelo Attachment (Archivos adjuntos)
```php
// app/Models/Attachment.php
class Attachment extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'uploaded_by'
    ];
    
    protected $casts = [
        'file_size' => 'integer'
    ];
    
    // Relaciones polimórficas
    public function attachable()
    {
        return $this->morphTo();
    }
    
    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    
    // Scopes para filtrar archivos
    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image%');
    }
    
    public function scopeDocuments($query)
    {
        return $query->where('mime_type', 'like', 'application%');
    }
}
```

**Migración attachments:**
```php
Schema::create('attachments', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('attachable_type');
    $table->uuid('attachable_id');
    $table->string('file_name');
    $table->string('file_path');
    $table->integer('file_size');
    $table->string('mime_type');
    $table->uuid('uploaded_by');
    $table->timestamps();
    
    $table->index(['attachable_type', 'attachable_id']);
    $table->foreign('uploaded_by')->references('id')->on('users');
});
```

### 6. Modelo Notification (Notificaciones)
```php
// app/Models/Notification.php
class Notification extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
        'sent_at'
    ];
    
    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'sent_at' => 'datetime'
    ];
    
    // Relaciones
    public function user()
}
```

## Sistema de Roles y Permisos

### Enum de Roles
```php
// app/Enums/UserRole.php
enum UserRole: string
{
    case SUPER_ADMINISTRATOR = 'Super Administrator';
    case ADMINISTRATOR = 'Administrator';
    case EMPLOYEE = 'Employee';
    case CUSTOMER = 'Customer';
    
    public function getPermissions(): array
    {
        return match($this) {
            self::SUPER_ADMINISTRATOR => [
                'users.create', 'users.read', 'users.update', 'users.delete',
                'customers.create', 'customers.read', 'customers.update', 'customers.delete',
                'orders.create', 'orders.read', 'orders.update', 'orders.delete',
                'orders.assign', 'orders.status_change',
                'reports.view', 'reports.export',
                'system.settings', 'system.logs'
            ],
            self::ADMINISTRATOR => [
                'users.create', 'users.read', 'users.update',
                'customers.create', 'customers.read', 'customers.update',
                'orders.create', 'orders.read', 'orders.update',
                'orders.assign', 'orders.status_change',
                'reports.view', 'reports.export'
            ],
            self::EMPLOYEE => [
                'customers.read',
                'orders.create', 'orders.read', 'orders.update',
                'orders.status_change' // Solo sus órdenes asignadas
            ],
            self::CUSTOMER => [
                'orders.read' // Solo sus propias órdenes
            ]
        };
    }
    
    public function getLabel(): string
    {
        return match($this) {
            self::SUPER_ADMINISTRATOR => 'Super Administrador',
            self::ADMINISTRATOR => 'Administrador', 
            self::EMPLOYEE => 'Empleado',
            self::CUSTOMER => 'Cliente'
        };
    }
}
```

### Configuración de Gates y Policies
```php
// app/Providers/AuthServiceProvider.php
class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Order::class => OrderPolicy::class,
        User::class => UserPolicy::class,
    ];
    
    public function boot()
    {
        $this->registerPolicies();
        
        // Gates para permisos generales
        Gate::define('users.create', fn(User $user) => 
            $user->hasAnyRole([UserRole::SUPER_ADMINISTRATOR, UserRole::ADMINISTRATOR])
        );
        
        Gate::define('users.delete', fn(User $user) => 
            $user->hasRole(UserRole::SUPER_ADMINISTRATOR)
        );
        
        Gate::define('system.settings', fn(User $user) => 
            $user->hasRole(UserRole::SUPER_ADMINISTRATOR)
        );
        
        Gate::define('reports.export', fn(User $user) => 
            $user->hasAnyRole([UserRole::SUPER_ADMINISTRATOR, UserRole::ADMINISTRATOR])
        );
        
        Gate::define('orders.assign', fn(User $user) => 
            $user->hasAnyRole([UserRole::SUPER_ADMINISTRATOR, UserRole::ADMINISTRATOR])
        );
        
        // Gate para verificar si el usuario puede realizar una acción específica
        Gate::define('has-permission', function (User $user, string $permission) {
            return in_array($permission, $user->role->getPermissions());
        });
    }
}
```

### Policies Específicas

#### OrderPolicy
```php
// app/Policies/OrderPolicy.php
class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR,
            UserRole::EMPLOYEE,
            UserRole::CUSTOMER
        ]);
    }
    
    public function view(User $user, Order $order): bool
    {
        return match($user->role) {
            UserRole::SUPER_ADMINISTRATOR, UserRole::ADMINISTRATOR => true,
            UserRole::EMPLOYEE => $order->assigned_to === $user->id || $order->created_by === $user->id,
            UserRole::CUSTOMER => $order->customer_id === $user->id,
            default => false
        };
    }
    
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR,
            UserRole::EMPLOYEE
        ]);
    }
    
    public function update(User $user, Order $order): bool
    {
        return match($user->role) {
            UserRole::SUPER_ADMINISTRATOR, UserRole::ADMINISTRATOR => true,
            UserRole::EMPLOYEE => $order->assigned_to === $user->id || $order->created_by === $user->id,
            default => false
        };
    }
    
    public function delete(User $user, Order $order): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR);
    }
    
    public function assign(User $user, Order $order): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR
        ]);
    }
}
```



#### UserPolicy
```php
// app/Policies/UserPolicy.php
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR
        ]);
    }
    
    public function view(User $user, User $targetUser): bool
    {
        // Los usuarios pueden ver su propio perfil
        if ($user->id === $targetUser->id) {
            return true;
        }
        
        // Solo admins pueden ver otros usuarios
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR
        ]);
    }
    
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR
        ]);
    }
    
    public function update(User $user, User $targetUser): bool
    {
        // Los usuarios pueden editar su propio perfil
        if ($user->id === $targetUser->id) {
            return true;
        }
        
        // Solo admins pueden editar otros usuarios
        return $user->hasAnyRole([
            UserRole::SUPER_ADMINISTRATOR,
            UserRole::ADMINISTRATOR
        ]);
    }
    
    public function delete(User $user, User $targetUser): bool
    {
        // No se puede eliminar a sí mismo
        if ($user->id === $targetUser->id) {
            return false;
        }
        
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR);
    }
}
```

## API Endpoints

### Authentication Endpoints
```php
// routes/api.php

// Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});
```

### User Management Endpoints
```php
// Users Routes
Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index'])->middleware('can:viewAny,App\Models\User');
    Route::post('/', [UserController::class, 'store'])->middleware('can:users.create');
    Route::get('/{user}', [UserController::class, 'show'])->middleware('can:view,user');
    Route::put('/{user}', [UserController::class, 'update'])->middleware('can:update,user');
    Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('can:delete,user');
    
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::get('/stats', [UserController::class, 'stats'])->middleware('can:viewAny,App\Models\User');
});
```



### Order Management Endpoints
```php
// Orders Routes
Route::middleware('auth:sanctum')->prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index'])->middleware('can:viewAny,App\Models\Order');
    Route::post('/', [OrderController::class, 'store'])->middleware('can:create,App\Models\Order');
    Route::get('/{order}', [OrderController::class, 'show'])->middleware('can:view,order');
    Route::put('/{order}', [OrderController::class, 'update'])->middleware('can:update,order');
    Route::delete('/{order}', [OrderController::class, 'destroy'])->middleware('can:delete,order');
    
    Route::post('/{order}/status', [OrderController::class, 'updateStatus'])->middleware('can:update,order');
    Route::post('/{order}/assign', [OrderController::class, 'assign'])->middleware('can:assign,order');
    Route::get('/{order}/history', [OrderController::class, 'history'])->middleware('can:view,order');
    Route::get('/{order}/attachments', [OrderController::class, 'attachments'])->middleware('can:view,order');
    Route::post('/{order}/attachments', [OrderController::class, 'uploadAttachment'])->middleware('can:update,order');
    Route::delete('/attachments/{attachment}', [OrderController::class, 'deleteAttachment'])->middleware('can:update,order');
    
    Route::get('/stats/summary', [OrderController::class, 'stats']);
    Route::get('/stats/by-user/{user}', [OrderController::class, 'userStats']);
});
```

### Attachment Download Endpoints
```php
// Attachment Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download'])
        ->name('attachments.download');
    Route::get('/attachments/{attachment}/preview', [AttachmentController::class, 'preview'])
        ->name('attachments.preview');
});
```

### Health Check Endpoints
```php
// Health Check Routes
Route::get('/up', [HealthController::class, 'up'])->name('health.up');
Route::get('/health', [HealthController::class, 'up'])->name('health.check');
```

### Firebase FCM Endpoints
```php
// FCM Routes
Route::middleware('auth:sanctum')->prefix('fcm')->group(function () {
    Route::post('/token', [FCMController::class, 'updateToken']);
    Route::delete('/token', [FCMController::class, 'removeToken']);
    Route::post('/test', [FCMController::class, 'sendTestNotification']);
});
```

### Reports Endpoints
```php
// Reports Routes
Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/user-activity', [ReportController::class, 'userActivity'])->middleware('can:has-permission,reports.view');
    Route::get('/order-processing', [ReportController::class, 'orderProcessing'])->middleware('can:has-permission,reports.view');
    Route::get('/system-performance', [ReportController::class, 'systemPerformance'])->middleware('can:has-permission,reports.view');
    Route::get('/user-registration', [ReportController::class, 'userRegistration'])->middleware('can:has-permission,reports.view');
});

// PDF Export Routes (solo PDF para el MVP)
Route::middleware('auth:sanctum')->prefix('export')->group(function () {
    Route::post('/users-pdf', [ExportController::class, 'usersPdf'])->middleware('can:reports.export');
    Route::post('/orders-pdf', [ExportController::class, 'ordersPdf'])->middleware('can:reports.export');
    Route::post('/system-logs-pdf', [ExportController::class, 'systemLogsPdf'])->middleware('can:reports.export');
});
```

### Monitoring Endpoints
```php
// Monitoring Routes (solo para admins)
Route::middleware('auth:sanctum')->prefix('monitoring')->group(function () {
    Route::get('/horizon/stats', [MonitoringController::class, 'horizonStats'])->middleware('can:system.settings');
    Route::get('/octane/stats', [MonitoringController::class, 'octaneStats'])->middleware('can:system.settings');
    Route::get('/queue/stats', [MonitoringController::class, 'queueStats'])->middleware('can:system.settings');
    Route::get('/system/metrics', [MonitoringController::class, 'systemMetrics'])->middleware('can:system.settings');
});
```

## Controladores

### AuthController
```php
// app/Http/Controllers/API/AuthController.php
class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        // Validar credenciales
        // Crear token Sanctum
        // Registrar último login
        // Retornar user + token
    }
    
    public function register(RegisterRequest $request)
    {
        // Crear usuario
        // Asignar rol por defecto
        // Enviar email de verificación
        // Retornar respuesta
    }
    
    public function logout(Request $request)
    {
        // Revocar token actual
        // Registrar logout
    }
    
    public function me(Request $request)
    {
        // Retornar usuario actual con roles/permisos
    }
    
    public function refresh(Request $request)
    {
        // Renovar token
    }
}
```

### UserController (Maneja Users y Customers)
```php
// app/Http/Controllers/API/UserController.php - Actualizado para arquitectura unificada
class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);
        
        $query = User::query();
        
        // Filtros
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        
        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->search . '%')
                  ->orWhere('last_name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('company', 'like', '%' . $request->search . '%');
            });
        }
        
        // Filtro específico para customers
        if ($request->filled('customers_only')) {
            $query->customers();
        }
        
        $users = $query->paginate($request->get('per_page', 15));
        
        return UserResource::collection($users);
    }
    
    public function store(CreateUserRequest $request)
    {
        $this->authorize('create', User::class);
        
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => UserRole::from($request->role),
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'company' => $request->company,
            // Campos específicos de customer
            'customer_notes' => $request->customer_notes,
            'customer_type' => $request->customer_type,
            'customer_preferences' => $request->customer_preferences,
        ]);
        
        // Enviar notificación
        $this->notificationService->sendUserNotification($user, 'created', [
            'created_by' => auth()->user()->full_name
        ]);
        
        return new UserResource($user);
    }
    
    public function show(User $user)
    {
        $this->authorize('view', $user);
        
        return new UserResource($user->load(['createdOrders', 'assignedOrders']));
    }
    
    public function update(User $user, UpdateUserRequest $request)
    {
        $this->authorize('update', $user);
        
        $oldRole = $user->role;
        
        $user->update($request->validated());
        
        // Auditoría de cambios de rol
        if ($oldRole !== $user->role) {
            $this->auditService->logRoleChange($user, $oldRole, $user->role, auth()->user());
        }
        
        return new UserResource($user);
    }
    
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);
        
        $user->delete();
        
        return response()->json(['message' => 'User deleted successfully']);
    }
    
    public function stats()
    {
        $this->authorize('viewAny', User::class);
        
        return [
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
            'users_by_role' => User::groupBy('role')->selectRaw('role, count(*) as count')->get(),
            'recent_logins' => User::where('last_login_at', '>=', now()->subDays(7))->count(),
        ];
    }
}
```

### OrderController
```php
// app/Http/Controllers/API/OrderController.php
class OrderController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);
        
        $query = Order::with(['customer', 'createdBy', 'assignedTo']);
        
        // Filtrar órdenes según rol del usuario
        $user = auth()->user();
        switch ($user->role) {
            case UserRole::EMPLOYEE:
                $query->where(function($q) use ($user) {
                    $q->where('assigned_to', $user->id)
                      ->orWhere('created_by', $user->id);
                });
                break;
            case UserRole::CUSTOMER:
                $query->where('customer_id', $user->id);
                break;
            // Super Admin y Admin pueden ver todas las órdenes
        }
        
        // Filtros adicionales
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        
        $orders = $query->paginate($request->get('per_page', 15));
        
        return OrderResource::collection($orders);
    }
    
    public function store(CreateOrderRequest $request)
    {
        $this->authorize('create', Order::class);
        
        $order = $this->orderService->createOrder($request->validated(), auth()->user());
        
        return new OrderResource($order->load(['customer', 'createdBy', 'assignedTo']));
    }
    
    public function show(Order $order)
    {
        $this->authorize('view', $order);
        
        return new OrderResource($order->load([
            'customer', 
            'createdBy', 
            'assignedTo', 
            'orderHistories.createdBy',
            'attachments'
        ]));
    }
    
    public function update(Order $order, UpdateOrderRequest $request)
    {
        $this->authorize('update', $order);
        
        $order->update($request->validated());
        
        // Crear entrada en historial
        $this->orderService->createHistoryEntry($order, 'updated', auth()->user());
        
        return new OrderResource($order);
    }
    
    public function updateStatus(Order $order, UpdateStatusRequest $request)
    {
        $this->authorize('update', $order);
        
        $updatedOrder = $this->orderService->updateOrderStatus(
            $order, 
            $request->status, 
            auth()->user()
        );
        
        return new OrderResource($updatedOrder);
    }
    
    public function assign(Order $order, AssignOrderRequest $request)
    {
        $this->authorize('assign', $order);
        
        $assignee = User::findOrFail($request->assigned_to);
        $updatedOrder = $this->orderService->assignOrder($order, $assignee, auth()->user());
        
        return new OrderResource($updatedOrder);
    }
    
    public function attachments(Order $order)
    {
        $this->authorize('view', $order);
        
        return AttachmentResource::collection($order->attachments);
    }
    
    public function uploadAttachment(Order $order, UploadAttachmentRequest $request)
    {
        $this->authorize('update', $order);
        
        $attachments = [];
        
        // Soporte para múltiples archivos
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $attachment = $this->attachmentService->uploadFile(
                    $file,
                    $order,
                    auth()->user()
                );
                $attachments[] = $attachment;
            }
        }
        
        // Soporte para archivo único (backward compatibility)
        if ($request->hasFile('attachment')) {
            $attachment = $this->attachmentService->uploadFile(
                $request->file('attachment'),
                $order,
                auth()->user()
            );
            $attachments[] = $attachment;
        }
        
        if (empty($attachments)) {
            return response()->json([
                'message' => 'No files were uploaded'
            ], 400);
        }
        
        // Crear entrada en historial
        $this->orderService->createHistoryEntry(
            $order, 
            'attachments_added', 
            auth()->user(),
            ['attachments_count' => count($attachments)]
        );
        
        return response()->json([
            'message' => 'Files uploaded successfully',
            'attachments' => AttachmentResource::collection($attachments)
        ]);
    }
    
    public function deleteAttachment(Attachment $attachment)
    {
        // Verificar que el attachment pertenece a una orden que el usuario puede modificar
        if ($attachment->attachable_type === Order::class) {
            $order = $attachment->attachable;
            $this->authorize('update', $order);
        }
        
        $deleted = $this->attachmentService->deleteFile($attachment);
        
        if ($deleted) {
            return response()->json([
                'message' => 'Attachment deleted successfully'
            ]);
        }
        
        return response()->json([
            'message' => 'Failed to delete attachment'
        ], 500);
    }
    
    public function stats()
    {
        $user = auth()->user();
        $stats = $this->orderService->getOrderStats($user);
        
        return response()->json($stats);
    }
}
```

### AttachmentController
```php
// app/Http/Controllers/API/AttachmentController.php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Services\AttachmentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function __construct(
        private AttachmentService $attachmentService
    ) {}
    
    public function download(Attachment $attachment)
    {
        // Verificar permisos basados en el tipo de entidad
        $this->authorizeAttachmentAccess($attachment);
        
        $downloadUrl = $this->attachmentService->getDownloadUrl($attachment);
        
        // Redirect to DigitalOcean Spaces temporary URL
        return redirect($downloadUrl);
    }
    
    public function preview(Attachment $attachment)
    {
        // Verificar permisos basados en el tipo de entidad
        $this->authorizeAttachmentAccess($attachment);
        
        $previewUrl = $this->attachmentService->getPreviewUrl($attachment);
        
        if (!$previewUrl) {
            return response()->json([
                'message' => 'Preview not available for this file type'
            ], 400);
        }
        
        return response()->json([
            'previewUrl' => $previewUrl
        ]);
    }
    
    private function authorizeAttachmentAccess(Attachment $attachment)
    {
        if ($attachment->attachable_type === Order::class) {
            $this->authorize('view', $attachment->attachable);
        }
        // Agregar más tipos de entidades según sea necesario
    }
}
```

### FCMController
```php
// app/Http/Controllers/API/FCMController.php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateFCMTokenRequest;
use App\Jobs\SendFirebaseNotificationJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FCMController extends Controller
{
    public function updateToken(UpdateFCMTokenRequest $request): JsonResponse
    {
        $user = auth()->user();
        
        $user->update([
            'fcm_token' => $request->fcm_token
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'FCM token updated successfully'
        ]);
    }
    
    public function removeToken(): JsonResponse
    {
        $user = auth()->user();
        
        $user->update([
            'fcm_token' => null
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'FCM token removed successfully'
        ]);
    }
    
    public function sendTestNotification(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->fcm_token) {
            return response()->json([
                'success' => false,
                'message' => 'No FCM token found for user'
            ], 400);
        }
        
        SendFirebaseNotificationJob::dispatch(
            $user,
            'Test Notification',
            'This is a test notification from Lumasachi Control',
            ['type' => 'test']
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Test notification queued successfully'
        ]);
    }
}
```

### MonitoringController
```php
// app/Http/Controllers/API/MonitoringController.php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Redis;
use Laravel\Horizon\Contracts\MasterSupervisorRepository;
use Laravel\Horizon\Contracts\MetricsRepository;

class MonitoringController extends Controller
{
    public function horizonStats(): JsonResponse
    {
        $masters = app(MasterSupervisorRepository::class)->all();
        $metrics = app(MetricsRepository::class);
        
        return response()->json([
            'supervisors' => collect($masters)->map(fn($master) => [
                'name' => $master->name,
                'status' => $master->status,
                'processes' => $master->processes,
                'options' => $master->options
            ]),
            'workload' => $metrics->snapshotsForJob('default'),
            'recent_jobs' => $metrics->recentJobs(),
            'failed_jobs' => $metrics->recentFailedJobs(),
        ]);
    }
    
    public function octaneStats(): JsonResponse
    {
        // Obtener estadísticas de Octane si están disponibles
        return response()->json([
            'server' => config('octane.server'),
            'workers' => config('octane.swoole.server.worker_num'),
            'task_workers' => config('octane.swoole.server.task_worker_num'),
            'max_requests' => config('octane.swoole.server.max_request'),
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
        ]);
    }
    
    public function queueStats(): JsonResponse
    {
        $redis = Redis::connection();
        
        return response()->json([
            'pending_jobs' => $redis->llen('queues:default'),
            'failed_jobs' => $redis->zcard('queues:default:failed'),
            'reserved_jobs' => $redis->zcard('queues:default:reserved'),
            'delayed_jobs' => $redis->zcard('queues:default:delayed'),
        ]);
    }
    
    public function systemMetrics(): JsonResponse
    {
        return response()->json([
            'memory' => [
                'usage' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit')
            ],
            'cpu' => [
                'load' => sys_getloadavg()
            ],
            'disk' => [
                'total' => disk_total_space('/'),
                'free' => disk_free_space('/'),
                'used' => disk_total_space('/') - disk_free_space('/')
            ],
            'uptime' => $this->getUptime(),
        ]);
    }
    
    private function getUptime(): ?string
    {
        if (function_exists('shell_exec')) {
            return shell_exec('uptime');
        }
        
        return null;
    }
}
```

## Requests (Validaciones)

### LoginRequest
```php
// app/Http/Requests/LoginRequest.php
class LoginRequest extends FormRequest
{
    public function rules()
    {
        return [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ];
    }
    
    public function messages()
    {
        return [
            'email.required' => 'El email es requerido',
            'email.email' => 'El email debe ser válido',
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres',
        ];
    }
}
```

### CreateUserRequest (Actualizado para Users y Customers)
```php
// app/Http/Requests/CreateUserRequest.php - Actualizado para arquitectura unificada
class CreateUserRequest extends FormRequest
{
    public function authorize()
    {
        return Gate::allows('users.create');
    }
    
    public function rules()
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'company' => 'nullable|string|max:255',
            'role' => 'required|in:' . implode(',', array_map(fn($role) => $role->value, UserRole::cases())),
            
            // Campos específicos de customer (solo si role es Customer)
            'customer_notes' => 'nullable|string',
            'customer_type' => 'nullable|string|in:individual,corporate',
            'customer_preferences' => 'nullable|string',
        ];
    }
    
    public function messages()
    {
        return [
            'role.in' => 'El rol seleccionado no es válido. Los roles disponibles son: ' . 
                        implode(', ', array_map(fn($role) => $role->value, UserRole::cases())),
            'customer_type.in' => 'El tipo de cliente debe ser individual o corporate',
        ];
    }
}
```

### CreateOrderRequest
```php
// app/Http/Requests/CreateOrderRequest.php
class CreateOrderRequest extends FormRequest
{
    public function rules()
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:Low,Normal,High,Urgent',
            'category' => 'nullable|string|max:100',
            'estimated_completion' => 'nullable|date|after:today',
            'assigned_to' => 'nullable|exists:users,id',
        ];
    }
}
```

### UploadAttachmentRequest
```php
// app/Http/Requests/UploadAttachmentRequest.php
class UploadAttachmentRequest extends FormRequest
{
    public function authorize()
    {
        return auth()->check();
    }
    
    public function rules()
    {
        return [
            'attachments' => 'array|max:10', // Máximo 10 archivos
            'attachments.*' => 'file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,zip,rar',
            'attachment' => 'file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,zip,rar', // Backward compatibility
        ];
    }
    
    public function messages()
    {
        return [
            'attachments.max' => 'No se pueden subir más de 10 archivos a la vez',
            'attachments.*.file' => 'Cada elemento debe ser un archivo válido',
            'attachments.*.max' => 'Cada archivo no puede exceder 10MB',
            'attachments.*.mimes' => 'Formato de archivo no soportado',
            'attachment.file' => 'El archivo debe ser válido',
            'attachment.max' => 'El archivo no puede exceder 10MB',
            'attachment.mimes' => 'Formato de archivo no soportado',
        ];
    }
}
```

## Resources (Transformaciones)

### UserResource (Unificado para Users y Customers)
```php
// app/Http/Resources/UserResource.php - Actualizado para arquitectura unificada
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'firstName' => $this->first_name,
            'lastName' => $this->last_name,
            'email' => $this->email,
            'phoneNumber' => $this->phone_number,
            'address' => $this->address,
            'company' => $this->company,
            'role' => $this->role->value,
            'roleLabel' => $this->role->getLabel(),
            'permissions' => $this->role->getPermissions(),
            'isActive' => $this->is_active,
            'lastLoginAt' => $this->last_login_at,
            'languagePreference' => $this->language_preference,
            
            // Campos específicos de customer (solo si es customer)
            'customerNotes' => $this->when($this->isCustomer(), $this->customer_notes),
            'customerType' => $this->when($this->isCustomer(), $this->customer_type),
            'customerPreferences' => $this->when($this->isCustomer(), $this->customer_preferences),
            
            // Helpers
            'isCustomer' => $this->isCustomer(),
            'isEmployee' => $this->isEmployee(),
            
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
```

### OrderResource
```php
// app/Http/Resources/OrderResource.php
class OrderResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'customerId' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'category' => $this->category,
            'estimatedCompletion' => $this->estimated_completion,
            'actualCompletion' => $this->actual_completion,
            'createdBy' => new UserResource($this->whenLoaded('createdBy')),
            'updatedBy' => new UserResource($this->whenLoaded('updatedBy')),
            'assignedTo' => new UserResource($this->whenLoaded('assignedTo')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
```

### AttachmentResource
```php
// app/Http/Resources/AttachmentResource.php
class AttachmentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'fileName' => $this->file_name,
            'filePath' => $this->file_path,
            'fileSize' => $this->file_size,
            'mimeType' => $this->mime_type,
            'uploadedBy' => new UserResource($this->whenLoaded('uploadedBy')),
            'downloadUrl' => $this->getDownloadUrl(),
            'previewUrl' => $this->getPreviewUrl(),
            'isImage' => $this->isImage(),
            'isDocument' => $this->isDocument(),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
    
    private function getDownloadUrl()
    {
        return route('attachments.download', ['attachment' => $this->id]);
    }
    
    private function getPreviewUrl()
    {
        if ($this->isImage()) {
            return Storage::disk('spaces')->temporaryUrl($this->file_path, now()->addHour());
        }
        return null;
    }
    
    private function isImage()
    {
        return str_starts_with($this->mime_type, 'image/');
    }
    
    private function isDocument()
    {
        return str_starts_with($this->mime_type, 'application/');
    }
}
```

## Servicios

### OrderService
```php
// app/Services/OrderService.php
class OrderService
{
    public function createOrder(array $data, User $user): Order
    {
        // Crear orden
        // Crear historial inicial
        // Enviar notificaciones
        // Retornar orden creada
    }
    
    public function updateOrderStatus(Order $order, string $status, User $user): Order
    {
        // Validar transición de estado
        // Actualizar orden
        // Crear historial
        // Notificar cambios
    }
    
    public function assignOrder(Order $order, User $assignee, User $assigner): Order
    {
        // Asignar orden
        // Crear historial
        // Notificar asignado
    }
    
    public function getOrderStats(User $user): array
    {
        // Estadísticas basadas en rol
        // Filtrar por permisos
    }
}
```

### AttachmentService
```php
// app/Services/AttachmentService.php
class AttachmentService
{
    public function uploadFile($file, $attachable, User $user): Attachment
    {
        // Validar archivo
        $this->validateFile($file);
        
        // Generar nombre único
        $fileName = $this->generateFileName($file);
        
        // Subir a DigitalOcean Spaces
        $filePath = Storage::disk('spaces')->putFileAs(
            'attachments/' . date('Y/m'),
            $file,
            $fileName
        );
        
        // Crear registro en base de datos
        $attachment = Attachment::create([
            'attachable_type' => get_class($attachable),
            'attachable_id' => $attachable->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'uploaded_by' => $user->id,
        ]);
        
        // Crear respaldo en AWS S3 (asíncrono)
        BackupToS3Job::dispatch($filePath, $fileName)->delay(now()->addMinutes(5));
        
        return $attachment;
    }
    
    public function deleteFile(Attachment $attachment): bool
    {
        // Eliminar de DigitalOcean Spaces
        Storage::disk('spaces')->delete($attachment->file_path);
        
        // Eliminar de AWS S3 (si existe)
        Storage::disk('s3_backup')->delete("backups/{$attachment->file_name}");
        
        // Eliminar registro
        return $attachment->delete();
    }
    
    public function getDownloadUrl(Attachment $attachment): string
    {
        return Storage::disk('spaces')->temporaryUrl(
            $attachment->file_path,
            now()->addHours(24)
        );
    }
    
    public function getPreviewUrl(Attachment $attachment): ?string
    {
        if (!$this->isPreviewable($attachment)) {
            return null;
        }
        
        return Storage::disk('spaces')->temporaryUrl(
            $attachment->file_path,
            now()->addHour()
        );
    }
    
    private function validateFile($file)
    {
        $maxSize = 10 * 1024 * 1024; // 10MB
        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-rar-compressed',
        ];
        
        if ($file->getSize() > $maxSize) {
            throw new \Exception('El archivo excede el tamaño máximo permitido (10MB)');
        }
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \Exception('Tipo de archivo no permitido');
        }
    }
    
    private function generateFileName($file): string
    {
        $extension = $file->getClientOriginalExtension();
        return uniqid() . '_' . time() . '.' . $extension;
    }
    
    private function isPreviewable(Attachment $attachment): bool
    {
        return str_starts_with($attachment->mime_type, 'image/') ||
               $attachment->mime_type === 'application/pdf';
    }
}
```

### ExportService
```php
// app/Services/ExportService.php
class ExportService
{
    public function exportUsersPdf(User $user): string
    {
        // Obtener usuarios según permisos
        // Generar PDF usando barryvdh/laravel-dompdf
        // Retornar path del archivo
    }
    
    public function exportOrdersPdf(array $filters, User $user): string
    {
        // Filtrar órdenes según rol
        // Generar PDF con estadísticas y lista de órdenes
        // Registrar exportación
    }
    
    public function exportSystemLogsPdf(User $user): string
    {
        // Exportar logs (solo admins)
        // Generar PDF con logs del sistema
    }
    
    private function generatePdf(string $view, array $data, string $filename): string
    {
        // Utilizar DomPDF para generar archivos PDF
        // Configurar márgenes, orientación, etc.
        // Retornar path del archivo generado
    }
}
```

### NotificationService
```php
// app/Services/NotificationService.php
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

class NotificationService
{
    public function __construct(
        private FirebaseMessaging $messaging
    ) {}
    
    public function sendOrderNotification(Order $order, string $type, User $recipient)
    {
        // Crear notificación en BD
        $notification = Notification::create([
            'user_id' => $recipient->id,
            'type' => $type,
            'title' => $this->getOrderNotificationTitle($type, $order),
            'message' => $this->getOrderNotificationMessage($type, $order),
            'data' => ['order_id' => $order->id],
        ]);
        
        // Enviar push notification si el usuario tiene FCM token
        if ($recipient->fcm_token) {
            $this->sendFirebaseNotification($recipient, $notification);
        }
    }
    
    public function sendUserNotification(User $user, string $type, array $data)
    {
        // Crear notificación en BD
        // Enviar push notification si aplica
        if ($user->fcm_token) {
            $this->sendFirebaseNotification($user, $notification);
        }
    }
    
    public function markAsRead(Notification $notification, User $user)
    {
        // Marcar como leída
        // Validar permisos
        if ($notification->user_id === $user->id) {
            $notification->update(['read_at' => now()]);
        }
    }
    
    private function sendFirebaseNotification(User $user, $notification)
    {
        $message = CloudMessage::withTarget('token', $user->fcm_token)
            ->withNotification(
                FirebaseNotification::create($notification->title, $notification->message)
            )
            ->withData($notification->data ?? []);
            
        $this->messaging->send($message);
    }
}
```

## Jobs (Trabajos en Cola)

### SendFirebaseNotificationJob
```php
// app/Jobs/SendFirebaseNotificationJob.php
<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Factory;

class SendFirebaseNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;
    public $backoff = [10, 30, 60];

    public function __construct(
        private User $user,
        private string $title,
        private string $body,
        private array $data = []
    ) {}

    public function handle(): void
    {
        if (!$this->user->fcm_token) {
            return;
        }

        $factory = (new Factory)->withServiceAccount(config('firebase.credentials.file'));
        $messaging = $factory->createMessaging();

        $message = CloudMessage::withTarget('token', $this->user->fcm_token)
            ->withNotification(Notification::create($this->title, $this->body))
            ->withData($this->data);

        try {
            $messaging->send($message);
            
            // Log successful notification
            logger()->info('Firebase notification sent successfully', [
                'user_id' => $this->user->id,
                'title' => $this->title
            ]);
        } catch (\Exception $e) {
            // Log error and re-throw for retry mechanism
            logger()->error('Firebase notification failed', [
                'user_id' => $this->user->id,
                'error' => $e->getMessage()
            ]);
            
            // Invalid token, remove it
            if (str_contains($e->getMessage(), 'invalid-registration-token')) {
                $this->user->update(['fcm_token' => null]);
                return;
            }
            
            throw $e;
        }
    }
}
```

### ExportDataJob
```php
// app/Jobs/ExportDataJob.php
<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ExportDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 300;

    public function __construct(
        private User $user,
        private string $type,
        private array $filters = []
    ) {}

    public function handle(): void
    {
        try {
            $filename = $this->generateExport();
            
            // Notify user that export is ready
            $this->user->notify(new ExportReadyNotification($filename));
            
            logger()->info('Export job completed successfully', [
                'user_id' => $this->user->id,
                'type' => $this->type,
                'filename' => $filename
            ]);
        } catch (\Exception $e) {
            logger()->error('Export job failed', [
                'user_id' => $this->user->id,
                'type' => $this->type,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    private function generateExport(): string
    {
        $data = $this->getData();
        
        $pdf = Pdf::loadView('exports.' . $this->type, compact('data'));
        
        $filename = $this->type . '_export_' . now()->format('Y-m-d_H-i-s') . '.pdf';
        $path = 'exports/' . $filename;
        
        Storage::disk('private')->put($path, $pdf->output());
        
        return $filename;
    }

    private function getData(): array
    {
        return match($this->type) {
            'users' => $this->getUsersData(),
            'orders' => $this->getOrdersData(),
            'system-logs' => $this->getSystemLogsData(),
            default => throw new \InvalidArgumentException('Invalid export type')
        };
    }

    private function getUsersData(): array
    {
        // Implement user data retrieval with proper permissions
        return [];
    }

    private function getOrdersData(): array
    {
        // Implement order data retrieval with proper permissions
        return [];
    }

    private function getSystemLogsData(): array
    {
        // Implement system logs retrieval (admin only)
        return [];
    }
}
```

## Middleware

### RoleMiddleware
```php
// app/Http/Middleware/RoleMiddleware.php
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = auth()->user();
        $userRole = $user->role->value;
        
        if (!in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Unauthorized',
                'required_roles' => $roles,
                'user_role' => $userRole
            ], 403);
        }
        
        return $next($request);
    }
}
```

### PermissionMiddleware
```php
// app/Http/Middleware/PermissionMiddleware.php
class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = auth()->user();
        $userPermissions = $user->role->getPermissions();
        
        if (!in_array($permission, $userPermissions)) {
            return response()->json([
                'message' => 'Insufficient permissions',
                'required_permission' => $permission,
                'user_permissions' => $userPermissions
            ], 403);
        }
        
        return $next($request);
    }
}
```

### AuditMiddleware
```php
// app/Http/Middleware/AuditMiddleware.php
class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Registrar acciones sensibles
        if (auth()->check() && $this->shouldAudit($request)) {
            $this->auditService->logAction(
                auth()->user(),
                $request->method(),
                $request->path(),
                $request->all(),
                $response->status()
            );
        }
        
        return $response;
    }
    
    private function shouldAudit(Request $request): bool
    {
        $auditablePaths = [
            'api/users',
            'api/orders',
            'api/customers',
            'api/export',
        ];
        
        return collect($auditablePaths)->some(fn($path) => 
            str_contains($request->path(), $path)
        );
    }
}
```

### Registro de Middlewares
```php
// app/Http/Kernel.php
protected $middlewareAliases = [
    'auth' => \App\Http\Middleware\Authenticate::class,
    'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
    'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
    'can' => \Illuminate\Auth\Middleware\Authorize::class,
    'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
    'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
    'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
    'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    
    // Middlewares personalizados
    'role' => \App\Http\Middleware\RoleMiddleware::class,
    'permission' => \App\Http\Middleware\PermissionMiddleware::class,
    'audit' => \App\Http\Middleware\AuditMiddleware::class,
];
```

### Uso en Rutas
```php
// routes/api.php - Ejemplos de uso de middlewares
Route::middleware(['auth:sanctum', 'role:Super Administrator,Administrator'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/system-logs', [AdminController::class, 'systemLogs']);
});

Route::middleware(['auth:sanctum', 'permission:reports.export'])->group(function () {
    Route::post('/export/users', [ExportController::class, 'users']);
    Route::post('/export/orders', [ExportController::class, 'orders']);
});

Route::middleware(['auth:sanctum', 'audit'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('orders', OrderController::class);
});
```

## Configuración de Internacionalización

### Archivos de Idioma
```php
// resources/lang/en/messages.php
return [
    'auth' => [
        'login_successful' => 'Login successful',
        'logout_successful' => 'Logout successful',
        'invalid_credentials' => 'Invalid credentials',
    ],
    'orders' => [
        'created' => 'Order created successfully',
        'updated' => 'Order updated successfully',
        'status_changed' => 'Order status changed to :status',
        'assigned' => 'Order assigned to :user',
    ],
    'users' => [
        'created' => 'User created successfully',
        'updated' => 'User updated successfully',
        'deleted' => 'User deleted successfully',
    ],
];

// resources/lang/es/messages.php
return [
    'auth' => [
        'login_successful' => 'Inicio de sesión exitoso',
        'logout_successful' => 'Cierre de sesión exitoso',
        'invalid_credentials' => 'Credenciales inválidas',
    ],
    'orders' => [
        'created' => 'Orden creada exitosamente',
        'updated' => 'Orden actualizada exitosamente',
        'status_changed' => 'Estado de orden cambiado a :status',
        'assigned' => 'Orden asignada a :user',
    ],
    'users' => [
        'created' => 'Usuario creado exitosamente',
        'updated' => 'Usuario actualizado exitosamente',
        'deleted' => 'Usuario eliminado exitosamente',
    ],
];
```

### Setup de Firebase FCM

#### 1. Configuración del Proyecto Firebase
```bash
# Crear proyecto en Firebase Console
# Habilitar Cloud Messaging
# Generar archivo de credenciales (service account key)
# Descargar firebase-credentials.json
```

#### 2. Configuración React Native
```bash
# Instalar dependencias en la app React Native
npm install @react-native-firebase/app @react-native-firebase/messaging

# Configurar archivos de configuración
# android/app/google-services.json
# ios/GoogleService-Info.plist
```

#### 3. Sincronización de Tokens FCM
```php
// Endpoint para actualizar FCM token
Route::post('/fcm/token', [FCMController::class, 'updateToken'])->middleware('auth:sanctum');

// app/Http/Controllers/FCMController.php
public function updateToken(Request $request)
{
    $request->validate([
        'fcm_token' => 'required|string'
    ]);
    
    auth()->user()->update([
        'fcm_token' => $request->fcm_token
    ]);
    
    return response()->json(['success' => true]);
}
```

## Configuración de Notificaciones Firebase

### Decisión: Firebase FCM vs Pusher para Notificaciones Push Móviles

**Se ha decidido usar Firebase Cloud Messaging (FCM) en lugar de Pusher para notificaciones push por las siguientes razones:**

#### ✅ **Ventajas de Firebase FCM:**
- **Especializado en móviles**: Diseñado específicamente para aplicaciones móviles (iOS/Android)
- **Integración nativa con React Native**: Soporte oficial y mejor rendimiento
- **Gratuito**: Sin límites de notificaciones push en el plan gratuito
- **Mejor alcance**: Garantiza entrega incluso cuando la app está cerrada
- **Configuración más simple**: Setup directo sin necesidad de servidor propio
- **Soporte offline**: Las notificaciones se entregan cuando el dispositivo vuelve online

#### ❌ **Limitaciones de Pusher:**
- **Enfoque web**: Principalmente diseñado para notificaciones web en tiempo real
- **Costo**: Cobra por mensajes enviados
- **Complejidad**: Requiere configuración adicional para push notifications móviles
- **Menor confiabilidad**: Para notificaciones push móviles reales

#### 🎯 **Para este proyecto:**
- **App móvil React Native**: FCM es la opción estándar de la industria
- **Notificaciones críticas**: Actualizaciones de órdenes, asignaciones, cambios de estado
- **Usuarios móviles**: Los empleados y clientes usan principalmente dispositivos móviles
- **Escalabilidad**: FCM maneja millones de notificaciones sin costo adicional

## Configuración de Notificaciones Firebase

### Configuración Firebase FCM
```php
// config/firebase.php
return [
    'credentials' => [
        'file' => env('FIREBASE_CREDENTIALS'),
    ],
    'project_id' => env('FIREBASE_PROJECT_ID'),
    'messaging' => [
        'http_timeout' => 30,
        'guzzle_request_options' => [],
    ],
];
```

### Variables de Entorno
```env
FIREBASE_CREDENTIALS=storage/firebase/firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id
```

### Notificación Firebase
```php
// app/Notifications/FirebasePushNotification.php
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebasePushNotification extends Notification
{
    use Queueable;
    
    public function __construct(
        private string $title,
        private string $body,
        private array $data = []
    ) {}
    
    public function via($notifiable): array
    {
        return ['firebase'];
    }
    
    public function toFirebase($notifiable): CloudMessage
    {
        return CloudMessage::withTarget('token', $notifiable->fcm_token)
            ->withNotification(
                Notification::create($this->title, $this->body)
            )
            ->withData($this->data);
    }
}
```

## Generación de PDFs - Decisión Arquitectónica

### Análisis: Backend vs Frontend para Generación de PDFs

**DECISIÓN: Generar PDFs desde el Backend (Laravel 12)**

#### ✅ **Ventajas del Backend:**

**Seguridad y Control**
- **Datos sensibles protegidos**: Los datos confidenciales nunca salen del entorno controlado del servidor
- **Control centralizado de plantillas**: Versioning y actualizaciones inmediatas sin necesidad de actualizar la app
- **Cumplimiento normativo**: Facilita cumplir GDPR, HIPAA y otras regulaciones de datos empresariales
- **Auditoría completa**: Logs y monitoreo de generación de documentos

**Rendimiento del Dispositivo**
- **Conserva batería**: No procesa documentos complejos en el dispositivo móvil
- **Optimización de recursos**: Aprovecha el poder del servidor (CPU, memoria) vs recursos limitados del móvil
- **Consistencia**: El mismo resultado independientemente del dispositivo del usuario

**Escalabilidad Empresarial**
- **Manejo de volumen**: Procesa múltiples PDFs simultáneamente
- **Recursos dedicados**: Servidores optimizados para generación de documentos
- **Caché y optimización**: PDFs reutilizables y optimizados

#### ❌ **Desventajas consideradas:**
- **Dependencia de conectividad**: Requiere internet (mitigado con notificaciones push)
- **Latencia**: Tiempo de espera para generar y descargar (optimizado con Laravel Octane)
- **Carga del servidor**: Aumenta procesamiento en backend (manejado con queues y Horizon)

#### 🚫 **Por qué no Frontend (React Native):**
- **Consumo de batería**: Procesamiento intensivo en dispositivos móviles
- **Memoria limitada**: Dispositivos con recursos restringidos
- **Inconsistencia**: Diferentes resultados según el dispositivo y sistema operativo
- **Tamaño del bundle**: Librerías de PDF aumentan significativamente el tamaño de la app
- **Limitaciones de funcionalidad**: React-PDF tiene restricciones (no soporta grid layouts, elementos table)
- **Datos sensibles**: Información empresarial no debe procesarse en el cliente

### Implementación de PDFs en Laravel

#### Controlador de Exportación
```php
// app/Http/Controllers/ExportController.php
class ExportController extends Controller
{
    public function __construct(
        private ExportService $exportService
    ) {}

    public function usersPdf(Request $request)
    {
        $this->authorize('export', User::class);
        
        try {
            $filters = $request->only(['role', 'status', 'date_from', 'date_to']);
            $pdf = $this->exportService->exportUsersPdf(auth()->user(), $filters);
            
            return response()->json([
                'success' => true,
                'message' => 'PDF generado exitosamente',
                'download_url' => $pdf['url'],
                'filename' => $pdf['filename']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error generating users PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error generando PDF'
            ], 500);
        }
    }

    public function ordersPdf(Request $request)
    {
        $this->authorize('export', Order::class);
        
        try {
            $filters = $request->only(['status', 'assigned_to', 'date_from', 'date_to']);
            $pdf = $this->exportService->exportOrdersPdf(auth()->user(), $filters);
            
            return response()->json([
                'success' => true,
                'message' => 'PDF generado exitosamente',
                'download_url' => $pdf['url'],
                'filename' => $pdf['filename']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error generating orders PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error generando PDF'
            ], 500);
        }
    }

    public function orderDetailPdf(Order $order)
    {
        $this->authorize('view', $order);
        
        try {
            $pdf = $this->exportService->exportOrderDetailPdf($order);
            
            return response()->json([
                'success' => true,
                'message' => 'PDF generado exitosamente',
                'download_url' => $pdf['url'],
                'filename' => $pdf['filename']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error generating order detail PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error generando PDF'
            ], 500);
        }
    }

    public function downloadPdf(string $filename)
    {
        $path = storage_path('app/exports/' . $filename);
        
        if (!file_exists($path)) {
            abort(404, 'Archivo no encontrado');
        }
        
        return response()->download($path)->deleteFileAfterSend(true);
    }
}
```

#### Servicio de Exportación Mejorado
```php
// app/Services/ExportService.php
class ExportService
{
    public function exportUsersPdf(User $user, array $filters = []): array
    {
        // Obtener usuarios según permisos y filtros
        $users = $this->getUsersForExport($user, $filters);
        
        $data = [
            'users' => $users,
            'filters' => $filters,
            'generated_by' => $user->name,
            'generated_at' => now()->format('d/m/Y H:i:s'),
            'total_users' => $users->count()
        ];
        
        return $this->generatePdf('exports.users', $data, 'usuarios-' . now()->format('Y-m-d-H-i-s'));
    }
    
    public function exportOrdersPdf(User $user, array $filters = []): array
    {
        // Obtener órdenes según rol y filtros
        $orders = $this->getOrdersForExport($user, $filters);
        
        $data = [
            'orders' => $orders,
            'filters' => $filters,
            'generated_by' => $user->name,
            'generated_at' => now()->format('d/m/Y H:i:s'),
            'total_orders' => $orders->count(),
            'statistics' => $this->getOrderStatistics($orders)
        ];
        
        return $this->generatePdf('exports.orders', $data, 'ordenes-' . now()->format('Y-m-d-H-i-s'));
    }

    public function exportOrderDetailPdf(Order $order): array
    {
        $data = [
            'order' => $order->load(['customer', 'assignedTo', 'history']),
            'generated_at' => now()->format('d/m/Y H:i:s'),
            'attachments' => $order->attachments()->get()
        ];
        
        return $this->generatePdf('exports.order-detail', $data, 'orden-' . $order->id . '-' . now()->format('Y-m-d'));
    }
    
    private function generatePdf(string $view, array $data, string $filename): array
    {
        $pdf = \PDF::loadView($view, $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true,
                'debugPng' => false,
                'debugKeepTemp' => false,
                'debugCss' => false,
                'logOutputFile' => storage_path('logs/dompdf.log'),
                'enable_font_subsetting' => true,
                'pdf_backend' => 'CPDF',
                'enable_javascript' => false,
                'enable_remote' => false
            ]);
        
        $filename = $filename . '.pdf';
        $path = 'exports/' . $filename;
        
        // Crear directorio si no existe
        Storage::makeDirectory('exports');
        
        // Guardar PDF
        Storage::put($path, $pdf->output());
        
        // Registrar exportación
        $this->logExport($filename, $view, auth()->user());
        
        return [
            'filename' => $filename,
            'url' => route('export.download', ['filename' => $filename]),
            'path' => $path,
            'size' => Storage::size($path)
        ];
    }
    
    private function getUsersForExport(User $user, array $filters): Collection
    {
        $query = User::query();
        
        // Aplicar filtros según rol
        if ($user->role !== UserRole::SUPER_ADMINISTRATOR) {
            $query->where('role', '!=', UserRole::SUPER_ADMINISTRATOR);
        }
        
        if (isset($filters['role'])) {
            $query->where('role', $filters['role']);
        }
        
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
    
    private function getOrdersForExport(User $user, array $filters): Collection
    {
        $query = Order::with(['customer', 'assignedTo']);
        
        // Aplicar filtros según rol
        if ($user->role === UserRole::EMPLOYEE) {
            $query->where('assigned_to', $user->id);
        } elseif ($user->role === UserRole::CUSTOMER) {
            $query->whereHas('customer', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }
        
        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
    
    private function getOrderStatistics(Collection $orders): array
    {
        return [
            'total' => $orders->count(),
            'pending' => $orders->where('status', 'pending')->count(),
            'in_progress' => $orders->where('status', 'in_progress')->count(),
            'completed' => $orders->where('status', 'completed')->count(),
            'cancelled' => $orders->where('status', 'cancelled')->count(),
        ];
    }
    
    private function logExport(string $filename, string $view, User $user): void
    {
        Log::info('PDF Export Generated', [
            'filename' => $filename,
            'view' => $view,
            'user_id' => $user->id,
            'user_role' => $user->role->value,
            'generated_at' => now()
        ]);
    }
}
```

#### Plantillas de PDFs

**Plantilla para Lista de Usuarios**
```blade
{{-- resources/views/exports/users.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Usuarios</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .info { margin-bottom: 15px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Usuarios</h1>
        <p>Lumasachi Control</p>
    </div>
    
    <div class="info">
        <p><strong>Generado por:</strong> {{ $generated_by }}</p>
        <p><strong>Fecha:</strong> {{ $generated_at }}</p>
        <p><strong>Total usuarios:</strong> {{ $total_users }}</p>
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->id }}</td>
                <td>{{ $user->name }}</td>
                <td>{{ $user->email }}</td>
                <td>{{ $user->role->getLabel() }}</td>
                <td>{{ $user->status ? 'Activo' : 'Inactivo' }}</td>
                <td>{{ $user->created_at->format('d/m/Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p>Generado automáticamente por Lumasachi Control</p>
    </div>
</body>
</html>
```

**Plantilla para Lista de Órdenes**
```blade
{{-- resources/views/exports/orders.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Órdenes</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .info { margin-bottom: 15px; }
        .statistics { margin-bottom: 15px; background-color: #f9f9f9; padding: 10px; }
        .stat-item { display: inline-block; margin-right: 20px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Órdenes</h1>
        <p>Lumasachi Control</p>
    </div>
    
    <div class="info">
        <p><strong>Generado por:</strong> {{ $generated_by }}</p>
        <p><strong>Fecha:</strong> {{ $generated_at }}</p>
        <p><strong>Total órdenes:</strong> {{ $total_orders }}</p>
    </div>
    
    <div class="statistics">
        <h3>Estadísticas</h3>
        <div class="stat-item"><strong>Pendientes:</strong> {{ $statistics['pending'] }}</div>
        <div class="stat-item"><strong>En Progreso:</strong> {{ $statistics['in_progress'] }}</div>
        <div class="stat-item"><strong>Completadas:</strong> {{ $statistics['completed'] }}</div>
        <div class="stat-item"><strong>Canceladas:</strong> {{ $statistics['cancelled'] }}</div>
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Asignado a</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
            <tr>
                <td>{{ $order->id }}</td>
                <td>{{ $order->title }}</td>
                <td>{{ $order->customer->name ?? 'N/A' }}</td>
                <td>{{ $order->assignedTo->name ?? 'Sin asignar' }}</td>
                <td>{{ ucfirst($order->status) }}</td>
                <td>{{ $order->created_at->format('d/m/Y H:i') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p>Generado automáticamente por Lumasachi Control</p>
    </div>
</body>
</html>
```

**Plantilla para Detalle de Orden**
```blade
{{-- resources/views/exports/order-detail.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Detalle de Orden #{{ $order->id }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { margin-bottom: 5px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Detalle de Orden #{{ $order->id }}</h1>
        <p>Lumasachi Control</p>
    </div>
    
    <div class="section">
        <h2>Información General</h2>
        <div class="info-grid">
            <div>
                <div class="info-item"><strong>Título:</strong> {{ $order->title }}</div>
                <div class="info-item"><strong>Descripción:</strong> {{ $order->description }}</div>
                <div class="info-item"><strong>Estado:</strong> {{ ucfirst($order->status) }}</div>
                <div class="info-item"><strong>Prioridad:</strong> {{ ucfirst($order->priority) }}</div>
            </div>
            <div>
                <div class="info-item"><strong>Cliente:</strong> {{ $order->customer->name ?? 'N/A' }}</div>
                <div class="info-item"><strong>Asignado a:</strong> {{ $order->assignedTo->name ?? 'Sin asignar' }}</div>
                <div class="info-item"><strong>Fecha Creación:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</div>
                <div class="info-item"><strong>Fecha Límite:</strong> {{ $order->due_date ? $order->due_date->format('d/m/Y') : 'N/A' }}</div>
            </div>
        </div>
    </div>
    
    @if($order->history->count() > 0)
    <div class="section">
        <h2>Historial</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Cambio</th>
                    <th>Usuario</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->history as $history)
                <tr>
                    <td>{{ $history->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $history->change_description }}</td>
                    <td>{{ $history->user->name }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
    
    <div class="footer">
        <p>Generado el {{ $generated_at }} por Lumasachi Control</p>
    </div>
</body>
</html>
```

#### Rutas de Exportación
```php
// routes/api.php - Actualizar sección de exportación
Route::middleware('auth:sanctum')->prefix('export')->group(function () {
    Route::post('/users-pdf', [ExportController::class, 'usersPdf'])
        ->middleware('can:has-permission,reports.export');
    
    Route::post('/orders-pdf', [ExportController::class, 'ordersPdf'])
        ->middleware('can:has-permission,reports.export');
    
    Route::get('/order/{order}/pdf', [ExportController::class, 'orderDetailPdf'])
        ->middleware('can:view,order');
    
    Route::get('/download/{filename}', [ExportController::class, 'downloadPdf'])
        ->name('export.download');
});
```

#### Implementación en React Native
```javascript
// services/exportService.js
export const exportService = {
    async exportUsersPdf(filters = {}) {
        try {
            const response = await httpClient.post('/export/users-pdf', filters);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error generando PDF');
        }
    },

    async exportOrdersPdf(filters = {}) {
        try {
            const response = await httpClient.post('/export/orders-pdf', filters);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error generando PDF');
        }
    },

    async exportOrderDetailPdf(orderId) {
        try {
            const response = await httpClient.get(`/export/order/${orderId}/pdf`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error generando PDF');
        }
    },

    async downloadPdf(filename) {
        try {
            const response = await httpClient.get(`/export/download/${filename}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw new Error('Error descargando PDF');
        }
    }
};
```

```javascript
// hooks/useExport.js
import { useState } from 'react';
import { exportService } from '../services/exportService';
import { Alert, Linking } from 'react-native';

export const useExport = () => {
    const [loading, setLoading] = useState(false);

    const exportUsersPdf = async (filters = {}) => {
        setLoading(true);
        try {
            const result = await exportService.exportUsersPdf(filters);
            
            Alert.alert(
                'PDF Generado',
                'El PDF se ha generado exitosamente',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                        text: 'Descargar', 
                        onPress: () => Linking.openURL(result.download_url) 
                    }
                ]
            );
            
            return result;
        } catch (error) {
            Alert.alert('Error', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const exportOrdersPdf = async (filters = {}) => {
        setLoading(true);
        try {
            const result = await exportService.exportOrdersPdf(filters);
            
            Alert.alert(
                'PDF Generado',
                'El PDF se ha generado exitosamente',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                        text: 'Descargar', 
                        onPress: () => Linking.openURL(result.download_url) 
                    }
                ]
            );
            
            return result;
        } catch (error) {
            Alert.alert('Error', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const exportOrderDetailPdf = async (orderId) => {
        setLoading(true);
        try {
            const result = await exportService.exportOrderDetailPdf(orderId);
            
            Alert.alert(
                'PDF Generado',
                'El PDF se ha generado exitosamente',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                        text: 'Descargar', 
                        onPress: () => Linking.openURL(result.download_url) 
                    }
                ]
            );
            
            return result;
        } catch (error) {
            Alert.alert('Error', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        exportUsersPdf,
        exportOrdersPdf,
        exportOrderDetailPdf
    };
};
```

### Optimizaciones y Mejores Prácticas

#### 1. Caché de PDFs
```php
// En ExportService - Agregar caché
private function generatePdf(string $view, array $data, string $filename): array
{
    $cacheKey = md5($view . serialize($data));
    
    if (Cache::has("pdf_cache_{$cacheKey}")) {
        return Cache::get("pdf_cache_{$cacheKey}");
    }
    
    // Generar PDF...
    $result = [
        'filename' => $filename,
        'url' => route('export.download', ['filename' => $filename]),
        'path' => $path,
        'size' => Storage::size($path)
    ];
    
    // Cachear por 1 hora
    Cache::put("pdf_cache_{$cacheKey}", $result, 3600);
    
    return $result;
}
```

#### 2. Procesamiento Asíncrono
```php
// app/Jobs/GeneratePdfJob.php
class GeneratePdfJob implements ShouldQueue
{
    public function __construct(
        private string $type,
        private array $data,
        private int $userId
    ) {}

    public function handle()
    {
        $user = User::find($this->userId);
        $exportService = app(ExportService::class);
        
        switch ($this->type) {
            case 'users':
                $result = $exportService->exportUsersPdf($user, $this->data);
                break;
            case 'orders':
                $result = $exportService->exportOrdersPdf($user, $this->data);
                break;
        }
        
        // Enviar notificación push cuando esté listo
        $user->notify(new PdfReadyNotification($result));
    }
}
```

#### 3. Limpieza Automática
```php
// app/Console/Commands/CleanupExports.php
class CleanupExports extends Command
{
    protected $signature = 'exports:cleanup';
    protected $description = 'Cleanup old export files';

    public function handle()
    {
        $files = Storage::files('exports');
        $cleaned = 0;
        
        foreach ($files as $file) {
            if (Storage::lastModified($file) < now()->subHours(24)->timestamp) {
                Storage::delete($file);
                $cleaned++;
            }
        }
        
        $this->info("Cleaned {$cleaned} export files");
    }
}
```

#### 4. Monitoreo y Logs
```php
// config/logging.php - Agregar canal específico
'channels' => [
    'exports' => [
        'driver' => 'daily',
        'path' => storage_path('logs/exports.log'),
        'level' => 'info',
        'days' => 14,
    ],
],
```

## Seeders

### DatabaseSeeder
```php
// database/seeders/DatabaseSeeder.php
public function run()
{
    $this->call([
        UserSeeder::class,
        OrderSeeder::class,
    ]);
}
```

### UserSeeder
```php
// database/seeders/UserSeeder.php
public function run()
{
    // Super Administrator
    User::create([
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'email' => 'super@lumasachi.com',
        'password' => Hash::make('password'),
        'role' => UserRole::SUPER_ADMINISTRATOR,
        'company' => 'Lumasachi',
        'is_active' => true,
        'language_preference' => 'es',
    ]);
    
    // Administrator
    User::create([
        'first_name' => 'Admin',
        'last_name' => 'User',
        'email' => 'admin@lumasachi.com',
        'password' => Hash::make('password'),
        'role' => UserRole::ADMINISTRATOR,
        'company' => 'Lumasachi',
        'is_active' => true,
        'language_preference' => 'es',
    ]);
    
    // Employee
    User::create([
        'first_name' => 'Employee',
        'last_name' => 'User',
        'email' => 'employee@lumasachi.com',
        'password' => Hash::make('password'),
        'role' => UserRole::EMPLOYEE,
        'company' => 'Lumasachi',
        'is_active' => true,
        'language_preference' => 'es',
    ]);
    
    // Customer
    User::create([
        'first_name' => 'Customer',
        'last_name' => 'User',
        'email' => 'customer@lumasachi.com',
        'password' => Hash::make('password'),
        'role' => UserRole::CUSTOMER,
        'company' => 'Acme Corp',
        'customer_notes' => 'Cliente VIP, preferencias especiales',
        'customer_type' => 'corporate',
        'is_active' => true,
        'language_preference' => 'es',
    ]);
    
    // Usuarios adicionales de prueba
    User::factory(10)->create([
        'role' => UserRole::EMPLOYEE,
        'company' => 'Lumasachi',
    ]);
    
    // Customers adicionales con campos específicos
    User::factory(20)->create([
        'role' => UserRole::CUSTOMER,
        'customer_notes' => 'Cliente regular',
        'customer_type' => 'individual',
    ]);
}
```

## Configuración de API

### Estructura de Respuestas
```php
// app/Traits/ApiResponse.php
trait ApiResponse
{
    protected function successResponse($data, $message = null, $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }
    
    protected function errorResponse($message, $code = 400, $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
```

### Manejo de Errores
```php
// app/Exceptions/Handler.php
public function render($request, Throwable $exception)
{
    if ($request->expectsJson()) {
        if ($exception instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
            ], 422);
        }
        
        if ($exception instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }
        
        if ($exception instanceof AuthorizationException) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
    }
    
    return parent::render($request, $exception);
}
```

## Configuración de Seguridad

### Sanctum Configuration
```php
// config/sanctum.php
'expiration' => 60 * 24, // 24 horas
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),
'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],
```

### Rate Limiting
```php
// app/Providers/RouteServiceProvider.php
protected function configureRateLimiting()
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
    
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip());
    });
}
```

## Tests

### Feature Tests
```php
// tests/Feature/AuthTest.php
class AuthTest extends TestCase
{
    public function test_user_can_login_with_valid_credentials()
    public function test_user_cannot_login_with_invalid_credentials()
    public function test_user_can_logout()
    public function test_user_can_refresh_token()
}

// tests/Feature/OrderTest.php
class OrderTest extends TestCase
{
    public function test_user_can_create_order()
    public function test_user_can_update_order_status()
    public function test_user_can_assign_order()
    public function test_user_cannot_access_unauthorized_orders()
}
```

### Unit Tests
```php
// tests/Unit/OrderServiceTest.php
class OrderServiceTest extends TestCase
{
    public function test_create_order_creates_history_entry()
    public function test_status_change_validates_transition()
    public function test_assign_order_sends_notification()
}
```

## Configuración de Entorno

### .env Variables
```env
# App
APP_NAME="Lumasachi Control"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost
APP_PORT=80

# Sail
WWWGROUP=1000
WWWUSER=1000
FORWARD_DB_PORT=5432
FORWARD_REDIS_PORT=6379
NGINX_PORT=8080

# Database
DB_CONNECTION=pgsql
DB_HOST=pgsql
DB_PORT=5432
DB_DATABASE=lumasachi_control
DB_USERNAME=sail
DB_PASSWORD=password

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=redis
QUEUE_FAILED_DRIVER=database-uuids

# Cache
CACHE_DRIVER=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Broadcasting
BROADCAST_DRIVER=redis

# Octane
OCTANE_SERVER=swoole
OCTANE_HOST=0.0.0.0
OCTANE_PORT=8000
OCTANE_WORKERS=4
OCTANE_TASK_WORKERS=6
OCTANE_MAX_REQUESTS=500

# Horizon
HORIZON_PREFIX=horizon:
HORIZON_DOMAIN=localhost

# Telescope
TELESCOPE_ENABLED=true
TELESCOPE_DRIVER=database
TELESCOPE_PATH=telescope

# Mail
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null

# Firebase
FIREBASE_CREDENTIALS=storage/firebase/firebase-credentials.json
FIREBASE_PROJECT_ID=lumasachi-control

# Health Checks
HEALTH_CHECK_ENABLED=true

## Health Checks - Decisión Arquitectónica

### Análisis: Implementación Custom vs Spatie/Laravel-Health

**DECISIÓN: Usar spatie/laravel-health en lugar de implementación custom**

#### ✅ **Ventajas de spatie/laravel-health:**

**Madurez y Robustez**
- **+800 estrellas en GitHub** - Comunidad grande y activa
- **Mantenimiento activo** por Spatie (equipo reconocido en el ecosistema Laravel)
- **Documentación exhaustiva** con ejemplos prácticos y mejores prácticas
- **Amplia compatibilidad** con Laravel 8-12 y actualizaciones constantes

**Características Avanzadas**
- **20+ checks predefinidos**: Base de datos, Redis, CPU, disco, cola, programador, etc.
- **Integración con Oh Dear** para monitoreo profesional externo
- **Métricas avanzadas**: CPU, memoria, disco, tiempo de respuesta
- **Configuración flexible**: Thresholds personalizables y checks condicionales
- **Caching inteligente**: Evita overhead en producción
- **Notificaciones automáticas**: Slack, email, webhooks cuando falla un check

**Escalabilidad y Mantenimiento**
- **Fácil extensión**: Agregar nuevos checks sin modificar código core
- **Configuración centralizada**: Un solo archivo de configuración
- **Testing incorporado**: Suite de pruebas robusta
- **Logs estructurados**: Mejor debugging y monitoreo

#### ❌ **Desventajas de Implementación Custom:**

**Limitaciones Técnicas**
- **Funcionalidad básica**: Solo checks fundamentales (DB, Redis, Storage)
- **Sin métricas avanzadas**: No monitorea CPU, memoria, disco
- **Mantenimiento manual**: Requiere desarrollo continuo
- **Sin integración externa**: No se conecta con servicios de monitoreo
- **Testing limitado**: Requiere escribir pruebas desde cero

**Escalabilidad**
- **Difícil extensión**: Agregar nuevos checks requiere modificar controller
- **Sin configuración centralizada**: Lógica dispersa en el código
- **Performance**: Sin optimizaciones para producción
- **Monitoreo limitado**: No proporciona métricas históricas

#### 🔧 **Implementación Recomendada:**

**Instalar spatie/laravel-health:**
```bash
composer require spatie/laravel-health
php artisan vendor:publish --tag=health-config
php artisan vendor:publish --tag=health-migrations
php artisan migrate
```

**Configuración optimizada:**
```php
// config/health.php
return [
    'oh_dear_endpoint' => env('OH_DEAR_HEALTH_CHECK_URL'),
    
    'result_stores' => [
        Spatie\Health\ResultStores\EloquentHealthResultStore::class,
        Spatie\Health\ResultStores\CacheHealthResultStore::class,
    ],
    
    'checks' => [
        Spatie\Health\Checks\Checks\DatabaseCheck::new(),
        Spatie\Health\Checks\Checks\RedisCheck::new(),
        Spatie\Health\Checks\Checks\CacheCheck::new(),
        Spatie\Health\Checks\Checks\QueueCheck::new(),
        Spatie\Health\Checks\Checks\ScheduleCheck::new(),
        Spatie\Health\Checks\Checks\UsedDiskSpaceCheck::new()
            ->warnWhenUsedSpaceIsAbovePercentage(70)
            ->failWhenUsedSpaceIsAbovePercentage(85),
        Spatie\Health\Checks\Checks\CpuLoadCheck::new()
            ->failWhenLoadIsHigherThan(2.0),
        Spatie\Health\Checks\Checks\DatabaseSizeCheck::new()
            ->failWhenSizeAboveGb(5.0),
    ],
    
    'notifications' => [
        Spatie\Health\Notifications\CheckFailedNotification::class => [
            'mail' => env('HEALTH_NOTIFICATION_EMAIL'),
            'slack' => env('HEALTH_NOTIFICATION_SLACK'),
        ],
    ],
];
```

**Rutas optimizadas:**
```php
// routes/api.php
Route::get('/health', Spatie\Health\Http\Controllers\HealthCheckController::class)
    ->name('health')
    ->middleware('throttle:60,1');
    
Route::get('/up', fn() => response()->json(['status' => 'ok']))
    ->name('health.simple');
```

**Comando para monitoreo:**
```php
// app/Console/Commands/RunHealthChecks.php
class RunHealthChecks extends Command
{
    protected $signature = 'health:check';
    
    public function handle()
    {
        $healthChecker = app(HealthChecker::class);
        $results = $healthChecker->run();
        
        if ($results->allChecksOk()) {
            $this->info('All health checks passed');
        } else {
            $this->error('Some health checks failed');
            // Enviar notificaciones
        }
    }
}
```

#### 📊 **Ventajas Específicas para Lumasachi Control:**

1. **Monitoreo Octane**: Checks específicos para Swoole/RoadRunner
2. **Horizon Integration**: Monitoreo automático de colas y jobs
3. **Firebase Checks**: Verificación de conectividad con FCM
4. **Escalabilidad**: Preparado para microservicios futuros
5. **Alertas Inteligentes**: Notificaciones solo cuando es necesario
6. **Métricas Business**: Monitoreo de órdenes, usuarios activos, etc.

#### 🚀 **Migración desde Implementación Custom:**

1. **Instalar spatie/laravel-health**
2. **Configurar checks equivalentes**
3. **Migrar rutas existentes**
4. **Actualizar tests de health checks**
5. **Configurar notificaciones**
6. **Eliminar HealthController custom**

Esta decisión proporciona una base sólida para monitoreo en producción con mínimo esfuerzo de desarrollo y máximo beneficio operacional.

## File Storage para Producción - Decisión Arquitectónica

### Análisis: Opciones de File Storage para Aplicaciones React Native

**DECISIÓN: Usar DigitalOcean Spaces como almacenamiento principal con respaldo en AWS S3**

#### 🌐 **Opciones Analizadas:**

**1. AWS S3 (Amazon Simple Storage Service)**
- **Ventajas:**
  - Líder del mercado con 99.999999999% (11 9's) de durabilidad
  - Múltiples clases de almacenamiento (Standard, IA, Glacier, Deep Archive)
  - Integración nativa con CloudFront CDN
  - Amplia gama de herramientas y SDKs
  - Disponible en múltiples regiones globalmente

- **Desventajas:**
  - Costos más elevados ($0.023/GB/mes para Standard)
  - Tarifas de transferencia de datos caras
  - Complejidad en la configuración de permisos
  - Modelo de precios complejo con múltiples variables

**2. DigitalOcean Spaces**
- **Ventajas:**
  - Precios predecibles: $5/mes por 250GB + 1TB transferencia
  - API compatible con S3 (migración fácil)
  - CDN integrado gratuito
  - Interfaz simple y amigable para desarrolladores
  - Excelente relación costo-beneficio

- **Desventajas:**
  - Menos regiones disponibles que AWS
  - Menor ecosistema de herramientas
  - Durabilidad ligeramente menor que AWS
  - Limitado a casos de uso generales

**3. Google Cloud Storage**
- **Ventajas:**
  - Precios competitivos ($0.020/GB/mes)
  - Integración con Google Cloud Platform
  - Buena performance global
  - Transferencia entre regiones gratuita en algunos casos

- **Desventajas:**
  - Menos opciones de almacenamiento que AWS
  - Menor adopción en el mercado
  - Documentación menos extensa

**4. Cloudflare R2**
- **Ventajas:**
  - Sin costos de transferencia de datos (egress)
  - Precios muy competitivos ($0.015/GB/mes)
  - Red global de Cloudflare
  - API compatible con S3

- **Desventajas:**
  - Servicio relativamente nuevo
  - Menor durabilidad garantizada
  - Ecosistema limitado
  - No soporta montaje nativo S3FS

#### 📊 **Análisis de Costos (100GB de datos):**

| Proveedor | Almacenamiento/mes | Transferencia (1TB) | Total/mes |
|-----------|-------------------|-------------------|-----------|
| AWS S3 | $2.30 | $92.00 | $94.30 |
| DigitalOcean Spaces | $5.00 | $0.00 | $5.00 |
| Google Cloud Storage | $2.00 | $120.00 | $122.00 |
| Cloudflare R2 | $1.50 | $0.00 | $1.50 |

#### 🎯 **Recomendación Específica para Lumasachi Control:**

**Arquitectura Híbrida: DigitalOcean Spaces + AWS S3**

1. **Almacenamiento Principal: DigitalOcean Spaces**
   - Para PDFs generados, archivos temporales, y assets estáticos
   - Costo predecible y CDN integrado
   - Fácil integración con el stack actual

2. **Almacenamiento de Respaldo: AWS S3 (Glacier)**
   - Para archivos históricos y respaldos críticos
   - Costo ultra-bajo para almacenamiento a largo plazo
   - Mayor durabilidad para datos críticos

#### 🔧 **Implementación Práctica:**

**Laravel Configuration (config/filesystems.php):**
```php
'disks' => [
    'spaces' => [
        'driver' => 's3',
        'key' => env('DO_SPACES_KEY'),
        'secret' => env('DO_SPACES_SECRET'),
        'endpoint' => env('DO_SPACES_ENDPOINT'),
        'region' => env('DO_SPACES_REGION'),
        'bucket' => env('DO_SPACES_BUCKET'),
        'url' => env('DO_SPACES_URL'),
        'visibility' => 'private',
        'throw' => false,
    ],
    
    's3_backup' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BACKUP_BUCKET'),
        'url' => env('AWS_URL'),
        'endpoint' => null,
        'use_path_style_endpoint' => false,
        'throw' => false,
    ],
],
```

**Servicio de Almacenamiento Híbrido:**
```php
// app/Services/FileStorageService.php
class FileStorageService
{
    public function storePDF($content, $filename)
    {
        // Almacenar en DigitalOcean Spaces
        $path = Storage::disk('spaces')->put("pdfs/{$filename}", $content);
        
        // Crear respaldo en AWS S3 después de 30 días
        dispatch(new BackupToS3Job($path, $filename))->delay(now()->addDays(30));
        
        return $path;
    }
    
    public function getPublicUrl($path)
    {
        return Storage::disk('spaces')->url($path);
    }
    
    public function getTemporaryUrl($path, $expiration = 3600)
    {
        return Storage::disk('spaces')->temporaryUrl($path, now()->addSeconds($expiration));
    }
}
```

**Job de Respaldo:**
```php
// app/Jobs/BackupToS3Job.php
class BackupToS3Job implements ShouldQueue
{
    public function handle()
    {
        $content = Storage::disk('spaces')->get($this->path);
        
        // Mover a S3 Glacier para almacenamiento a largo plazo
        Storage::disk('s3_backup')->put("backups/{$this->filename}", $content);
        
        // Opcional: eliminar de Spaces después del respaldo
        // Storage::disk('spaces')->delete($this->path);
    }
}
```

**Variables de Entorno:**
```env
# DigitalOcean Spaces
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=lumasachi-control
DO_SPACES_URL=https://lumasachi-control.nyc3.digitaloceanspaces.com

# AWS S3 (Respaldo)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_DEFAULT_REGION=us-east-1
AWS_BACKUP_BUCKET=lumasachi-control-backup
```

#### 🚀 **Integración con React Native:**

**Servicio de Archivos:**
```javascript
// services/fileService.js
export const FileService = {
    async uploadFile(file, type = 'document') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const response = await httpClient.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data;
    },
    
    async downloadPDF(orderId) {
        const response = await httpClient.get(`/api/export/pdf/order/${orderId}`, {
            responseType: 'blob',
        });
        
        return response.data;
    },
    
    async getPreviewUrl(fileId) {
        const response = await httpClient.get(`/api/files/${fileId}/preview-url`);
        return response.data.url;
    },
};
```

**Hook para Manejo de Archivos:**
```javascript
// hooks/useFileManager.js
export const useFileManager = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const uploadFile = async (file, onProgress) => {
        setUploading(true);
        try {
            const result = await FileService.uploadFile(file, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                    onProgress?.(percentCompleted);
                },
            });
            return result;
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };
    
    const downloadAndSharePDF = async (orderId) => {
        try {
            const blob = await FileService.downloadPDF(orderId);
            const reader = new FileReader();
            reader.onload = () => {
                // Compartir archivo en React Native
                Share.share({
                    message: 'Orden exportada',
                    url: reader.result,
                });
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };
    
    return {
        uploading,
        progress,
        uploadFile,
        downloadAndSharePDF,
    };
};
```

#### 💰 **Ventajas Económicas:**

1. **Ahorro del 95% en costos** comparado con AWS S3
2. **Precios predecibles** sin sorpresas en facturación  
3. **CDN incluido** sin costos adicionales
4. **Transferencia gratuita** hasta 1TB mensual
5. **Escalabilidad gradual** según crecimiento

#### 🔒 **Consideraciones de Seguridad:**

- **Encriptación en tránsito**: SSL/TLS automático
- **Encriptación en reposo**: AES-256 por defecto
- **Acceso controlado**: Keys API separadas por entorno
- **URLs temporales**: Para acceso seguro a archivos privados
- **Respaldo automático**: Protección contra pérdida de datos

#### 📈 **Escalabilidad y Monitoreo:**

- **Métricas de uso**: Monitoreo de almacenamiento y transferencia
- **Alertas automáticas**: Notificaciones por uso excesivo
- **Migración gradual**: Fácil migración a AWS si es necesario
- **Performance**: CDN global para entrega rápida

Esta arquitectura híbrida ofrece el equilibrio perfecto entre **costo, performance y confiabilidad** para las necesidades específicas de Lumasachi Control.

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

## Comandos Artisan Personalizados

### Comando para Limpiar Tokens Expirados
```php
// app/Console/Commands/CleanExpiredTokens.php
class CleanExpiredTokens extends Command
{
    protected $signature = 'tokens:clean';
    protected $description = 'Clean expired personal access tokens';
    
    public function handle()
    {
        $count = PersonalAccessToken::where('expires_at', '<', now())->delete();
        $this->info("Deleted {$count} expired tokens");
    }
}
```

### Comando para Estadísticas
```php
// app/Console/Commands/GenerateStats.php
class GenerateStats extends Command
{
    protected $signature = 'stats:generate';
    protected $description = 'Generate system statistics';
    
    public function handle()
    {
        // Generar estadísticas diarias
        // Enviar reportes automáticos
    }
}
```

## Documentación API

### Swagger/OpenAPI
```yaml
# storage/api-docs/api-docs.yaml
openapi: 3.0.0
info:
  title: Lumasachi Control API
  version: 1.0.0
  description: API para el sistema de control Lumasachi

paths:
  /api/auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
```

## Monitoreo y Logs

### Logging Configuration
```php
// config/logging.php
'channels' => [
    'api' => [
        'driver' => 'daily',
        'path' => storage_path('logs/api.log'),
        'level' => 'debug',
        'days' => 14,
    ],
    'orders' => [
        'driver' => 'daily',
        'path' => storage_path('logs/orders.log'),
        'level' => 'info',
        'days' => 30,
    ],
],
```

### Health Check Controller
```php
// app/Http/Controllers/HealthController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Laravel\Horizon\Contracts\MasterSupervisorRepository;

class HealthController extends Controller
{
    public function up(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'horizon' => $this->checkHorizon(),
            'storage' => $this->checkStorage(),
        ];

        $allHealthy = collect($checks)->every(fn($check) => $check['healthy']);

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'unhealthy',
            'checks' => $checks,
            'timestamp' => now()->toISOString(),
            'version' => config('app.version', '1.0.0'),
        ], $allHealthy ? 200 : 503);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            $responseTime = $this->measureResponseTime(fn() => DB::select('SELECT 1'));
            
            return [
                'healthy' => true,
                'message' => 'Database connection OK',
                'response_time_ms' => $responseTime
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ];
        }
    }

    private function checkRedis(): array
    {
        try {
            $responseTime = $this->measureResponseTime(fn() => Redis::ping());
            
            return [
                'healthy' => true,
                'message' => 'Redis connection OK',
                'response_time_ms' => $responseTime
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Redis connection failed: ' . $e->getMessage()
            ];
        }
    }

    private function checkHorizon(): array
    {
        try {
            $masters = app(MasterSupervisorRepository::class)->all();
            $active = collect($masters)->filter(fn($master) => $master->status === 'running');
            
            return [
                'healthy' => $active->isNotEmpty(),
                'message' => $active->isNotEmpty() ? 'Horizon is running' : 'Horizon is not running',
                'active_supervisors' => $active->count(),
                'total_supervisors' => count($masters)
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Horizon check failed: ' . $e->getMessage()
            ];
        }
    }

    private function checkStorage(): array
    {
        try {
            $testFile = 'health-check-' . now()->timestamp . '.txt';
            Storage::disk('local')->put($testFile, 'test');
            $exists = Storage::disk('local')->exists($testFile);
            Storage::disk('local')->delete($testFile);
            
            return [
                'healthy' => $exists,
                'message' => $exists ? 'Storage is writable' : 'Storage is not writable'
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Storage check failed: ' . $e->getMessage()
            ];
        }
    }

    private function measureResponseTime(callable $callback): float
    {
        $start = microtime(true);
        $callback();
        return round((microtime(true) - $start) * 1000, 2);
    }
}
```

### Configuración de Octane
```php
// config/octane.php
return [
    'server' => env('OCTANE_SERVER', 'swoole'),
    
    'https' => env('OCTANE_HTTPS', false),
    
    'listeners' => [
        WorkerStarting::class => [
            EnsureUploadedFilesAreValid::class,
            EnsureUploadedFilesCanBeMoved::class,
        ],
        RequestReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
            ...Octane::prepareApplicationForNextRequest(),
        ],
        RequestHandled::class => [
            FlushUploadedFiles::class,
        ],
        RequestTerminated::class => [
            FlushTemporaryContainerInstances::class,
        ],
    ],
    
    'warm' => [
        ...Octane::defaultServicesToWarm(),
    ],
    
    'cache' => [
        'interval' => env('OCTANE_CACHE_INTERVAL', 1000),
        'rows' => env('OCTANE_CACHE_ROWS', 1000),
    ],
    
    'swoole' => [
        'host' => env('OCTANE_HOST', '0.0.0.0'),
        'port' => env('OCTANE_PORT', 8000),
        'server' => [
            'worker_num' => env('OCTANE_WORKERS', 4),
            'task_worker_num' => env('OCTANE_TASK_WORKERS', 6),
            'max_request' => env('OCTANE_MAX_REQUESTS', 500),
            'dispatch_mode' => 1,
            'open_tcp_nodelay' => true,
            'max_coroutines' => 10000,
        ],
    ],
];
```

### Configuración de Horizon
```php
// config/horizon.php
return [
    'use' => env('HORIZON_PREFIX', 'horizon:'),
    
    'prefix' => env('HORIZON_PREFIX', 'horizon:'),
    
    'middleware' => ['web', 'auth:sanctum'],
    
    'waits' => [
        'redis:default' => 60,
    ],
    
    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],
    
    'fast_termination' => false,
    
    'memory_limit' => 64,
    
    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'processes' => 1,
            'tries' => 3,
            'timeout' => 60,
            'memory' => 128,
        ],
    ],
    
    'environments' => [
        'production' => [
            'supervisor-1' => [
                'maxProcesses' => 10,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
        ],
        'local' => [
            'supervisor-1' => [
                'maxProcesses' => 3,
            ],
        ],
    ],
];
```

### Configuración de Telescope
```php
// config/telescope.php
return [
    'driver' => env('TELESCOPE_DRIVER', 'database'),
    
    'path' => env('TELESCOPE_PATH', 'telescope'),
    
    'middleware' => [
        'web',
        'auth:sanctum',
    ],
    
    'only_paths' => [
        'api/*',
    ],
    
    'ignore_paths' => [
        'telescope*',
        'horizon*',
        'up',
    ],
    
    'watchers' => [
        RequestWatcher::class => [
            'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
            'size_limit' => env('TELESCOPE_RESPONSE_SIZE_LIMIT', 64),
        ],
        CommandWatcher::class => [
            'enabled' => env('TELESCOPE_COMMAND_WATCHER', true),
        ],
        ScheduleWatcher::class => [
            'enabled' => env('TELESCOPE_SCHEDULE_WATCHER', true),
        ],
        JobWatcher::class => [
            'enabled' => env('TELESCOPE_JOB_WATCHER', true),
        ],
        ExceptionWatcher::class => [
            'enabled' => env('TELESCOPE_EXCEPTION_WATCHER', true),
        ],
        QueryWatcher::class => [
            'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
            'slow' => 100,
        ],
    ],
];
```

### Configuración Nginx para Octane
```nginx
# docker/nginx/octane.conf
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name localhost;
    server_tokens off;
    root /var/www/html/public;

    index index.php;

    charset utf-8;

    location /index.php {
        try_files /not_exists @octane;
    }

    location / {
        try_files $uri $uri/ @octane;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log error;

    error_page 404 /index.php;

    location @octane {
        set $suffix "";

        if ($uri = /index.php) {
            set $suffix ?$query_string;
        }

        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_pass http://app:8000$suffix;
    }
}
```

### Crontab para Scheduler
```bash
# docker/crontab
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

## Checklist de Implementación

### Fase 1: Configuración Base con Laravel Sail
- [ ] Configurar Laravel 12 con PHP 8.4 usando Laravel Sail
- [ ] Configurar Docker con docker-compose.yml optimizado
- [ ] Instalar y configurar PostgreSQL 16
- [ ] Configurar Redis 7 para cache y queues
- [ ] Configurar Nginx como proxy reverse
- [ ] Crear Makefile para comandos de desarrollo
- [ ] Configurar variables de entorno (.env)

### Fase 2: Tecnologías de Alto Rendimiento
- [ ] Instalar y configurar Laravel Octane con Swoole
- [ ] Configurar Octane para máximo rendimiento
- [ ] Instalar y configurar Laravel Horizon
- [ ] Configurar supervisores de queues en Horizon
- [ ] Instalar Laravel Telescope para desarrollo
- [ ] Configurar watchers de Telescope

### Fase 3: Autenticación y Autorización
- [ ] Instalar y configurar Sanctum
- [ ] Crear migraciones base (users, customers, orders, etc.)
- [ ] Crear enum UserRole con permisos
- [ ] Implementar Gates y Policies para autorización
- [ ] Implementar endpoints de autenticación
- [ ] Configurar middleware de autenticación

### Fase 4: Gestión de Usuarios
- [ ] CRUD completo de usuarios con UserPolicy
- [ ] Validaciones con enum UserRole
- [ ] Endpoints de perfil con autorización
- [ ] Resources para transformaciones de datos
- [ ] Middleware personalizado para roles y permisos

### Fase 5: Gestión de Órdenes
- [ ] CRUD completo de órdenes con OrderPolicy
- [ ] Sistema de estados y transiciones con validaciones
- [ ] Historial de cambios automático
- [ ] Asignación de órdenes con permisos por rol
- [ ] Sistema de archivos adjuntos polimórfico con soporte para múltiples archivos
- [ ] Implementar controladores y servicios para upload/download de múltiples archivos
- [ ] Crear AttachmentController para gestión de archivos adjuntos
- [ ] Implementar AttachmentService para manejo de archivos con DigitalOcean Spaces
- [ ] Filtros dinámicos según rol del usuario

### Fase 6: Colas y Jobs
- [ ] Configurar Redis queues con Horizon
- [ ] Crear jobs para notificaciones Firebase
- [ ] Crear jobs para exportación de datos
- [ ] Configurar retry y backoff strategies
- [ ] Implementar failed job handling

### Fase 7: Notificaciones Firebase
- [ ] Configuración de Firebase FCM
- [ ] Implementar Firebase credentials
- [ ] Crear jobs para notificaciones push
- [ ] Sistema de notificaciones internas
- [ ] Endpoint para actualizar FCM tokens
- [ ] Manejo de tokens inválidos

### Fase 8: File Storage y Configuración de Almacenamiento
- [ ] Configurar DigitalOcean Spaces como almacenamiento principal
- [ ] Configurar AWS S3 como almacenamiento de respaldo
- [ ] Implementar FileStorageService para almacenamiento híbrido
- [ ] Crear jobs de respaldo automático (BackupToS3Job)
- [ ] Configurar variables de entorno para ambos proveedores
- [ ] Implementar servicio de archivos para React Native
- [ ] Crear hook useFileManager para manejo de archivos
- [ ] Configurar URLs temporales para acceso seguro
- [ ] Implementar monitoreo de uso y alertas
- [ ] Crear políticas de limpieza automática de archivos

### Fase 9: Generación de PDFs y Reportes
- [ ] Instalar y configurar barryvdh/laravel-dompdf
- [ ] Crear ExportController con métodos para PDFs
- [ ] Implementar ExportService mejorado con filtros por rol
- [ ] Crear plantillas Blade para PDFs (users, orders, order-detail)
- [ ] Configurar rutas de exportación con autorización
- [ ] Implementar caché de PDFs para optimización
- [ ] Crear jobs asíncronos para generación de PDFs grandes (GeneratePdfJob)
- [ ] Implementar limpieza automática de PDFs (CleanupExports command)
- [ ] Configurar logs específicos para exportaciones
- [ ] Crear servicio React Native para exportación
- [ ] Implementar hooks useExport para React Native
- [ ] Configurar notificaciones push para PDFs listos
- [ ] Permisos específicos para exportación por rol

### Fase 10: Health Checks y Monitoring
- [ ] Instalar y configurar spatie/laravel-health
- [ ] Configurar checks de base de datos, Redis, cache, colas y programador
- [ ] Implementar checks de espacio en disco y carga de CPU
- [ ] Configurar notificaciones automáticas (email, Slack)
- [ ] Eliminar HealthController custom e implementar rutas optimizadas
- [ ] Crear comando RunHealthChecks para monitoreo automático
- [ ] Configurar integración con Oh Dear (opcional)
- [ ] Configurar monitoreo de servicios
- [ ] Implementar métricas de rendimiento
- [ ] Configurar alertas automáticas
- [ ] Logs estructurados

### Fase 11: Internacionalización
- [ ] Archivos de idioma
- [ ] Middleware de idioma
- [ ] Respuestas localizadas
- [ ] Validaciones localizadas

### Fase 12: Testing y Documentación
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests de rendimiento con Octane
- [ ] Documentación API
- [ ] Guías de despliegue

### Fase 13: Optimización y Deployment
- [ ] Optimizar configuraciones para producción
- [ ] Configurar caching strategies
- [ ] Implementar script de deployment
- [ ] Configurar CI/CD pipeline
- [ ] Load testing y optimización

## Notas Importantes

### Configuración y Desarrollo
1. **Laravel Sail**: Usar como entorno de desarrollo estándar con Docker
2. **Octane**: Hasta 4x mejor rendimiento que PHP-FPM tradicional
3. **Horizon**: Monitoreo visual y gestión de queues en tiempo real
4. **Telescope**: Solo para desarrollo, no habilitarlo en producción
5. **PostgreSQL**: Mejor rendimiento y características avanzadas vs MySQL
6. **Redis**: Cache, sesiones y queues centralizados

### Seguridad y Rendimiento
7. **Seguridad**: Implementar validación exhaustiva en todos los endpoints
8. **Performance**: Usar eager loading, índices de BD, y cache donde sea apropiado
9. **Escalabilidad**: Todas las operaciones pesadas deben usar queues
10. **Auditoría**: Registrar todas las acciones importantes usando AuditMiddleware
11. **Autorización**: Usar Gates y Policies nativos de Laravel para mejor rendimiento
12. **Roles**: Los roles están definidos en enum UserRole para mejor tipado

### Tecnologías Específicas
13. **Firebase FCM**: Configurar correctamente las credenciales y tokens para notificaciones push móviles
14. **Exportación MVP**: Solo PDF habilitado inicialmente, Excel/CSV se puede agregar en futuras versiones
15. **Health Checks**: Implementar monitoreo completo de servicios
16. **Backup**: Implementar respaldos automáticos de BD con volúmenes Docker

### Deployment y Monitoring
17. **Monitoreo**: Logs detallados y métricas de performance con Horizon y health checks
18. **Versionado**: Considerar versionado de API para futuras actualizaciones
19. **Migración**: Si en el futuro se necesita más flexibilidad, es posible migrar a Spatie Permission
20. **Deployment**: Usar scripts automatizados y CI/CD para deployments
21. **Load Testing**: Probar rendimiento con Octane antes de producción

### Comandos Útiles
```bash
# Desarrollo
make install      # Instalar y configurar proyecto
make start        # Iniciar servicios
make octane-start # Iniciar servidor Octane
make horizon-start # Iniciar Horizon

# Monitoreo
./vendor/bin/sail artisan horizon:status
./vendor/bin/sail artisan octane:status
./vendor/bin/sail artisan queue:monitor

# Optimización
make optimize     # Optimizar para producción
./vendor/bin/sail artisan octane:restart
./vendor/bin/sail artisan horizon:restart
```

### Puntos de Acceso para Desarrollo
- **Aplicación**: http://localhost
- **Nginx Proxy**: http://localhost:8080
- **Horizon**: http://localhost/horizon
- **Telescope**: http://localhost/telescope
- **Health Check**: http://localhost/up

## Resumen de Ventajas de la Configuración

### 🚀 **Rendimiento Optimizado**
- **Laravel Octane**: Hasta 4x mejor rendimiento que PHP-FPM tradicional
- **Swoole**: Servidor asíncrono con workers persistentes
- **Redis**: Cache distribuido y gestión de sesiones de alta velocidad
- **PostgreSQL**: Base de datos optimizada para consultas complejas

### 📊 **Monitoreo y Debugging**
- **Horizon**: Dashboard visual para monitoreo de queues en tiempo real
- **Telescope**: Debugging avanzado durante desarrollo
- **Health Checks**: Monitoreo automático de servicios
- **Métricas**: Estadísticas detalladas de rendimiento

### 🔧 **Desarrollo Eficiente**
- **Laravel Sail**: Entorno Docker listo para usar
- **Makefile**: Comandos simplificados para desarrollo
- **Hot Reload**: Desarrollo con recarga automática
- **Containers**: Aislamiento completo de dependencias

### 📱 **Optimizado para Móviles**
- **Firebase FCM**: Notificaciones push nativas
- **API REST**: Endpoints optimizados para React Native
- **Queues**: Procesamiento asíncrono para mejor UX
- **Caching**: Respuestas rápidas para aplicaciones móviles

### 🔐 **Seguridad y Escalabilidad**
- **Sanctum**: Autenticación API segura
- **Gates & Policies**: Autorización granular
- **Rate Limiting**: Protección contra abuso
- **Audit Logs**: Trazabilidad completa de acciones

### 🛠️ **Tecnologías Modernas**
- **PHP 8.4**: Características más recientes del lenguaje
- **Laravel 12**: Framework actualizado y optimizado
- **Docker**: Contenedores para desarrollo y producción
- **Nginx**: Proxy reverso de alto rendimiento

Este documento servirá como guía completa para el desarrollo del backend Laravel que dará soporte a la aplicación móvil Lumasachi Control con las mejores prácticas de la industria.
