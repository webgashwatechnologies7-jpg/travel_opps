<?php

/*
|--------------------------------------------------------------------------
| Future Features Routes (Currently Commented Out)
|--------------------------------------------------------------------------
|
| These routes are for future features that are planned but not yet implemented.
| Uncomment and implement the corresponding controllers when ready.
|
*/

/*
// Proposals routes - require authentication
Route::middleware('auth:sanctum')->prefix('proposals')->group(function () {
    Route::get('/', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'index']);
    Route::post('/', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'store']);
    Route::get('/{id}', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'show']);
    Route::put('/{id}', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'update']);
    Route::delete('/{id}', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'destroy']);
    Route::post('/{id}/approve', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'approve']);
    Route::post('/{id}/send', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'send']);
    Route::post('/{id}/attachments', [\App\Modules\Proposals\Presentation\Controllers\ProposalController::class, 'uploadAttachment']);
});

// Emails routes - require authentication
Route::middleware('auth:sanctum')->prefix('emails')->group(function () {
    Route::get('/', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'index']);
    Route::post('/', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'store']);
    Route::get('/{id}', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'show']);
    Route::post('/{id}/send', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'send']);
    Route::get('/stats', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'getStats']);
    Route::get('/{id}/track-open', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'trackOpen']);
    Route::post('/{id}/track-click', [\App\Modules\Mails\Presentation\Controllers\EmailController::class, 'trackClick']);
});

// Supplier Communications routes - require authentication
Route::middleware('auth:sanctum')->prefix('supplier-communications')->group(function () {
    Route::get('/', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'index']);
    Route::post('/', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'store']);
    Route::get('/{id}', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'show']);
    Route::put('/{id}', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'update']);
    Route::get('/overdue', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'getOverdue']);
    Route::post('/{id}/respond', [\App\Modules\SupplierCommunication\Presentation\Controllers\SupplierCommunicationController::class, 'markAsResponded']);
});

// Post Sales routes - require authentication
Route::middleware('auth:sanctum')->prefix('post-sales')->group(function () {
    Route::get('/', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'index']);
    Route::post('/', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'store']);
    Route::get('/{id}', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'show']);
    Route::put('/{id}', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'update']);
    Route::get('/overdue', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'getOverdue']);
    Route::post('/{id}/complete', [\App\Modules\PostSales\Presentation\Controllers\PostSaleController::class, 'markAsCompleted']);
});

// Vouchers routes - require authentication
Route::middleware('auth:sanctum')->prefix('vouchers')->group(function () {
    Route::get('/', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'index']);
    Route::post('/', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'store']);
    Route::get('/{id}', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'show']);
    Route::put('/{id}', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'update']);
    Route::delete('/{id}', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'destroy']);
    Route::post('/{id}/approve', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'approve']);
    Route::post('/{id}/send', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'sendToCustomer']);
    Route::post('/{id}/confirm', [\App\Modules\Vouchers\Presentation\Controllers\VoucherController::class, 'confirmByCustomer']);
});

// Documents routes - require authentication
Route::middleware('auth:sanctum')->prefix('documents')->group(function () {
    Route::get('/', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'index']);
    Route::post('/', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'store']);
    Route::get('/{id}', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'show']);
    Route::put('/{id}', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'update']);
    Route::delete('/{id}', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'destroy']);
    Route::get('/expired', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'getExpired']);
    Route::get('/expiring-soon', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'getExpiringSoon']);
    Route::post('/{id}/verify', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'verify']);
    Route::post('/{id}/reject', [\App\Modules\Documents\Presentation\Controllers\DocumentController::class, 'reject']);
});

// Invoices routes - require authentication
Route::middleware('auth:sanctum')->prefix('invoices')->group(function () {
    Route::get('/', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'index']);
    Route::post('/', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'store']);
    Route::get('/{id}', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'show']);
    Route::put('/{id}', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'update']);
    Route::delete('/{id}', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'destroy']);
    Route::get('/overdue', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'getOverdue']);
    Route::post('/{id}/approve', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'approve']);
    Route::post('/{id}/send', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'send']);
    Route::post('/{id}/payments', [\App\Modules\Invoices\Presentation\Controllers\InvoiceController::class, 'addPayment']);
});

// Billing routes - require authentication
Route::middleware('auth:sanctum')->prefix('billing')->group(function () {
    Route::get('/', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'index']);
    Route::post('/', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'store']);
    Route::get('/{id}', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'show']);
    Route::put('/{id}', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'update']);
    Route::get('/overdue', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'getOverdue']);
    Route::post('/{id}/mark-paid', [\App\Modules\Billing\Presentation\Controllers\BillingController::class, 'markAsPaid']);
});

// History routes - require authentication
Route::middleware('auth:sanctum')->prefix('history')->group(function () {
    Route::get('/lead/{leadId}', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'getLeadHistory']);
    Route::get('/user/{userId}', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'getUserHistory']);
    Route::get('/module/{module}', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'getModuleHistory']);
    Route::post('/', [\App\Modules\History\Presentation\Controllers\HistoryController::class, 'logActivity']);
});
*/

/*
|--------------------------------------------------------------------------
| Implementation Priority Recommendations
|--------------------------------------------------------------------------
|
| 1. HIGH PRIORITY:
|    - Proposals Module (Core CRM functionality)
|    - Invoices Module (Financial tracking)
|    - Documents Module (Document management)
|
| 2. MEDIUM PRIORITY:
|    - Emails Module (Enhanced communication)
|    - Post Sales Module (Customer service)
|    - History Module (Activity tracking)
|
| 3. LOW PRIORITY:
|    - Supplier Communications Module
|    - Vouchers Module
|    - Billing Module (Subscription management)
|
| To implement:
| 1. Create the corresponding controller files
| 2. Create the model files with proper relationships
| 3. Create the database migrations
| 4. Uncomment the routes above
| 5. Add require __DIR__.'/api_future.php'; to main api.php
|
*/
