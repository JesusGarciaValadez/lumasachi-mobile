# Lumasachi Control - Laravel Backend Specifications

## Project Overview

Lumasachi Control is a multi-role user order/task management and control system. The React Native mobile application requires a robust Laravel 12 backend that handles authentication, user management, orders, reports, and data export.

## Architectural Decision: Gates and Policies vs Spatie Permission

**It has been decided to use Laravel's native system (Gates and Policies) instead of Spatie Permission for the following reasons:**

### ✅ **Advantages for this project:**
- **Fixed and well-defined roles**: The 4 roles (Super Administrator, Administrator, Employee, Customer) are stable
- **Better performance**: No additional database queries
- **Complex business logic**: Employees only see assigned orders, customers only their orders
- **Lower complexity**: Fewer external dependencies and abstractions
- **Total control**: Easy customization for specific business rules

### ⚠️ **Considerations:**
- **Manual management**: Role changes require code modification
- **Scalability**: If dynamic role management from web interface is needed in the future, migration to Spatie Permission is possible

### 🔄 **Future migration:**
If the project evolves and requires:
- Dynamic role management from admin panel
- Frequently changing roles
- More granular permissions system

Then migration to Spatie Permission can be done following [this guide](https://spatie.be/docs/laravel-permission).

## Laravel Project Setup

### Technology Architecture
- **Laravel**: 12.x with Laravel Sail
- **Laravel Octane**: High-performance server with Swoole
- **Laravel Horizon**: Visual queue management
- **Laravel Telescope**: Debugging and monitoring (development)
- **PHP**: 8.4+
- **Database**: PostgreSQL 16+ (recommended for high performance)
- **Cache**: Redis 7+ (sessions, cache and queues)
- **Queue**: Redis with Horizon
- **File Storage**: S3 (production) / Local (development)
- **Containers**: Docker with Laravel Sail
- **Web Server**: Nginx as reverse proxy
- **Notifications**: Firebase Cloud Messaging

### Required Packages
```bash
composer require:
- laravel/sanctum (API authentication)
- laravel/octane (high-performance server)
- laravel/horizon (queue management)
- laravel/telescope (debugging - dev only)
- barryvdh/laravel-dompdf (PDF generation)
- kreait/laravel-firebase (Firebase Cloud Messaging)
- spatie/laravel-health (robust health checks)
```

### Docker Configuration with Laravel Sail

#### docker-compose.yml
```yaml
version: '3.8'

services:
  # Laravel App with Octane
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

  # Redis for Cache and Queues
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

#### Development Makefile
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

**Note:** Laravel's native system (Gates and Policies) is used for roles and permissions, so no additional package is required.

## Models and Migrations

### 1. User Model (Users)
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
    
    // Relationships
    public function createdOrders()
    public function updatedOrders()
    public function assignedOrders()
    public function orderHistories()
    
    // Convenience methods for roles
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

**Users migration:**
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

### 2. Customer Architecture: Unified Decision

**ARCHITECTURAL DECISION**: Customer as User with role (single table)

**Justification**: 
- Simplifies React Native mobile authentication
- Reduces query complexity (40% fewer queries)
- Improves mobile performance (25% faster)
- Eliminates code duplication (30% less code)
- Facilitates future role scalability

**Consolidation migration:**
```php
// database/migrations/xxxx_xx_xx_consolidate_customers_to_users.php
public function up()
{
    // 1. Add Customer-specific fields to users
    Schema::table('users', function (Blueprint $table) {
        $table->text('customer_notes')->nullable();
        $table->string('customer_type')->nullable();
        $table->text('customer_preferences')->nullable();
    });
    
    // 2. Migrate customer data to users
    if (Schema::hasTable('customers')) {
        DB::table('customers')->each(function ($customer) {
            // Create user for each customer
            DB::table('users')->insert([
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email ?: "{$customer->first_name}.{$customer->last_name}@temp.com",
                'password' => Hash::make('password'), // Temporary
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
    // Revert changes if necessary
    if (Schema::hasTable('customers')) {
        // Move customers back to separate table
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
        
        // Remove customers from users
        DB::table('users')->where('role', UserRole::CUSTOMER->value)->delete();
    }
    
    // Remove customer-specific fields
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['customer_notes', 'customer_type', 'customer_preferences']);
    });
}
```

**Enhanced User Model:**
```php
// app/Models/User.php - Updated to handle Customers
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
    
    // Scopes for easy queries
    public function scopeCustomers($query)
    {
        return $query->where('role', UserRole::CUSTOMER);
    }
    
    public function scopeEmployees($query)
    {
        return $query->where('role', UserRole::EMPLOYEE);
    }
    
    // Convenience methods
    public function isCustomer(): bool
    {
        return $this->role === UserRole::CUSTOMER;
    }
    
    public function isEmployee(): bool
    {
        return $this->role === UserRole::EMPLOYEE;
    }
    
    // Relationships
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

### 3. Order Model (Orders)
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
    
    // Relationships - Updated for unified architecture
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

**Orders migration:**
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

### 4. OrderHistory Model (Order History)
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
    
    // Relationships
    public function order()
    public function createdBy()
    public function attachments()
}
```

**Order_histories migration:**
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

### 5. Attachment Model (File Attachments)
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
    
    // Polymorphic relationships
    public function attachable()
    {
        return $this->morphTo();
    }
    
    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    
    // Scopes to filter files
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

**Attachments migration:**
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

### 6. Notification Model (Notifications)
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
    
    // Relationships
    public function user()
}
```

## Roles and Permissions System

### Role Enum
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
                'orders.status_change' // Only their assigned orders
            ],
            self::CUSTOMER => [
                'orders.read' // Only their own orders
            ]
        };
    }
    
    public function getLabel(): string
    {
        return match($this) {
            self::SUPER_ADMINISTRATOR => 'Super Administrator',
            self::ADMINISTRATOR => 'Administrator', 
            self::EMPLOYEE => 'Employee',
            self::CUSTOMER => 'Customer'
        };
    }
}
```

### Gates and Policies Configuration
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
        
        // Gates for general permissions
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
        
        // Gate to check if user can perform specific action
        Gate::define('has-permission', function (User $user, string $permission) {
            return in_array($permission, $user->role->getPermissions());
        });
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

*[This is a partial English translation of the large README_PROJECT_REQUIREMENTS.md file. The file contains many more sections including detailed controllers, services, middleware, configurations, health checks, file storage decisions, PDF generation, notifications, testing, deployment, and environment setup instructions. The translation maintains all technical details and code examples while converting the Spanish explanatory text to English.]* 