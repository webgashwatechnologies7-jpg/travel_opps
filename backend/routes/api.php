<?php

use App\Http\Controllers\AuthController;
use App\Modules\Crm\Presentation\Controllers\AdminUserController;
use App\Modules\Crm\Presentation\Controllers\CompanySettingsController;
use App\Modules\Crm\Presentation\Controllers\PermissionController;
use App\Modules\Crm\Presentation\Controllers\ProfileController;
use App\Modules\Dashboard\Presentation\Controllers\DashboardController;
use App\Modules\Dashboard\Presentation\Controllers\DestinationAnalyticsController;
use App\Modules\Dashboard\Presentation\Controllers\PerformanceController;
use App\Modules\Dashboard\Presentation\Controllers\ReportsController;
use App\Modules\Dashboard\Presentation\Controllers\SourceAnalyticsController;
use App\Modules\Hr\Presentation\Controllers\TargetController;
use App\Modules\Automation\Presentation\Controllers\CampaignController;
use App\Modules\Automation\Presentation\Controllers\GoogleSheetSyncController;
use App\Modules\Automation\Presentation\Controllers\InboxController;
use App\Modules\Automation\Presentation\Controllers\WhatsappController;
use App\Modules\Leads\Presentation\Controllers\FollowupController;
use App\Modules\Leads\Presentation\Controllers\LeadImportController;
use App\Modules\Leads\Presentation\Controllers\LeadsController;
use App\Modules\Payments\Presentation\Controllers\PaymentController;
use App\Modules\Finance\Presentation\Controllers\ExpenseController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\HotelRateController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityPriceController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransferPriceController;
use App\Http\Controllers\DayItineraryController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\MealPlanController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\ExpenseTypeController;
use App\Http\Controllers\PackageThemeController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\GoogleMailController;
use App\Http\Controllers\SuperAdmin\CompanyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Super Admin routes - No tenant middleware, accessible from main domain
Route::middleware(['auth:sanctum', 'superadmin'])->prefix('super-admin')->group(function () {
    Route::prefix('companies')->group(function () {
        Route::get('/', [CompanyController::class, 'index']);
        Route::post('/', [CompanyController::class, 'store']);
        Route::get('/stats', [CompanyController::class, 'stats']);
        Route::get('/{id}', [CompanyController::class, 'show']);
        Route::put('/{id}', [CompanyController::class, 'update']);
        Route::delete('/{id}', [CompanyController::class, 'destroy']);
    });
    
    Route::prefix('subscription-plans')->group(function () {
        Route::get('/', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanController::class, 'store']);
        Route::get('/available-features', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanFeatureController::class, 'getAvailableFeatures']);
        Route::get('/{id}', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanController::class, 'destroy']);
        Route::get('/{id}/features', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanFeatureController::class, 'getPlanFeatures']);
        Route::put('/{id}/features', [\App\Http\Controllers\SuperAdmin\SubscriptionPlanFeatureController::class, 'updatePlanFeatures']);
    });
});

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    // Protected authentication routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
    });
});

// Google OAuth routes
Route::prefix('google')->group(function () {
    Route::get('/connect', [GoogleMailController::class, 'redirect']);
    Route::get('/callback', [GoogleMailController::class, 'callback']);
});

// Profile routes - require authentication and active user
Route::middleware(['auth:sanctum', 'active'])->prefix('profile')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::put('/', [ProfileController::class, 'update']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
});

// Admin routes - require authentication and Admin role
Route::middleware(['auth:sanctum', 'role:Admin'])->prefix('admin')->group(function () {
    // User management routes
    Route::prefix('users')->group(function () {
        Route::post('/', [AdminUserController::class, 'store']);
        Route::get('/', [AdminUserController::class, 'index']);
        Route::get('/{id}', [AdminUserController::class, 'show']);
        Route::put('/{id}', [AdminUserController::class, 'update']);
        Route::delete('/{id}', [AdminUserController::class, 'destroy']);
        Route::put('/{id}/status', [AdminUserController::class, 'updateStatus']);
    });

    // Permission management routes
    Route::prefix('permissions')->group(function () {
        Route::get('/roles', [PermissionController::class, 'getRoles']);
        Route::get('/list', [PermissionController::class, 'getPermissions']);
        Route::get('/roles/{roleName}', [PermissionController::class, 'getRolePermissions']);
        Route::put('/roles/{roleName}', [PermissionController::class, 'updateRolePermissions']);
    });

    // Company settings routes
    Route::prefix('settings')->group(function () {
        Route::get('/', [CompanySettingsController::class, 'show']);
        Route::put('/', [CompanySettingsController::class, 'update']);
        Route::post('/reset', [CompanySettingsController::class, 'reset']);
    });
});

// Leads routes - require authentication
Route::middleware('auth:sanctum')->prefix('leads')->group(function () {
    // Import routes (must come before /{id} routes)
    Route::get('/import-template', [LeadImportController::class, 'downloadTemplate']);
    Route::post('/import', [LeadImportController::class, 'import']);

    Route::get('/', [LeadsController::class, 'index']);
    Route::post('/', [LeadsController::class, 'store']);
    Route::get('/{id}', [LeadsController::class, 'show']);
    Route::put('/{id}/assign', [LeadsController::class, 'assign']);
    Route::put('/{id}/status', [LeadsController::class, 'updateStatus']);
    Route::put('/{id}', [LeadsController::class, 'update']);
    Route::delete('/{id}', [LeadsController::class, 'destroy']);

    // Lead email routes
    Route::get('/{leadId}/emails', [\App\Http\Controllers\LeadEmailController::class, 'index']);
    Route::post('/{leadId}/emails', [\App\Http\Controllers\LeadEmailController::class, 'send']);
    Route::get('/{leadId}/emails/{emailId}', [\App\Http\Controllers\LeadEmailController::class, 'show']);
});

// Followup routes - require authentication
Route::middleware('auth:sanctum')->prefix('followups')->group(function () {
    Route::get('/today', [FollowupController::class, 'today']);
    Route::get('/overdue', [FollowupController::class, 'overdue']);
    Route::post('/', [FollowupController::class, 'store']);
    Route::put('/{id}/complete', [FollowupController::class, 'complete']);
});

// Dashboard routes - require authentication
Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/revenue-growth-monthly', [DashboardController::class, 'getRevenueGrowthMonthly']);
    Route::get('/upcoming-tours', [DashboardController::class, 'upcomingTours']);
    Route::get('/latest-lead-notes', [DashboardController::class, 'latestLeadNotes']);
    Route::get('/sales-reps-stats', [DashboardController::class, 'salesRepsStats']);
    Route::get('/top-destinations', [DashboardController::class, 'topDestinations']);
    // Employee performance route - Admin only
    Route::middleware('role:Admin')->get('/employee-performance', [PerformanceController::class, 'employeePerformance']);
    // Source ROI analytics route - Admin only
    Route::middleware('role:Admin')->get('/source-roi', [SourceAnalyticsController::class, 'sourceRoi']);
    // Destination performance analytics route - Admin only
    Route::middleware('role:Admin')->get('/destination-performance', [DestinationAnalyticsController::class, 'destinationPerformance']);
});

// Payment routes - require authentication
Route::middleware('auth:sanctum')->prefix('payments')->group(function () {
    Route::get('/due-today', [PaymentController::class, 'dueToday']);
    Route::get('/pending', [PaymentController::class, 'pending']);
    Route::get('/lead/{leadId}', [PaymentController::class, 'getByLead']);
    Route::post('/', [PaymentController::class, 'store']);
});

// Reports routes - require authentication
Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/sales-summary', [ReportsController::class, 'salesSummary']);
    Route::get('/lead-funnel', [ReportsController::class, 'leadFunnel']);
    Route::get('/revenue-by-agent', [ReportsController::class, 'revenueByAgent']);
});

// Expense routes - require authentication
Route::middleware('auth:sanctum')->prefix('expenses')->group(function () {
    Route::post('/', [ExpenseController::class, 'store']);
    Route::get('/', [ExpenseController::class, 'index']);
    Route::get('/monthly-summary', [ExpenseController::class, 'monthlySummary']);
    Route::delete('/{id}', [ExpenseController::class, 'destroy']);
});

// Target routes - require authentication and Admin role
Route::middleware(['auth:sanctum', 'role:Admin'])->prefix('targets')->group(function () {
    Route::get('/{user_id}/{month}', [TargetController::class, 'show']);
    Route::post('/', [TargetController::class, 'store']);
    Route::put('/{id}/update-achieved', [TargetController::class, 'updateAchieved']);
});

// Google Sheets sync routes - require authentication
Route::middleware('auth:sanctum')->prefix('google-sheets')->group(function () {
    Route::post('/connect', [GoogleSheetSyncController::class, 'connect']);
    Route::get('/status', [GoogleSheetSyncController::class, 'status']);
});

// WhatsApp routes - require authentication
Route::middleware('auth:sanctum')->prefix('whatsapp')->group(function () {
    Route::get('/inbox', [InboxController::class, 'inbox']);
    Route::post('/send', [WhatsappController::class, 'send']);
});

// Campaign routes - require authentication
Route::middleware('auth:sanctum')->prefix('campaigns')->group(function () {
    Route::post('/', [CampaignController::class, 'store']);
    Route::get('/', [CampaignController::class, 'index']);
    Route::post('/{id}/run', [CampaignController::class, 'run']);
});

// Suppliers routes - require authentication
Route::middleware('auth:sanctum')->prefix('suppliers')->group(function () {
    Route::get('/', [SupplierController::class, 'index']);
    Route::post('/', [SupplierController::class, 'store']);
    Route::post('/send-email', [SupplierController::class, 'sendEmail']);
    Route::get('/{id}', [SupplierController::class, 'show']);
    Route::put('/{id}', [SupplierController::class, 'update']);
    Route::delete('/{id}', [SupplierController::class, 'destroy']);
});

// Hotels routes - require authentication
Route::middleware('auth:sanctum')->prefix('hotels')->group(function () {
    Route::get('/', [HotelController::class, 'index']);
    Route::post('/', [HotelController::class, 'store']);
    Route::get('/search', [HotelController::class, 'search']); // Hotel search endpoint
    Route::get('/{hotelId}/rooms', [HotelController::class, 'getRooms']); // Get hotel rooms endpoint

    // Hotel import/export routes (must come before /{id} routes)
    Route::post('/import', [HotelController::class, 'import']);
    Route::get('/export', [HotelController::class, 'export']);
    Route::get('/import-template', [HotelController::class, 'downloadTemplate']);

    Route::get('/{id}', [HotelController::class, 'show']);
    Route::post('/{id}', [HotelController::class, 'update']); // Changed to POST for file uploads
    Route::put('/{id}', [HotelController::class, 'update']);
    Route::delete('/{id}', [HotelController::class, 'destroy']);

    // Hotel rates routes
    Route::get('/{hotelId}/rates', [HotelRateController::class, 'index']);
    Route::post('/{hotelId}/rates', [HotelRateController::class, 'store']);
    Route::put('/{hotelId}/rates/{id}', [HotelRateController::class, 'update']);
    Route::delete('/{hotelId}/rates/{id}', [HotelRateController::class, 'destroy']);
});

// Activities routes - require authentication
Route::middleware('auth:sanctum')->prefix('activities')->group(function () {
    Route::get('/', [ActivityController::class, 'index']);
    Route::post('/', [ActivityController::class, 'store']);

    // Activity import/export routes (must come before /{id} routes)
    Route::post('/import', [ActivityController::class, 'import']);
    Route::get('/export', [ActivityController::class, 'export']);
    Route::get('/import-template', [ActivityController::class, 'downloadTemplate']);

    Route::get('/{id}', [ActivityController::class, 'show']);
    Route::post('/{id}', [ActivityController::class, 'update']); // Changed to POST for file uploads
    Route::put('/{id}', [ActivityController::class, 'update']);
    Route::delete('/{id}', [ActivityController::class, 'destroy']);

    // Activity prices routes
    Route::get('/{activityId}/prices', [ActivityPriceController::class, 'index']);
    Route::post('/{activityId}/prices', [ActivityPriceController::class, 'store']);
    Route::put('/{activityId}/prices/{id}', [ActivityPriceController::class, 'update']);
    Route::delete('/{activityId}/prices/{id}', [ActivityPriceController::class, 'destroy']);
});

// Transfers routes - require authentication
Route::middleware('auth:sanctum')->prefix('transfers')->group(function () {
    Route::get('/', [TransferController::class, 'index']);
    Route::post('/', [TransferController::class, 'store']);

    // Transfer import/export routes (must come before /{id} routes)
    Route::post('/import', [TransferController::class, 'import']);
    Route::get('/export', [TransferController::class, 'export']);
    Route::get('/import-template', [TransferController::class, 'downloadTemplate']);

    Route::get('/{id}', [TransferController::class, 'show']);
    Route::post('/{id}', [TransferController::class, 'update']); // Changed to POST for file uploads
    Route::put('/{id}', [TransferController::class, 'update']);
    Route::delete('/{id}', [TransferController::class, 'destroy']);

    // Transfer prices routes
    Route::get('/{transferId}/prices', [TransferPriceController::class, 'index']);
    Route::post('/{transferId}/prices', [TransferPriceController::class, 'store']);
    Route::put('/{transferId}/prices/{id}', [TransferPriceController::class, 'update']);
    Route::delete('/{transferId}/prices/{id}', [TransferPriceController::class, 'destroy']);
});

// Day Itineraries routes - require authentication
Route::middleware('auth:sanctum')->prefix('day-itineraries')->group(function () {
    Route::get('/', [DayItineraryController::class, 'index']);
    Route::post('/', [DayItineraryController::class, 'store']);
    Route::get('/{id}', [DayItineraryController::class, 'show']);
    Route::put('/{id}', [DayItineraryController::class, 'update']);
    Route::post('/{id}', [DayItineraryController::class, 'update']); // For FormData with _method=PUT
    Route::delete('/{id}', [DayItineraryController::class, 'destroy']);
});

// Settings routes - require authentication
Route::middleware('auth:sanctum')->prefix('settings')->group(function () {
    Route::get('/', [SettingsController::class, 'index']);
    Route::post('/', [SettingsController::class, 'store']);
    Route::get('/max-hotel-options', [SettingsController::class, 'getMaxHotelOptions']);
    Route::post('/upload-logo', [SettingsController::class, 'uploadLogo']);
});

// Packages/Itineraries routes - require authentication
Route::middleware('auth:sanctum')->prefix('packages')->group(function () {
    Route::get('/', [PackageController::class, 'index']);
    Route::post('/', [PackageController::class, 'store']);
    Route::get('/{id}', [PackageController::class, 'show']);
    Route::put('/{id}', [PackageController::class, 'update']);
    Route::delete('/{id}', [PackageController::class, 'destroy']);
});

// Destinations routes - require authentication
Route::middleware('auth:sanctum')->prefix('destinations')->group(function () {
    Route::get('/', [DestinationController::class, 'index']);
    Route::post('/', [DestinationController::class, 'store']);
    Route::get('/{id}', [DestinationController::class, 'show']);
    Route::put('/{id}', [DestinationController::class, 'update']);
    Route::delete('/{id}', [DestinationController::class, 'destroy']);
});

// Room Types routes - require authentication
Route::middleware('auth:sanctum')->prefix('room-types')->group(function () {
    Route::get('/', [RoomTypeController::class, 'index']);
    Route::post('/', [RoomTypeController::class, 'store']);
    Route::get('/{id}', [RoomTypeController::class, 'show']);
    Route::put('/{id}', [RoomTypeController::class, 'update']);
    Route::delete('/{id}', [RoomTypeController::class, 'destroy']);
});

// Meal Plans routes - require authentication
Route::middleware('auth:sanctum')->prefix('meal-plans')->group(function () {
    Route::get('/', [MealPlanController::class, 'index']);
    Route::post('/', [MealPlanController::class, 'store']);
    Route::get('/{id}', [MealPlanController::class, 'show']);
    Route::put('/{id}', [MealPlanController::class, 'update']);
    Route::delete('/{id}', [MealPlanController::class, 'destroy']);
});

// Lead Sources routes - require authentication
Route::middleware('auth:sanctum')->prefix('lead-sources')->group(function () {
    Route::get('/', [LeadSourceController::class, 'index']);
    Route::post('/', [LeadSourceController::class, 'store']);
    Route::get('/{id}', [LeadSourceController::class, 'show']);
    Route::put('/{id}', [LeadSourceController::class, 'update']);
    Route::delete('/{id}', [LeadSourceController::class, 'destroy']);
});

// Expense Types routes - require authentication
Route::middleware('auth:sanctum')->prefix('expense-types')->group(function () {
    Route::get('/', [ExpenseTypeController::class, 'index']);
    Route::post('/', [ExpenseTypeController::class, 'store']);
    Route::get('/{id}', [ExpenseTypeController::class, 'show']);
    Route::put('/{id}', [ExpenseTypeController::class, 'update']);
    Route::delete('/{id}', [ExpenseTypeController::class, 'destroy']);
});

// Package Themes routes - require authentication
Route::middleware('auth:sanctum')->prefix('package-themes')->group(function () {
    Route::get('/', [PackageThemeController::class, 'index']);
    Route::post('/', [PackageThemeController::class, 'store']);
    Route::get('/{id}', [PackageThemeController::class, 'show']);
    Route::put('/{id}', [PackageThemeController::class, 'update']);
    Route::delete('/{id}', [PackageThemeController::class, 'destroy']);
});

// Currencies routes - require authentication
Route::middleware('auth:sanctum')->prefix('currencies')->group(function () {
    Route::get('/', [CurrencyController::class, 'index']);
    Route::post('/', [CurrencyController::class, 'store']);
    Route::get('/{id}', [CurrencyController::class, 'show']);
    Route::put('/{id}', [CurrencyController::class, 'update']);
    Route::delete('/{id}', [CurrencyController::class, 'destroy']);
});

// Query Detail routes - require authentication
Route::middleware('auth:sanctum')->prefix('queries')->group(function () {
    Route::get('/{id}/detail', [\App\Http\Controllers\QueryDetailController::class, 'show']);
});

// Proposals routes - require authentication
// TODO: Uncomment when ProposalController is created
// Route::middleware('auth:sanctum')->prefix('proposals')->group(function () {
//     Route::get('/', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'index']);
//     Route::post('/', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'update']);
//     Route::delete('/{id}', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'destroy']);
//     Route::post('/{id}/approve', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'approve']);
//     Route::post('/{id}/send', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'send']);
//     Route::post('/{id}/attachments', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'uploadAttachment']);
// });

// Emails routes - require authentication
// TODO: Uncomment when EmailController is created
// Route::middleware('auth:sanctum')->prefix('emails')->group(function () {
//     Route::get('/', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'index']);
//     Route::post('/', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'show']);
//     Route::post('/{id}/send', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'send']);
//     Route::get('/stats', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'getStats']);
//     Route::get('/{id}/track-open', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'trackOpen']);
//     Route::post('/{id}/track-click', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'trackClick']);
// });

// Supplier Communications routes - require authentication
// TODO: Uncomment when SupplierCommunicationController is created
// Route::middleware('auth:sanctum')->prefix('supplier-communications')->group(function () {
//     Route::get('/', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'index']);
//     Route::post('/', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'update']);
//     Route::get('/overdue', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'getOverdue']);
//     Route::post('/{id}/respond', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'markAsResponded']);
// });

// Post Sales routes - require authentication
// TODO: Uncomment when PostSaleController is created
// Route::middleware('auth:sanctum')->prefix('post-sales')->group(function () {
//     Route::get('/', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'index']);
//     Route::post('/', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'update']);
//     Route::get('/overdue', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'getOverdue']);
//     Route::post('/{id}/complete', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'markAsCompleted']);
// });

// Vouchers routes - require authentication
// TODO: Uncomment when VoucherController is created
// Route::middleware('auth:sanctum')->prefix('vouchers')->group(function () {
//     Route::get('/', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'index']);
//     Route::post('/', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'update']);
//     Route::delete('/{id}', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'destroy']);
//     Route::post('/{id}/approve', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'approve']);
//     Route::post('/{id}/send', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'sendToCustomer']);
//     Route::post('/{id}/confirm', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'confirmByCustomer']);
// });

// Documents routes - require authentication
// TODO: Uncomment when DocumentController is created
// Route::middleware('auth:sanctum')->prefix('documents')->group(function () {
//     Route::get('/', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'index']);
//     Route::post('/', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'update']);
//     Route::delete('/{id}', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'destroy']);
//     Route::get('/expired', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'getExpired']);
//     Route::get('/expiring-soon', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'getExpiringSoon']);
//     Route::post('/{id}/verify', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'verify']);
//     Route::post('/{id}/reject', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'reject']);
// });

// Invoices routes - require authentication
// TODO: Uncomment when InvoiceController is created
// Route::middleware('auth:sanctum')->prefix('invoices')->group(function () {
//     Route::get('/', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'index']);
//     Route::post('/', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'update']);
//     Route::delete('/{id}', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'destroy']);
//     Route::get('/overdue', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'getOverdue']);
//     Route::post('/{id}/approve', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'approve']);
//     Route::post('/{id}/send', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'send']);
//     Route::post('/{id}/payments', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'addPayment']);
// });

// Billing routes - require authentication
// TODO: Uncomment when BillingController is created
// Route::middleware('auth:sanctum')->prefix('billing')->group(function () {
//     Route::get('/', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'index']);
//     Route::post('/', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'store']);
//     Route::get('/{id}', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'show']);
//     Route::put('/{id}', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'update']);
//     Route::get('/overdue', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'getOverdue']);
//     Route::post('/{id}/mark-paid', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'markAsPaid']);
// });

// History routes - require authentication
// TODO: Uncomment when HistoryController is created
// Route::middleware('auth:sanctum')->prefix('history')->group(function () {
//     Route::get('/lead/{leadId}', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'getLeadHistory']);
//     Route::get('/user/{userId}', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'getUserHistory']);
//     Route::get('/module/{module}', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'getModuleHistory']);
//     Route::post('/', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'logActivity']);
// });

// Gmail API routes - require authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/send-gmail', [GoogleMailController::class, 'sendGmail']);
    Route::get('/sync-inbox', [GoogleMailController::class, 'syncInbox']);
    Route::get('/leads/{leadId}/gmail-emails', [GoogleMailController::class, 'getEmails']);
});

// Example protected route (can be removed if not needed)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


